import { Router } from 'express';
import { getCards } from '../repositories/card-repository';

console.log('cards router file loaded');

const router = Router();

router.get('/', async (req, res) => {
	try {
		console.log('GET /cards handler hit');

		const page = Number(req.query.page ?? 1);
		const limit = Number(req.query.limit ?? 10);

		const cards = await getCards(page, limit);

		res.json({
			page,
			limit,
			count: cards.length,
			data: cards,
		});
	} catch (error) {
		console.error('Error in GET /cards', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;
