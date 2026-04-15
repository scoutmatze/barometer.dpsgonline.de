import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  return NextResponse.json(user);
}
