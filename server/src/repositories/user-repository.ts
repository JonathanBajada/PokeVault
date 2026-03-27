import bcrypt from 'bcrypt';
import { pool } from '../db';

const SALT_ROUNDS = 12;

export type User = {
	id: string;
	email: string;
	username: string;
	created_at: Date;
	updated_at: Date;
};

export type UserWithHash = User & { password_hash: string };

export async function findUserByEmail(email: string): Promise<UserWithHash | null> {
	const result = await pool.query<UserWithHash>(
		`SELECT id, email, username, password_hash, created_at, updated_at
		 FROM users WHERE email = $1`,
		[email.toLowerCase()],
	);
	return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
	const result = await pool.query<User>(
		`SELECT id, email, username, created_at, updated_at
		 FROM users WHERE id = $1`,
		[id],
	);
	return result.rows[0] ?? null;
}

export async function createUser(
	email: string,
	username: string,
	password: string,
): Promise<User> {
	const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

	const result = await pool.query<User>(
		`INSERT INTO users (email, username, password_hash)
		 VALUES ($1, $2, $3)
		 RETURNING id, email, username, created_at, updated_at`,
		[email.toLowerCase(), username.trim(), password_hash],
	);
	return result.rows[0];
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function updateUsername(
	id: string,
	username: string,
): Promise<User | null> {
	const result = await pool.query<User>(
		`UPDATE users
		 SET username = $1, updated_at = now()
		 WHERE id = $2
		 RETURNING id, email, username, created_at, updated_at`,
		[username.trim(), id],
	);
	return result.rows[0] ?? null;
}

export async function updateUser(
	id: string,
	fields: { username?: string; email?: string },
): Promise<User | null> {
	const sets: string[] = [];
	const values: unknown[] = [];
	let i = 1;

	if (fields.username !== undefined) {
		sets.push(`username = $${i++}`);
		values.push(fields.username.trim());
	}
	if (fields.email !== undefined) {
		sets.push(`email = $${i++}`);
		values.push(fields.email.toLowerCase());
	}
	if (sets.length === 0) return null;

	sets.push(`updated_at = now()`);
	values.push(id);

	const result = await pool.query<User>(
		`UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, email, username, created_at, updated_at`,
		values,
	);
	return result.rows[0] ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
	const result = await pool.query(
		`DELETE FROM users WHERE id = $1`,
		[id],
	);
	return (result.rowCount ?? 0) > 0;
}
