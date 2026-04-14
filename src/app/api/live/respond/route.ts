import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { activity_id, value_numeric, value_text, fingerprint } = await request.json();

    const activity = await pool.query(
      `SELECT la.id, la.status, la.type, ls.status as session_status
       FROM live_activities la JOIN live_sessions ls ON ls.id = la.session_id
       WHERE la.id = $1`, [activity_id]
    );

    if (activity.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    if (activity.rows[0].status !== 'open') return NextResponse.json({ error: 'Nicht mehr offen' }, { status: 410 });
    if (activity.rows[0].session_status !== 'active') return NextResponse.json({ error: 'Session nicht aktiv' }, { status: 410 });

    const sessionHash = crypto.createHash('sha256').update(fingerprint || crypto.randomBytes(16).toString('hex')).digest('hex').slice(0, 32);

    if (activity.rows[0].type === 'openqa') {
      // Open Q&A: allow multiple submissions per person
      const uniqueHash = sessionHash + '_' + Date.now();
      const result = await pool.query(
        `INSERT INTO live_responses (activity_id, session_hash, value_text) VALUES ($1, $2, $3) RETURNING id`,
        [activity_id, uniqueHash, value_text || null]
      );
      return NextResponse.json({ ok: true, id: result.rows[0].id });
    }

    // All other types: one response per person (upsert)
    await pool.query(`
      INSERT INTO live_responses (activity_id, session_hash, value_numeric, value_text)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (activity_id, session_hash)
      DO UPDATE SET value_numeric = COALESCE($3, live_responses.value_numeric),
                    value_text = COALESCE($4, live_responses.value_text),
                    submitted_at = NOW()
    `, [activity_id, sessionHash, value_numeric || null, value_text || null]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Live respond error:', err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
