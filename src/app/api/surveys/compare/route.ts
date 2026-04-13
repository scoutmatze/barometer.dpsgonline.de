import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser(['ADMIN', 'BL']);

    // Get all closed/active surveys with their data
    const surveys = await pool.query(`
      SELECT s.id, s.title, s.subtitle, s.survey_date, s.status,
        s.zusammenarbeit_items, s.numeric_items,
        (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as response_count,
        (SELECT json_agg(json_build_object('id', a.id, 'label', a.label, 'sort_order', a.sort_order)
          ORDER BY a.sort_order) FROM survey_agenda_items a WHERE a.survey_id = s.id) as agenda_items
      FROM surveys s
      WHERE s.status IN ('closed', 'active')
      ORDER BY s.survey_date ASC NULLS LAST
    `);

    // Get aggregated answers per survey
    const results = [];
    for (const survey of surveys.rows) {
      const answers = await pool.query(`
        SELECT ra.section, ra.question_key,
          AVG(CASE WHEN ra.value_numeric > 0 THEN ra.value_numeric ELSE NULL END) as avg_value,
          COUNT(CASE WHEN ra.value_numeric > 0 THEN 1 ELSE NULL END) as valid_count
        FROM response_answers ra
        JOIN responses r ON r.id = ra.response_id
        WHERE r.survey_id = $1 AND ra.section IN ('zusammenarbeit', 'numeric')
        GROUP BY ra.section, ra.question_key
      `, [survey.id]);

      results.push({
        ...survey,
        averages: answers.rows,
      });
    }

    return NextResponse.json(results);
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
