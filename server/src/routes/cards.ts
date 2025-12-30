import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY?.trim();
type CacheEntry = {
	data: any;
	expiresAt: number;
};

const searchCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * GET /cards/search?q=...
 * Example: /cards/search?q=name:charizard
 *
 * Proxies the Pokémon TCG API so the frontend never calls it directly.
 */
router.get('/search', async (req, res) => {
	const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

	if (!q) {
		return res.status(400).json({ error: 'Query param "q" is required' });
	}

	// 🔹 Check cache first
	const cached = searchCache[q];
	if (cached && cached.expiresAt > Date.now()) {
		return res.status(200).json(cached.data);
	}

	// 🔹 Call Pokémon API only if cache miss
	const response = await axios.get(`${POKEMON_TCG_BASE_URL}/cards`, {
		params: {
			q,
			page: 1,
			pageSize: 10,
		},
		headers: API_KEY ? { 'X-Api-Key': API_KEY } : undefined,
	});

	// 🔹 Store in cache
	searchCache[q] = {
		data: response.data,
		expiresAt: Date.now() + CACHE_TTL_MS,
	};

	return res.status(200).json(response.data);
});

export default router;
