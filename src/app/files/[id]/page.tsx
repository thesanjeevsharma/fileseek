'use client';

import { useEffect, useState } from 'react';
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

interface FileWithTags extends File {
    tags: Tag[];
}

interface FileTagResponse {
    file_tags: Array<{
        tags: Tag;
    }>;
}

export default function FileDetailPage() {
    const { id } = useParams();
    const { address } = useWallet();
    const [file, setFile] = useState<FileWithTags | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchFileDetails() {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                const { data, error: fileError } = await supabase
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
                if (!data) throw new Error('File not found');

                // Transform the data to match our FileWithTags interface
                const fileWithTags: FileWithTags = {
                    ...data,
                    tags: (data as unknown as FileTagResponse).file_tags?.map(ft => ft.tags) || [],
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
                                    <dd className="mt-1 font-mono text-sm text-gray-300 break-all">
                                        {file.filecoin_hash}
                                    </dd>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                            Upload Date
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-300">
                                            {new Date(file.upload_date).toLocaleDateString()}
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