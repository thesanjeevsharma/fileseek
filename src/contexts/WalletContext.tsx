'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';

interface WalletContextType {
    address: string | null;
    isConnecting: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if user was previously connected
        const checkConnection = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        setAddress(accounts[0].address);
                        await syncWithSupabase(accounts[0].address);
                    }
                } catch (err) {
                    console.error('Error checking wallet connection:', err);
                }
            }
        };

        checkConnection();
    }, []);

    const syncWithSupabase = async (walletAddress: string) => {
        try {
            // Check if user exists
            const { data: existingUser } = await supabase
                .from('users')
                .select()
                .eq('wallet_address', walletAddress)
                .single();

            if (!existingUser) {
                // Create new user if doesn't exist
                const { error } = await supabase.from('users').insert([
                    {
                        wallet_address: walletAddress,
                        reward_points: 0,
                    },
                ]);

                if (error) throw error;
            }
        } catch (err) {
            console.error('Error syncing with Supabase:', err);
            setError('Error creating user profile');
        }
    };

    const connect = async () => {
        if (typeof window.ethereum === 'undefined') {
            setError('Please install MetaMask to connect');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);

            if (accounts.length > 0) {
                setAddress(accounts[0]);
                await syncWithSupabase(accounts[0]);
            }
        } catch (err) {
            console.error('Error connecting wallet:', err);
            setError('Error connecting wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        setAddress(null);
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                isConnecting,
                error,
                connect,
                disconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
} 