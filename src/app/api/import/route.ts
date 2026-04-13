import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    await requireUser(['ADMIN']);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const surveyDate = formData.get('survey_date') as string;

    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (rows.length < 2) return NextResponse.json({ error: 'Keine Daten' }, { status: 400 });

    const headers = rows[0] as string[];

    // Parse header structure from Forms export
    const agendaPrefix = 'Wie sehr haben wir bei folgenden Themen';
    const zusammenarbeitPrefix = 'Wie bewertest du unsere Zusammenarbeit';

    const agendaCols: { col: number; label: string }[] = [];
    const zusammenarbeitCols: { col: number; label: string }[] = [];
    const numericCols: { col: number; key: string }[] = [];
    const freitextCols: { col: number; key: string }[] = [];

    headers.forEach((h, i) => {
      if (!h) return;
      const hs = String(h);
      if (hs.startsWith(agendaPrefix)) {
        const dotIdx = hs.indexOf('.', agendaPrefix.length);
        const label = dotIdx >= 0 ? hs.substring(dotIdx + 1).trim() : hs;
        agendaCols.push({ col: i, label });
      } else if (hs.startsWith(zusammenarbeitPrefix)) {
        const dotIdx = hs.indexOf('.', zusammenarbeitPrefix.length);
        const label = dotIdx >= 0 ? hs.substring(dotIdx + 1).trim() : hs;
        zusammenarbeitCols.push({ col: i, label });
      } else if (hs === 'strategisch' || hs === 'operativ') {
        numericCols.push({ col: i, key: hs });
      } else if (hs.includes('Mehrwert')) {
        numericCols.push({ col: i, key: 'mehrwert' });
      } else if (hs.includes('persoenlichen Entwicklungsziele') || hs.includes('persönlichen Entwicklungsziele')) {
        numericCols.push({ col: i, key: 'entwicklung' });
      } else if (hs.includes('Aufgaben gut zu bew') || hs.includes('Aufgaben gut zu bewältigen')) {
        numericCols.push({ col: i, key: 'belastung' });
      } else if (hs.includes('besonders gelungen')) {
        freitextCols.push({ col: i, key: 'gelungen' });
      } else if (hs.includes('3 Themen') || hs.includes('Monaten')) {
        freitextCols.push({ col: i, key: 'themen' });
      } else if (hs.includes('loswerden') || hs.includes('ausserdem') || hs.includes('außerdem')) {
        freitextCols.push({ col: i, key: 'sonstiges' });
      }
    });

    // Get default template
    const tmplResult = await pool.query('SELECT * FROM templates WHERE is_default = true LIMIT 1');
    const tmpl = tmplResult.rows[0];

    // Create survey
    const surveyResult = await pool.query(`
      INSERT INTO surveys (title, subtitle, survey_date, template_id, status, zusammenarbeit_items, numeric_items, freitext_items, closed_at)
      VALUES ($1, $2, $3, $4, 'closed', $5, $6, $7, NOW())
      RETURNING id
    `, [
      title || 'Importiert',
      subtitle || '',
      surveyDate || null,
      tmpl?.id || null,
      JSON.stringify(tmpl?.zusammenarbeit_items || []),
      JSON.stringify(tmpl?.numeric_items || []),
      JSON.stringify(tmpl?.freitext_items || []),
    ]);
    const surveyId = surveyResult.rows[0].id;

    // Insert agenda items and store their DB ids
    const agendaDbIds: number[] = [];
    for (let i = 0; i < agendaCols.length; i++) {
      const aiResult = await pool.query(
        'INSERT INTO survey_agenda_items (survey_id, label, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [surveyId, agendaCols[i].label, i]
      );
      agendaDbIds.push(aiResult.rows[0].id);
    }

    // Likert mapping
    const likertMap: Record<string, number> = {
      'volle Zustimmung': 5, 'volle zustimmung': 5,
      'eher ja': 4,
      'teils/teils': 3, 'teils': 3,
      'eher nein': 2,
      'eher nicht': 1,
      'keine Aussage': 0, 'keine aussage': 0,
    };

    // Import each response row
    const dataRows = rows.slice(1);
    let imported = 0;

    for (const row of dataRows) {
      if (!row || row.length < 5) continue;

      const responseResult = await pool.query(
        'INSERT INTO responses (survey_id) VALUES ($1) RETURNING id',
        [surveyId]
      );
      const responseId = responseResult.rows[0].id;

      // Agenda answers
      for (let ai = 0; ai < agendaCols.length; ai++) {
        const val = row[agendaCols[ai].col];
        const numVal = val ? (likertMap[String(val).trim().toLowerCase()] ?? 0) : 0;
        await pool.query(
          'INSERT INTO response_answers (response_id, section, question_key, value_numeric) VALUES ($1, $2, $3, $4)',
          [responseId, 'agenda', String(agendaDbIds[ai]), numVal]
        );
      }

      // Zusammenarbeit answers
      for (let i = 0; i < zusammenarbeitCols.length; i++) {
        const val = row[zusammenarbeitCols[i].col];
        const numVal = val ? (likertMap[String(val).trim().toLowerCase()] ?? 0) : 0;
        await pool.query(
          'INSERT INTO response_answers (response_id, section, question_key, value_numeric) VALUES ($1, $2, $3, $4)',
          [responseId, 'zusammenarbeit', String(i), numVal]
        );
      }

      // Numeric answers
      for (const nc of numericCols) {
        const val = Number(row[nc.col]) || 0;
        await pool.query(
          'INSERT INTO response_answers (response_id, section, question_key, value_numeric) VALUES ($1, $2, $3, $4)',
          [responseId, 'numeric', nc.key, val]
        );
      }

      // Freitext answers
      for (const fc of freitextCols) {
        const val = row[fc.col] ? String(row[fc.col]).trim() : '';
        if (val) {
          await pool.query(
            'INSERT INTO response_answers (response_id, section, question_key, value_text) VALUES ($1, $2, $3, $4)',
            [responseId, 'freitext', fc.key, val]
          );
        }
      }

      imported++;
    }

    return NextResponse.json({ ok: true, surveyId, imported });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: 'Import fehlgeschlagen' }, { status: 500 });
  }
}
