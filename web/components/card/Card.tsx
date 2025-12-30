'use client';

import { useState } from 'react';
import { Card as CardType } from '@/lib/api/cards';

interface CardProps {
	card: CardType;
	onClick?: () => void;
	isInBinder?: boolean;
}

export default function Card({ card, onClick, isInBinder = false }: CardProps) {
	const [added, setAdded] = useState(isInBinder);

	const handleAddToBinder = (e: React.MouseEvent) => {
		e.stopPropagation();
		setAdded(!added);
	};

	const isHolo = card.rarity?.includes('Holo');

	const rarityBannerColor = isHolo ? 'bg-purple-600/80' : 'bg-blue-600/80';

	const borderStyle = isHolo
		? 'border border-purple-600/70 shadow-[0_8px_30px_rgba(168,85,247,0.25)]'
		: 'border border-blue-600/70 shadow-[0_8px_30px_rgba(37,99,235,0.25)]';

	return (
		<div
			className={`relative rounded-2xl ${borderStyle}
				group cursor-pointer transition-shadow duration-200 ease-out
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
							${
								isHolo
									? 'bg-purple-500/20 text-purple-700 border border-purple-300/50'
									: 'bg-blue-500/20 text-blue-700 border border-blue-300/50'
							}`}
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
