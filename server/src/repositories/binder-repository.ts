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
	market_price: number | null;
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
			c.rarity,
			COALESCE(MAX(p.market), MAX(p.mid), MAX(p.high)) AS market_price
		FROM binder_cards bc
		INNER JOIN cards c ON bc.card_id = c.id
		INNER JOIN sets s ON c.set_id = s.id
		LEFT JOIN prices p ON c.id = p.card_id
		WHERE bc.binder_id = $1
		GROUP BY bc.card_id, bc.quantity, bc.condition, bc.grade, bc.intent,
		         bc.created_at, c.name, c.image_small, c.image_large, s.name, c.rarity
		ORDER BY bc.created_at DESC`,
		[binderId],
	);
	return result.rows.map((row) => ({
		...row,
		market_price: row.market_price ? Number(row.market_price) : null,
	}));
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
			c.rarity,
			COALESCE(MAX(p.market), MAX(p.mid), MAX(p.high)) AS market_price
		FROM binder_cards bc
		INNER JOIN cards c ON bc.card_id = c.id
		INNER JOIN sets s ON c.set_id = s.id
		LEFT JOIN prices p ON c.id = p.card_id
		WHERE bc.binder_id = $1 AND bc.card_id = $2
		GROUP BY bc.card_id, bc.quantity, bc.condition, bc.grade, bc.intent,
		         bc.created_at, c.name, c.image_small, c.image_large, s.name, c.rarity`,
		[binderId, cardId],
	);
	const row = result.rows[0];
	return { ...row, market_price: row.market_price ? Number(row.market_price) : null };
}

export async function updateBinderCard(
	binderId: string,
	cardId: string,
	quantity: number,
	condition?: string,
	intent?: string,
): Promise<BinderCard | null> {
	const result = await pool.query(
		`UPDATE binder_cards
		 SET quantity = $1, condition = COALESCE($2, condition), intent = COALESCE($3, intent), updated_at = now()
		 WHERE binder_id = $4 AND card_id = $5`,
		[quantity, condition ?? null, intent ?? null, binderId, cardId],
	);
	if ((result.rowCount ?? 0) === 0) return null;

	const fetched = await pool.query<BinderCard>(
		`SELECT
			bc.card_id, bc.quantity, bc.condition, bc.grade, bc.intent,
			bc.created_at AS added_at,
			c.name, c.image_small AS image_small_url, c.image_large AS image_large_url,
			s.name AS set_name, c.rarity,
			COALESCE(MAX(p.market), MAX(p.mid), MAX(p.high)) AS market_price
		FROM binder_cards bc
		INNER JOIN cards c ON bc.card_id = c.id
		INNER JOIN sets s ON c.set_id = s.id
		LEFT JOIN prices p ON c.id = p.card_id
		WHERE bc.binder_id = $1 AND bc.card_id = $2
		GROUP BY bc.card_id, bc.quantity, bc.condition, bc.grade, bc.intent,
		         bc.created_at, c.name, c.image_small, c.image_large, s.name, c.rarity`,
		[binderId, cardId],
	);
	const row = fetched.rows[0];
	return { ...row, market_price: row.market_price ? Number(row.market_price) : null };
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
