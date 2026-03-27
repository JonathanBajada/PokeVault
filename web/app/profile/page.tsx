'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { HiPencil, HiCheck, HiXMark } from 'react-icons/hi2';
import { fetchBinder, BinderCard } from '@/lib/api/binder';
import { Card } from '@/lib/api/cards';
import CardModal from '@/components/card/CardModal';

// ─── Rarity tier ──────────────────────────────────────────────────────────
function rarityTier(rarity: string | null): number {
	if (!rarity) return 0;
	const r = rarity.toLowerCase();
	if (r.includes('secret')) return 10;
	if (r.includes('rainbow')) return 9;
	if (r.includes('gold')) return 8;
	if (r.includes('full art') || r.includes('alt art')) return 8;
	if (r.includes('ultra')) return 7;
	if (r.includes('vmax') || r.includes('vstar')) return 6;
	if (r.includes('vex') || r.includes(' ex') || r.includes('gx') || r.includes(' v')) return 6;
	if (r.includes('holo')) return 5;
	if (r === 'rare') return 4;
	if (r.includes('promo')) return 4;
	if (r === 'uncommon') return 2;
	if (r === 'common') return 1;
	return 3;
}

function binderCardToCard(c: BinderCard): Card {
	return {
		id: c.card_id,
		name: c.name,
		set_name: c.set_name,
		rarity: c.rarity,
		image_small_url: c.image_small_url,
		image_large_url: c.image_large_url,
		highest_price: c.market_price ?? undefined,
	};
}

