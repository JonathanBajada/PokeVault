import { Router, Request, Response } from 'express';
import { z } from 'zod';

export type User = {
	id: number;
	name: string;
};

// Temporary in-memory data (acts like a database for now)
const users: User[] = [
	{ id: 1, name: 'Alice' },
	{ id: 2, name: 'Bob' },
];

const createUserSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
});

const updateUserSchema = z.object({
	name: z.string().trim().min(1, 'Name must be a non-empty string').optional(),
});

const router = Router();

// GET /users
router.get('/', (req: Request, res: Response) => {
	return res.status(200).json(users);
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
	};

	users.push(newUser);

	return res.status(201).json(newUser);
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
