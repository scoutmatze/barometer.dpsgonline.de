import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireUser } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireUser(['ADMIN', 'BL']);
    const category = request.nextUrl.searchParams.get('category');
    const result = await pool.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as response_count,
        (SELECT json_agg(json_build_object('id', a.id, 'label', a.label, 'sort_order', a.sort_order)
          ORDER BY a.sort_order)
          FROM survey_agenda_items a WHERE a.survey_id = s.id) as agenda_items
      FROM surveys s
      ${category ? 'WHERE s.category = $1' : ''}
      ORDER BY s.survey_date DESC NULLS LAST, s.created_at DESC
    `, category ? [category] : []);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(['ADMIN', 'BL']);
    const body = await request.json();
    const { title, subtitle, survey_date, agenda_items, emails, template_id, open_access_enabled, category } = body;

    // Get template
    const tmplResult = await pool.query(
      'SELECT * FROM templates WHERE id = $1 OR (is_default = true AND $1 IS NULL) ORDER BY is_default DESC LIMIT 1',
      [template_id || null]
    );
    const tmpl = tmplResult.rows[0];
    if (!tmpl) return NextResponse.json({ error: 'Kein Template gefunden' }, { status: 400 });

    // Create survey
    const surveyResult = await pool.query(`
      INSERT INTO surveys (title, subtitle, survey_date, template_id, status, zusammenarbeit_items, numeric_items, freitext_items, created_by, open_access_enabled, category)
      VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [title, subtitle, survey_date || null, tmpl.id, tmpl.zusammenarbeit_items, tmpl.numeric_items, tmpl.freitext_items, user.id, open_access_enabled || false, category || 'BL']);

    const surveyId = surveyResult.rows[0].id;

    // Insert agenda items
    if (agenda_items && agenda_items.length > 0) {
      for (let i = 0; i < agenda_items.length; i++) {
        const label = typeof agenda_items[i] === 'string' ? agenda_items[i] : agenda_items[i].label;
        if (label && label.trim()) {
          await pool.query(
            'INSERT INTO survey_agenda_items (survey_id, label, sort_order) VALUES ($1, $2, $3)',
            [surveyId, label.trim(), i]
          );
        }
      }
    }

    // Generate tokens for emails
    if (emails && emails.length > 0) {
      for (const email of emails) {
        if (!email || !email.trim()) continue;
        const token = crypto.randomBytes(32).toString('hex');
        const tokenResult = await pool.query(
          'INSERT INTO survey_tokens (survey_id, token) VALUES ($1, $2) RETURNING id',
          [surveyId, token]
        );
        await pool.query(
          'INSERT INTO token_assignments (token_id, email) VALUES ($1, $2)',
          [tokenResult.rows[0].id, email.trim().toLowerCase()]
        );
      }
    }

    return NextResponse.json({ id: surveyId }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
