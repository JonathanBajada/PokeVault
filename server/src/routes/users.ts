import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
	createUser,
	deleteUser,
	findUserByEmail,
	findUserById,
	findUserByUsername,
	updateUser,
	verifyPassword,
} from '../repositories/user-repository';
import {
	addCardToBinder,
	getBinderCards,
	getOrCreateBinder,
	removeCardFromBinder,
	updateBinderCard,
} from '../repositories/binder-repository';

export const CONDITIONS = [
	'Mint',
	'Near Mint',
	'Lightly Played',
	'Moderately Played',
	'Heavily Played',
	'Damaged',
] as const;

const router = Router();

// ─── Validation schemas ────────────────────────────────────────────────────

const registerSchema = z.object({
	email: z.string().email('Invalid email'),
	username: z.string().trim().min(1, 'Username is required'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateSchema = z.object({
	username: z.string().trim().min(1, 'Username must not be empty').optional(),
	email: z.string().email('Invalid email').optional(),
}).refine((d) => d.username !== undefined || d.email !== undefined, {
	message: 'Provide at least username or email',
});

const CONDITION_VALUES = ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'] as const;

const addCardSchema = z.object({
	cardId: z.string().min(1),
	quantity: z.number().int().min(1).max(99).default(1),
	condition: z.enum(CONDITION_VALUES).optional(),
	intent: z.enum(['own', 'sell', 'trade', 'want']).optional(),
});

const updateCardSchema = z.object({
	quantity: z.number().int().min(1).max(99).optional(),
	condition: z.enum(CONDITION_VALUES).optional(),
	intent: z.enum(['own', 'want']).optional(),
});

// ─── Auth routes ───────────────────────────────────────────────────────────

// POST /users/register
router.post('/register', async (req: Request, res: Response) => {
	const parsed = registerSchema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({
			error: parsed.error.issues[0]?.message ?? 'Invalid request body',
		});
	}

	const { email, username, password } = parsed.data;

	try {
		const existing = await findUserByEmail(email);
		if (existing) {
			return res.status(409).json({ error: 'Email already in use' });
		}

		const user = await createUser(email, username, password);
		return res.status(201).json(user);
	} catch (err) {
		console.error('Register error:', err);
		return res.status(500).json({ error: 'Registration failed. Check server logs.' });
	}
});

// POST /users/login
router.post('/login', async (req: Request, res: Response) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json({ error: 'Email and password are required' });
	}

	try {
		const user = await findUserByEmail(email);
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const valid = await verifyPassword(password, user.password_hash);
		if (!valid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const { password_hash: _, ...safeUser } = user;
		return res.status(200).json(safeUser);
	} catch (err) {
		console.error('Login error:', err);
		return res.status(500).json({ error: 'Login failed. Check server logs.' });
	}
});

// ─── User routes ───────────────────────────────────────────────────────────

// GET /users/:id
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
	const user = await findUserById(req.params.id);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}
	return res.status(200).json(user);
});

// PATCH /users/:id
router.patch('/:id', async (req: Request<{ id: string }>, res: Response) => {
	const parsed = updateSchema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({
			error: parsed.error.issues[0]?.message ?? 'Invalid request body',
		});
	}

	try {
		if (parsed.data.email) {
			const existing = await findUserByEmail(parsed.data.email);
			if (existing && existing.id !== req.params.id) {
				return res.status(409).json({ error: 'Email already in use' });
			}
		}

		const user = await updateUser(req.params.id, parsed.data);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		return res.status(200).json(user);
	} catch (err) {
		console.error('Update user error:', err);
		return res.status(500).json({ error: 'Update failed' });
	}
});

// DELETE /users/:id
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
	const deleted = await deleteUser(req.params.id);
	if (!deleted) {
		return res.status(404).json({ error: 'User not found' });
	}
	return res.status(204).send();
});

// ─── Binder routes ─────────────────────────────────────────────────────────

// GET /users/:id/cards
router.get('/:id/cards', async (req: Request<{ id: string }>, res: Response) => {
	const user = await findUserById(req.params.id);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	const binder = await getOrCreateBinder(user.id);
	const cards = await getBinderCards(binder.id);

	return res.status(200).json({ binderId: binder.id, count: cards.length, cards });
});

// POST /users/:id/cards
router.post('/:id/cards', async (req: Request<{ id: string }>, res: Response) => {
	const user = await findUserById(req.params.id);
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

	const binder = await getOrCreateBinder(user.id);
	const { cardId, quantity, condition, intent } = parsed.data;
	const card = await addCardToBinder(binder.id, cardId, quantity, condition, intent);

	return res.status(201).json(card);
});

// PATCH /users/:id/cards/:cardId
router.patch(
	'/:id/cards/:cardId',
	async (req: Request<{ id: string; cardId: string }>, res: Response) => {
		const user = await findUserById(req.params.id);
		if (!user) return res.status(404).json({ error: 'User not found' });

		const parsed = updateCardSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({
				error: parsed.error.issues[0]?.message ?? 'Invalid request body',
			});
		}

		if (!parsed.data.quantity && !parsed.data.condition && !parsed.data.intent) {
			return res.status(400).json({ error: 'Nothing to update' });
		}

		const binder = await getOrCreateBinder(user.id);
		const updated = await updateBinderCard(
			binder.id,
			req.params.cardId,
			parsed.data.quantity ?? 1,
			parsed.data.condition,
			parsed.data.intent,
		);
		if (!updated) return res.status(404).json({ error: 'Card not in binder' });
		return res.status(200).json(updated);
	},
);

// DELETE /users/:id/cards/:cardId
router.delete(
	'/:id/cards/:cardId',
	async (req: Request<{ id: string; cardId: string }>, res: Response) => {
		const user = await findUserById(req.params.id);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const binder = await getOrCreateBinder(user.id);
		const removed = await removeCardFromBinder(binder.id, req.params.cardId);
		if (!removed) {
			return res.status(404).json({ error: 'Card not in binder' });
		}
		return res.status(204).send();
	},
);

// ─── Public routes ─────────────────────────────────────────────────────────

// GET /users/by-username/:username/wants  — public, no auth required
router.get('/by-username/:username/wants', async (req: Request<{ username: string }>, res: Response) => {
	const user = await findUserByUsername(req.params.username);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	const binder = await getOrCreateBinder(user.id);
	const allCards = await getBinderCards(binder.id);
	const wants = allCards.filter((c) => c.intent === 'want');

	return res.status(200).json({
		username: user.username,
		count: wants.length,
		cards: wants,
	});
});

export default router;
