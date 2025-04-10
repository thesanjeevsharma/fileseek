import type { File } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';

interface FileCardProps {
    file: File & {
        votes?: { vote_type: number }[];
    };
}

export function FileCard({ file }: FileCardProps) {
    // Calculate total votes
    const votes = file.votes?.reduce((acc, vote) => acc + vote.vote_type, 0) || 0;

    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5 transition-all duration-200 hover:border-gray-700 hover:shadow-lg hover:shadow-blue-500/5">
            <Link className="relative" href={`/files/${file.id}`}>
                <div className="mb-4">
                    {file.thumbnail_url ? (
                        <div className="relative h-40 w-full overflow-hidden rounded-lg">
                            <Image
                                src={file.thumbnail_url}
                                alt={file.file_name || 'File thumbnail'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    ) : (
                        <div className="flex h-40 w-full items-center justify-center rounded-lg bg-gray-800/50 text-gray-400">
                            <span className="text-3xl font-medium">
                                {file.file_type.toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                    {file.file_name || 'Unnamed File'}
                </h3>

                <div className="grid grid-cols-3 gap-1">
                    <div className="flex items-center justify-center space-x-3 rounded-lg bg-gray-900/50 px-2 py-3 ring-1 ring-gray-800/60">
                        <span className="text-sm text-gray-300">{file.file_type}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3 rounded-lg bg-gray-900/50 px-2 py-3 ring-1 ring-gray-800/60">
                        <span className="text-sm text-gray-300">{formatFileSize(file.file_size)}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 rounded-lg bg-gray-800 px-2 py-2">
                        <span className={`text-sm ${votes > 0 ? 'text-green-400' : votes < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                            {votes > 0 ? `+${votes}` : votes}
                        </span>
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