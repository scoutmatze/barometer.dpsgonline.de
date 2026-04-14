import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { response_id, fingerprint } = await request.json();
    const sessionHash = crypto.createHash('sha256').update(fingerprint || '').digest('hex').slice(0, 32);

    await pool.query(
      `INSERT INTO live_upvotes (response_id, session_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [response_id, sessionHash]
    );

    const count = await pool.query('SELECT COUNT(*) as c FROM live_upvotes WHERE response_id = $1', [response_id]);
    return NextResponse.json({ ok: true, upvotes: Number(count.rows[0].c) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}
