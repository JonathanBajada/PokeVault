import { Router } from 'express';
import { getCards } from '../repositories/card-repository';

console.log('cards router file loaded');

const router = Router();

router.get('/', async (req, res) => {
	const page = Number(req.query.page ?? 1);
	const limit = Number(req.query.limit ?? 10);

	const { cards, total } = await getCards(page, limit);

	res.json({
		page,
		limit,
		total,
		data: cards,
	});
});

export default router;
