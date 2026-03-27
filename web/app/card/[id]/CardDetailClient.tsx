'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { HiArrowLeft, HiCheck } from 'react-icons/hi2';
import { CardDetail } from '@/lib/api/cards';
import { fetchBinder, addCardToBinder, updateBinderCard, removeCardFromBinder, CONDITIONS } from '@/lib/api/binder';

interface Props {
	card: CardDetail;
}

export default function CardDetailClient({ card }: Props) {
	const { data: session } = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [popoverOpen, setPopoverOpen] = useState(false);

	const { data: binder } = useQuery({
		queryKey: ['binder', session?.user.id],
		queryFn: () => fetchBinder(session!.user.id),
		enabled: !!session?.user.id,
	});

	const binderCard = binder?.cards.find((c) => c.card_id === card.id) ?? null;
	const binderEntry = binderCard
		? { quantity: binderCard.quantity, condition: binderCard.condition, intent: binderCard.intent }
		: null;

	const addMutation = useMutation({
		mutationFn: ({ qty, cond }: { qty: number; cond: string }) =>
			addCardToBinder(session!.user.id, card.id, qty, cond),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['binder', session?.user.id] }),
	});

	const updateMutation = useMutation({
		mutationFn: ({ qty, cond }: { qty: number; cond: string }) =>
			updateBinderCard(session!.user.id, card.id, qty, cond),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['binder', session?.user.id] }),
	});

	const removeMutation = useMutation({
		mutationFn: () => removeCardFromBinder(session!.user.id, card.id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['binder', session?.user.id] }),
	});

	const intentMutation = useMutation({
		mutationFn: (intent: 'own' | 'want') =>
			updateBinderCard(session!.user.id, card.id, binderEntry!.quantity, binderEntry!.condition ?? undefined, intent),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['binder', session?.user.id] }),
	});

	const rarityLower = card.rarity?.toLowerCase() ?? '';
	const isHolo = rarityLower.includes('holo');
	const getRarityColorCategory = (): 'COMMON' | 'UNCOMMON' | 'RARE' => {
		if (!card.rarity) return 'COMMON';
		const r = card.rarity.toLowerCase();
		if (r === 'common') return 'COMMON';
		if (r === 'uncommon') return 'UNCOMMON';
		return 'RARE';
	};
	const rarityColorCategory = getRarityColorCategory();
	const isWanted = binderEntry?.intent === 'want';

	return (
		<div className='min-h-screen py-8' style={{ paddingTop: '5rem' }}>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='grid md:grid-cols-2 gap-8 lg:gap-12' style={{ gridTemplateColumns: '1fr 1.5fr' }}>

					{/* ── Left: image ── */}
					<div>
						<button
							onClick={() => router.back()}
							className='flex items-center gap-2 mb-4 text-sm font-medium hover:opacity-80 transition-opacity'
							style={{ color: 'var(--text-secondary)' }}
						>
							<HiArrowLeft className='w-4 h-4' />
							Back
						</button>

						<div
							className={`card-detail-image-bg relative rounded-2xl overflow-hidden ${isHolo ? 'holo' : ''}`}
							data-rarity={rarityColorCategory}
						>
							{rarityColorCategory === 'RARE' && (
								<div
									className='absolute inset-0 pointer-events-none'
									style={{ background: 'radial-gradient(circle at center, var(--vault-gold-soft) 0%, transparent 70%)', opacity: 0.6 }}
								/>
							)}
							<div className='card-image-wrapper relative p-3 md:p-12 min-h-[300px] flex items-center justify-center'>
								{card.image_large_url || card.image_small_url ? (
									<img
										src={card.image_large_url || card.image_small_url}
										alt={card.name}
										className='max-w-full max-h-[70vh] object-contain drop-shadow-2xl relative z-10'
										style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}
									/>
								) : (
									<p style={{ color: 'var(--text-muted)' }}>No Image Available</p>
								)}
							</div>
						</div>
					</div>

					{/* ── Right: details ── */}
					<div className='flex flex-col'>
						<div
							className='rounded-2xl p-5 md:p-6 flex-1'
							style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
						>
							{/* Header */}
							<div className='mb-5'>
								<div className='flex items-start justify-between mb-3'>
									<div className='flex-1'>
										<h1 className='font-brand text-2xl md:text-3xl font-bold mb-1' style={{ color: 'var(--text-primary)' }}>
											{card.name}
											{card.number && (
												<span className='ml-2 text-lg font-normal' style={{ color: 'var(--text-muted)' }}>
													#{card.number}
												</span>
											)}
										</h1>
										{card.set_name && (
											<p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
												{card.set_name}{card.set_series && ` · ${card.set_series}`}
											</p>
										)}
									</div>
									{card.rarity && (
										<div
											className='px-3 py-1 rounded-lg text-xs font-semibold shrink-0'
											style={{
												background: rarityColorCategory === 'COMMON' ? 'rgba(148,163,184,0.3)' : rarityColorCategory === 'UNCOMMON' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)',
												color: rarityColorCategory === 'COMMON' ? '#cbd5e1' : rarityColorCategory === 'UNCOMMON' ? '#86efac' : '#fde68a',
												border: '1px solid var(--border-default)',
											}}
										>
											{card.rarity.toUpperCase()}
										</div>
									)}
								</div>

								{/* Action buttons */}
								<div className='flex flex-col gap-2 mb-5'>
									{/* Add / In Binder button */}
									<div className='relative'>
										{popoverOpen && (
											<BinderPopover
												isInBinder={!!binderEntry}
												initialQty={binderEntry?.quantity ?? 1}
												initialCondition={binderEntry?.condition ?? 'Near Mint'}
												onAdd={async (qty, cond) => { await addMutation.mutateAsync({ qty, cond }); }}
												onUpdate={async (qty, cond) => { await updateMutation.mutateAsync({ qty, cond }); }}
												onRemove={async () => { await removeMutation.mutateAsync(); }}
												onClose={() => setPopoverOpen(false)}
											/>
										)}
										<button
											onClick={() => {
												if (!session) { router.push('/login'); return; }
												setPopoverOpen((o) => !o);
											}}
											className='btn-primary flex items-center gap-2 px-4 py-2 text-sm'
											style={binderEntry ? {
												background: 'linear-gradient(135deg, var(--vault-gold), var(--vault-gold-dark))',
												color: '#0b0b0d',
											} : {
												background: 'rgba(199,179,119,0.1)',
												color: 'var(--text-secondary)',
												borderColor: 'var(--border-default)',
											}}
										>
											{binderEntry ? (
												<>
													<HiCheck className='w-4 h-4' />
													<span className='font-semibold'>In Binder ×{binderEntry.quantity}</span>
												</>
											) : (
												<span className='font-semibold'>{session ? 'Add to Binder' : 'Sign in to Add'}</span>
											)}
										</button>
									</div>

									{/* Own / Want toggle — only shown when card is already in binder */}
									{binderEntry && session && (
										<div className='flex gap-2'>
											<button
												onClick={() => intentMutation.mutate('own')}
												disabled={intentMutation.isPending || !isWanted}
												className='flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all'
												style={!isWanted ? {
													background: 'linear-gradient(135deg, var(--vault-gold), var(--vault-gold-dark))',
													color: '#0b0b0d',
													border: '1px solid transparent',
												} : {
													background: 'transparent',
													color: 'var(--text-muted)',
													border: '1px solid var(--border-default)',
												}}
											>
												Own
											</button>
											<button
												onClick={() => intentMutation.mutate('want')}
												disabled={intentMutation.isPending || isWanted}
												className='flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all'
												style={isWanted ? {
													background: 'rgba(99,179,237,0.2)',
													color: '#63b3ed',
													border: '1px solid rgba(99,179,237,0.4)',
												} : {
													background: 'transparent',
													color: 'var(--text-muted)',
													border: '1px solid var(--border-default)',
												}}
											>
												♡ Want
											</button>
										</div>
									)}
								</div>
							</div>

							{/* Stats row */}
							<div className='flex flex-wrap items-center gap-4 mb-5 pb-4' style={{ borderBottom: '1px solid var(--border-default)' }}>
								{card.supertype && (
									<Stat label='Type' value={card.supertype} />
								)}
								{card.hp && (
									<Stat label='HP' value={card.hp} />
								)}
								{card.types && card.types.length > 0 && (
									<div className='flex items-center gap-2'>
										<span className='text-[10px] font-medium uppercase tracking-wide' style={{ color: 'var(--text-muted)' }}>Energy</span>
										<div className='flex gap-1'>
											{card.types.map((t, i) => (
												<span key={i} className='px-2 py-0.5 rounded text-xs' style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>{t}</span>
											))}
										</div>
									</div>
								)}
								{card.weaknesses && card.weaknesses.length > 0 && (
									<div className='flex items-center gap-2'>
										<span className='text-[10px] font-medium uppercase tracking-wide' style={{ color: 'var(--text-muted)' }}>Weak</span>
										{card.weaknesses.map((w, i) => (
											<span key={i} className='px-2 py-0.5 rounded text-xs' style={{ background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)', color: '#ef4444' }}>{w.type} {w.value}</span>
										))}
									</div>
								)}
								{card.resistances && card.resistances.length > 0 && (
									<div className='flex items-center gap-2'>
										<span className='text-[10px] font-medium uppercase tracking-wide' style={{ color: 'var(--text-muted)' }}>Resist</span>
										{card.resistances.map((r, i) => (
											<span key={i} className='px-2 py-0.5 rounded text-xs' style={{ background: 'rgba(0,255,0,0.15)', border: '1px solid rgba(0,255,0,0.3)', color: '#22c55e' }}>{r.type} {r.value}</span>
										))}
									</div>
								)}
							</div>

							{/* Abilities */}
							{card.abilities && card.abilities.length > 0 && (
								<div className='mb-5'>
									<SectionLabel>Abilities</SectionLabel>
									<div className='space-y-2'>
										{card.abilities.map((a, i) => (
											<DetailBlock key={i} title={a.name} text={a.text} />
										))}
									</div>
								</div>
							)}

							{/* Attacks */}
							{card.attacks && card.attacks.length > 0 && (
								<div className='mb-5'>
									<SectionLabel>Attacks</SectionLabel>
									<div className='space-y-2'>
										{card.attacks.map((a, i) => (
											<div key={i} className='p-3 rounded-lg' style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)' }}>
												<div className='flex items-start justify-between mb-1'>
													<div>
														<p className='font-brand font-semibold text-sm mb-1' style={{ color: 'var(--text-primary)' }}>{a.name}</p>
														{a.cost && a.cost.length > 0 && (
															<div className='flex gap-1'>
																{a.cost.map((e, j) => (
																	<span key={j} className='text-[10px] px-1.5 py-0.5 rounded' style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>{e}</span>
																))}
															</div>
														)}
													</div>
													{a.damage && (
														<span className='font-brand text-lg font-bold ml-3' style={{ color: 'var(--vault-gold)' }}>{a.damage}</span>
													)}
												</div>
												{a.text && <p className='text-xs leading-relaxed mt-1' style={{ color: 'var(--text-secondary)' }}>{a.text}</p>}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Prices */}
							{card.prices && card.prices.length > 0 && (
								<div>
									<SectionLabel>Market Prices</SectionLabel>
									<div className='p-4 rounded-lg space-y-2' style={{ background: 'rgba(199,179,119,0.08)', border: '1px solid var(--vault-gold-soft)' }}>
										{card.prices.map((p, i) => (
											<div key={i} className='flex justify-between items-center py-2 px-3 rounded' style={{ background: 'rgba(0,0,0,0.2)' }}>
												<span className='text-xs font-medium' style={{ color: 'var(--text-primary)' }}>{p.source} · {p.variant}</span>
												<span className='font-brand text-lg font-bold' style={{ color: p.market || p.high ? 'var(--vault-gold)' : 'var(--text-muted)' }}>
													{p.market ? `$${Number(p.market).toFixed(2)}` : p.high ? `$${Number(p.high).toFixed(2)}` : 'N/A'}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Mobile sticky binder bar */}
			<div
				className='md:hidden fixed bottom-0 left-0 right-0 z-30 p-4 backdrop-blur-md'
				style={{ background: 'rgba(22,30,46,0.95)', borderTop: '1px solid var(--border-default)' }}
			>
				<button
					onClick={() => {
						if (!session) { router.push('/login'); return; }
						setPopoverOpen((o) => !o);
					}}
					className='w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold'
					style={binderEntry ? {
						background: 'linear-gradient(135deg, var(--vault-gold), var(--vault-gold-dark))',
						color: '#0b0b0d',
					} : {}}
				>
					{binderEntry ? `In Binder ×${binderEntry.quantity} — Edit` : session ? 'Add to Binder' : 'Sign in to Add'}
				</button>
			</div>
		</div>
	);
}

// ─── Small helpers ─────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className='flex items-center gap-2'>
			<span className='text-[10px] font-medium uppercase tracking-wide' style={{ color: 'var(--text-muted)' }}>{label}</span>
			<span className='text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>{value}</span>
		</div>
	);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className='text-[10px] font-medium uppercase tracking-wide mb-2' style={{ color: 'var(--text-muted)' }}>{children}</p>
	);
}

function DetailBlock({ title, text }: { title: string; text: string }) {
	return (
		<div className='p-3 rounded-lg' style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)' }}>
			<p className='font-brand font-semibold text-sm mb-1' style={{ color: 'var(--text-primary)' }}>{title}</p>
			<p className='text-xs leading-relaxed' style={{ color: 'var(--text-secondary)' }}>{text}</p>
		</div>
	);
}

// ─── Binder Popover ────────────────────────────────────────────────────────

function BinderPopover({
	isInBinder, initialQty, initialCondition, onAdd, onUpdate, onRemove, onClose,
}: {
	isInBinder: boolean;
	initialQty: number;
	initialCondition: string;
	onAdd: (qty: number, cond: string) => Promise<void>;
	onUpdate: (qty: number, cond: string) => Promise<void>;
	onRemove: () => Promise<void>;
	onClose: () => void;
}) {
	const [qty, setQty] = useState(initialQty);
	const [condition, setCondition] = useState(initialCondition);
	const [loading, setLoading] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
		const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('mousedown', handler);
		document.addEventListener('keydown', keyHandler);
		return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
	}, [onClose]);

	return (
		<div
			ref={ref}
			onClick={(e) => e.stopPropagation()}
			className='absolute bottom-full mb-2 left-0 z-50 w-52 rounded-xl p-4 shadow-2xl'
			style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
		>
			<p className='text-xs font-semibold uppercase tracking-wide mb-3' style={{ color: 'var(--text-muted)' }}>
				{isInBinder ? 'Edit Binder Entry' : 'Add to Binder'}
			</p>
			<div className='mb-3'>
				<label className='block text-xs mb-1.5' style={{ color: 'var(--text-secondary)' }}>Quantity</label>
				<div className='flex items-center gap-2'>
					<button onClick={() => setQty((q) => Math.max(1, q - 1))} className='btn-secondary w-8 h-8 flex items-center justify-center rounded-lg text-base font-bold'>−</button>
					<span className='flex-1 text-center text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>{qty}</span>
					<button onClick={() => setQty((q) => Math.min(99, q + 1))} className='btn-secondary w-8 h-8 flex items-center justify-center rounded-lg text-base font-bold'>+</button>
				</div>
			</div>
			<div className='mb-4'>
				<label className='block text-xs mb-1.5' style={{ color: 'var(--text-secondary)' }}>Condition</label>
				<select value={condition} onChange={(e) => setCondition(e.target.value)} className='w-full px-2 py-1.5 rounded-lg text-xs' style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
					{CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
				</select>
			</div>
			<div className='flex gap-2'>
				<button
					onClick={async () => { setLoading(true); try { isInBinder ? await onUpdate(qty, condition) : await onAdd(qty, condition); onClose(); } finally { setLoading(false); } }}
					disabled={loading}
					className='flex-1 btn-primary py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50'
				>
					{loading ? '…' : isInBinder ? 'Update' : 'Add'}
				</button>
				{isInBinder && (
					<button
						onClick={async () => { setLoading(true); try { await onRemove(); onClose(); } finally { setLoading(false); } }}
						disabled={loading}
						className='btn-secondary px-2 py-1.5 rounded-lg text-xs disabled:opacity-50'
					>✕</button>
				)}
			</div>
		</div>
	);
}
