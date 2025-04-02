import type { Tag } from '@/types/database';

interface TagListProps {
    tags: Tag[];
}

export function TagList({ tags }: TagListProps) {
    if (tags.length === 0) {
        return <span className="text-sm text-gray-500">No tags</span>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
                <span
                    key={tag.id}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                >
                    {tag.tag}
                </span>
            ))}
        </div>
    );
} 