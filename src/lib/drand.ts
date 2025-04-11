import { fetchBeacon, HttpCachingChain, HttpChainClient } from "drand-client";

const fetchLatestRandomness = async (): Promise<string> => {
	try {
		const options = {
			disableBeaconVerification: false,
			noCache: false,
		};

		const chain = new HttpCachingChain("https://api.drand.sh", options);
		const client = new HttpChainClient(chain, options);
		const theLatestBeacon = await fetchBeacon(client);

		return theLatestBeacon.randomness;
	} catch (error) {
		console.error("Error fetching randomness:", error);
		return "";
	}
};

const hexToSeed = (hex: string): number => {
	// Take the first 8 characters to form a 32-bit integer
	return Number.parseInt(hex.slice(0, 8), 16);
};

const lcg = (seed: number): (() => number) => {
	let state = seed;
	return () => {
		// LCG parameters
		state = (1664525 * state + 1013904223) % 0x100000000;
		return state / 0x100000000;
	};
};

export const getRandomPoints = async () => {
	const randomness = await fetchLatestRandomness();
	const seed = hexToSeed(randomness);
	const random = lcg(seed);

	return Math.floor(random() * 100);
};
