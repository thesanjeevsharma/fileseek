import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { File, Tag } from '@/types/database';
import { TagInput } from './TagInput';

interface TagFileFormProps {
    onSuccess: (file: File) => void;
    onCancel: () => void;
}

export function TagFileForm({ onSuccess, onCancel }: TagFileFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [formData, setFormData] = useState({
        filecoin_hash: '',
        file_name: '',
        file_type: '',
        file_size: '',
        network: '',
        description: '',
        thumbnail_url: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // First, ensure all temporary tags are created in the database
            const tagPromises = selectedTags
                .filter(tag => tag.id.startsWith('temp-'))
                .map(async (tag) => {
                    const { data, error } = await supabase
                        .from('tags')
                        .insert([{ tag: tag.tag }])
                        .select()
                        .single();

                    if (error) throw error;
                    return data;
                });

            const createdTags = await Promise.all(tagPromises);

            // Create a map of temporary IDs to real IDs
            const tagMap = new Map(
                selectedTags.map(tag => {
                    if (tag.id.startsWith('temp-')) {
                        const createdTag = createdTags.find(t => t.tag === tag.tag);
                        return [tag.id, createdTag?.id];
                    }
                    return [tag.id, tag.id];
                })
            );

            // Create the file
            const { data: file, error: fileError } = await supabase
                .from('files')
                .insert([
                    {
                        ...formData,
                        file_size: Number.parseInt(formData.file_size, 10),
                        upload_date: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (fileError) throw fileError;
            if (!file) throw new Error('Failed to create file');

            // Create file-tag associations using the real tag IDs
            if (selectedTags.length > 0) {
                const fileTags = selectedTags.map(tag => ({
                    file_id: file.id,
                    tag_id: tagMap.get(tag.id),
                }));

                const { error: tagError } = await supabase
                    .from('file_tags')
                    .insert(fileTags);

                if (tagError) throw tagError;
            }

            onSuccess(file);
        } catch (err) {
            console.error('Error saving file:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while saving the file');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="filecoin_hash" className="block text-sm font-medium">
                    Filecoin Hash *
                </label>
                <input
                    type="text"
                    id="filecoin_hash"
                    name="filecoin_hash"
                    required
                    className="mt-1 block w-full rounded-lg border px-3 py-2"
                    value={formData.filecoin_hash}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="file_name" className="block text-sm font-medium">
                    File Name
                </label>
                <input
                    type="text"
                    id="file_name"
                    name="file_name"
                    className="mt-1 block w-full rounded-lg border px-3 py-2"
                    value={formData.file_name}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="file_type" className="block text-sm font-medium">
                    File Type *
                </label>
                <input
                    type="text"
                    id="file_type"
                    name="file_type"
                    required
                    className="mt-1 block w-full rounded-lg border px-3 py-2"
                    value={formData.file_type}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="file_size" className="block text-sm font-medium">
                    File Size (bytes) *
                </label>
                <input
                    type="number"
                    id="file_size"
                    name="file_size"
                    required
                    min="0"
                    className="mt-1 block w-full rounded-lg border px-3 py-2"
                    value={formData.file_size}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="network" className="block text-sm font-medium">
                    Network *
                </label>
                <input
                    type="text"
                    id="network"
                    name="network"
                    required
                    className="mt-1 block w-full rounded-lg border px-3 py-2"
                    value={formData.network}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="thumbnail_url" className="block text-sm font-medium">
                    Thumbnail URL
                </label>
                <input
                    type="url"
                    id="thumbnail_url"
                    name="thumbnail_url"
                    className="mt-1 block w-full rounded-lg border px-3 py-2"
                    value={formData.thumbnail_url}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="mt-1 block w-full rounded-lg border px-3 py-2"
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="tags" className="block text-sm font-medium">Tags</label>
                <div className="mt-1">
                    <TagInput
                        id="tags"
                        onTagsChange={setSelectedTags}
                        disabled={loading}
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border px-4 py-2 hover:bg-gray-50"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
} 