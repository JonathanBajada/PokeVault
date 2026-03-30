'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card as CardType } from '@/lib/api/cards';

export type BinderEntry = {
	quantity: number;
	condition: string | null;
	intent: string | null;
};

interface CardProps {
	card: CardType;
	onClick?: () => void;
	binderEntry?: BinderEntry | null;
	onToggleBinder?: (intent: 'own' | 'want') => Promise<void>;
	priority?: boolean;
}

export default function Card({ card, onClick, binderEntry, onToggleBinder, priority = false }: CardProps) {
	const currentIntent = binderEntry?.intent ?? null;
	const isOwned = !!binderEntry && currentIntent !== 'want';
	const isWanted = currentIntent === 'want';

	const [loadingIntent, setLoadingIntent] = useState<'own' | 'want' | null>(null);
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);

	const rarityLower = card.rarity?.toLowerCase() || '';
	const isHolo = rarityLower.includes('rare holo') || rarityLower.includes('holo');

	const getRarityLabel = () => (card.rarity ? card.rarity.toUpperCase() : 'COMMON');
	const getRarityColorCategory = (): 'COMMON' | 'UNCOMMON' | 'RARE' => {
		if (!card.rarity) return 'COMMON';
		const r = card.rarity.toLowerCase();
		if (r === 'common') return 'COMMON';
		if (r === 'uncommon') return 'UNCOMMON';
		return 'RARE';
	};

	const handleIntent = async (e: React.MouseEvent, intent: 'own' | 'want') => {
		e.stopPropagation();
		if (!onToggleBinder) {
			setShowLoginPrompt(true);
			setTimeout(() => setShowLoginPrompt(false), 2000);
			return;
		}
		if (intent === 'own' && isOwned) return;
		if (intent === 'want' && isWanted) return;
		setLoadingIntent(intent);
		try {
			await onToggleBinder(intent);
		} finally {
			setLoadingIntent(null);
		}
	};

	return (
		<div className={`card ${isHolo ? 'holo' : ''} cursor-pointer group`} onClick={onClick}>
			{/* ── Image ── */}
			<div className='card-image-wrapper' data-rarity={getRarityColorCategory()}>
				{card.image_small_url ? (
					<Image src={card.image_small_url} alt={card.name} fill sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw' style={{ objectFit: 'contain' }} priority={priority} />
				) : (
					<div className='w-full h-full flex items-center justify-center' style={{ backgroundColor: 'var(--bg-elevated)' }}>
						<div style={{ color: 'var(--text-muted)' }} className='text-sm'>No Image</div>
					</div>
				)}
				<div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10' />

				{/* Intent badge */}
				{binderEntry && (
					<div
						className='absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold'
						style={{
							background: isWanted ? 'rgba(99,179,237,0.9)' : 'var(--vault-gold)',
							color: isWanted ? '#fff' : 'var(--text-inverse)',
						}}
					>
						{isWanted ? '♡' : binderEntry.quantity}
					</div>
				)}
			</div>

			{/* ── Rarity bar ── */}
			<div className='rarity-label-bar' data-rarity={getRarityColorCategory()}>{getRarityLabel()}</div>

			{/* ── Content ── */}
			<div className='flex flex-col rounded-b-[0.6rem]' style={{ background: 'rgba(22, 30, 46, 1)' }}>
				<div className='px-6 pt-4 pb-3 flex-grow'>
					<h3 className='card-title line-clamp-2 min-h-[2.5rem]'>{card.name}</h3>
					{card.set_name && <p className='card-set-name line-clamp-1'>{card.set_name}</p>}
				</div>

				{/* Price + actions */}
				<div className='price-zone' style={{ background: 'linear-gradient(to bottom, rgba(18,26,38,0.4), rgba(15,22,35,0.6))' }}>
					<div className='px-6' style={{ borderTop: '1px solid var(--border-default)', paddingTop: '12px', paddingBottom: '8px' }}>
						<p className='card-price'>
							{card.highest_price && card.highest_price > 0 ? `$${Number(card.highest_price).toFixed(2)}` : 'N/A'}
						</p>
					</div>

					<div className='px-6 pt-3 pb-6 flex gap-2 shrink-0'>
						{/* Want (heart) */}
						<div className='relative'>
							{showLoginPrompt && (
								<div
									className='absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-xs font-medium pointer-events-none z-20'
									style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
								>
									Sign in to add cards
								</div>
							)}
							<button
								onClick={(e) => handleIntent(e, 'want')}
								disabled={loadingIntent !== null || isWanted}
								title={isWanted ? 'On want list' : 'Add to want list'}
								className='btn-secondary p-2.5 flex items-center justify-center disabled:opacity-70'
								style={isWanted ? { color: '#63b3ed', borderColor: 'rgba(99,179,237,0.5)' } : {}}
							>
								{loadingIntent === 'want' ? (
									<svg className='w-5 h-5 animate-spin' fill='none' viewBox='0 0 24 24'><circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'/><path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'/></svg>
								) : (
									<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill={isWanted ? 'currentColor' : 'none'} viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
										<path strokeLinecap='round' strokeLinejoin='round' d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
									</svg>
								)}
							</button>
						</div>

						{/* Own (binder) */}
						<button
							onClick={(e) => handleIntent(e, 'own')}
							disabled={loadingIntent !== null || isOwned}
							title={isOwned ? 'In your binder' : 'Add to binder'}
							className='btn-primary p-2.5 flex items-center justify-center disabled:opacity-70'
						>
							{loadingIntent === 'own' ? (
								<svg className='w-5 h-5 animate-spin' fill='none' viewBox='0 0 24 24'><circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'/><path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'/></svg>
							) : isOwned ? (
								<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
									<path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
								</svg>
							) : (
								<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
									<path strokeLinecap='round' strokeLinejoin='round' d='M7 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z' />
									<circle cx='7' cy='8' r='1.5' fill='currentColor' />
									<circle cx='7' cy='12' r='1.5' fill='currentColor' />
									<circle cx='7' cy='16' r='1.5' fill='currentColor' />
									<path strokeLinecap='round' strokeLinejoin='round' d='M10 8H18M10 12H18M10 16H18' />
								</svg>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
