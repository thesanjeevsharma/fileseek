import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types/database";

export function useUser() {
	const { address } = useWallet();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchUser() {
			if (!address) {
				setUser(null);
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				const { data, error: supabaseError } = await supabase
					.from("users")
					.select("*")
					.eq("wallet_address", address)
					.single();

				if (supabaseError) throw supabaseError;
				if (!data) throw new Error("User not found");

				setUser(data);
			} catch (err) {
				console.error("Error fetching user:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load user data",
				);
				setUser(null);
			} finally {
				setLoading(false);
			}
		}

		fetchUser();
	}, [address]);

	const refreshUser = async () => {
		if (!address) return;

		try {
			setLoading(true);
			setError(null);

			const { data, error: supabaseError } = await supabase
				.from("users")
				.select("*")
				.eq("wallet_address", address)
				.single();

			if (supabaseError) throw supabaseError;
			if (!data) throw new Error("User not found");

			setUser(data);
		} catch (err) {
			console.error("Error refreshing user:", err);
			setError(
				err instanceof Error ? err.message : "Failed to refresh user data",
			);
		} finally {
			setLoading(false);
		}
	};

	return {
		user,
		loading,
		error,
		refreshUser,
	};
}
