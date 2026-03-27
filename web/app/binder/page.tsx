'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HiBookOpen, HiTrash } from 'react-icons/hi2';
import { fetchBinder, removeCardFromBinder, BinderCard } from '@/lib/api/binder';

export default function BinderPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();

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
				<div className='mb-16'>
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

				{/* Empty state */}
				{binder?.cards.length === 0 && (
					<div className='flex flex-col items-center justify-center py-32 gap-4'>
						<HiBookOpen
							className='w-16 h-16'
							style={{ color: 'var(--text-muted)', opacity: 0.4 }}
						/>
						<p
							className='text-lg font-medium'
							style={{ color: 'var(--text-muted)' }}
						>
							Your binder is empty
						</p>
						<p
							className='text-sm'
							style={{ color: 'var(--text-muted)', opacity: 0.6 }}
						>
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

				{/* Card grid */}
				{binder && binder.cards.length > 0 && (
					<div className='card-grid-zone'>
						<div className='card-grid-background'>
							<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8'>
								{binder.cards.map((card) => (
									<BinderCardTile
										key={card.card_id}
										card={card}
										onRemove={() => removeMutation.mutate(card.card_id)}
										isRemoving={removeMutation.isPending && removeMutation.variables === card.card_id}
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
	isRemoving,
}: {
	card: BinderCard;
	onRemove: () => void;
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
			</div>

			{/* Rarity bar */}
			<div className='rarity-label-bar' data-rarity={getRarityColorCategory()}>
				{card.rarity?.toUpperCase() ?? 'COMMON'}
			</div>

			{/* Content */}
			<div className='flex flex-col' style={{ background: 'rgba(22, 30, 46, 1)' }}>
				<div className='px-6 pt-4 pb-3 flex-grow'>
					<h3 className='card-title line-clamp-2 min-h-[2.5rem]'>{card.name}</h3>
					{card.set_name && (
						<p className='card-set-name line-clamp-1'>{card.set_name}</p>
					)}
				</div>

				<div
					className='price-zone'
					style={{
						background: 'linear-gradient(to bottom, rgba(18,26,38,0.4), rgba(15,22,35,0.6))',
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
						{card.quantity > 1 && (
							<p className='text-xs' style={{ color: 'var(--text-muted)' }}>
								×{card.quantity}
							</p>
						)}
					</div>

					<div className='px-6 pt-5 pb-4 flex gap-2 shrink-0'>
						<button
							onClick={onRemove}
							disabled={isRemoving}
							className='btn-secondary p-2.5 flex items-center justify-center disabled:opacity-50'
							aria-label='Remove from binder'
							title='Remove from binder'
						>
							<HiTrash className='w-5 h-5' />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
