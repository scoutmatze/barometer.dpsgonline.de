import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();

    // Validate token
    const tokenResult = await pool.query(`
      SELECT t.id, t.survey_id, t.used_at, s.status
      FROM survey_tokens t
      JOIN surveys s ON s.id = t.survey_id
      WHERE t.token = $1
    `, [token]);

    if (tokenResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ungültiger Link' }, { status: 404 });
    }

    const tokenRow = tokenResult.rows[0];

    if (tokenRow.status !== 'active') {
      return NextResponse.json({ error: 'Diese Umfrage ist nicht mehr aktiv' }, { status: 410 });
    }

    if (tokenRow.used_at) {
      return NextResponse.json({ error: 'Du hast bereits teilgenommen' }, { status: 409 });
    }

    // Create response
    const responseResult = await pool.query(
      'INSERT INTO responses (survey_id) VALUES ($1) RETURNING id',
      [tokenRow.survey_id]
    );
    const responseId = responseResult.rows[0].id;

    // Insert answers
    const { answers } = body;
    if (answers && Array.isArray(answers)) {
      for (const a of answers) {
        await pool.query(
          'INSERT INTO response_answers (response_id, section, question_key, value_numeric, value_text) VALUES ($1, $2, $3, $4, $5)',
          [responseId, a.section, a.question_key, a.value_numeric || null, a.value_text || null]
        );
      }
    }

    // Mark token as used
    await pool.query('UPDATE survey_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
