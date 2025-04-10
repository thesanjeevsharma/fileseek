import { useState, useEffect, useCallback } from "react";
import type { File } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { useUser } from "./useUser";
import { toast } from "sonner";

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
	const { user } = useUser();
	const [files, setFiles] = useState<File[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchFiles = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			let query = supabase.from("files").select(
				`
					*,
					file_tags!inner(tag_id),
					tags!inner(*),
					votes (
						vote_type
					)
				`,
				{
					count: "exact",
				},
			);

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
				// Count upvotes and downvotes for sorting
				const { data: voteCounts, error: voteError } = await supabase
					.from("votes")
					.select("file_id, vote_type")
					.in("vote_type", [1, -1]);

				if (voteError) throw voteError;

				// Calculate net votes (upvotes - downvotes) for each file
				const netVotes = new Map();
				if (voteCounts) {
					for (const vote of voteCounts) {
						const current = netVotes.get(vote.file_id) || 0;
						netVotes.set(vote.file_id, current + vote.vote_type);
					}
				}

				// Get all files and sort them by net votes
				const { data: allFiles, error: filesError } = await query;
				if (filesError) throw filesError;

				const sortedFiles = allFiles
					?.sort((a, b) => {
						const aVotes = netVotes.get(a.id) || 0;
						const bVotes = netVotes.get(b.id) || 0;
						return bVotes - aVotes;
					})
					.slice(0, limit);

				if (sortedFiles) {
					setFiles(sortedFiles);
					setLoading(false);
					return;
				}
			} else {
				query = query.order("upload_date", { ascending: false });
			}

			query = query.limit(limit);

			const { data, error: supabaseError } = await query;

			if (supabaseError) {
				throw supabaseError;
			}

			// Remove duplicates and format the data
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
	}, [limit, orderBy, filterByType, filterByTags, searchQuery]);

	useEffect(() => {
		fetchFiles();
	}, [fetchFiles]);

	const voteOnFile = async (fileId: string, voteType: 1 | -1) => {
		if (!user) {
			toast.error("Please connect your wallet to vote");
			return;
		}

		try {
			// First check if user has already voted
			const { data: existingVote, error: voteCheckError } = await supabase
				.from("votes")
				.select("*")
				.eq("file_id", fileId)
				.eq("user_id", user.id)
				.maybeSingle();

			if (voteCheckError) throw voteCheckError;

			// If user is voting the same way, remove their vote
			if (existingVote?.vote_type === voteType) {
				const { error: deleteError } = await supabase
					.from("votes")
					.delete()
					.eq("id", existingVote.id);

				if (deleteError) throw deleteError;
				toast.success("Vote removed");
			} else if (existingVote) {
				// Update existing vote
				const { error: updateError } = await supabase
					.from("votes")
					.update({ vote_type: voteType })
					.eq("id", existingVote.id);

				if (updateError) throw updateError;
				toast.success(voteType === 1 ? "Upvoted!" : "Downvoted!");
			} else {
				// Create new vote
				const { error: insertError } = await supabase.from("votes").insert({
					file_id: fileId,
					user_id: user.id,
					vote_type: voteType,
				});

				if (insertError) throw insertError;
				toast.success(voteType === 1 ? "Upvoted!" : "Downvoted!");
			}

			// Refresh the files to update vote counts
			await fetchFiles();
		} catch (err) {
			console.error("Error voting:", err);
			setError(
				err instanceof Error ? err.message : "An error occurred while voting",
			);
			toast.error("Failed to register vote. Please try again.");
		}
	};

	return {
		files,
		loading,
		error,
		voteOnFile,
	};
}
