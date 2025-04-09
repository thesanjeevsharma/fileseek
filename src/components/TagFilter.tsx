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
        return (
            <div className="space-y-3">
                <div className="h-6 w-24 animate-pulse rounded-lg bg-gray-800" />
                <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-20 animate-pulse rounded-full bg-gray-800" />
                    <div className="h-8 w-24 animate-pulse rounded-full bg-gray-800" />
                    <div className="h-8 w-16 animate-pulse rounded-full bg-gray-800" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-300">Filter by Tags</h2>
            <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${selectedTags.includes(tag.id)
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 ring-1 ring-blue-500/50'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
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