'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { TagFileModal } from './TagFileModal';
import type { File } from '@/types/database';

export function Header() {
    const { address, isConnecting, error: walletError, connect, disconnect } = useWallet();
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    const handleFileTagged = (_file: File) => {
        setIsTagModalOpen(false);
        // You might want to add some success notification here
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="text-xl font-bold">FileSeek</span>
                </Link>

                <nav className="flex items-center space-x-4">
                    <button
                        type="button"
                        onClick={() => setIsTagModalOpen(true)}
                        className="cursor-pointer rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                        disabled={!address}
                    >
                        Tag a File
                    </button>
                    {walletError && (
                        <span className="text-sm text-red-600" role="alert">
                            {walletError}
                        </span>
                    )}
                    <button
                        type="button"
                        className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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