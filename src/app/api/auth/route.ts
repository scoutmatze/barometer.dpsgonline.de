import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { compare } from 'bcryptjs';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json();
    if (!email || !pin) {
      return NextResponse.json({ error: 'E-Mail und PIN erforderlich' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT id, email, name, pin_hash, role FROM users WHERE email = $1 AND active = true',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ungültige Zugangsdaten' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await compare(pin, user.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Ungültige Zugangsdaten' }, { status: 401 });
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('auth-token');
  return response;
}
