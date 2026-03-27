import { pool } from '../db';

export type Binder = {
	id: string;
	user_id: string;
	name: string;
	is_public: boolean;
	created_at: Date;
	updated_at: Date;
};

export type BinderCard = {
	card_id: string;
	quantity: number;
	condition: string | null;
	grade: string | null;
	intent: string | null;
	added_at: Date;
	// Joined from cards/sets for convenience
	name: string;
	image_small_url: string;
	image_large_url: string;
	set_name: string;
	rarity: string | null;
};

/** Returns the user's binder, creating one if it doesn't exist yet. */
export async function getOrCreateBinder(userId: string): Promise<Binder> {
	const existing = await pool.query<Binder>(
		`SELECT * FROM binders WHERE user_id = $1 LIMIT 1`,
		[userId],
	);

	if (existing.rows.length > 0) {
		return existing.rows[0];
	}

	const created = await pool.query<Binder>(
		`INSERT INTO binders (user_id) VALUES ($1) RETURNING *`,
		[userId],
	);
	return created.rows[0];
}

export async function getBinderCards(binderId: string): Promise<BinderCard[]> {
	const result = await pool.query<BinderCard>(
		`SELECT
			bc.card_id,
			bc.quantity,
			bc.condition,
			bc.grade,
			bc.intent,
			bc.created_at AS added_at,
			c.name,
			c.image_small AS image_small_url,
			c.image_large AS image_large_url,
			s.name AS set_name,
			c.rarity
		FROM binder_cards bc
		INNER JOIN cards c ON bc.card_id = c.id
		INNER JOIN sets s ON c.set_id = s.id
		WHERE bc.binder_id = $1
		ORDER BY bc.created_at DESC`,
		[binderId],
	);
	return result.rows;
}

export async function addCardToBinder(
	binderId: string,
	cardId: string,
	quantity: number = 1,
	condition?: string,
	intent?: string,
): Promise<BinderCard> {
	// Upsert: if the card is already in the binder, increase quantity
	await pool.query(
		`INSERT INTO binder_cards (binder_id, card_id, quantity, condition, intent)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (binder_id, card_id)
		 DO UPDATE SET
		   quantity   = binder_cards.quantity + EXCLUDED.quantity,
		   condition  = COALESCE(EXCLUDED.condition, binder_cards.condition),
		   intent     = COALESCE(EXCLUDED.intent,    binder_cards.intent),
		   updated_at = now()`,
		[binderId, cardId, quantity, condition ?? null, intent ?? null],
	);

	const result = await pool.query<BinderCard>(
		`SELECT
			bc.card_id,
			bc.quantity,
			bc.condition,
			bc.grade,
			bc.intent,
			bc.created_at AS added_at,
			c.name,
			c.image_small AS image_small_url,
			c.image_large AS image_large_url,
			s.name AS set_name,
			c.rarity
		FROM binder_cards bc
		INNER JOIN cards c ON bc.card_id = c.id
		INNER JOIN sets s ON c.set_id = s.id
		WHERE bc.binder_id = $1 AND bc.card_id = $2`,
		[binderId, cardId],
	);
	return result.rows[0];
}

export async function removeCardFromBinder(
	binderId: string,
	cardId: string,
): Promise<boolean> {
	const result = await pool.query(
		`DELETE FROM binder_cards WHERE binder_id = $1 AND card_id = $2`,
		[binderId, cardId],
	);
	return (result.rowCount ?? 0) > 0;
}
