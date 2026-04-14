import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const activities = await pool.query(`
      SELECT la.id, la.type, la.title, la.status, la.config,
        (SELECT json_agg(json_build_object(
          'id', lr.id,
          'value_numeric', lr.value_numeric,
          'value_text', lr.value_text,
          'submitted_at', lr.submitted_at,
          'upvotes', (SELECT COUNT(*) FROM live_upvotes lu WHERE lu.response_id = lr.id)
        ) ORDER BY lr.submitted_at DESC)
        FROM live_responses lr WHERE lr.activity_id = la.id) as responses,
        (SELECT COUNT(DISTINCT lr.session_hash) FROM live_responses lr WHERE lr.activity_id = la.id) as response_count
      FROM live_activities la
      WHERE la.session_id = $1
      ORDER BY la.sort_order
    `, [id]);

    return NextResponse.json({
      activities: activities.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
