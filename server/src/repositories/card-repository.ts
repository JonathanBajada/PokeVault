import { pool } from '../db';

export async function getCards(page: number, limit: number) {
	const safeLimit = Math.min(limit, 20); // hard cap
	const offset = (page - 1) * safeLimit;

	const result = await pool.query(
		`
    SELECT id, name, set_name, rarity, image_small
    FROM cards
    ORDER BY name
    LIMIT $1 OFFSET $2
    `,
		[safeLimit, offset],
	);

	return result.rows;
}
