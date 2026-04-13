
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Users, Hash, ChevronDown } from 'lucide-react';

interface SurveyData {
  id: number;
  title: string;
  subtitle: string;
  survey_date: string;
  response_count: number;
  zusammenarbeit_items: string[];
  numeric_items: { key: string; label: string; min: number; max: number }[];
  agenda_items: { id: number; label: string }[] | null;
  averages: { section: string; question_key: string; avg_value: number; valid_count: number }[];
}

function likertColor(val: number): string {
  if (val >= 4.5) return '#16a34a';
  if (val >= 3.5) return '#65a30d';
  if (val >= 2.5) return '#eab308';
  if (val >= 1.5) return '#f97316';
  return '#ef4444';
}

function TrendLine({ data, max, height = 180 }: { data: { label: string; value: number }[]; max: number; height?: number }) {
  if (data.length === 0) return null;

  const pointSpacing = 56;
  const w = Math.max(data.length * pointSpacing + 40, 400);
  const h = height;
  const padding = { top: 24, bottom: 48, left: 20, right: 30 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
    y: padding.top + chartH - (d.value > 0 ? (d.value / max) * chartH : 0),
    value: d.value,
    label: d.label,
  }));

  const pathD = points.filter(p => p.value > 0).map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');

  const validPoints = points.filter(p => p.value > 0);
  const trend = validPoints.length >= 2
    ? validPoints[validPoints.length - 1].value - validPoints[0].value
    : 0;

  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <svg width={w} height={h} viewBox={'0 0 ' + w + ' ' + h}>
        {/* Grid lines with labels */}
        {[1, 2, 3, 4, 5].filter(v => v <= max).map((v) => {
          const y = padding.top + chartH - (v / max) * chartH;
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke="#e8e5df" strokeWidth="1" />
              <text x={padding.left - 4} y={y + 4} textAnchor="end" fontSize="10" fill="#9e9a92">{v}</text>
            </g>
          );
        })}

        {/* Connecting line */}
        <path d={pathD} fill="none" stroke="#003056" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={p.value > 0 ? likertColor(p.value) : '#d4d0c8'} stroke="white" strokeWidth="2" />
            {p.value > 0 && (
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill={likertColor(p.value)} fontFamily="'PT Sans Narrow', sans-serif">
                {p.value.toFixed(1)}
              </text>
            )}
            {/* X-axis labels - rotated */}
            <text x={p.x} y={h - padding.bottom + 16} textAnchor="middle" fontSize="11" fill="#5c5850" fontWeight="600" fontFamily="'PT Sans Narrow', sans-serif">
              {p.label.replace('BL ', '')}
            </text>
            {/* Year below */}
            {(() => {
              const yearMatch = p.label.match(/\/(\d{4})/);
              const prevYear = i > 0 ? data[i-1].label.match(/\/(\d{4})/)?.[1] : null;
              const year = yearMatch?.[1];
              if (year && year !== prevYear) {
                return <text x={p.x} y={h - padding.bottom + 30} textAnchor="middle" fontSize="10" fill="#9e9a92" fontFamily="'PT Sans Narrow', sans-serif">{year}</text>;
              }
              return null;
            })()}
          </g>
        ))}

        {/* Trend indicator */}
        {trend !== 0 && (
          <g>
            <rect x={w - 58} y={2} width={52} height={22} rx="6" fill={trend > 0 ? '#dcfce7' : '#fef2f2'} />
            <text x={w - 32} y={17} textAnchor="middle" fontSize="13" fontWeight="700"
              fill={trend > 0 ? '#16a34a' : trend < -0.3 ? '#ef4444' : '#eab308'}
              fontFamily="'PT Sans Narrow', sans-serif">
              {trend > 0 ? '\u2191' : '\u2193'} {Math.abs(trend).toFixed(1)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function OverallGauge({ label, values, max }: { label: string; values: { label: string; value: number }[]; max: number }) {
  const validValues = values.filter(v => v.value > 0);
  const currentAvg = validValues.length > 0 ? validValues[validValues.length - 1].value : 0;

  return (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid #d4d0c8',
      padding: '16px 16px 8px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1815' }}>{label}</span>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: likertColor(currentAvg),
          background: likertColor(currentAvg) + '15',
          padding: '2px 8px', borderRadius: 8,
        }}>
          {currentAvg > 0 ? '\u00D8 ' + currentAvg.toFixed(1) : '--'}
        </span>
      </div>
      <TrendLine data={values} max={max} height={160} />
    </div>
  );
}

