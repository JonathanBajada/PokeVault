import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BinderCard } from '@/lib/api/binder';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface WantListResponse {
	username: string;
	count: number;
	cards: BinderCard[];
}

async function fetchWantList(username: string): Promise<WantListResponse> {
	const res = await fetch(`${API_URL}/users/by-username/${encodeURIComponent(username)}/wants`, {
		next: { revalidate: 60 },
	});
	if (res.status === 404) notFound();
	if (!res.ok) throw new Error('Failed to fetch want list');
	return res.json();
}

interface Props {
	params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { username } = await params;
	try {
		const data = await fetchWantList(username);
		const title = `${data.username}'s Want List — PokeVault`;
		const description = `${data.count} card${data.count !== 1 ? 's' : ''} on ${data.username}'s Pokémon TCG want list`;
		const firstImage = data.cards[0]?.image_small_url;
		return {
			title,
			description,
			openGraph: {
				title,
				description,
				type: 'website',
				...(firstImage && { images: [{ url: firstImage, alt: `${data.username}'s want list` }] }),
			},
			twitter: { card: 'summary_large_image', title, description },
		};
	} catch {
		return { title: 'Want List — PokeVault' };
	}
}

export default async function WantListPage({ params }: Props) {
	const { username } = await params;
	const data = await fetchWantList(username);

	return (
		<div className='min-h-screen py-8' style={{ paddingTop: '5rem' }}>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>

				{/* Header */}
				<div className='mb-10'>
					<div className='flex items-baseline gap-3 mb-2'>
						<h1
							className='font-brand text-4xl md:text-5xl font-bold drop-shadow-sm'
							style={{ color: 'var(--vault-gold)', letterSpacing: '0.3px' }}
						>
							{data.username}
						</h1>
						<span className='font-japanese text-lg md:text-xl opacity-60' style={{ color: 'var(--text-muted)' }}>
							ウィッシュリスト
						</span>
					</div>
					<p className='text-sm' style={{ color: 'var(--text-muted)' }}>
						Want list · {data.count} card{data.count !== 1 ? 's' : ''}
					</p>
				</div>

				{/* Empty state */}
				{data.count === 0 && (
					<div
						className='rounded-2xl p-16 text-center'
						style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
					>
						<p className='text-lg font-medium mb-2' style={{ color: 'var(--text-muted)' }}>
							Nothing on the want list yet
						</p>
						<p className='text-sm' style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
							{data.username} hasn&apos;t added any cards to their want list.
						</p>
					</div>
				)}

				{/* Card grid */}
				{data.count > 0 && (
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'>
						{data.cards.map((card) => (
							<WantCard key={card.card_id} card={card} />
						))}
					</div>
				)}

				{/* CTA */}
				<div
					className='mt-16 rounded-2xl p-8 text-center'
					style={{
						background: 'var(--bg-elevated)',
						border: '1px solid rgba(255,95,210,0.15)',
						boxShadow: '0 0 40px rgba(255,95,210,0.04)',
					}}
				>
					<p className='font-brand text-xl font-bold mb-1' style={{ color: 'var(--text-primary)' }}>
						Track your own Pokémon TCG collection
					</p>
					<p className='text-sm mb-6' style={{ color: 'var(--text-muted)' }}>
						Build a binder, manage your want list, and share it with the community.
					</p>
					<Link
						href='/signup'
						className='btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold'
					>
						Get started free →
					</Link>
				</div>
			</div>
		</div>
	);
}

function WantCard({ card }: { card: BinderCard }) {
	const rarityLower = card.rarity?.toLowerCase() ?? '';
	const isHolo = rarityLower.includes('holo');

	const getRarityColorCategory = (): 'COMMON' | 'UNCOMMON' | 'RARE' => {
		if (!card.rarity) return 'COMMON';
		const r = card.rarity.toLowerCase();
		if (r === 'common') return 'COMMON';
		if (r === 'uncommon') return 'UNCOMMON';
		return 'RARE';
	};

	return (
		<Link href={`/card/${card.card_id}`} className={`card ${isHolo ? 'holo' : ''} group block`}>
			<div className='card-image-wrapper' data-rarity={getRarityColorCategory()}>
				{card.image_small_url ? (
					<img src={card.image_small_url} alt={card.name} loading='lazy' />
				) : (
					<div className='w-full h-full flex items-center justify-center' style={{ backgroundColor: 'var(--bg-elevated)' }}>
						<span className='text-sm' style={{ color: 'var(--text-muted)' }}>No Image</span>
					</div>
				)}
				<div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10' />
				<div
					className='absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold'
					style={{ background: 'rgba(99,179,237,0.9)', color: '#fff' }}
				>
					♡
				</div>
			</div>

			<div className='rarity-label-bar' data-rarity={getRarityColorCategory()}>
				{card.rarity?.toUpperCase() ?? 'COMMON'}
			</div>

			<div className='flex flex-col pb-4' style={{ background: 'rgba(22, 30, 46, 1)' }}>
				<div className='px-4 pt-3'>
					<h3 className='card-title line-clamp-2 min-h-[2.5rem] text-sm'>{card.name}</h3>
					{card.set_name && <p className='card-set-name line-clamp-1 text-xs'>{card.set_name}</p>}
					{card.market_price && (
						<p className='card-price text-sm mt-1'>${card.market_price.toFixed(2)}</p>
					)}
				</div>
			</div>
		</Link>
	);
}
