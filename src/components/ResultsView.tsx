
'use client';

import { useState, useMemo } from 'react';
import { BarChart3, Users, Hash, MessageSquare } from 'lucide-react';

const LIKERT_OPTIONS = [
  { value: 5, label: 'volle Zustimmung', color: '#16a34a' },
  { value: 4, label: 'eher ja', color: '#65a30d' },
  { value: 3, label: 'teils/teils', color: '#eab308' },
  { value: 2, label: 'eher nein', color: '#f97316' },
  { value: 1, label: 'eher nicht', color: '#ef4444' },
  { value: 0, label: 'keine Aussage', color: '#9e9a92' },
];

function avg(arr: number[]): number {
  const valid = arr.filter(v => v > 0);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

function likertColor(val: number): string {
  if (val >= 4.5) return '#16a34a';
  if (val >= 3.5) return '#65a30d';
  if (val >= 2.5) return '#eab308';
  if (val >= 1.5) return '#f97316';
  return '#ef4444';
}

function LikertBar({ label, responses }: { label: string; responses: number[] }) {
  const counts = [0, 0, 0, 0, 0, 0];
  responses.forEach(v => { if (v >= 0 && v <= 5) counts[v]++; });
  const total = responses.length;
  const mean = avg(responses);

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-dpsg-gray-900">{label}</span>
        <span className="rounded-md px-2 py-0.5 text-xs font-bold"
          style={{ color: likertColor(mean), backgroundColor: likertColor(mean) + '15' }}>
          {mean > 0 ? 'Ø ' + mean.toFixed(1) : '--'}
        </span>
      </div>
      <div className="flex h-5 gap-0.5 overflow-hidden rounded-md">
        {LIKERT_OPTIONS.slice().reverse().map((opt, i) => {
          const count = counts[opt.value];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return pct > 0 ? (
            <div key={i} className="flex items-center justify-center text-xs font-bold text-white"
              title={opt.label + ': ' + count + 'x'}
              style={{ width: pct + '%', backgroundColor: opt.color, minWidth: 2 }}>
              {pct > 14 && count}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

function NumericGauge({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color = value / max > 0.7 ? '#16a34a' : value / max > 0.4 ? '#eab308' : '#f97316';
  return (
    <div className="text-center" style={{ minWidth: 100 }}>
      <div className="relative mx-auto" style={{ width: 80, height: 80 }}>
        <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e8e5df" strokeWidth="8" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={pct * 2.136 + ' 213.6'} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-dpsg-gray-900">
          {value > 0 ? value.toFixed(1) : '--'}
        </div>
      </div>
      <div className="mt-1.5 text-xs text-dpsg-gray-600">{label}</div>
      <div className="text-xs text-dpsg-gray-400">von {max}</div>
    </div>
  );
}

interface ResultsData {
  survey: any;
  responses: any[];
}

export default function ResultsView({ data }: { data: ResultsData }) {
  const [tab, setTab] = useState('agenda');
  const { survey, responses } = data;

  const agendaItems = survey.agenda_items || [];
  const zusammenarbeitItems = survey.zusammenarbeit_items || [];
  const numericItems = survey.numeric_items || [];
  const freitextItems = survey.freitext_items || [];

  // Parse answers per section
  const parsed = useMemo(() => {
    const agenda: Record<string, number[]> = {};
    const zusammenarbeit: Record<string, number[]> = {};
    const numeric: Record<string, number[]> = {};
    const freitext: Record<string, string[]> = {};

    for (const r of responses) {
      const answers = r.answers || [];
      for (const a of answers) {
        const key = a.section + ':' + a.question_key;
        if (a.section === 'agenda') {
          if (!agenda[a.question_key]) agenda[a.question_key] = [];
          agenda[a.question_key].push(a.value_numeric || 0);
        } else if (a.section === 'zusammenarbeit') {
          if (!zusammenarbeit[a.question_key]) zusammenarbeit[a.question_key] = [];
          zusammenarbeit[a.question_key].push(a.value_numeric || 0);
        } else if (a.section === 'numeric') {
          if (!numeric[a.question_key]) numeric[a.question_key] = [];
          numeric[a.question_key].push(a.value_numeric || 0);
        } else if (a.section === 'freitext') {
          if (!freitext[a.question_key]) freitext[a.question_key] = [];
          if (a.value_text) freitext[a.question_key].push(a.value_text);
        }
      }
    }

    return { agenda, zusammenarbeit, numeric, freitext };
  }, [responses]);

  const tabs = [
    { key: 'agenda', label: 'Tagesordnung', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: 'zusammenarbeit', label: 'Zusammenarbeit', icon: <Users className="h-3.5 w-3.5" /> },
    { key: 'bewertung', label: 'Bewertung', icon: <Hash className="h-3.5 w-3.5" /> },
    { key: 'freitext', label: 'Freitext', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-dpsg-gray-100 p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all '
              + (tab === t.key
                ? 'bg-white text-dpsg-blue shadow-sm'
                : 'text-dpsg-gray-500 hover:text-dpsg-gray-700')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-dpsg-gray-200 bg-white p-6">
        {tab === 'agenda' && (
          <div>
            <h3 className="mb-4 text-sm font-bold text-dpsg-gray-900">
              Beitrag zum Weiterkommen des Verbands
            </h3>
            {agendaItems
              .sort((a: any, b: any) => {
                const aAvg = avg(parsed.agenda[String(a.id)] || []);
                const bAvg = avg(parsed.agenda[String(b.id)] || []);
                return bAvg - aAvg;
              })
              .map((item: any) => (
                <LikertBar key={item.id} label={item.label}
                  responses={parsed.agenda[String(item.id)] || []} />
              ))}
          </div>
        )}

        {tab === 'zusammenarbeit' && (
          <div>
            <h3 className="mb-4 text-sm font-bold text-dpsg-gray-900">
              Zusammenarbeit an diesem Wochenende
            </h3>
            {zusammenarbeitItems.map((item: string, i: number) => (
              <LikertBar key={i} label={item}
                responses={parsed.zusammenarbeit[String(i)] || []} />
            ))}
          </div>
        )}

        {tab === 'bewertung' && (
          <div>
            <h3 className="mb-5 text-sm font-bold text-dpsg-gray-900">Numerische Bewertungen</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {numericItems.map((item: any) => (
                <NumericGauge key={item.key}
                  value={avg(parsed.numeric[item.key] || [])}
                  max={item.max} label={item.label} />
              ))}
            </div>
          </div>
        )}

        {tab === 'freitext' && (
          <div className="space-y-6">
            {freitextItems.map((item: any) => {
              const texts = parsed.freitext[item.key] || [];
              return (
                <div key={item.key}>
                  <h4 className="mb-2 text-sm font-bold text-dpsg-gray-900">{item.label}</h4>
                  {item.key === 'themen' && texts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        const counts: Record<string, number> = {};
                        texts.flatMap((t: string) => t.split(',').map(s => s.trim().toLowerCase())).filter(Boolean)
                          .forEach((w: string) => { counts[w] = (counts[w] || 0) + 1; });
                        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                        const max = sorted[0]?.[1] || 1;
                        return sorted.map(([word, count], i) => (
                          <span key={i} className="rounded-md px-2 py-1"
                            style={{
                              fontSize: 12 + (count / max) * 8,
                              fontWeight: count > 1 ? 700 : 500,
                              color: '#003056',
                              opacity: 0.5 + (count / max) * 0.5,
                              backgroundColor: 'rgba(0,48,86,' + (0.05 + (count / max) * 0.08) + ')',
                            }}>
                            {word} {count > 1 && <sup>{count}</sup>}
                          </span>
                        ));
                      })()}
                    </div>
                  ) : texts.length > 0 ? (
                    <div className="space-y-1">
                      {texts.map((t: string, i: number) => (
                        <div key={i} className="rounded-lg bg-dpsg-gray-50 px-3 py-2 text-sm text-dpsg-gray-700">
                          &ldquo;{t}&rdquo;
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-dpsg-gray-400">Keine Antworten</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
