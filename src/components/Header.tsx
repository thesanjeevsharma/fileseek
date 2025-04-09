'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { TagFileModal } from './TagFileModal';
import type { File } from '@/types/database';
import { toast } from 'sonner';

export function Header() {
    const { address, isConnecting, error: walletError, connect, disconnect } = useWallet();
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleFileTagged = (_file: File) => {
        setIsTagModalOpen(false);
        toast.success('File tagged successfully');
    };

    const handleTagFile = () => {
        if (!address) {
            toast.error('Please connect your wallet to tag a file');
            return;
        }
        setIsTagModalOpen(true);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-xl font-bold text-transparent">
                        FileSeek
                    </span>
                </Link>

                <nav className="flex items-center space-x-4">
                    <button
                        type="button"
                        onClick={handleTagFile}
                        className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Tag a File
                    </button>
                    {walletError && (
                        <span className="text-sm text-red-400" role="alert">
                            {walletError}
                        </span>
                    )}
                    <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        onClick={address ? disconnect : connect}
                        disabled={isConnecting}
                    >
                        {isConnecting
                            ? 'Connecting...'
                            : address
                                ? `Disconnect (${address.slice(0, 6)}...${address.slice(-4)})`
                                : 'Connect Wallet'}
                    </button>
                </nav>
            </div>

            <TagFileModal
                isOpen={isTagModalOpen}
                onClose={() => setIsTagModalOpen(false)}
                onSuccess={handleFileTagged}
            />
        </header>
    );
} 