import { pool } from './db';

async function start() {
	const res = await pool.query('SELECT 1');
	console.log('DB connected:', res.rowCount === 1);
	process.exit(0);
}

start();
