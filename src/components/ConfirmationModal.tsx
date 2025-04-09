import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: ReactNode;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
}: ConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-black">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-100">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-3">
                    {typeof message === 'string' ? (
                        <p className="text-sm text-gray-400">{message}</p>
                    ) : (
                        message
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-gray-900"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-gray-900"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 