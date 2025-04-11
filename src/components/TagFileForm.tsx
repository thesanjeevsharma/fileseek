import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import type { File, Tag } from '@/types/database';
import { TagInput } from './TagInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { REWARD_POINTS } from '@/config/rewards';
import { updateUserPoints } from '@/lib/rewards';
import { getRandomPoints } from '@/lib/drand';
interface TagFileFormProps {
    onSuccess: (file: File) => void;
    onCancel: () => void;
}

export function TagFileForm({ onSuccess, onCancel }: TagFileFormProps) {
    const { user, refreshUser } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [formData, setFormData] = useState({
        filecoin_hash: '',
        file_name: '',
        file_type: '',
        file_size: '',
        network: 'filecoin',
        description: '',
        thumbnail_url: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!user) throw new Error('Please connect your wallet to tag a file');

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
                        user_id: user.id,
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

            // Award points for tagging a file
            const randomPoints = await getRandomPoints();
            const finalRewardPoints = REWARD_POINTS.TAG_FILE + randomPoints;

            if (finalRewardPoints > REWARD_POINTS.TAG_FILE) {
                toast.success(`You earned ${randomPoints} extra points!`);
            }

            await updateUserPoints(user.id, finalRewardPoints);
            await refreshUser();

            onSuccess(file);
            toast.success('File saved successfully');
        } catch (err) {
            console.error('Error saving file:', err);
            toast.error(err instanceof Error ? err.message : 'An error occurred while saving the file');
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="filecoin_hash" className="block text-sm font-medium text-gray-300">
                    Filecoin Hash *
                </label>
                <input
                    type="text"
                    id="filecoin_hash"
                    name="filecoin_hash"
                    required
                    className="mt-2 block w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.filecoin_hash}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="file_name" className="block text-sm font-medium text-gray-300">
                    File Name *
                </label>
                <input
                    type="text"
                    id="file_name"
                    name="file_name"
                    className="mt-2 block w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.file_name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div>
                <label htmlFor="file_type" className="block text-sm font-medium text-gray-300">
                    File Type *
                </label>
                <input
                    type="text"
                    id="file_type"
                    name="file_type"
                    required
                    className="mt-2 block w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.file_type}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="file_size" className="block text-sm font-medium text-gray-300">
                    File Size (bytes) *
                </label>
                <input
                    type="number"
                    id="file_size"
                    name="file_size"
                    required
                    min="0"
                    className="mt-2 block w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.file_size}
                    onChange={handleChange}
                />
            </div>

            {/* <div>
                <label htmlFor="network" className="block text-sm font-medium text-gray-300">
                    Network *
                </label>
                <input
                    type="text"
                    id="network"
                    name="network"
                    required
                    className="mt-2 block w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.network}
                    onChange={handleChange}
                />
            </div> */}

            <div>
                <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-300">
                    Thumbnail URL
                </label>
                <input
                    type="url"
                    id="thumbnail_url"
                    name="thumbnail_url"
                    className="mt-2 block w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.thumbnail_url}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="mt-2 block w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-300">
                    Tags
                </label>
                <div className="mt-2">
                    <TagInput
                        id="tags"
                        onTagsChange={setSelectedTags}
                        disabled={loading}
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="flex justify-end space-x-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
} 