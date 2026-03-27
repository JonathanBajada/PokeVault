import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;

				const res = await fetch(`${API_URL}/users/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: credentials.email,
						password: credentials.password,
					}),
				});

				if (!res.ok) return null;

				const user = await res.json();
				return { id: user.id, email: user.email, name: user.username, createdAt: user.created_at };
			},
		}),
	],
	callbacks: {
		jwt({ token, user, trigger, session }) {
			if (trigger === 'update' && session) {
				if (session.username) token.username = session.username;
				if (session.email) token.email = session.email;
			}
			if (user) {
				token.id = user.id;
				token.username = user.name ?? '';
				token.createdAt = (user as { createdAt?: string }).createdAt ?? '';
			}
			return token;
		},
		session({ session, token }) {
			session.user.id = token.id;
			session.user.username = token.username;
			session.user.createdAt = token.createdAt;
			return session;
		},
	},
	pages: {
		signIn: '/login',
	},
	session: {
		strategy: 'jwt',
	},
};
