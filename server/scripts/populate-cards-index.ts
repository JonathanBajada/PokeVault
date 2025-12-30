import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY?.trim();
const OUTPUT_FILE = path.join(__dirname, '../data/cards-index.json');
const MIN_CARDS = 1000;

interface CardIndexEntry {
	id: string;
	name: string;
	set?: string;
	rarity?: string;
	images?: {
		small: string;
	};
}

async function fetchPageWithRetry(
	page: number,
	pageSize: number,
	maxRetries = 3,
): Promise<any> {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const response = await axios.get(`${POKEMON_TCG_BASE_URL}/cards`, {
				params: { page, pageSize },
				headers: API_KEY ? { 'X-Api-Key': API_KEY } : undefined,
				timeout: 60000, // 60 second timeout
			});
			return response;
		} catch (error: any) {
			const status = error.response?.status;
			const isRetryable =
				status === 429 ||
				status === 503 ||
				status === 504 ||
				!error.response;

			if (isRetryable && attempt < maxRetries) {
				const waitTime = status === 429 ? 5000 : 2000 * attempt;
				console.log(
					`Attempt ${attempt} failed (${error.message}), retrying in ${waitTime}ms...`,
				);
				await new Promise((resolve) => setTimeout(resolve, waitTime));
				continue;
			}
			throw error;
		}
	}
	throw new Error('Max retries exceeded');
}

async function populateCardsIndex() {
	console.log('Starting to populate cards-index.json...');
	const cardsIndex: CardIndexEntry[] = [];
	let page = 1;
	const pageSize = 100; // Reduced page size for more reliable requests
	let hasMore = true;

	while (hasMore && cardsIndex.length < MIN_CARDS) {
		try {
			console.log(
				`Fetching page ${page}... (current: ${cardsIndex.length} cards)`,
			);
			const response = await fetchPageWithRetry(page, pageSize);

			const cards = response.data.data || [];

			// Extract only the fields we need for the index
			for (const card of cards) {
				if (cardsIndex.length >= MIN_CARDS) break;

				cardsIndex.push({
					id: card.id,
					name: card.name,
					set: card.set?.name,
					rarity: card.rarity,
					images: card.images
						? {
								small: card.images.small,
						  }
						: undefined,
				});
			}

			console.log(
				`Processed ${cards.length} cards (total: ${cardsIndex.length})`,
			);

			// Check if there are more pages and we haven't reached our minimum
			hasMore = cards.length === pageSize && cardsIndex.length < MIN_CARDS;
			page++;

			// Add a small delay to avoid rate limiting
			if (hasMore) {
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		} catch (error: any) {
			console.error(`Error fetching page ${page}:`, error.message);
			if (error.response?.status === 429) {
				console.log('Rate limited, waiting 5 seconds...');
				await new Promise((resolve) => setTimeout(resolve, 5000));
				continue;
			}
			// If we have some cards, save what we have
			if (cardsIndex.length > 0) {
				console.log(
					`\n⚠️  Stopping early due to error, but saving ${cardsIndex.length} cards collected so far...`,
				);
				break;
			}
			hasMore = false;
		}
	}

	// Ensure output directory exists
	const outputDir = path.dirname(OUTPUT_FILE);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Save to JSON file
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cardsIndex, null, 2));
	console.log(
		`\n✅ Successfully saved ${cardsIndex.length} cards to ${OUTPUT_FILE}`,
	);
}

populateCardsIndex().catch(console.error);