// ─── Stat card component ──────────────────────────────────────────────────
function StatCard({
	label,
	value,
	sub,
	accent = false,
	onClick,
	thumbnail,
}: {
	label: string;
	value: string;
	sub?: string;
	accent?: boolean;
	onClick?: () => void;
	thumbnail?: string;
}) {
	return (
		<div
			className={`rounded-2xl p-5 flex flex-col gap-1 ${onClick ? 'cursor-pointer hover:brightness-110 transition-all' : ''}`}
			style={{
				background: 'var(--bg-elevated)',
				border: `1px solid ${accent ? 'rgba(255,95,210,0.35)' : 'var(--border-default)'}`,
				boxShadow: accent ? '0 0 24px rgba(255,95,210,0.08)' : undefined,
			}}
			onClick={onClick}
		>
			<p className='text-xs font-medium uppercase tracking-widest' style={{ color: 'var(--text-muted)' }}>
				{label}
			</p>
			<div className='flex items-center gap-3'>
				{thumbnail && (
					<img src={thumbnail} alt={sub} className='h-12 w-auto rounded object-contain shrink-0' />
				)}
				<div className='min-w-0'>
					<p className='text-2xl font-bold font-brand' style={{ color: accent ? 'var(--vault-gold)' : 'var(--text-primary)' }}>
						{value}
					</p>
					{sub && (
						<p className='text-xs truncate mt-0.5' style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
							{sub}
						</p>
					)}
				</div>
			</div>
			{onClick && (
				<p className='text-xs mt-1' style={{ color: 'var(--vault-gold)', opacity: 0.6 }}>
					Click to view →
				</p>
			)}
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
	const { data: session, status, update } = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();

	// Edit state
	const [editing, setEditing] = useState(false);
	const [editUsername, setEditUsername] = useState('');
	const [editEmail, setEditEmail] = useState('');
	const [editError, setEditError] = useState('');
	const [saveSuccess, setSaveSuccess] = useState(false);

	// Card modal state
	const [selectedCard, setSelectedCard] = useState<Card | null>(null);

	useEffect(() => {
		if (status === 'unauthenticated') router.push('/login');
	}, [status, router]);

	const { data: binder, isLoading } = useQuery({
		queryKey: ['binder', session?.user.id],
		queryFn: () => fetchBinder(session!.user.id),
		enabled: !!session?.user.id,
	});

	const updateMutation = useMutation({
		mutationFn: async (fields: { username?: string; email?: string }) => {
			const res = await fetch('/api/user', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(fields),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Update failed');
			return data;
		},
		onSuccess: async (data) => {
			await update({ username: data.username, email: data.email });
			queryClient.invalidateQueries({ queryKey: ['binder', session?.user.id] });
			setEditing(false);
			setEditError('');
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 2500);
		},
		onError: (err: Error) => {
			setEditError(err.message);
		},
	});

	const stats = useMemo(() => {
		if (!binder) return null;
		const cards = binder.cards;

		const totalOwned = cards.reduce((s, c) => s + c.quantity, 0);
		const uniqueCards = cards.length;
		const totalValue = cards.reduce((s, c) => s + (c.market_price ?? 0) * c.quantity, 0);
		const sets = new Set(cards.map((c) => c.set_name)).size;

		const mostValuable = cards.reduce<BinderCard | null>(
			(best, c) => (c.market_price ?? 0) > (best?.market_price ?? 0) ? c : best,
			null,
		);

		const rarest = cards.reduce<BinderCard | null>(
			(best, c) => rarityTier(c.rarity) > rarityTier(best?.rarity ?? null) ? c : best,
			null,
		);

		return { totalOwned, uniqueCards, totalValue, sets, mostValuable, rarest };
	}, [binder]);

	const memberSince = useMemo(() => {
		if (!session?.user.createdAt) return '—';
		return new Date(session.user.createdAt).toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric',
		});
	}, [session?.user.createdAt]);

	const initials = useMemo(() => {
		if (!session?.user.username) return '?';
		return session.user.username
			.split(/\s+/)
			.map((w) => w[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}, [session?.user.username]);

	function startEditing() {
		setEditUsername(session?.user.username ?? '');
		setEditEmail(session?.user.email ?? '');
		setEditError('');
		setEditing(true);
	}

	function cancelEditing() {
		setEditing(false);
		setEditError('');
	}

	function saveEdits() {
		if (!editUsername.trim()) { setEditError('Username cannot be empty'); return; }
		const fields: { username?: string; email?: string } = {};
		if (editUsername.trim() !== session?.user.username) fields.username = editUsername.trim();
		if (editEmail.trim() !== session?.user.email) fields.email = editEmail.trim();
		if (Object.keys(fields).length === 0) { setEditing(false); return; }
		updateMutation.mutate(fields);
	}

	if (status === 'loading' || isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='relative'>
					<div className='animate-spin rounded-full h-16 w-16 border-4' style={{ borderColor: 'var(--border-default)' }} />
					<div className='animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0' style={{ borderColor: 'var(--vault-gold)' }} />
				</div>
			</div>
		);
	}

	if (!session) return null;

	return (
		<div className='min-h-screen py-8 relative' style={{ paddingTop: '3.5rem' }}>
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

				{/* ── Page title ── */}
				<div className='mb-10 flex items-baseline gap-3'>
					<h1
						className='font-brand text-4xl md:text-5xl font-bold drop-shadow-sm'
						style={{ color: 'var(--vault-gold)', letterSpacing: '0.3px' }}
					>
						Profile
					</h1>
					<span
						className='font-japanese text-lg md:text-xl opacity-60'
						style={{ color: 'var(--text-muted)' }}
					>
						プロフィール
					</span>
				</div>

				{/* ── Profile header ── */}
				<div
					className='rounded-2xl p-6 md:p-8 mb-8'
					style={{
						background: 'var(--bg-elevated)',
						border: '1px solid rgba(255,95,210,0.2)',
						boxShadow: '0 0 40px rgba(255,95,210,0.06)',
					}}
				>
					<div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
						{/* Avatar */}
						<div
							className='w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold font-brand shrink-0'
							style={{
								background: 'linear-gradient(135deg, var(--vault-gold), var(--vault-gold-dark))',
								color: 'var(--text-inverse)',
								boxShadow: '0 8px 24px rgba(255,95,210,0.4)',
							}}
						>
							{initials}
						</div>

						{/* Info / Edit form */}
						<div className='flex-1 min-w-0'>
							{editing ? (
								<div className='flex flex-col gap-3'>
									{editError && (
										<p className='text-sm' style={{ color: '#f87171' }}>{editError}</p>
									)}
									<div className='flex flex-col sm:flex-row gap-3'>
										<div className='flex flex-col gap-1 flex-1'>
											<label className='text-xs font-medium uppercase tracking-wider' style={{ color: 'var(--text-muted)' }}>
												Username
											</label>
											<input
												value={editUsername}
												onChange={(e) => setEditUsername(e.target.value)}
												className='px-3 py-2 rounded-xl text-sm'
												style={{
													background: 'var(--bg-base)',
													border: '1px solid var(--border-default)',
													color: 'var(--text-primary)',
												}}
											/>
										</div>
										<div className='flex flex-col gap-1 flex-1'>
											<label className='text-xs font-medium uppercase tracking-wider' style={{ color: 'var(--text-muted)' }}>
												Email
											</label>
											<input
												type='email'
												value={editEmail}
												onChange={(e) => setEditEmail(e.target.value)}
												className='px-3 py-2 rounded-xl text-sm'
												style={{
													background: 'var(--bg-base)',
													border: '1px solid var(--border-default)',
													color: 'var(--text-primary)',
												}}
											/>
										</div>
									</div>
									<div className='flex gap-2 mt-1'>
										<button
											onClick={saveEdits}
											disabled={updateMutation.isPending}
											className='btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50'
										>
											<HiCheck className='w-4 h-4' />
											{updateMutation.isPending ? 'Saving…' : 'Save'}
										</button>
										<button
											onClick={cancelEditing}
											disabled={updateMutation.isPending}
											className='btn-secondary flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium'
										>
											<HiXMark className='w-4 h-4' />
											Cancel
										</button>
									</div>
								</div>
							) : (
								<div>
									<div className='flex items-center gap-2'>
										<h2
											className='text-2xl md:text-3xl font-bold font-brand truncate'
											style={{ color: 'var(--text-primary)' }}
										>
											{session.user.username}
										</h2>
										{saveSuccess && (
											<span className='text-xs px-2 py-0.5 rounded-full' style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
												Saved
											</span>
										)}
										<button
											onClick={startEditing}
											className='btn-secondary p-1.5 rounded-lg'
											title='Edit profile'
										>
											<HiPencil className='w-4 h-4' />
										</button>
									</div>
									<p className='text-sm mt-1 truncate' style={{ color: 'var(--text-muted)' }}>
										{session.user.email}
									</p>
									<p
										className='text-xs mt-2 font-medium'
										style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
									>
										Member since {memberSince}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* ── Stats ── */}
				<div className='mb-4'>
					<div className='flex items-baseline gap-2 mb-5'>
						<h3 className='text-lg font-semibold font-brand' style={{ color: 'var(--text-primary)' }}>
							Collection Stats
						</h3>
						<span className='font-japanese text-xs opacity-50' style={{ color: 'var(--text-muted)' }}>
							コレクション統計
						</span>
					</div>

					{!stats || binder?.cards.length === 0 ? (
						<div
							className='rounded-2xl p-8 text-center'
							style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
						>
							<p style={{ color: 'var(--text-muted)' }}>No cards in your binder yet.</p>
						</div>
					) : (
						<>
							{/* Main grid */}
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
								<StatCard
									label='Cards Owned'
									value={stats.totalOwned.toLocaleString()}
									accent
								/>
								<StatCard
									label='Unique Cards'
									value={stats.uniqueCards.toLocaleString()}
								/>
								<StatCard
									label='Binder Value'
									value={`$${stats.totalValue.toFixed(2)}`}
									accent
								/>
								<StatCard
									label='Sets'
									value={stats.sets.toLocaleString()}
								/>
							</div>

							{/* Highlight row */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								{stats.mostValuable && (
									<StatCard
										label='Most Valuable'
										value={stats.mostValuable.market_price
											? `$${stats.mostValuable.market_price.toFixed(2)}`
											: 'N/A'}
										sub={stats.mostValuable.name}
										thumbnail={stats.mostValuable.image_small_url}
										onClick={() => setSelectedCard(binderCardToCard(stats.mostValuable!))}
									/>
								)}
								{stats.rarest && (
									<StatCard
										label='Rarest Card'
										value={stats.rarest.rarity ?? 'Unknown'}
										sub={stats.rarest.name}
										thumbnail={stats.rarest.image_small_url}
										onClick={() => setSelectedCard(binderCardToCard(stats.rarest!))}
									/>
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{/* Card modal */}
			<CardModal
				card={selectedCard}
				isOpen={selectedCard !== null}
				onClose={() => setSelectedCard(null)}
			/>
		</div>
	);
}
