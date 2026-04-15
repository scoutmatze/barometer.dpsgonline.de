import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const { current_pin, new_pin } = await request.json();
    if (!current_pin || !new_pin) return NextResponse.json({ error: 'Beide PINs erforderlich' }, { status: 400 });
    if (new_pin.length < 4) return NextResponse.json({ error: 'Neuer PIN muss mindestens 4 Zeichen haben' }, { status: 400 });

    const result = await pool.query('SELECT pin_hash FROM users WHERE id = $1', [user.id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });

    const valid = await compare(current_pin, result.rows[0].pin_hash);
    if (!valid) return NextResponse.json({ error: 'Aktueller PIN ist falsch' }, { status: 403 });

    const newHash = await hash(new_pin, 12);
    await pool.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [newHash, user.id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
