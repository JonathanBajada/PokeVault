import { fetchCardById } from '@/lib/api/cards';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CardDetailClient from './CardDetailClient';

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	try {
		const card = await fetchCardById(id);
		const title = `${card.name} | PokeVault`;
		const description = [card.rarity, card.set_name].filter(Boolean).join(' · ');
		const image = card.image_large_url || card.image_small_url;
		return {
			title,
			description,
			openGraph: {
				title,
				description,
				type: 'website',
				...(image && { images: [{ url: image, width: 734, height: 1024, alt: card.name }] }),
			},
			twitter: {
				card: 'summary_large_image',
				title,
				...(image && { images: [image] }),
			},
		};
	} catch {
		return { title: 'Card Not Found | PokeVault' };
	}
}

export default async function CardPage({ params }: Props) {
	const { id } = await params;
	try {
		const card = await fetchCardById(id);
		return <CardDetailClient card={card} />;
	} catch {
		notFound();
	}
}
