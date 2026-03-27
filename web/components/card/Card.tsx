'use client';

import { useState, useEffect, useRef } from 'react';
import { Card as CardType } from '@/lib/api/cards';
import { CONDITIONS } from '@/lib/api/binder';

export type BinderEntry = {
	quantity: number;
	condition: string | null;
};

interface CardProps {
	card: CardType;
	onClick?: () => void;
	binderEntry?: BinderEntry | null;
	onAddToBinder?: (quantity: number, condition: string) => Promise<void>;
	onUpdateBinder?: (quantity: number, condition: string) => Promise<void>;
	onRemoveFromBinder?: () => Promise<void>;
}

export default function Card({
	card,
	onClick,
	binderEntry,
	onAddToBinder,
	onUpdateBinder,
	onRemoveFromBinder,
}: CardProps) {
	const isInBinder = !!binderEntry;
	const isLoggedIn = !!(onAddToBinder || onUpdateBinder);

	const [popoverOpen, setPopoverOpen] = useState(false);
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);

	const rarityLower = card.rarity?.toLowerCase() || '';
	const isHolo = rarityLower.includes('rare holo') || rarityLower.includes('holo');

	const getRarityLabel = (): string => {
		if (!card.rarity) return 'COMMON';
		return card.rarity.toUpperCase();
	};

	const getRarityColorCategory = (): 'COMMON' | 'UNCOMMON' | 'RARE' => {
		if (!card.rarity) return 'COMMON';
		const r = card.rarity.toLowerCase();
		if (r === 'common') return 'COMMON';
		if (r === 'uncommon') return 'UNCOMMON';
		return 'RARE';
	};

	const handleBinderButtonClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!isLoggedIn) {
			setShowLoginPrompt(true);
			setTimeout(() => setShowLoginPrompt(false), 2000);
			return;
		}
		setPopoverOpen((o) => !o);
	};

	return (
		<div
			className={`card ${isHolo ? 'holo' : ''} cursor-pointer group`}
			onClick={onClick}
		>
			{/* ================= IMAGE ================= */}
			<div className='card-image-wrapper' data-rarity={getRarityColorCategory()}>
				{card.image_small_url ? (
					<img src={card.image_small_url} alt={card.name} loading='lazy' />
				) : (
					<div
						className='w-full h-full flex items-center justify-center'
						style={{ backgroundColor: 'var(--bg-elevated)' }}
					>
						<div style={{ color: 'var(--text-muted)' }} className='text-sm'>
							No Image
						</div>
					</div>
				)}
				<div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10' />

				{/* Quantity badge */}
				{isInBinder && binderEntry!.quantity > 0 && (
					<div
						className='absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold'
						style={{
							background: 'var(--vault-gold)',
							color: 'var(--text-inverse)',
						}}
					>
						{binderEntry!.quantity}
					</div>
				)}
			</div>

			{/* ================= RARITY BAR ================= */}
			<div className='rarity-label-bar' data-rarity={getRarityColorCategory()}>
				{getRarityLabel()}
			</div>

			{/* ================= CONTENT ================= */}
			<div className='flex flex-col' style={{ background: 'rgba(22, 30, 46, 1)' }}>
				<div className='px-6 pt-4 pb-3 flex-grow'>
					<h3 className='card-title line-clamp-2 min-h-[2.5rem]'>{card.name}</h3>
					{card.set_name && (
						<p className='card-set-name line-clamp-1'>{card.set_name}</p>
					)}
				</div>

				{/* Price Zone */}
				<div
					className='price-zone'
					style={{
						background:
							'linear-gradient(to bottom, rgba(18, 26, 38, 0.4), rgba(15, 22, 35, 0.6))',
					}}
				>
					<div
						className='px-6'
						style={{
							borderTop: '1px solid var(--border-default)',
							paddingTop: '12px',
							paddingBottom: '8px',
						}}
					>
						<p className='card-price'>
							{card.highest_price && card.highest_price > 0
								? `$${Number(card.highest_price).toFixed(2)}`
								: 'N/A'}
						</p>
					</div>

					{/* Action Buttons */}
					<div className='px-6 pt-5 pb-4 flex gap-2 shrink-0 justify-start'>
						{/* Favorite */}
						<button
							onClick={(e) => e.stopPropagation()}
							className='btn-secondary p-2.5 flex items-center justify-center'
							aria-label='Favourite card'
						>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='w-5 h-5 text-gray-600 hover:text-yellow-500 transition-colors duration-200'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth={2}
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
								/>
							</svg>
						</button>

						{/* Binder button + popover */}
						<div className='relative'>
							{showLoginPrompt && (
								<div
									className='absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-xs font-medium pointer-events-none z-20'
									style={{
										background: 'var(--bg-elevated)',
										border: '1px solid var(--border-default)',
										color: 'var(--text-secondary)',
									}}
								>
									Sign in to add cards
								</div>
							)}

							{popoverOpen && (
								<BinderPopover
									isInBinder={isInBinder}
									initialQty={binderEntry?.quantity ?? 1}
									initialCondition={binderEntry?.condition ?? 'Near Mint'}
									onAdd={async (qty, cond) => {
										await onAddToBinder?.(qty, cond);
									}}
									onUpdate={async (qty, cond) => {
										await onUpdateBinder?.(qty, cond);
									}}
									onRemove={async () => {
										await onRemoveFromBinder?.();
									}}
									onClose={() => setPopoverOpen(false)}
								/>
							)}

							<button
								onClick={handleBinderButtonClick}
								aria-label={isInBinder ? 'Edit binder entry' : 'Add to Binder'}
								title={isInBinder ? 'Edit binder entry' : 'Add to Binder'}
								className={`btn-primary p-2.5 flex items-center justify-center ${isInBinder ? 'opacity-90' : ''}`}
							>
								{isInBinder ? (
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
										<path strokeLinecap='round' strokeLinejoin='round' d='M12 2V6M16 2V6' />
										<circle cx='19' cy='5' r='3' fill='currentColor' />
										<path strokeLinecap='round' strokeLinejoin='round' d='M19 3V7M17 5H21' stroke='white' strokeWidth={1.5} />
									</svg>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Binder Popover ────────────────────────────────────────────────────────

interface BinderPopoverProps {
	isInBinder: boolean;
	initialQty: number;
	initialCondition: string;
	onAdd: (qty: number, condition: string) => Promise<void>;
	onUpdate: (qty: number, condition: string) => Promise<void>;
	onRemove: () => Promise<void>;
	onClose: () => void;
}

function BinderPopover({
	isInBinder,
	initialQty,
	initialCondition,
	onAdd,
	onUpdate,
	onRemove,
	onClose,
}: BinderPopoverProps) {
	const [qty, setQty] = useState(initialQty);
	const [condition, setCondition] = useState(initialCondition);
	const [loading, setLoading] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onClose();
			}
		};
		const keyHandler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('mousedown', handler);
		document.addEventListener('keydown', keyHandler);
		return () => {
			document.removeEventListener('mousedown', handler);
			document.removeEventListener('keydown', keyHandler);
		};
	}, [onClose]);

	const handleConfirm = async () => {
		setLoading(true);
		try {
			if (isInBinder) {
				await onUpdate(qty, condition);
			} else {
				await onAdd(qty, condition);
			}
			onClose();
		} finally {
			setLoading(false);
		}
	};

	const handleRemove = async () => {
		setLoading(true);
		try {
			await onRemove();
			onClose();
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			ref={ref}
			onClick={(e) => e.stopPropagation()}
			className='absolute bottom-full mb-2 right-0 z-50 w-52 rounded-xl p-4 shadow-2xl'
			style={{
				background: 'var(--bg-elevated)',
				border: '1px solid var(--border-strong)',
			}}
		>
			<p
				className='text-xs font-semibold uppercase tracking-wide mb-3'
				style={{ color: 'var(--text-muted)' }}
			>
				{isInBinder ? 'Edit Binder Entry' : 'Add to Binder'}
			</p>

			{/* Quantity stepper */}
			<div className='mb-3'>
				<label className='block text-xs mb-1.5' style={{ color: 'var(--text-secondary)' }}>
					Quantity
				</label>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => setQty((q) => Math.max(1, q - 1))}
						className='btn-secondary w-8 h-8 flex items-center justify-center rounded-lg text-base font-bold'
					>
						−
					</button>
					<span
						className='flex-1 text-center text-sm font-semibold'
						style={{ color: 'var(--text-primary)' }}
					>
						{qty}
					</span>
					<button
						onClick={() => setQty((q) => Math.min(99, q + 1))}
						className='btn-secondary w-8 h-8 flex items-center justify-center rounded-lg text-base font-bold'
					>
						+
					</button>
				</div>
			</div>

			{/* Condition dropdown */}
			<div className='mb-4'>
				<label className='block text-xs mb-1.5' style={{ color: 'var(--text-secondary)' }}>
					Condition
				</label>
				<select
					value={condition}
					onChange={(e) => setCondition(e.target.value)}
					className='w-full px-2 py-1.5 rounded-lg text-xs'
					style={{
						background: 'rgba(255,255,255,0.06)',
						border: '1px solid var(--border-default)',
						color: 'var(--text-primary)',
					}}
				>
					{CONDITIONS.map((c) => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>
			</div>

			{/* Actions */}
			<div className='flex gap-2'>
				<button
					onClick={handleConfirm}
					disabled={loading}
					className='flex-1 btn-primary py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50'
				>
					{loading ? '…' : isInBinder ? 'Update' : 'Add'}
				</button>
				{isInBinder && (
					<button
						onClick={handleRemove}
						disabled={loading}
						className='btn-secondary px-2 py-1.5 rounded-lg text-xs disabled:opacity-50'
						title='Remove from binder'
					>
						✕
					</button>
				)}
			</div>
		</div>
	);
}
