import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(['ADMIN', 'BL']);
    const { id } = await params;
    const result = await pool.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as response_count,
        (SELECT json_agg(json_build_object('id', a.id, 'label', a.label, 'sort_order', a.sort_order)
          ORDER BY a.sort_order)
          FROM survey_agenda_items a WHERE a.survey_id = s.id) as agenda_items,
        (SELECT COUNT(*) FROM survey_tokens t WHERE t.survey_id = s.id) as token_count,
        (SELECT COUNT(*) FROM survey_tokens t WHERE t.survey_id = s.id AND t.used_at IS NOT NULL) as tokens_used
      FROM surveys s WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(['ADMIN']);
    const { id } = await params;
    const body = await _.json();

    if (body.status === 'active') {
      await pool.query('UPDATE surveys SET status = $1 WHERE id = $2', ['active', id]);
    } else if (body.status === 'closed') {
      await pool.query('UPDATE surveys SET status = $1, closed_at = NOW() WHERE id = $2', ['closed', id]);
      // DSGVO: Delete token assignments
      await pool.query(`
        DELETE FROM token_assignments WHERE token_id IN (
          SELECT id FROM survey_tokens WHERE survey_id = $1
        )
      `, [id]);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
