import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Params = { params: Promise<{ userId: string; cardId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
	const { userId, cardId } = await params;
	const session = await getServerSession(authOptions);
	if (!session || session.user.id !== userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await req.json();
	const res = await fetch(`${API_URL}/users/${userId}/cards/${cardId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = await res.json();
	return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
	const { userId, cardId } = await params;
	const session = await getServerSession(authOptions);
	if (!session || session.user.id !== userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const res = await fetch(`${API_URL}/users/${userId}/cards/${cardId}`, {
		method: 'DELETE',
	});

	if (res.status === 204) return new NextResponse(null, { status: 204 });
	const data = await res.json();
	return NextResponse.json(data, { status: res.status });
}
