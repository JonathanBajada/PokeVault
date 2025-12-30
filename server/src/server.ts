import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
console.log(process.env.POKEMON_TCG_API_KEY);

import usersRouter from './routes/users';
import cardsRouter from './routes/cards';

const app = express();

app.use(cors());

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
	res.status(200).json({ status: 'ok' });
});

app.use('/users', usersRouter);

console.log('Mounting /cards router');
app.use('/cards', cardsRouter);

const PORT = 4000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
