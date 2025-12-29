import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY?.trim();

/**
 * GET /cards/search?q=...
 * Example: /cards/search?q=name:charizard
 *
 * Proxies the Pokémon TCG API so the frontend never calls it directly.
 */
router.get('/search', async (req: Request, res: Response) => {
	// 1️⃣ Safely read query param
	const q = typeof req.query.q === 'string' ? req.query.q : '';

	// 2️⃣ Validate input
	if (!q || q.trim().length === 0) {
		return res.status(400).json({
			error: 'Query param "q" is required (example: ?q=name:charizard)',
		});
	}

	try {
		// 3️⃣ Call Pokémon TCG API
		const response = await axios.get(`${POKEMON_TCG_BASE_URL}/cards`, {
			params: { q },
			headers: API_KEY ? { 'X-Api-Key': API_KEY } : undefined,
		});

		// 4️⃣ Return data to client
		return res.status(200).json(response.data);
	} catch (err: any) {
		// 5️⃣ Handle external API errors
		const status = err?.response?.status ?? 500;
		const message =
			err?.response?.data?.error ??
			err?.message ??
			'Failed to fetch cards from Pokémon TCG API';

		return res.status(status).json({ error: message });
	}
});

export default router;
