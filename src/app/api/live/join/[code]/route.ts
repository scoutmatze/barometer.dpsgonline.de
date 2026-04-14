import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const result = await pool.query(`
      SELECT ls.id, ls.title, ls.subtitle, ls.status, ls.access_code,
        (SELECT json_agg(json_build_object(
          'id', la.id, 'type', la.type, 'title', la.title, 'config', la.config, 'status', la.status
        ) ORDER BY la.sort_order) FROM live_activities la WHERE la.session_id = ls.id) as activities
      FROM live_sessions ls WHERE ls.access_code = $1
    `, [code.toUpperCase()]);

    if (result.rows.length === 0) return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
    const session = result.rows[0];
    if (session.status !== 'active') return NextResponse.json({ error: 'Session nicht aktiv' }, { status: 410 });

    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
