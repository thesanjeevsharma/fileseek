'use client';

import { WalletProvider } from '@/contexts/WalletContext';
import type { ReactNode } from 'react';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return <WalletProvider>{children}</WalletProvider>;
} 