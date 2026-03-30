import type { Metadata } from 'next';
import { Geist, Geist_Mono, Space_Grotesk, Inter, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import Providers from './provider';
import Navbar from '@/components/Navbar';
import PixelBackground from '@/components/PixelBackground';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
	variable: '--font-space-grotesk',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	display: 'swap',
});

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
	weight: ['400', '500', '600'],
	display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
	variable: '--font-noto-jp',
	subsets: ['latin'],
	weight: ['300', '400', '500', '700'],
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'PokeVault - Card Collection',
	description: 'Discover and collect cards with PokeVault',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${inter.variable} ${notoSansJP.variable} antialiased`}
			>
				<PixelBackground />
				<Providers>
					<Navbar />
					<main className='min-h-screen pt-16'>{children}</main>
				</Providers>
			</body>
		</html>
	);
}
