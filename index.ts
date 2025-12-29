import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

type User = {
	id: number;
	name: string;
};

const users: User[] = [
	{ id: 1, name: 'Alice' },
	{ id: 2, name: 'Bob' },
];

app.get('/health', (req: Request, res: Response) => {
	res.status(200).json({ status: 'ok' });
});

app.get('/users', (req: Request, res: Response) => {
	res.status(200).json(users);
});

app.get('/users/:id', (req: Request, res: Response) => {
	const id = Number(req.params.id);

	const user = users.find((u) => u.id === id);

	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	res.status(200).json(user);
});

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
