import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser(['ADMIN', 'BL']);
    const result = await pool.query(`
      SELECT DISTINCT category FROM (
        SELECT category FROM surveys WHERE category IS NOT NULL
        UNION
        SELECT category FROM live_sessions WHERE category IS NOT NULL
      ) c ORDER BY category
    `);
    return NextResponse.json(result.rows.map(r => r.category));
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
