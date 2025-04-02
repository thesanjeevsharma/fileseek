'use client';

import { useState } from 'react';
import { FileCard } from '@/components/FileCard';
import { useFiles } from '@/hooks/useFiles';
import { TagFilter } from '@/components/TagFilter';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { files, loading, error, voteOnFile } = useFiles({
    searchQuery: searchQuery || undefined,
    filterByTags: selectedTags,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The useFiles hook will automatically refetch with the new search query
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Discover Files on Filecoin</h1>
        <p className="mt-2 text-gray-600">
          Browse, search, and interact with files stored on the Filecoin network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <TagFilter
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search files..."
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-8 rounded-lg bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <p className="text-gray-500">Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <p className="text-gray-500">No files found</p>
              </div>
            ) : (
              files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onUpvote={() => voteOnFile(file.id, 1)}
                  onDownvote={() => voteOnFile(file.id, -1)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
