'use client';

import { Modal } from './Modal';
import { TagFileForm } from './TagFileForm';
import type { File } from '@/types/database';

interface TagFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (file: File) => void;
}

export function TagFileModal({ isOpen, onClose, onSuccess }: TagFileModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tag a File">
            <TagFileForm onSuccess={onSuccess} onCancel={onClose} />
        </Modal>
    );
} 