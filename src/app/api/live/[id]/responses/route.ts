import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await pool.query(`
      SELECT lr.id, lr.value_text, lr.submitted_at,
        (SELECT COUNT(*) FROM live_upvotes lu WHERE lu.response_id = lr.id) as upvotes
      FROM live_responses lr
      WHERE lr.activity_id = $1 AND lr.value_text IS NOT NULL
      ORDER BY (SELECT COUNT(*) FROM live_upvotes lu WHERE lu.response_id = lr.id) DESC, lr.submitted_at DESC
    `, [id]);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
