const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
};

export type BinderResponse = {
	binderId: string;
	count: number;
	cards: BinderCard[];
};

export async function fetchBinder(userId: string): Promise<BinderResponse> {
	const res = await fetch(`${API_URL}/users/${userId}/cards`);
	if (!res.ok) throw new Error('Failed to fetch binder');
	return res.json();
}

export async function addCardToBinder(
	userId: string,
	cardId: string,
	quantity = 1,
): Promise<BinderCard> {
	const res = await fetch(`${API_URL}/users/${userId}/cards`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ cardId, quantity }),
	});
	if (!res.ok) throw new Error('Failed to add card to binder');
	return res.json();
}

export async function removeCardFromBinder(
	userId: string,
	cardId: string,
): Promise<void> {
	const res = await fetch(`${API_URL}/users/${userId}/cards/${cardId}`, {
		method: 'DELETE',
	});
	if (!res.ok) throw new Error('Failed to remove card from binder');
}
