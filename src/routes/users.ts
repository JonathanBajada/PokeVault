import { Router, Request, Response } from 'express';
import { z } from 'zod';
import cards from './cards';

type PriceSnapshot = {
	low?: number;
	mid?: number;
	high?: number;
	capturedAt: string; // ISO timestamp
};

type CollectedCard = {
	cardId: string;
	name: string;
	imageUrl: string;

	setName: string;
	rarity?: string;

	priceSnapshot?: PriceSnapshot;

	quantity: number;
	condition?: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
	addedAt: string; // ISO timestamp
};

export type User = {
	id: number;
	name: string;
	cards: CollectedCard[];
};

// Temporary in-memory data (acts like a database for now)
const users: User[] = [
	{ id: 1, name: 'Alice', cards: [] },
	{ id: 2, name: 'Bob', cards: [] },
];

const createUserSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
});

const updateUserSchema = z.object({
	name: z.string().trim().min(1, 'Name must be a non-empty string').optional(),
});

const addCardSchema = z.object({
	cardId: z.string().min(1),
	name: z.string().trim().min(1),
	imageUrl: z.string().url(),
	setName: z.string().trim().min(1),
	rarity: z.string().trim().min(1).optional(),
	quantity: z.number().int().min(1).default(1),
	condition: z.enum(['NM', 'LP', 'MP', 'HP', 'DMG']).optional(),
	priceSnapshot: z
		.object({
			low: z.number().optional(),
			mid: z.number().optional(),
			high: z.number().optional(),
			capturedAt: z.string().min(1),
		})
		.optional(),
});

const router = Router();

// GET /users
router.get('/', (req: Request, res: Response) => {
	return res.status(200).json(users);
});

router.get('/:id/cards', (req: Request<{ id: string }>, res: Response) => {
	const id = Number(req.params.id);

	const user = users.find((u) => u.id === id);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	return res.status(200).json({
		userId: user.id,
		count: user.cards.length,
		cards: user.cards,
	});
});

// POST /users
router.post('/', (req: Request, res: Response) => {
	const parsed = createUserSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			error: parsed.error.issues[0]?.message ?? 'Invalid request body',
		});
	}

	const name = parsed.data.name;

	const newUser: User = {
		id: users.length ? users[users.length - 1].id + 1 : 1,
		name: name.trim(),
		cards: [],
	};

	users.push(newUser);

	return res.status(201).json(newUser);
});

router.post('/:id/cards', (req: Request<{ id: string }>, res: Response) => {
	const id = Number(req.params.id);

	const user = users.find((u) => u.id === id);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	const parsed = addCardSchema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({
			error: 'Invalid request body',
			issues: parsed.error.issues.map((i) => ({
				path: i.path.join('.'),
				message: i.message,
			})),
		});
	}

	const now = new Date().toISOString();

	const incoming = parsed.data;

	// If the user already has this card in their collection, increase quantity
	const existing = user.cards.find((c) => c.cardId === incoming.cardId);

	if (existing) {
		existing.quantity += incoming.quantity;
		// optionally update snapshot/condition if provided
		if (incoming.condition) existing.condition = incoming.condition;
		if (incoming.priceSnapshot)
			existing.priceSnapshot = incoming.priceSnapshot;
		return res.status(200).json(existing);
	}

	const collectedCard = {
		...incoming,
		addedAt: now,
	};

	user.cards.push(collectedCard);

	return res.status(201).json(collectedCard);
});

// GET /users/:id
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
	const id = Number(req.params.id);

	const user = users.find((u) => u.id === id);

	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	return res.status(200).json(user);
});

// PATCH /users/:id
router.patch('/:id', (req: Request<{ id: string }>, res: Response) => {
	const id = Number(req.params.id);

	const user = users.find((u) => u.id === id);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	const parsed = updateUserSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			error: parsed.error.issues[0]?.message ?? 'Invalid request body',
		});
	}

	if (parsed.data.name === undefined) {
		return res.status(400).json({ error: 'Nothing to update' });
	}

	user.name = parsed.data.name;

	return res.status(200).json(user);
});

// DELETE /users/:id
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
	const id = Number(req.params.id);

	const index = users.findIndex((u) => u.id === id);

	if (index === -1) {
		return res.status(404).json({ error: 'User not found' });
	}

	users.splice(index, 1);

	return res.status(204).send();
});

export default router;
