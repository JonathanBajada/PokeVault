import { pool } from '../db';
import * as fs from 'fs';
import * as path from 'path';

interface CardData {
	id: string;
	name: string;
	number: string;
	rarity: string;
	supertype: string;
	hp?: string;
	level?: string;
	artist?: string;
	flavorText?: string;
	types?: string[];
	subtypes?: string[];
	evolvesFrom?: string;
	evolvesTo?: string[];
	retreatCost?: string[];
	convertedRetreatCost?: number;
	attacks?: Array<{
		name: string;
		cost: string[];
		damage?: string;
		text?: string;
		convertedEnergyCost?: number;
	}>;
	abilities?: Array<{
		name: string;
		text: string;
		type?: string;
	}>;
	weaknesses?: Array<{
		type: string;
		value: string;
	}>;
	resistances?: Array<{
		type: string;
		value: string;
	}>;
	nationalPokedexNumbers?: number[];
	set: {
		id: string;
		name: string;
		series: string;
		printedTotal?: number;
		total?: number;
		ptcgoCode?: string;
		releaseDate: string;
		updatedAt?: string;
		images: {
			symbol?: string;
			logo?: string;
		};
	};
	images: {
		small: string;
		large: string;
	};
	legalities?: {
		unlimited?: string;
		expanded?: string;
	};
	tcgplayer?: {
		url?: string;
		updatedAt?: string;
		prices?: Record<
			string,
			{
				low?: number;
				mid?: number;
				high?: number;
				market?: number;
				directLow?: number | null;
			}
		>;
	};
	cardmarket?: {
		url?: string;
		updatedAt?: string;
		prices?: {
			averageSellPrice?: number;
			lowPrice?: number;
			trendPrice?: number;
			germanProLow?: number;
			suggestedPrice?: number;
			reverseHoloSell?: number;
			reverseHoloLow?: number;
			reverseHoloTrend?: number;
			lowPriceExPlus?: number;
			avg1?: number;
			avg7?: number;
			avg30?: number;
			reverseHoloAvg1?: number;
			reverseHoloAvg7?: number;
			reverseHoloAvg30?: number;
		};
	};
}

// Helper: build a multi-row INSERT values string and params array
function buildBatchInsert(rows: any[][], offset = 1): { values: string; params: any[] } {
	const params: any[] = [];
	const valueClauses = rows.map((row) => {
		const placeholders = row.map((_, i) => `$${offset + params.length + i}`);
		params.push(...row);
		return `(${placeholders.join(', ')})`;
	});
	return { values: valueClauses.join(', '), params };
}

