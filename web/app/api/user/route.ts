import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function PATCH(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const body = await req.json();

	const res = await fetch(`${API_URL}/users/${session.user.id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

	const data = await res.json();
	return NextResponse.json(data, { status: res.status });
}
