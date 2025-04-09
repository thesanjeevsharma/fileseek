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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Discover Files on Filecoin
          </h1>
          <p className="mt-4 text-gray-400 text-lg">
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
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-6 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-8 py-3 text-white font-medium hover:bg-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  Search
                </button>
              </div>
            </form>

            {error && (
              <div className="mb-8 rounded-xl bg-red-900/20 border border-red-800 p-4 text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-16">
                  <div className="flex items-center space-x-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <p className="text-gray-400">Loading files...</p>
                  </div>
                </div>
              ) : files.length === 0 ? (
                <div className="col-span-full flex items-center justify-center py-16">
                  <p className="text-gray-400">No files found</p>
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
    </div>
  );
}
