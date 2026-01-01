'use client';

import { useState } from 'react';
import { Card as CardType } from '@/lib/api/cards';

interface CardProps {
	card: CardType;
	onClick?: () => void;
	isInBinder?: boolean;
}

function getRarityColors(rarity: string | null | undefined) {
	if (!rarity) {
		return {
			bg: 'bg-slate-500/15',
			text: 'text-slate-700',
			border: 'border-slate-300/50',
			banner: 'bg-slate-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(100,116,139,0.25)]',
		};
	}

	const rarityLower = rarity.toLowerCase();

	// Rare Holo variants (all share purple)
	if (rarityLower.includes('rare holo') || rarityLower === 'rare ultra') {
		return {
			bg: 'bg-purple-500/20',
			text: 'text-purple-700',
			border: 'border-purple-300/50',
			banner: 'bg-purple-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(168,85,247,0.25)]',
		};
	}

	// Specific rarity mappings
	if (rarityLower === 'common') {
		return {
			bg: 'bg-slate-500/15',
			text: 'text-slate-700',
			border: 'border-slate-300/50',
			banner: 'bg-slate-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(100,116,139,0.25)]',
		};
	}

	if (rarityLower === 'uncommon') {
		return {
			bg: 'bg-emerald-500/15',
			text: 'text-emerald-700',
			border: 'border-emerald-300/50',
			banner: 'bg-emerald-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(16,185,129,0.25)]',
		};
	}

	if (rarityLower === 'promo') {
		return {
			bg: 'bg-orange-500/15',
			text: 'text-orange-700',
			border: 'border-orange-300/50',
			banner: 'bg-orange-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(251,146,60,0.25)]',
		};
	}

	if (rarityLower === 'rare') {
		return {
			bg: 'bg-blue-500/15',
			text: 'text-blue-700',
			border: 'border-blue-300/50',
			banner: 'bg-blue-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(37,99,235,0.25)]',
		};
	}

	if (rarityLower === 'rare break') {
		return {
			bg: 'bg-amber-500/20',
			text: 'text-amber-800',
			border: 'border-amber-300/60',
			banner: 'bg-amber-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(245,158,11,0.25)]',
		};
	}

	if (rarityLower === 'rare prism star') {
		return {
			bg: 'bg-cyan-500/15',
			text: 'text-cyan-700',
			border: 'border-cyan-300/50',
			banner: 'bg-cyan-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(6,182,212,0.25)]',
		};
	}

	if (rarityLower === 'rare shiny') {
		return {
			bg: 'bg-teal-500/15',
			text: 'text-teal-700',
			border: 'border-teal-300/50',
			banner: 'bg-teal-600/80',
			shadow: 'shadow-[0_8px_30px_rgba(20,184,166,0.25)]',
		};
	}

	// Default fallback
	return {
		bg: 'bg-slate-500/15',
		text: 'text-slate-700',
		border: 'border-slate-300/50',
		banner: 'bg-slate-600/80',
		shadow: 'shadow-[0_8px_30px_rgba(100,116,139,0.25)]',
	};
}

export default function Card({ card, onClick, isInBinder = false }: CardProps) {
	const [added, setAdded] = useState(isInBinder);

	const handleAddToBinder = (e: React.MouseEvent) => {
		e.stopPropagation();
		setAdded(!added);
	};

	const rarityColors = getRarityColors(card.rarity);
	const borderStyle = `border ${rarityColors.border} ${rarityColors.shadow}`;
	const rarityBannerColor = rarityColors.banner;

	return (
		<div
			className={`relative rounded-2xl ${borderStyle}
				group cursor-pointer transition-all duration-200 ease-out
				group-hover:-translate-y-1
				group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]`}
			onClick={onClick}
		>
			{/* ================= TOP RARITY BANNER ================= */}
			<div className='absolute top-0 left-0 right-0 overflow-hidden rounded-t-2xl z-20'>
				<div
					className={`${rarityBannerColor}
						text-white text-[11px] font-semibold tracking-wide
						py-1 px-3 text-center`}
				>
					{card.rarity || 'Unknown'}
				</div>
			</div>

			{/* ================= IMAGE ================= */}
			<div className='aspect-square bg-white/30 flex items-center justify-center p-2 relative overflow-hidden mt-7'>
				{/* Inner frame */}
				<div className='absolute inset-0 rounded-md ring-1 ring-black/10 z-0' />

				{card.image_small ? (
					<img
						src={card.image_small}
						alt={card.name}
						className='w-full h-full object-contain relative z-10'
						loading='lazy'
					/>
				) : (
					<div className='text-gray-400 text-sm'>No Image</div>
				)}

				{/* Hover shimmer */}
				<div
					className='absolute inset-0
						bg-gradient-to-r from-transparent via-white/20 to-transparent
						-translate-x-full group-hover:translate-x-full
						transition-transform duration-1000 z-20'
				/>
			</div>

			{/* ================= BOTTOM INFO PANEL ================= */}
			<div className='p-3 space-y-1.5 bg-white/80 rounded-b-2xl relative z-10'>
				{/* Name */}
				<h3 className='font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2rem]'>
					{card.name}
				</h3>

				{/* Set */}
				{card.set_name && (
					<div className='space-y-0.5'>
						<p className='text-xs text-gray-600 font-medium'>SET</p>
						<p className='text-xs text-gray-600 font-medium line-clamp-1'>
							{card.set_name}
						</p>
					</div>
				)}

				{/* Rarity badge */}
				<div className='pt-1'>
					<span
						className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
							${rarityColors.bg} ${rarityColors.text} border ${rarityColors.border}`}
					>
						{card.rarity || 'Unknown'}
					</span>
				</div>

				{/* Add to Binder */}
				<button
					onClick={handleAddToBinder}
					aria-pressed={added}
					className={`w-full mt-3 flex items-center justify-center gap-2
						px-3 py-2 text-xs font-semibold rounded-lg
						transition-colors duration-200
						${
							added
								? 'bg-green-500/90 text-white hover:bg-green-600'
								: 'bg-purple-600/80 text-white hover:bg-purple-700'
						}`}
				>
					{added ? '✔ Added!' : 'Add to My Binder'}
				</button>
			</div>
		</div>
	);
}
