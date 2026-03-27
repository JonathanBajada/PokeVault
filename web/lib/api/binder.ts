export const CONDITIONS = [
	'Mint',
	'Near Mint',
	'Lightly Played',
	'Moderately Played',
	'Heavily Played',
	'Damaged',
] as const;

export type Condition = (typeof CONDITIONS)[number];

export type BinderCard = {
	card_id: string;
	name: string;
	image_small_url: string;
	image_large_url: string;
	set_name: string;
	rarity: string | null;
	quantity: number;
	condition: string | null;
	intent: string | null;
	added_at: string;
	market_price: number | null;
};

export type BinderResponse = {
	binderId: string;
	count: number;
	cards: BinderCard[];
};

export async function fetchBinder(userId: string): Promise<BinderResponse> {
	const res = await fetch(`/api/binder/${userId}/cards`);
	if (!res.ok) throw new Error('Failed to fetch binder');
	return res.json();
}

export async function addCardToBinder(
	userId: string,
	cardId: string,
	quantity = 1,
	condition?: string,
): Promise<BinderCard> {
	const res = await fetch(`/api/binder/${userId}/cards`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ cardId, quantity, condition }),
	});
	if (!res.ok) throw new Error('Failed to add card to binder');
	return res.json();
}

export async function updateBinderCard(
	userId: string,
	cardId: string,
	quantity: number,
	condition?: string,
): Promise<BinderCard> {
	const res = await fetch(`/api/binder/${userId}/cards/${cardId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ quantity, condition }),
	});
	if (!res.ok) throw new Error('Failed to update binder card');
	return res.json();
}

export async function removeCardFromBinder(
	userId: string,
	cardId: string,
): Promise<void> {
	const res = await fetch(`/api/binder/${userId}/cards/${cardId}`, {
		method: 'DELETE',
	});
	if (!res.ok) throw new Error('Failed to remove card from binder');
}
