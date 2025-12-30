import { pool } from '../db';

export async function getCards(page: number, limit: number) {
	const safeLimit = Math.min(limit, 20);
	const offset = (page - 1) * safeLimit;

	const dataPromise = pool.query(
		`
		SELECT id, name, set_name, rarity, image_small
		FROM cards
		ORDER BY name
		LIMIT $1 OFFSET $2
		`,
		[safeLimit, offset],
	);

	const countPromise = pool.query(`SELECT COUNT(*) FROM cards`);

	const [dataResult, countResult] = await Promise.all([
		dataPromise,
		countPromise,
	]);

	return {
		cards: dataResult.rows,
		total: Number(countResult.rows[0].count),
	};
}
