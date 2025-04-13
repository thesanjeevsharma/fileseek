'use client';

import { useState, useEffect, useRef } from 'react';
import { useTags } from '@/hooks/useTags';
import type { Tag } from '@/types/database';

interface TagInputProps {
    id?: string;
    fileId?: string;
    initialTags?: Tag[];
    onTagsChange?: (tags: Tag[]) => void;
    disabled?: boolean;
}

export function TagInput({
    id,
    fileId,
    initialTags = [],
    onTagsChange,
    disabled = false,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const { searchTags, removeTagFromFile, isLoading } = useTags();

    useEffect(() => {
        // Handle clicks outside of suggestions
        function handleClickOutside(event: MouseEvent) {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        onTagsChange?.(selectedTags);
    }, [selectedTags, onTagsChange]);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (value.trim()) {
            const results = await searchTags(value);
            setSuggestions(results);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            await addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
            // Remove the last tag when backspace is pressed on empty input
            const lastTag = selectedTags[selectedTags.length - 1];
            await handleRemoveTag(lastTag);
        }
    };

    const addTag = async (tagText: string) => {
        if (disabled || isLoading) return;

        const normalizedTag = tagText.trim().toLowerCase();
        if (!normalizedTag) return;

        // Check if tag already exists in selected tags
        if (selectedTags.some((tag) => tag.tag.toLowerCase() === normalizedTag)) {
            return;
        }

        const suggestion = suggestions.find(
            (suggestion) => suggestion.tag.toLowerCase() === normalizedTag
        );

        if (suggestion) {
            const newTag: Tag = {
                id: suggestion.id,
                tag: normalizedTag,
            };
            setSelectedTags((prev) => [...prev, newTag]);
        } else {
            const newTag: Tag = {
                id: `temp-${Date.now()}`,
                tag: normalizedTag,
            };
            setSelectedTags((prev) => [...prev, newTag]);
        }

        setInputValue('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleRemoveTag = async (tagToRemove: Tag) => {
        if (disabled || isLoading) return;

        if (fileId) {
            await removeTagFromFile(fileId, tagToRemove.id);
        }
        setSelectedTags((prev) =>
            prev.filter((tag) => tag.id !== tagToRemove.id)
        );
    };

    return (
        <div className="relative w-full">
            <div className="flex flex-wrap gap-2 rounded-xl border border-gray-800 bg-gray-900/50 p-3">
                {selectedTags.map((tag) => (
                    <span
                        key={tag.id}
                        className="flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1.5 text-sm text-blue-400 ring-1 ring-blue-500/30"
                    >
                        {tag.tag}
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 rounded-full p-1 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 transition-colors"
                            disabled={disabled || isLoading}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue.trim() && setShowSuggestions(true)}
                    placeholder={
                        selectedTags.length === 0 ? 'Add tags...' : 'Add another tag...'
                    }
                    className="flex-1 min-w-[120px] border-none bg-transparent p-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-0"
                    disabled={disabled || isLoading}
                />
            </div>
            <span className="text-xs text-gray-500">
                Choose a tag from the suggestions or type a new one. Press Enter to add.
            </span>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-gray-800 bg-gray-900 shadow-2xl"
                >
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => {
                                addTag(suggestion.tag);
                                inputRef.current?.focus();
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                        >
                            {suggestion.tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 