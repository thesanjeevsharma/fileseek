import { useState, useEffect } from "react";
import type { File } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface UseFilesOptions {
	limit?: number;
	orderBy?: "upload_date" | "upvotes";
	filterByType?: string;
	filterByTags?: string[];
	searchQuery?: string;
}

export function useFiles({
	limit = 10,
	orderBy = "upload_date",
	filterByType,
	filterByTags = [],
	searchQuery,
}: UseFilesOptions = {}) {
	const [files, setFiles] = useState<File[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchFiles() {
			try {
				setLoading(true);
				setError(null);

				let query = supabase
					.from("files")
					.select("*, file_tags!inner(tag_id), tags!inner(*)", {
						count: "exact",
					});

				// Apply tag filters if any
				if (filterByTags.length > 0) {
					query = query.in("tags.id", filterByTags);
				}

				if (filterByType) {
					query = query.eq("file_type", filterByType);
				}

				if (searchQuery) {
					query = query.or(
						`file_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`,
					);
				}

				if (orderBy === "upvotes") {
					// TODO: Implement upvote sorting when vote table is ready
					query = query.order("upload_date", { ascending: false });
				} else {
					query = query.order("upload_date", { ascending: false });
				}

				query = query.limit(limit);

				const { data, error: supabaseError } = await query;

				if (supabaseError) {
					throw supabaseError;
				}

				// Remove duplicates caused by the join and format the data
				const uniqueFiles = Array.from(
					new Map(data?.map((file) => [file.id, file])).values(),
				);

				setFiles(uniqueFiles);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "An error occurred while fetching files",
				);
			} finally {
				setLoading(false);
			}
		}

		fetchFiles();
	}, [limit, orderBy, filterByType, filterByTags, searchQuery]);

	const voteOnFile = async (fileId: string, voteType: 1 | -1) => {
		try {
			const { error } = await supabase.from("votes").upsert(
				{
					file_id: fileId,
					user_id: "TODO: Get authenticated user ID", // TODO: Implement with auth
					vote_type: voteType,
				},
				{ onConflict: "file_id,user_id" },
			);

			if (error) {
				throw error;
			}

			// Optimistically update the UI
			// TODO: Update vote count in the UI when vote table is ready
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "An error occurred while voting",
			);
		}
	};

	return {
		files,
		loading,
		error,
		voteOnFile,
	};
}
