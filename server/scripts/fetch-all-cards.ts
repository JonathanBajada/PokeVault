import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY?.trim();
const OUTPUT_DIR = path.join(__dirname, '../../web/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'cards.json');

async function fetchAllCards() {
	console.log('Starting to fetch all cards...');
	const allCards: any[] = [];
	let page = 1;
	const pageSize = 250; // Max allowed by API
	let hasMore = true;

	while (hasMore) {
		try {
			console.log(`Fetching page ${page}...`);
			const response = await axios.get(`${POKEMON_TCG_BASE_URL}/cards`, {
				params: { page, pageSize },
				headers: API_KEY ? { 'X-Api-Key': API_KEY } : undefined,
			});

			const cards = response.data.data || [];
			allCards.push(...cards);

			console.log(`Fetched ${cards.length} cards (total: ${allCards.length})`);

			// Check if there are more pages
			hasMore = cards.length === pageSize && response.data.totalCount > allCards.length;
			page++;
		} catch (error: any) {
			console.error(`Error fetching page ${page}:`, error.message);
			hasMore = false;
		}
	}

	// Ensure output directory exists
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	}

	// Save to JSON file
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ data: allCards, totalCount: allCards.length }, null, 2));
	console.log(`\n✅ Successfully saved ${allCards.length} cards to ${OUTPUT_FILE}`);
}

fetchAllCards().catch(console.error);

