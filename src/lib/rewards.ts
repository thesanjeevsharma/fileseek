import { supabase } from "./supabase";

export async function updateUserPoints(userId: string, points: number) {
	try {
		// Get current points
		const { data: userData, error: fetchError } = await supabase
			.from("users")
			.select("reward_points")
			.eq("id", userId)
			.single();

		if (fetchError) throw fetchError;
		if (!userData) throw new Error("User not found");

		// Calculate new points total
		const newPoints = (userData.reward_points || 0) + points;

		// Update points
		const { error: updateError } = await supabase
			.from("users")
			.update({ reward_points: newPoints })
			.eq("id", userId);

		if (updateError) throw updateError;

		return newPoints;
	} catch (err) {
		console.error("Error updating user points:", err);
		throw err;
	}
}
