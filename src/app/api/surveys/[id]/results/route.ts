import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(['ADMIN', 'BL']);
    const { id } = await params;

    // Get survey with agenda
    const surveyResult = await pool.query(`
      SELECT s.*,
        (SELECT json_agg(json_build_object('id', a.id, 'label', a.label, 'sort_order', a.sort_order)
          ORDER BY a.sort_order) FROM survey_agenda_items a WHERE a.survey_id = s.id) as agenda_items
      FROM surveys s WHERE s.id = $1
    `, [id]);

    if (surveyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    }

    // Get all responses with answers
    const responsesResult = await pool.query(`
      SELECT r.id, r.submitted_at,
        json_agg(json_build_object(
          'section', ra.section,
          'question_key', ra.question_key,
          'value_numeric', ra.value_numeric,
          'value_text', ra.value_text
        )) as answers
      FROM responses r
      JOIN response_answers ra ON ra.response_id = r.id
      WHERE r.survey_id = $1
      GROUP BY r.id, r.submitted_at
      ORDER BY r.submitted_at
    `, [id]);

    return NextResponse.json({
      survey: surveyResult.rows[0],
      responses: responsesResult.rows,
    });
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
