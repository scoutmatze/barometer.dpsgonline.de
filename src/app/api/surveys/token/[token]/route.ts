
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const result = await pool.query(`
      SELECT t.id as token_id, t.used_at, s.id, s.title, s.subtitle, s.status,
        s.zusammenarbeit_items, s.numeric_items, s.freitext_items,
        (SELECT json_agg(json_build_object('id', a.id, 'label', a.label, 'sort_order', a.sort_order)
          ORDER BY a.sort_order)
          FROM survey_agenda_items a WHERE a.survey_id = s.id) as agenda_items
      FROM survey_tokens t
      JOIN surveys s ON s.id = t.survey_id
      WHERE t.token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ungültiger Link' }, { status: 404 });
    }

    const row = result.rows[0];

    if (row.status !== 'active') {
      return NextResponse.json({ error: 'Diese Umfrage ist nicht mehr aktiv' }, { status: 410 });
    }

    if (row.used_at) {
      return NextResponse.json({ error: 'Du hast bereits teilgenommen' }, { status: 409 });
    }

    return NextResponse.json({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      agenda_items: row.agenda_items || [],
      zusammenarbeit_items: row.zusammenarbeit_items || [],
      numeric_items: row.numeric_items || [],
      freitext_items: row.freitext_items || [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
