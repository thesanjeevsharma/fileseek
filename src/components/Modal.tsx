'use client';

import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="border-gray-800 bg-gray-900 p-6 shadow-2xl">
                <DialogHeader className="mb-6 flex items-center justify-between">
                    <DialogTitle
                        className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-xl font-bold text-transparent"
                    >
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className={cn("max-h-[calc(100vh-20rem)]")}>
                    {children}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
} 