export default function VergleichPage() {
  const router = useRouter();
  const [data, setData] = useState<SurveyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('zusammenarbeit');

  useEffect(() => {
    fetch('/api/surveys/compare')
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  // Build zusammenarbeit trend data
  const zusammenarbeitTrends = useMemo(() => {
    if (data.length === 0) return [];
    const items = data[data.length - 1]?.zusammenarbeit_items || [];
    return items.map((item: string, idx: number) => ({
      label: item,
      values: data.map(s => ({
        label: s.title,
        value: (() => {
          const avg = s.averages.find(a => a.section === 'zusammenarbeit' && a.question_key === String(idx));
          return avg ? Number(avg.avg_value) : 0;
        })(),
      })),
    }));
  }, [data]);

  // Build numeric trend data
  const numericTrends = useMemo(() => {
    if (data.length === 0) return [];
    const items = data[data.length - 1]?.numeric_items || [];
    return items.map((item: any) => ({
      label: item.label,
      max: item.max,
      key: item.key,
      values: data.map(s => ({
        label: s.title,
        value: (() => {
          const avg = s.averages.find(a => a.section === 'numeric' && a.question_key === item.key);
          return avg ? Number(avg.avg_value) : 0;
        })(),
      })),
    }));
  }, [data]);

  // Overall averages per survey
  const overallTrend = useMemo(() => {
    return data.map(s => {
      const zusAvgs = s.averages
        .filter(a => a.section === 'zusammenarbeit' && Number(a.avg_value) > 0)
        .map(a => Number(a.avg_value));
      const avg = zusAvgs.length > 0 ? zusAvgs.reduce((a, b) => a + b, 0) / zusAvgs.length : 0;
      return { label: s.title, value: avg, count: Number(s.response_count) };
    });
  }, [data]);

  const tabs = [
    { key: 'zusammenarbeit', label: 'Zusammenarbeit', icon: <Users className="h-3.5 w-3.5" /> },
    { key: 'bewertung', label: 'Bewertung', icon: <Hash className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <button onClick={() => router.back()} className="opacity-70 hover:opacity-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="text-base font-bold">Zeitvergleich</div>
            <div className="text-xs opacity-50">{data.length} Sitzungen &middot; Trends über Zeit</div>
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <div className="py-20 text-center text-sm text-dpsg-gray-400">Laden...</div>
        ) : (
          <>
            {/* Overall trend card */}
            <div className="mb-6 rounded-xl border border-dpsg-gray-200 bg-white p-5">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-dpsg-blue" />
                <h3 className="text-sm font-bold text-dpsg-gray-900">Gesamtentwicklung Zusammenarbeit</h3>
              </div>
              <p className="mb-4 text-xs text-dpsg-gray-500">
                Durchschnitt aller Zusammenarbeit-Fragen pro Sitzung
              </p>
              <TrendLine data={overallTrend} max={5} height={200} />
              {/* Response counts */}
              <div className="mt-2 flex gap-1 overflow-x-auto">
                {overallTrend.map((d, i) => (
                  <div key={i} className="shrink-0 text-center" style={{ minWidth: 40 }}>
                    <span className="text-xs text-dpsg-gray-400">{d.count}x</span>
                  </div>
                ))}
              </div>
            </div>

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

            {/* Zusammenarbeit trends */}
            {tab === 'zusammenarbeit' && (
              <div>
                {zusammenarbeitTrends.map((item, i) => (
                  <OverallGauge key={i} label={item.label} values={item.values} max={5} />
                ))}
              </div>
            )}

            {/* Numeric trends */}
            {tab === 'bewertung' && (
              <div>
                {numericTrends.map((item, i) => (
                  <OverallGauge key={i} label={item.label} values={item.values} max={item.max} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
