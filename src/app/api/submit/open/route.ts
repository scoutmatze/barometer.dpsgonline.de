import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { survey_id, answers, fingerprint } = body;

    // Validate survey
    const surveyResult = await pool.query(
      'SELECT id, status, open_access_enabled FROM surveys WHERE id = $1',
      [survey_id]
    );

    if (surveyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Umfrage nicht gefunden' }, { status: 404 });
    }

    const survey = surveyResult.rows[0];
    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'Umfrage nicht aktiv' }, { status: 410 });
    }
    if (!survey.open_access_enabled) {
      return NextResponse.json({ error: 'Offener Zugang nicht aktiviert' }, { status: 403 });
    }

    // Check duplicate via fingerprint hash
    const sessionHash = crypto.createHash('sha256').update(fingerprint || 'unknown').digest('hex');
    const existing = await pool.query(
      'SELECT id FROM open_access_sessions WHERE survey_id = $1 AND session_hash = $2',
      [survey_id, sessionHash]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Du hast bereits teilgenommen' }, { status: 409 });
    }

    // Create response
    const responseResult = await pool.query(
      'INSERT INTO responses (survey_id) VALUES ($1) RETURNING id',
      [survey_id]
    );
    const responseId = responseResult.rows[0].id;

    // Insert answers
    if (answers && Array.isArray(answers)) {
      for (const a of answers) {
        await pool.query(
          'INSERT INTO response_answers (response_id, section, question_key, value_numeric, value_text) VALUES ($1, $2, $3, $4, $5)',
          [responseId, a.section, a.question_key, a.value_numeric || null, a.value_text || null]
        );
      }
    }

    // Record session
    await pool.query(
      'INSERT INTO open_access_sessions (survey_id, session_hash) VALUES ($1, $2)',
      [survey_id, sessionHash]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Open submit error:', err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
