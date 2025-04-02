import type { File } from '@/types/database';
import Link from 'next/link';

interface FileCardProps {
    file: File;
    onUpvote: () => void;
    onDownvote: () => void;
}

export function FileCard({ file, onUpvote, onDownvote }: FileCardProps) {
    return (
        <div className="group relative rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <Link href={`/files/${file.id}`} className="relative">
                <div className="mb-4">
                    {file.thumbnail_url ? (
                        <img
                            src={file.thumbnail_url}
                            alt={file.file_name || 'File thumbnail'}
                            className="h-32 w-full rounded object-cover"
                        />
                    ) : (
                        <div className="flex h-32 w-full items-center justify-center rounded bg-gray-100">
                            <span className="text-2xl text-gray-400">
                                {file.file_type.toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                <h3 className="mb-2 text-lg font-semibold">
                    {file.file_name || 'Unnamed File'}
                </h3>

                <div className="mb-2 text-sm text-gray-600">
                    <p>Type: {file.file_type}</p>
                    <p>Size: {formatFileSize(file.file_size)}</p>
                    <p>Network: {file.network}</p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="relative z-10 flex space-x-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onUpvote();
                            }}
                            className="cursor-pointer rounded px-2 py-1 text-sm hover:bg-gray-100"
                        >
                            👍
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onDownvote();
                            }}
                            className="cursor-pointer rounded px-2 py-1 text-sm hover:bg-gray-100"
                        >
                            👎
                        </button>
                    </div>
                </div>
            </Link>
        </div>
    );
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