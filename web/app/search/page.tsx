'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

export default function SearchPage() {
	const [query, setQuery] = useState('');

	const { data, isLoading, error } = useQuery({
		queryKey: ['cards', query],
		queryFn: async () => {
			if (!query) return null;

			const res = await fetch(
				`/api/cards/search?q=${encodeURIComponent(query)}`,
			);

			if (!res.ok) {
				throw new Error('Failed to fetch cards');
			}

			return res.json();
		},
		enabled: query.length > 0,
	});

	return (
		<main style={{ padding: 24 }}>
			<h1>Search Pokémon Cards</h1>

			<input
				type='text'
				placeholder='e.g. name:charizard'
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				style={{
					padding: 8,
					width: 320,
					marginBottom: 16,
					display: 'block',
				}}
			/>

			{isLoading && <p>Loading...</p>}
			{error && <p>Error loading cards</p>}

			{data?.data && (
				<ul style={{ listStyle: 'none', padding: 0 }}>
					{data.data.map((card: any) => (
						<li
							key={card.id}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 12,
								marginBottom: 12,
							}}
						>
							<Image
								src={card.images.small}
								alt={card.name}
								width={80}
								height={110}
							/>
							<div>
								<strong>{card.name}</strong>
								<div>{card.set.name}</div>
								<div>{card.rarity}</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
