'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { HiBookOpen, HiTrash, HiFunnel } from 'react-icons/hi2';
import { fetchBinder, removeCardFromBinder, updateBinderCard, BinderCard } from '@/lib/api/binder';

export default function BinderPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [selectedSet, setSelectedSet] = useState('');

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/login');
		}
	}, [status, router]);

	const { data: binder, isLoading } = useQuery({
		queryKey: ['binder', session?.user.id],
		queryFn: () => fetchBinder(session!.user.id),
		enabled: !!session?.user.id,
	});

	const removeMutation = useMutation({
		mutationFn: (cardId: string) =>
			removeCardFromBinder(session!.user.id, cardId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['binder', session!.user.id] });
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ cardId, quantity, condition }: { cardId: string; quantity: number; condition?: string }) =>
			updateBinderCard(session!.user.id, cardId, quantity, condition),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['binder', session!.user.id] });
		},
	});

	// Derive unique sets from binder cards
	const uniqueSets = useMemo(() => {
		if (!binder) return [];
		return [...new Set(binder.cards.map((c) => c.set_name))].sort();
	}, [binder]);

	// Filter cards by selected set
	const visibleCards = useMemo(() => {
		if (!binder) return [];
		if (!selectedSet) return binder.cards;
		return binder.cards.filter((c) => c.set_name === selectedSet);
	}, [binder, selectedSet]);

	// Total binder value
	const totalValue = useMemo(() => {
		if (!binder) return null;
		const hasAnyPrice = binder.cards.some((c) => c.market_price !== null);
		if (!hasAnyPrice) return null;
		return binder.cards.reduce((sum, c) => {
			return sum + (c.market_price ?? 0) * c.quantity;
		}, 0);
	}, [binder]);

	// Value of filtered cards
	const filteredValue = useMemo(() => {
		if (!selectedSet || totalValue === null) return null;
		return visibleCards.reduce((sum, c) => {
			return sum + (c.market_price ?? 0) * c.quantity;
		}, 0);
	}, [visibleCards, selectedSet, totalValue]);

	if (status === 'loading' || isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='relative'>
					<div
						className='animate-spin rounded-full h-16 w-16 border-4'
						style={{ borderColor: 'var(--border-default)' }}
					/>
					<div
						className='animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0'
						style={{ borderColor: 'var(--text-secondary)' }}
					/>
				</div>
			</div>
		);
	}

	if (!session) return null;

	return (
		<div className='min-h-screen py-8 relative' style={{ paddingTop: '3.5rem' }}>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

				{/* Header */}
				<div className='mb-10'>
					<div className='flex items-baseline gap-3 mb-3'>
						<h1
							className='page-header-title font-brand text-4xl md:text-5xl drop-shadow-sm'
							style={{
								color: 'var(--vault-gold)',
								letterSpacing: '0.3px',
								fontWeight: 600,
								lineHeight: 1.2,
							}}
						>
							{session.user.username}&apos;s Binder
						</h1>
						<span
							className='font-japanese japanese-label japanese-neon text-lg md:text-xl'
							style={{ color: 'var(--vault-gold)' }}
						>
							コレクション
						</span>
					</div>
					<p
						className='font-body text-sm md:text-base'
						style={{ color: 'var(--text-muted)', opacity: 0.65 }}
					>
						{binder?.count ?? 0} card{binder?.count !== 1 ? 's' : ''} in your collection
					</p>
				</div>

				{/* Stats + Filter bar */}
				{binder && binder.cards.length > 0 && (
					<div className='flex flex-wrap items-center justify-between gap-4 mb-8'>
						{/* Binder value */}
						{totalValue !== null && (
							<div
								className='flex items-center gap-6 px-5 py-3 rounded-xl'
								style={{
									background: 'var(--bg-elevated)',
									border: '1px solid var(--border-default)',
								}}
							>
								<div>
									<p className='text-xs mb-0.5' style={{ color: 'var(--text-muted)' }}>
										Total Binder Value
									</p>
									<p
										className='text-lg font-semibold font-brand'
										style={{ color: 'var(--vault-gold)' }}
									>
										${totalValue.toFixed(2)}
									</p>
								</div>
								{selectedSet && filteredValue !== null && (
									<>
										<div
											style={{
												width: '1px',
												height: '2rem',
												background: 'var(--border-default)',
											}}
										/>
										<div>
											<p className='text-xs mb-0.5' style={{ color: 'var(--text-muted)' }}>
												{selectedSet}
											</p>
											<p
												className='text-lg font-semibold font-brand'
												style={{ color: 'var(--text-primary)' }}
											>
												${filteredValue.toFixed(2)}
											</p>
										</div>
									</>
								)}
							</div>
						)}

						{/* Set filter */}
						{uniqueSets.length > 1 && (
							<div className='flex items-center gap-2'>
								<HiFunnel
									className='w-4 h-4 shrink-0'
									style={{ color: 'var(--text-muted)' }}
								/>
								<select
									value={selectedSet}
									onChange={(e) => setSelectedSet(e.target.value)}
									className='px-3 py-2 rounded-xl text-sm'
									style={{
										background: 'var(--bg-elevated)',
										border: '1px solid var(--border-default)',
										color: 'var(--text-primary)',
									}}
								>
									<option value=''>All Sets ({binder.cards.length})</option>
									{uniqueSets.map((set) => {
										const count = binder.cards.filter(
											(c) => c.set_name === set,
										).length;
										return (
											<option key={set} value={set}>
												{set} ({count})
											</option>
										);
									})}
								</select>
							</div>
						)}
					</div>
				)}

				{/* Empty state */}
				{binder?.cards.length === 0 && (
					<div className='flex flex-col items-center justify-center py-32 gap-4'>
						<HiBookOpen
							className='w-16 h-16'
							style={{ color: 'var(--text-muted)', opacity: 0.4 }}
						/>
						<p className='text-lg font-medium' style={{ color: 'var(--text-muted)' }}>
							Your binder is empty
						</p>
						<p className='text-sm' style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
							Browse the catalogue and add cards to start your collection.
						</p>
						<button
							onClick={() => router.push('/')}
							className='mt-4 btn-primary px-6 py-2 rounded-xl text-sm font-medium'
						>
							Browse Cards
						</button>
					</div>
				)}

				{/* No results after filter */}
				{binder && binder.cards.length > 0 && visibleCards.length === 0 && (
					<div className='text-center py-20'>
						<p style={{ color: 'var(--text-muted)' }}>
							No cards from {selectedSet} in your binder.
						</p>
					</div>
				)}

				{/* Card grid */}
				{visibleCards.length > 0 && (
					<div className='card-grid-zone'>
						<div className='mb-6 text-sm' style={{ color: 'var(--text-muted)' }}>
							Showing {visibleCards.length} of {binder?.cards.length} cards
						</div>
						<div className='card-grid-background'>
							<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8'>
								{visibleCards.map((card) => (
									<BinderCardTile
										key={card.card_id}
										card={card}
										onRemove={() => removeMutation.mutate(card.card_id)}
										onUpdate={(quantity, condition) =>
											updateMutation.mutate({ cardId: card.card_id, quantity, condition })
										}
										isRemoving={
											removeMutation.isPending &&
											removeMutation.variables === card.card_id
										}
									/>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function BinderCardTile({
	card,
	onRemove,
	onUpdate,
	isRemoving,
}: {
	card: BinderCard;
	onRemove: () => void;
	onUpdate: (quantity: number, condition?: string) => void;
	isRemoving: boolean;
}) {
	const rarityLower = card.rarity?.toLowerCase() ?? '';
	const isHolo = rarityLower.includes('rare holo') || rarityLower.includes('holo');

	const getRarityColorCategory = (): 'COMMON' | 'UNCOMMON' | 'RARE' => {
		if (!card.rarity) return 'COMMON';
		const r = card.rarity.toLowerCase();
		if (r === 'common') return 'COMMON';
		if (r === 'uncommon') return 'UNCOMMON';
		return 'RARE';
	};

	return (
		<div className={`card ${isHolo ? 'holo' : ''} group`}>
			{/* Image */}
			<div className='card-image-wrapper' data-rarity={getRarityColorCategory()}>
				{card.image_small_url ? (
					<img src={card.image_small_url} alt={card.name} loading='lazy' />
				) : (
					<div
						className='w-full h-full flex items-center justify-center'
						style={{ backgroundColor: 'var(--bg-elevated)' }}
					>
						<span className='text-sm' style={{ color: 'var(--text-muted)' }}>
							No Image
						</span>
					</div>
				)}
				<div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10' />

				{/* Quantity badge */}
				<div
					className='absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold'
					style={{ background: 'var(--vault-gold)', color: 'var(--text-inverse)' }}
				>
					{card.quantity}
				</div>
			</div>

			{/* Rarity bar */}
			<div className='rarity-label-bar' data-rarity={getRarityColorCategory()}>
				{card.rarity?.toUpperCase() ?? 'COMMON'}
			</div>

			{/* Content */}
			<div className='flex flex-col' style={{ background: 'rgba(22, 30, 46, 1)' }}>
				<div className='px-6 pt-4 pb-2 flex-grow'>
					<h3 className='card-title line-clamp-2 min-h-[2.5rem]'>{card.name}</h3>
					{card.set_name && (
						<p className='card-set-name line-clamp-1'>{card.set_name}</p>
					)}
					{card.condition && (
						<p className='text-xs mt-1' style={{ color: 'var(--text-muted)' }}>
							{card.condition}
						</p>
					)}
				</div>

				<div
					className='price-zone'
					style={{
						background:
							'linear-gradient(to bottom, rgba(18,26,38,0.4), rgba(15,22,35,0.6))',
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
							{card.market_price ? `$${card.market_price.toFixed(2)}` : 'N/A'}
						</p>
					</div>

					{/* Inline quantity controls */}
					<div className='px-6 pt-3 pb-4 flex items-center justify-between gap-2'>
						<div className='flex items-center gap-1'>
							<button
								onClick={() => onUpdate(Math.max(1, card.quantity - 1))}
								disabled={card.quantity <= 1 || isRemoving}
								className='btn-secondary w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold disabled:opacity-30'
							>
								−
							</button>
							<span
								className='w-6 text-center text-sm font-semibold'
								style={{ color: 'var(--text-primary)' }}
							>
								{card.quantity}
							</span>
							<button
								onClick={() => onUpdate(Math.min(99, card.quantity + 1))}
								disabled={card.quantity >= 99 || isRemoving}
								className='btn-secondary w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold disabled:opacity-30'
							>
								+
							</button>
						</div>
						<button
							onClick={onRemove}
							disabled={isRemoving}
							className='btn-secondary p-2 flex items-center justify-center disabled:opacity-50'
							aria-label='Remove from binder'
							title='Remove from binder'
						>
							<HiTrash className='w-4 h-4' />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
