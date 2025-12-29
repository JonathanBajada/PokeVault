import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: 'http://localhost:3000/:path*',
			},
		];
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.pokemontcg.io',
			},
			{
				protocol: 'https',
				hostname: '**.pokemontcg.io',
			},
		],
	},
};

export default nextConfig;