async function seedNewSchema() {
	const filePath = path.join(__dirname, '../../data/cards2.json');
	const raw = fs.readFileSync(filePath, 'utf-8');
	const data = JSON.parse(raw);
	const cards: CardData[] = data.data || [];

	console.log(`Loading ${cards.length} cards from cards2.json...`);

	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		// Step 1: Insert sets (batch)
		const setsMap = new Map<string, CardData['set']>();
		for (const card of cards) {
			if (!setsMap.has(card.set.id)) setsMap.set(card.set.id, card.set);
		}

		console.log(`Inserting ${setsMap.size} unique sets...`);
		const setRows = Array.from(setsMap.values()).map((s) => [
			s.id, s.name, s.series,
			s.printedTotal || null, s.total || null, s.ptcgoCode || null,
			s.releaseDate || null,
			s.updatedAt ? new Date(s.updatedAt) : null,
			s.images.symbol || null, s.images.logo || null,
		]);
		const { values: setVals, params: setParams } = buildBatchInsert(setRows);
		await client.query(
			`INSERT INTO sets (id, name, series, printed_total, total, ptcgo_code, release_date, updated_at, symbol_image, logo_image)
			 VALUES ${setVals}
			 ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, series=EXCLUDED.series,
			   printed_total=EXCLUDED.printed_total, total=EXCLUDED.total, ptcgo_code=EXCLUDED.ptcgo_code,
			   release_date=EXCLUDED.release_date, updated_at=EXCLUDED.updated_at,
			   symbol_image=EXCLUDED.symbol_image, logo_image=EXCLUDED.logo_image`,
			setParams,
		);

		// Step 2: Insert cards in chunks of 100
		console.log(`Inserting ${cards.length} cards...`);
		const CHUNK = 100;
		for (let i = 0; i < cards.length; i += CHUNK) {
			const chunk = cards.slice(i, i + CHUNK);
			const cardRows = chunk.map((card) => [
				card.id, card.name, card.number, card.rarity, card.supertype,
				card.hp || null, card.level || null, card.artist || null, card.flavorText || null,
				card.set.id, card.images.small, card.images.large,
				card.evolvesFrom || null, card.convertedRetreatCost || null,
				card.legalities?.unlimited || null, card.legalities?.expanded || null,
			]);
			const { values: cardVals, params: cardParams } = buildBatchInsert(cardRows);
			await client.query(
				`INSERT INTO cards (id, name, number, rarity, supertype, hp, level, artist, flavor_text,
				  set_id, image_small, image_large, evolves_from, converted_retreat_cost,
				  legality_unlimited, legality_expanded)
				 VALUES ${cardVals}
				 ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, number=EXCLUDED.number,
				   rarity=EXCLUDED.rarity, supertype=EXCLUDED.supertype, hp=EXCLUDED.hp,
				   level=EXCLUDED.level, artist=EXCLUDED.artist, flavor_text=EXCLUDED.flavor_text,
				   set_id=EXCLUDED.set_id, image_small=EXCLUDED.image_small, image_large=EXCLUDED.image_large,
				   evolves_from=EXCLUDED.evolves_from, converted_retreat_cost=EXCLUDED.converted_retreat_cost,
				   legality_unlimited=EXCLUDED.legality_unlimited, legality_expanded=EXCLUDED.legality_expanded,
				   updated_at=now()`,
				cardParams,
			);
			console.log(`  Inserted ${Math.min(i + CHUNK, cards.length)} cards...`);
		}

		// Step 3: Insert card_types (batch)
		console.log('Inserting card types...');
		const typeRows: any[][] = [];
		for (const card of cards) {
			for (const type of card.types || []) typeRows.push([card.id, type]);
		}
		if (typeRows.length > 0) {
			const { values, params } = buildBatchInsert(typeRows);
			await client.query(
				`INSERT INTO card_types (card_id, type) VALUES ${values} ON CONFLICT (card_id, type) DO NOTHING`,
				params,
			);
		}
		console.log(`  Inserted ${typeRows.length} card type relationships`);

		// Step 4: Insert card_subtypes (batch)
		console.log('Inserting card subtypes...');
		const subtypeRows: any[][] = [];
		for (const card of cards) {
			for (const sub of card.subtypes || []) subtypeRows.push([card.id, sub]);
		}
		if (subtypeRows.length > 0) {
			const { values, params } = buildBatchInsert(subtypeRows);
			await client.query(
				`INSERT INTO card_subtypes (card_id, subtype) VALUES ${values} ON CONFLICT (card_id, subtype) DO NOTHING`,
				params,
			);
		}
		console.log(`  Inserted ${subtypeRows.length} card subtype relationships`);

		// Step 5: Insert attacks in chunks, then attack_costs
		console.log('Inserting attacks...');
		let attacksInserted = 0;
		for (let i = 0; i < cards.length; i += CHUNK) {
			const chunk = cards.slice(i, i + CHUNK);
			const attackRows: any[][] = [];
			for (const card of chunk) {
				for (let j = 0; j < (card.attacks || []).length; j++) {
					const a = card.attacks![j];
					attackRows.push([card.id, a.name, a.damage || null, a.text || null, a.convertedEnergyCost || null, j]);
				}
			}
			if (attackRows.length === 0) continue;
			const { values, params } = buildBatchInsert(attackRows);
			const result = await client.query(
				`INSERT INTO attacks (card_id, name, damage, text, converted_energy_cost, attack_order)
				 VALUES ${values} RETURNING id, card_id, attack_order`,
				params,
			);

			// Build attack_costs rows
			const attackMap = new Map<string, number>();
			for (const row of result.rows) {
				attackMap.set(`${row.card_id}:${row.attack_order}`, row.id);
			}
			const costRows: any[][] = [];
			for (const card of chunk) {
				for (let j = 0; j < (card.attacks || []).length; j++) {
					const a = card.attacks![j];
					const attackId = attackMap.get(`${card.id}:${j}`);
					if (!attackId) continue;
					for (let k = 0; k < (a.cost || []).length; k++) {
						costRows.push([attackId, a.cost[k], k]);
					}
				}
			}
			if (costRows.length > 0) {
				const { values: cv, params: cp } = buildBatchInsert(costRows);
				await client.query(
					`INSERT INTO attack_costs (attack_id, energy_type, cost_order) VALUES ${cv} ON CONFLICT (attack_id, energy_type, cost_order) DO NOTHING`,
					cp,
				);
			}
			attacksInserted += attackRows.length;
		}
		console.log(`  Inserted ${attacksInserted} attacks`);

		// Step 6: Insert abilities (batch)
		console.log('Inserting abilities...');
		const abilityRows: any[][] = [];
		for (const card of cards) {
			for (let i = 0; i < (card.abilities || []).length; i++) {
				const a = card.abilities![i];
				abilityRows.push([card.id, a.name, a.text, a.type || null, i]);
			}
		}
		if (abilityRows.length > 0) {
			const { values, params } = buildBatchInsert(abilityRows);
			await client.query(
				`INSERT INTO abilities (card_id, name, text, type, ability_order) VALUES ${values}`,
				params,
			);
		}
		console.log(`  Inserted ${abilityRows.length} abilities`);

		// Step 7: Insert weaknesses (batch)
		console.log('Inserting weaknesses...');
		const weaknessRows: any[][] = [];
		for (const card of cards) {
			for (const w of card.weaknesses || []) weaknessRows.push([card.id, w.type, w.value]);
		}
		if (weaknessRows.length > 0) {
			const { values, params } = buildBatchInsert(weaknessRows);
			await client.query(
				`INSERT INTO card_weaknesses (card_id, type, value) VALUES ${values} ON CONFLICT (card_id, type) DO NOTHING`,
				params,
			);
		}
		console.log(`  Inserted ${weaknessRows.length} weaknesses`);

		// Step 8: Insert resistances (batch)
		console.log('Inserting resistances...');
		const resistanceRows: any[][] = [];
		for (const card of cards) {
			for (const r of card.resistances || []) resistanceRows.push([card.id, r.type, r.value]);
		}
		if (resistanceRows.length > 0) {
			const { values, params } = buildBatchInsert(resistanceRows);
			await client.query(
				`INSERT INTO card_resistances (card_id, type, value) VALUES ${values} ON CONFLICT (card_id, type) DO NOTHING`,
				params,
			);
		}
		console.log(`  Inserted ${resistanceRows.length} resistances`);

		// Step 9: Insert pokedex numbers (batch)
		console.log('Inserting Pokédex numbers...');
		const pokedexRows: any[][] = [];
		for (const card of cards) {
			for (const n of card.nationalPokedexNumbers || []) pokedexRows.push([card.id, n]);
		}
		if (pokedexRows.length > 0) {
			const { values, params } = buildBatchInsert(pokedexRows);
			await client.query(
				`INSERT INTO card_pokedex_numbers (card_id, pokedex_number) VALUES ${values} ON CONFLICT (card_id, pokedex_number) DO NOTHING`,
				params,
			);
		}
		console.log(`  Inserted ${pokedexRows.length} Pokédex number relationships`);

		// Step 10: Insert TCGPlayer prices (batch)
		console.log('Inserting TCGPlayer prices...');
		const tcgRows: any[][] = [];
		for (const card of cards) {
			if (card.tcgplayer?.prices) {
				for (const [variant, priceData] of Object.entries(card.tcgplayer.prices)) {
					tcgRows.push([
						card.id, 'tcgplayer', variant,
						priceData.low || null, priceData.mid || null,
						priceData.high || null, priceData.market || null,
						priceData.directLow || null,
						card.tcgplayer.updatedAt ? new Date(card.tcgplayer.updatedAt) : null,
					]);
				}
			}
		}
		if (tcgRows.length > 0) {
			const { values, params } = buildBatchInsert(tcgRows);
			await client.query(
				`INSERT INTO prices (card_id, source, variant, low, mid, high, market, direct_low, updated_at)
				 VALUES ${values}
				 ON CONFLICT (card_id, source, variant) DO UPDATE SET
				   low=EXCLUDED.low, mid=EXCLUDED.mid, high=EXCLUDED.high,
				   market=EXCLUDED.market, direct_low=EXCLUDED.direct_low, updated_at=EXCLUDED.updated_at`,
				params,
			);
		}
		console.log(`  Inserted ${tcgRows.length} TCGPlayer price entries`);

		// Step 11: Insert Cardmarket prices (batch)
		console.log('Inserting Cardmarket prices...');
		const cmRows: any[][] = [];
		for (const card of cards) {
			if (card.cardmarket?.prices) {
				const p = card.cardmarket.prices;
				cmRows.push([
					card.id, 'cardmarket', 'standard',
					p.lowPrice || null, p.averageSellPrice || null, p.trendPrice || null,
					card.cardmarket.updatedAt ? new Date(card.cardmarket.updatedAt) : null,
				]);
			}
		}
		if (cmRows.length > 0) {
			const { values, params } = buildBatchInsert(cmRows);
			await client.query(
				`INSERT INTO prices (card_id, source, variant, low, mid, market, updated_at)
				 VALUES ${values}
				 ON CONFLICT (card_id, source, variant) DO UPDATE SET
				   low=EXCLUDED.low, mid=EXCLUDED.mid, market=EXCLUDED.market, updated_at=EXCLUDED.updated_at`,
				params,
			);
		}
		console.log(`  Inserted ${cmRows.length} Cardmarket price entries`);

		await client.query('COMMIT');
		console.log(`\n✅ Successfully seeded ${cards.length} cards with all related data`);
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('❌ Seeding failed', err);
		throw err;
	} finally {
		client.release();
		process.exit(0);
	}
}

seedNewSchema().catch(console.error);
