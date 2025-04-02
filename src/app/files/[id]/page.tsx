'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { File, Tag } from '@/types/database';
import { TagList } from '@/components/TagList';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useWallet } from '@/contexts/WalletContext';

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

    const handleReport = async () => {
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
            alert('File reported successfully');
        } catch (err) {
            console.error('Error reporting file:', err);
            alert('Failed to report file. Please try again.');
        } finally {
            setIsSubmitting(false);
            setReportReason('');
            setIsReportModalOpen(false);
        }
    };

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
                <div className="animate-pulse">
                    <div className="h-8 w-1/3 bg-gray-200 rounded mb-4" />
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !file) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="rounded-lg bg-red-50 p-4 text-red-600">
                    {error || 'File not found'}
                </div>
                <Link
                    href="/"
                    className="mt-4 inline-block text-blue-600 hover:underline"
                >
                    ← Back to files
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-blue-600 hover:underline inline-flex items-center"
                >
                    ← Back to files
                </Link>
                <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                    disabled={!address}
                >
                    Report File
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        {file.thumbnail_url ? (
                            <img
                                src={file.thumbnail_url}
                                alt={file.file_name || 'File thumbnail'}
                                className="w-full rounded-lg object-cover"
                            />
                        ) : (
                            <div className="flex h-64 w-full items-center justify-center rounded-lg bg-gray-100">
                                <span className="text-4xl text-gray-400">
                                    {file.file_type.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold">
                            {file.file_name || 'Unnamed File'}
                        </h1>

                        <dl className="grid grid-cols-1 gap-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Filecoin Hash
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 break-all">
                                    {file.filecoin_hash}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    File Type
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {file.file_type}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    File Size
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {formatFileSize(file.file_size)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Network
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {file.network}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Upload Date
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(file.upload_date).toLocaleDateString()}
                                </dd>
                            </div>

                            {file.description && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        Description
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {file.description}
                                    </dd>
                                </div>
                            )}

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Tags
                                </dt>
                                <dd className="mt-1">
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
                onConfirm={handleReport}
                title="Report File"
                message={
                    <div className="space-y-4">
                        <p>Are you sure you want to report this file?</p>
                        <div>
                            <label htmlFor="reportReason" className="block text-sm font-medium text-gray-700">
                                Reason for reporting (optional)
                            </label>
                            <textarea
                                id="reportReason"
                                rows={3}
                                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
    );
} 