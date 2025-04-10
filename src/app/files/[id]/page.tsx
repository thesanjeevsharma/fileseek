'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { File, Tag } from '@/types/database';
import { TagList } from '@/components/TagList';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DocumentDuplicateIcon, HandThumbUpIcon, HandThumbDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { REWARD_POINTS } from '@/config/rewards';
import { updateUserPoints } from '@/lib/rewards';
import { useUser } from '@/hooks/useUser';
import { Textarea } from '@/components/ui/textarea';

interface Comment {
    id: string;
    user_id: string;
    comment: string;
    created_at: string;
    users: {
        wallet_address: string;
    };
}

interface FileWithTags extends File {
    tags: Tag[];
    upvotes: number;
    downvotes: number;
    comments?: Comment[];
}

interface FileTagResponse {
    file_tags: Array<{
        tags: Tag;
    }>;
}

export default function FileDetailPage() {
    const { id } = useParams();
    const { address } = useWallet();
    const { refreshUser } = useUser();
    const [file, setFile] = useState<FileWithTags | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userVote, setUserVote] = useState<1 | -1 | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        async function fetchFileDetails() {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                // First fetch the file details
                const { data: fileData, error: fileError } = await supabase
                    .from('files')
                    .select(`
                        *,
                        file_tags (
                            tags (*)
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (fileError) throw fileError;
                if (!fileData) throw new Error('File not found');

                // Then fetch the vote counts
                const { data: voteData, error: voteError } = await supabase
                    .from('votes')
                    .select('vote_type')
                    .eq('file_id', id);

                if (voteError) throw voteError;

                // Calculate upvotes and downvotes
                const upvotes = voteData?.filter(v => v.vote_type === 1).length || 0;
                const downvotes = voteData?.filter(v => v.vote_type === -1).length || 0;

                // Transform the data to match our FileWithTags interface
                const fileWithTags: FileWithTags = {
                    ...fileData,
                    tags: (fileData as unknown as FileTagResponse).file_tags?.map(ft => ft.tags) || [],
                    upvotes,
                    downvotes
                };

                setFile(fileWithTags);
            } catch (err) {
                console.error('Error fetching file details:', err);
                setError(
                    err instanceof Error ? err.message : 'Failed to load file details'
                );
            } finally {
                setLoading(false);
            }
        }

        fetchFileDetails();
    }, [id]);

    const fetchUserVote = useCallback(async () => {
        if (!id || !address) return;

        try {
            // Get user's UUID from their wallet address
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('wallet_address', address)
                .single();

            if (userError) throw userError;
            if (!userData) return;

            // Get user's vote for this file
            const { data: voteData, error: voteError } = await supabase
                .from('votes')
                .select('vote_type')
                .eq('file_id', id)
                .eq('user_id', userData.id)
                .single();

            if (voteError && voteError.code !== 'PGRST116') throw voteError; // PGRST116 is "no rows returned"
            setUserVote(voteData?.vote_type || null);
        } catch (err) {
            console.error('Error fetching user vote:', err);
        }
    }, [id, address]);

    useEffect(() => {
        if (id && address) {
            fetchUserVote();
        }
    }, [id, address, fetchUserVote]);

    const handleVote = async (voteType: 1 | -1) => {
        if (!file || !address) {
            toast.error('Please connect your wallet to vote');
            return;
        }

        try {
            // Get user's UUID from their wallet address
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('wallet_address', address)
                .single();

            if (userError) throw userError;
            if (!userData) throw new Error('User not found');

            // Check if user has already voted
            const { data: existingVote, error: voteCheckError } = await supabase
                .from('votes')
                .select('*')
                .eq('file_id', file.id)
                .eq('user_id', userData.id)
                .maybeSingle();

            if (voteCheckError) throw voteCheckError;

            // Get the file owner's ID to award/deduct points
            const { data: fileData, error: fileError } = await supabase
                .from('files')
                .select('user_id')
                .eq('id', file.id)
                .single();

            if (fileError) throw fileError;
            if (!fileData?.user_id) throw new Error('File owner not found');

            // If user is voting the same way, remove their vote and revert points
            if (existingVote?.vote_type === voteType) {
                const { error: deleteError } = await supabase
                    .from('votes')
                    .delete()
                    .eq('id', existingVote.id);

                if (deleteError) throw deleteError;

                // Revert points based on vote type
                if (voteType === 1) {
                    await updateUserPoints(fileData.user_id, -REWARD_POINTS.UPVOTE_RECEIVED);
                } else {
                    await updateUserPoints(fileData.user_id, -REWARD_POINTS.DOWNVOTE_RECEIVED);
                }

                setUserVote(null);
                setFile(prev => prev ? {
                    ...prev,
                    upvotes: voteType === 1 ? prev.upvotes - 1 : prev.upvotes,
                    downvotes: voteType === -1 ? prev.downvotes - 1 : prev.downvotes
                } : null);
                toast.success('Vote removed');
            } else if (existingVote) {
                // Update existing vote
                const { error: updateError } = await supabase
                    .from('votes')
                    .update({ vote_type: voteType })
                    .eq('id', existingVote.id);

                if (updateError) throw updateError;

                // Revert old vote points and add new vote points
                if (existingVote.vote_type === 1) {
                    await updateUserPoints(fileData.user_id, -REWARD_POINTS.UPVOTE_RECEIVED);
                } else {
                    await updateUserPoints(fileData.user_id, -REWARD_POINTS.DOWNVOTE_RECEIVED);
                }

                if (voteType === 1) {
                    await updateUserPoints(fileData.user_id, REWARD_POINTS.UPVOTE_RECEIVED);
                } else {
                    await updateUserPoints(fileData.user_id, REWARD_POINTS.DOWNVOTE_RECEIVED);
                }

                setUserVote(voteType);
                setFile(prev => prev ? {
                    ...prev,
                    upvotes: voteType === 1 ? prev.upvotes + 1 : prev.upvotes - 1,
                    downvotes: voteType === -1 ? prev.downvotes + 1 : prev.downvotes - 1
                } : null);
                toast.success(voteType === 1 ? 'Upvoted!' : 'Downvoted!');
            } else {
                // Create new vote
                const { error: insertError } = await supabase
                    .from('votes')
                    .insert({
                        file_id: file.id,
                        user_id: userData.id,
                        vote_type: voteType
                    });

                if (insertError) throw insertError;

                // Award points based on vote type
                if (voteType === 1) {
                    await updateUserPoints(fileData.user_id, REWARD_POINTS.UPVOTE_RECEIVED);
                } else {
                    await updateUserPoints(fileData.user_id, REWARD_POINTS.DOWNVOTE_RECEIVED);
                }

                setUserVote(voteType);
                setFile(prev => prev ? {
                    ...prev,
                    upvotes: voteType === 1 ? prev.upvotes + 1 : prev.upvotes,
                    downvotes: voteType === -1 ? prev.downvotes + 1 : prev.downvotes
                } : null);
                toast.success(voteType === 1 ? 'Upvoted!' : 'Downvoted!');
            }

            await refreshUser();
        } catch (err) {
            console.error('Error voting:', err);
            toast.error('Failed to register vote. Please try again.');
        }
    };

    const handleReportConfirmation = async () => {
        if (!file || !address) return;

        try {
            setIsSubmitting(true);

            // First, get the user's UUID from their wallet address
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('wallet_address', address)
                .single();

            if (userError) throw userError;
            if (!userData) throw new Error('User not found');

            // Now create the report with the user's UUID
            const { error: reportError } = await supabase
                .from('reports')
                .insert([
                    {
                        file_id: file.id,
                        user_id: userData.id,
                        report_reason: reportReason,
                    },
                ]);

            if (reportError) throw reportError;

            // Show success message or update UI
            toast.success('File reported successfully');
        } catch (err) {
            console.error('Error reporting file:', err);
            toast.error('Failed to report file. Please try again.');
        } finally {
            setIsSubmitting(false);
            setReportReason('');
            setIsReportModalOpen(false);
        }
    };

    const handleReport = () => {
        if (!address) {
            toast.error('Please connect your wallet to report a file');
            return;
        }

        setIsReportModalOpen(true);
    }

    function formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    useEffect(() => {
        async function fetchComments() {
            if (!id) return;

            try {
                const { data, error } = await supabase
                    .from('comments')
                    .select(`
                        *,
                        users (
                            wallet_address
                        )
                    `)
                    .eq('file_id', id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setComments(data || []);
            } catch (err) {
                console.error('Error fetching comments:', err);
                toast.error('Failed to load comments');
            }
        }

        fetchComments();
    }, [id]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !address || !newComment.trim()) return;

        try {
            setIsSubmittingComment(true);

            // Get user's UUID from their wallet address
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('wallet_address', address)
                .single();

            if (userError) throw userError;
            if (!userData) throw new Error('User not found');

            // Insert the comment
            const { data: commentData, error: commentError } = await supabase
                .from('comments')
                .insert([
                    {
                        file_id: file.id,
                        user_id: userData.id,
                        comment: newComment.trim()
                    }
                ])
                .select(`
                    *,
                    users (
                        wallet_address
                    )
                `)
                .single();

            if (commentError) throw commentError;

            // Update the comments list
            setComments(prev => [commentData, ...prev]);
            setNewComment('');
            toast.success('Comment added successfully');
        } catch (err) {
            console.error('Error adding comment:', err);
            toast.error('Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!address) return;

        try {
            // Get user's UUID from their wallet address
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('wallet_address', address)
                .single();

            if (userError) throw userError;
            if (!userData) throw new Error('User not found');

            // Delete the comment
            const { error: deleteError } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', userData.id);

            if (deleteError) throw deleteError;

            // Update the comments list
            setComments(prev => prev.filter(comment => comment.id !== commentId));
            toast.success('Comment deleted successfully');
        } catch (err) {
            console.error('Error deleting comment:', err);
            toast.error('Failed to delete comment');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 w-1/3 rounded-lg bg-gray-800" />
                    <div className="space-y-4">
                        <div className="h-4 w-1/4 rounded-lg bg-gray-800" />
                        <div className="h-4 w-1/2 rounded-lg bg-gray-800" />
                        <div className="h-4 w-1/3 rounded-lg bg-gray-800" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !file) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
                    {error || 'File not found'}
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                >
                    ← Back to files
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        ← Back to files
                    </Link>
                    <Button
                        variant="destructive"
                        type="button"
                        onClick={handleReport}
                    >
                        Report File
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            {file.thumbnail_url ? (
                                <div className="relative h-80 w-full overflow-hidden rounded-xl border border-gray-800">
                                    <Image
                                        src={file.thumbnail_url}
                                        alt={file.file_name || 'File thumbnail'}
                                        fill
                                        className="object-cover transition-all hover:scale-105"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-80 w-full items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50">
                                    <span className="text-5xl font-medium text-gray-600">
                                        {file.file_type.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-3xl font-bold text-white">
                                {file.file_name || 'Unnamed File'}
                            </h1>

                            <dl className="grid grid-cols-1 gap-4">
                                <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                                    <dt className="text-sm font-medium text-gray-400">
                                        Filecoin Hash
                                    </dt>
                                    <dd className="mt-1 font-mono text-sm text-gray-300 break-all flex items-center gap-2">
                                        {file.filecoin_hash}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(file.filecoin_hash);
                                                toast.success('Hash copied to clipboard');
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                                            title="Copy hash"
                                        >
                                            <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 cursor-pointer" />
                                        </button>
                                    </dd>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                                        <dt className="text-sm font-medium text-gray-400">
                                            File Type
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-300">
                                            {file.file_type}
                                        </dd>
                                    </div>

                                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                                        <dt className="text-sm font-medium text-gray-400">
                                            File Size
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-300">
                                            {formatFileSize(file.file_size)}
                                        </dd>
                                    </div>

                                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                                        <dt className="text-sm font-medium text-gray-400">
                                            Network
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-300">
                                            {file.network}
                                        </dd>
                                    </div>

                                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                                        <dt className="text-sm font-medium text-gray-400">
                                            Votes
                                        </dt>
                                        <dd className="mt-2 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleVote(1)}
                                                className={`rounded-lg p-2 transition-colors ${userVote === 1
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'hover:bg-gray-800 text-gray-400'
                                                    }`}
                                                title="Upvote"
                                            >
                                                <HandThumbUpIcon className="h-5 w-5" />
                                            </button>
                                            <span className="text-sm text-gray-300">
                                                {file.upvotes - file.downvotes}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleVote(-1)}
                                                className={`rounded-lg p-2 transition-colors ${userVote === -1
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'hover:bg-gray-800 text-gray-400'
                                                    }`}
                                                title="Downvote"
                                            >
                                                <HandThumbDownIcon className="h-5 w-5" />
                                            </button>
                                        </dd>
                                    </div>

                                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                                        <dt className="text-sm font-medium text-gray-400">
                                            Upload Date
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-300">
                                            {format(new Date(file.upload_date), 'PPP')}
                                        </dd>
                                    </div>
                                </div>

                                {file.description && (
                                    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                                        <dt className="text-sm font-medium text-gray-400">
                                            Description
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-300">
                                            {file.description}
                                        </dd>
                                    </div>
                                )}

                                <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                                    <dt className="text-sm font-medium text-gray-400">
                                        Tags
                                    </dt>
                                    <dd className="mt-2">
                                        <TagList tags={file.tags} />
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Comments</h2>

                    {/* Comment Form */}
                    {address ? (
                        <form onSubmit={handleSubmitComment} className="mb-8">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full mb-4"
                                disabled={isSubmittingComment}
                            />
                            <Button
                                type="submit"
                                disabled={isSubmittingComment || !newComment.trim()}
                            >
                                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </form>
                    ) : (
                        <div className="mb-8 p-4 rounded-lg bg-gray-800/50 text-gray-400">
                            Please connect your wallet to comment.
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <p className="text-gray-400">No comments yet.</p>
                        ) : (
                            comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="rounded-lg border border-gray-800 bg-gray-900/30 p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-mono text-sm text-gray-400">
                                                    {comment.users.wallet_address.slice(0, 6)}...
                                                    {comment.users.wallet_address.slice(-4)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(comment.created_at), 'PPp')}
                                                </span>
                                            </div>
                                            <p className="text-gray-300">{comment.comment}</p>
                                        </div>
                                        {address === comment.users.wallet_address && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                title="Delete comment"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <ConfirmationModal
                    isOpen={isReportModalOpen}
                    onClose={() => {
                        setIsReportModalOpen(false);
                        setReportReason('');
                    }}
                    onConfirm={handleReportConfirmation}
                    title="Report File"
                    message={
                        <div className="space-y-4">
                            <p className="text-gray-300">Are you sure you want to report this file?</p>
                            <div>
                                <label htmlFor="reportReason" className="block text-sm font-medium text-gray-300">
                                    Reason for reporting (optional)
                                </label>
                                <textarea
                                    id="reportReason"
                                    rows={3}
                                    className="mt-2 block w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Please provide a reason for reporting this file..."
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    }
                    confirmText={isSubmitting ? 'Submitting...' : 'Submit Report'}
                    cancelText="Cancel"
                />
            </div>
        </div>
    );
} 