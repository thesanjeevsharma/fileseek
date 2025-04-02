import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useTags() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const searchTags = useCallback(async (query: string) => {
		try {
			const { data, error: searchError } = await supabase
				.from("tags")
				.select("*")
				.ilike("tag", `%${query}%`)
				.limit(10);

			if (searchError) throw searchError;
			return data || [];
		} catch (err) {
			console.error("Error searching tags:", err);
			return [];
		}
	}, []);

	const addTagToFile = useCallback(async (fileId: string, tagText: string) => {
		setIsLoading(true);
		setError(null);

		try {
			// Convert tag to lowercase for case-insensitive comparison
			const normalizedTag = tagText.toLowerCase().trim();

			// Check if tag already exists (case-insensitive)
			const { data: existingTags, error: searchError } = await supabase
				.from("tags")
				.select("*")
				.ilike("tag", normalizedTag)
				.limit(1);

			if (searchError) throw searchError;

			let tagId: string;

			if (existingTags && existingTags.length > 0) {
				// Use existing tag
				tagId = existingTags[0].id;
			} else {
				// Create new tag
				const { data: newTag, error: createError } = await supabase
					.from("tags")
					.insert([{ tag: normalizedTag }])
					.select()
					.single();

				if (createError) throw createError;
				if (!newTag) throw new Error("Failed to create tag");

				tagId = newTag.id;
			}

			// Add tag to file
			const { error: linkError } = await supabase
				.from("file_tags")
				.insert([{ file_id: fileId, tag_id: tagId }]);

			if (linkError) throw linkError;
		} catch (err) {
			console.error("Error adding tag:", err);
			setError(err instanceof Error ? err.message : "Error adding tag");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const removeTagFromFile = useCallback(
		async (fileId: string, tagId: string) => {
			setIsLoading(true);
			setError(null);

			try {
				const { error: deleteError } = await supabase
					.from("file_tags")
					.delete()
					.match({ file_id: fileId, tag_id: tagId });

				if (deleteError) throw deleteError;
			} catch (err) {
				console.error("Error removing tag:", err);
				setError(err instanceof Error ? err.message : "Error removing tag");
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const getFileTags = useCallback(async (fileId: string) => {
		try {
			const { data, error } = await supabase
				.from("file_tags")
				.select(`
          tag_id,
          tags (*)
        `)
				.eq("file_id", fileId);

			if (error) throw error;

			return data?.map((item) => item.tags) || [];
		} catch (err) {
			console.error("Error fetching file tags:", err);
			return [];
		}
	}, []);

	return {
		isLoading,
		error,
		searchTags,
		addTagToFile,
		removeTagFromFile,
		getFileTags,
	};
}
