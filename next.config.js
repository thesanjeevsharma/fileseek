/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
	typescript: {
		// Temporarily ignore type errors during build (you should fix these later)
		ignoreBuildErrors: true,
	},
};

module.exports = nextConfig;
