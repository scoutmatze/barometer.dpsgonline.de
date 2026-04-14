import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(['ADMIN', 'BL']);
    const { id } = await params;
    const result = await pool.query(`
      SELECT ls.*,
        (SELECT json_agg(json_build_object(
          'id', la.id, 'type', la.type, 'title', la.title, 'config', la.config,
          'status', la.status, 'sort_order', la.sort_order, 'opened_at', la.opened_at, 'closed_at', la.closed_at
        ) ORDER BY la.sort_order) FROM live_activities la WHERE la.session_id = ls.id) as activities
      FROM live_sessions ls WHERE ls.id = $1
    `, [id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(['ADMIN']);
    const { id } = await params;
    const body = await request.json();

    if (body.status === 'active') {
      await pool.query('UPDATE live_sessions SET status = $1 WHERE id = $2', ['active', id]);
    } else if (body.status === 'closed') {
      await pool.query('UPDATE live_sessions SET status = $1, closed_at = NOW() WHERE id = $2', ['closed', id]);
      await pool.query(`UPDATE live_activities SET status = 'closed', closed_at = NOW() WHERE session_id = $1 AND status = 'open'`, [id]);
    }

    if (body.activity_id && body.activity_status) {
      if (body.activity_status === 'open') {
        await pool.query('UPDATE live_activities SET status = $1, opened_at = NOW() WHERE id = $2', ['open', body.activity_id]);
      } else if (body.activity_status === 'closed') {
        await pool.query('UPDATE live_activities SET status = $1, closed_at = NOW() WHERE id = $2', ['closed', body.activity_id]);
      }
    }

    // Add new activity on-the-fly
    if (body.add_activity) {
      const a = body.add_activity;
      const maxOrder = await pool.query('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM live_activities WHERE session_id = $1', [id]);
      await pool.query(
        `INSERT INTO live_activities (session_id, type, title, config, sort_order, status, opened_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, a.type, a.title, JSON.stringify(a.config || {}), maxOrder.rows[0].next, a.open_immediately ? 'open' : 'pending', a.open_immediately ? new Date() : null]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
