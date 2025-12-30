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
		e.stopPropagation(); // Prevent card click from firing
		setAdded(!added);
		// TODO: Add API call to add/remove from binder
	};

	// Determine rarity banner color - purple for Holo, blue for regular
	const rarityBannerColor = card.rarity?.includes('Holo')
		? 'bg-purple-600/90'
		: 'bg-blue-600/90';

	// Determine border color to match rarity exactly
	const borderColor = card.rarity?.includes('Holo')
		? 'border-purple-600'
		: 'border-blue-600';

	return (
		<div
			className={`relative rounded-2xl overflow-hidden border-2 ${borderColor} bg-white/5 transition-all duration-300 group cursor-pointer`}
			onClick={onClick}
			style={{
				boxShadow: 'none',
				filter: 'none',
				textShadow: 'none',
			}}
		>
			{/* Rarity Banner at Top */}
			<div
				className={`absolute top-0 left-0 right-0 ${rarityBannerColor} text-white text-xs font-bold py-1 px-3 text-center z-20`}
			>
				{card.rarity || 'Unknown'}
			</div>

			{/* Image Container */}
			<div className='aspect-square bg-white/30 flex items-center justify-center p-3 relative overflow-hidden mt-6'>
				{card.image_small ? (
					<img
						src={card.image_small}
						alt={card.name}
						className='w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 relative z-10'
						loading='lazy'
					/>
				) : (
					<div className='text-gray-400 text-sm'>No Image</div>
				)}
				{/* Shimmer effect on hover */}
				<div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20'></div>
			</div>

			{/* Card Info */}
			<div className='p-4 space-y-2 bg-white/10  relative z-10'>
				{/* Card Name */}
				<h3 className='font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2rem]'>
					{card.name}
				</h3>

				{/* Set Name */}
				{card.set_name && (
					<div className='space-y-0.5'>
						<p className='text-xs text-gray-600 font-medium'>SET</p>
						<p className='text-xs text-gray-600 font-medium line-clamp-1'>
							{card.set_name}
						</p>
					</div>
				)}

				{/* Rarity Badge */}
				<div className='pt-1'>
					<span
						className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
							card.rarity?.includes('Holo')
								? 'bg-purple-500/20 text-purple-700 border border-purple-300/50'
								: 'bg-blue-500/20 text-blue-700 border border-blue-300/50'
						}`}
					>
						{card.rarity || 'Unknown'}
					</span>
				</div>

				{/* Add to Binder Button */}
				<button
					onClick={handleAddToBinder}
					className={`w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
						added
							? 'bg-green-500 text-white hover:bg-green-600'
							: 'bg-purple-600 text-white hover:bg-purple-700'
					}`}
				>
					{added ? (
						<>
							<svg
								width='16'
								height='16'
								viewBox='0 0 24 24'
								fill='none'
								className='w-4 h-4'
							>
								<path
									d='M9 12L11 14L15 10'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
								<circle
									cx='12'
									cy='12'
									r='10'
									stroke='currentColor'
									strokeWidth='2'
								/>
							</svg>
							✔ Added!
						</>
					) : (
						<>
							<svg
								width='16'
								height='16'
								viewBox='0 0 24 24'
								fill='none'
								className='w-4 h-4'
							>
								<path
									d='M7 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
								<circle cx='7' cy='8' r='1.5' fill='currentColor' />
								<circle cx='7' cy='12' r='1.5' fill='currentColor' />
								<circle cx='7' cy='16' r='1.5' fill='currentColor' />
							</svg>
							Add to My Binder
						</>
					)}
				</button>
			</div>
		</div>
	);
}
