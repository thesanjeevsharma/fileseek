'use client';

import { useState, useEffect } from 'react';
import { useTags } from '@/hooks/useTags';
import type { Tag } from '@/types/database';

interface TagFilterProps {
    selectedTags: string[];
    onTagsChange: (tagIds: string[]) => void;
}

export function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
    const [popularTags, setPopularTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const { searchTags } = useTags();

    useEffect(() => {
        async function fetchPopularTags() {
            setLoading(true);
            try {
                // Get all tags (we'll implement proper pagination/popularity later)
                const tags = await searchTags('');
                setPopularTags(tags);
            } catch (error) {
                console.error('Error fetching popular tags:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPopularTags();
    }, [searchTags]);

    const toggleTag = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            onTagsChange(selectedTags.filter((id) => id !== tagId));
        } else {
            onTagsChange([...selectedTags, tagId]);
        }
    };

    if (loading) {
        return <div className="animate-pulse h-8 bg-gray-200 rounded-lg" />;
    }

    return (
        <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-700">Filter by Tags</h2>
            <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTags.includes(tag.id)
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                    >
                        {tag.tag}
                    </button>
                ))}
                {popularTags.length === 0 && (
                    <p className="text-sm text-gray-500">No tags available</p>
                )}
            </div>
        </div>
    );
} 