import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireUser } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser(['ADMIN', 'BL']);
    const result = await pool.query(`
      SELECT ls.*,
        (SELECT COUNT(*) FROM live_activities la WHERE la.session_id = ls.id) as activity_count,
        (SELECT COUNT(DISTINCT lr.session_hash) FROM live_responses lr
         JOIN live_activities la ON la.id = lr.activity_id WHERE la.session_id = ls.id) as participant_count
      FROM live_sessions ls ORDER BY ls.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(['ADMIN']);
    const { title, subtitle, session_date, activities } = await request.json();
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    const result = await pool.query(
      `INSERT INTO live_sessions (title, subtitle, session_date, access_code, status, created_by)
       VALUES ($1, $2, $3, $4, 'draft', $5) RETURNING *`,
      [title, subtitle || null, session_date || null, code, user.id]
    );
    const session = result.rows[0];

    if (activities && activities.length > 0) {
      for (let i = 0; i < activities.length; i++) {
        const a = activities[i];
        await pool.query(
          `INSERT INTO live_activities (session_id, type, title, config, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [session.id, a.type, a.title, JSON.stringify(a.config || {}), i]
        );
      }
    }

    return NextResponse.json(session, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
