
'use client';

import { useState, useEffect, use } from 'react';

const LIKERT = [
  { value: 5, label: 'Volle Zustimmung', dots: 5, color: '#16a34a', bg: '#dcfce7' },
  { value: 4, label: 'Eher ja', dots: 4, color: '#65a30d', bg: '#ecfccb' },
  { value: 3, label: 'Teils / teils', dots: 3, color: '#eab308', bg: '#fef9c3' },
  { value: 2, label: 'Eher nein', dots: 2, color: '#f97316', bg: '#fff7ed' },
  { value: 1, label: 'Eher nicht', dots: 1, color: '#ef4444', bg: '#fef2f2' },
  { value: 0, label: 'Keine Aussage', dots: 0, color: '#9e9a92', bg: '#f5f3ef' },
];

interface SurveyData {
  id: number;
  title: string;
  subtitle: string;
  agenda_items: { id: number; label: string; sort_order: number }[];
  zusammenarbeit_items: string[];
  numeric_items: { key: string; label: string; min: number; max: number }[];
  freitext_items: { key: string; label: string }[];
}

export default function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('loading');
  const [qIdx, setQIdx] = useState(0);
  const [agendaAnswers, setAgendaAnswers] = useState<(number | null)[]>([]);
  const [zusAnswers, setZusAnswers] = useState<(number | null)[]>([]);
  const [numAnswers, setNumAnswers] = useState<Record<string, number | null>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/surveys/token/' + token)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setPhase('error'); return; }
        setSurvey(data);
        setAgendaAnswers((data.agenda_items || []).map(() => null));
        setZusAnswers((data.zusammenarbeit_items || []).map(() => null));
        const nums: Record<string, number | null> = {};
        (data.numeric_items || []).forEach((n: any) => { nums[n.key] = null; });
        setNumAnswers(nums);
        const txts: Record<string, string> = {};
        (data.freitext_items || []).forEach((f: any) => { txts[f.key] = ''; });
        setTextAnswers(txts);
        setPhase('welcome');
      })
      .catch(() => { setError('Verbindungsfehler'); setPhase('error'); });
  }, [token]);

  async function handleSubmit() {
    if (!survey) return;
    setSubmitting(true);
    const answers: any[] = [];

    survey.agenda_items.forEach((item, i) => {
      answers.push({ section: 'agenda', question_key: String(item.id), value_numeric: agendaAnswers[i] || 0 });
    });
    survey.zusammenarbeit_items.forEach((_, i) => {
      answers.push({ section: 'zusammenarbeit', question_key: String(i), value_numeric: zusAnswers[i] || 0 });
    });
    Object.entries(numAnswers).forEach(([key, val]) => {
      answers.push({ section: 'numeric', question_key: key, value_numeric: val || 0 });
    });
    Object.entries(textAnswers).forEach(([key, val]) => {
      if (val) answers.push({ section: 'freitext', question_key: key, value_text: val });
    });

    try {
      const res = await fetch('/api/submit/' + token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setPhase('error'); return; }
      setPhase('done');
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setSubmitting(false);
    }
  }

  function goNext(nextPhase?: string, nextIdx?: number) {
    if (nextPhase) setPhase(nextPhase);
    if (nextIdx !== undefined) setQIdx(nextIdx);
  }

  function handleAgendaAnswer(val: number) {
    setAgendaAnswers(prev => prev.map((a, i) => i === qIdx ? val : a));
    setTimeout(() => {
      if (!survey) return;
      if (qIdx < survey.agenda_items.length - 1) goNext(undefined, qIdx + 1);
      else goNext('zus-intro', 0);
    }, 200);
  }

  function handleZusAnswer(val: number) {
    setZusAnswers(prev => prev.map((a, i) => i === qIdx ? val : a));
    setTimeout(() => {
      if (!survey) return;
      if (qIdx < survey.zusammenarbeit_items.length - 1) goNext(undefined, qIdx + 1);
      else goNext('num-intro', 0);
    }, 200);
  }

  if (phase === 'loading') return <div className="flex min-h-screen items-center justify-center text-sm text-dpsg-gray-400">Laden...</div>;
  if (phase === 'error') return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <div className="text-4xl mb-4">:(</div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    </div>
  );
  if (phase === 'done') return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L19 7"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-dpsg-gray-900">Danke!</h2>
        <p className="mt-1 text-sm text-dpsg-gray-500">Deine anonyme Rückmeldung wurde gespeichert.</p>
        <p className="mt-4 text-lg font-bold text-dpsg-blue">Gut Pfad!</p>
      </div>
    </div>
  );

  if (!survey) return null;

  // Total progress
  const total = survey.agenda_items.length + survey.zusammenarbeit_items.length + survey.numeric_items.length + 1;
  const done = agendaAnswers.filter(a => a !== null).length + zusAnswers.filter(a => a !== null).length
    + Object.values(numAnswers).filter(a => a !== null).length
    + (Object.values(textAnswers).some(v => v) ? 1 : 0);
  const progressPct = (done / total) * 100;

  const LikertButton = ({ opt, selected, onClick }: { opt: typeof LIKERT[0]; selected: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%', minHeight: 52,
      padding: '10px 16px', borderRadius: 14, boxSizing: 'border-box' as any,
      border: selected ? '2.5px solid ' + opt.color : '2px solid #e8e5df',
      backgroundColor: selected ? opt.bg : 'white', cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent', outline: 'none', textAlign: 'left' as any,
    }}>
      <div style={{ width: 40, display: 'flex', gap: 3, justifyContent: 'center' }}>
        {opt.dots === 0 ? <span style={{ fontSize: 18, color: opt.color, fontWeight: 700 }}>--</span> :
          Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: i < opt.dots ? opt.color : '#d4d0c8' }} />
          ))}
      </div>
      <span style={{ fontSize: 15, fontWeight: selected ? 700 : 500, color: selected ? opt.color : '#3d3a36' }}>
        {opt.label}
      </span>
      {selected && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}>
          <circle cx="12" cy="12" r="11" fill={opt.color} />
          <path d="M7 12.5l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );

  const NumButton = ({ n, selected, onClick, max }: { n: number; selected: boolean; onClick: () => void; max: number }) => {
    const pct = (n - 1) / (max - 1);
    const color = pct >= 0.8 ? '#16a34a' : pct >= 0.6 ? '#65a30d' : pct >= 0.4 ? '#eab308' : pct >= 0.2 ? '#f97316' : '#ef4444';
    return (
      <button onClick={onClick} style={{
        flex: 1, aspectRatio: '1', maxHeight: 56, minHeight: 44, borderRadius: 12,
        border: selected ? '3px solid ' + color : '2px solid #e8e5df',
        backgroundColor: selected ? color + '18' : 'white',
        color: selected ? color : '#3d3a36',
        fontSize: 18, fontWeight: 700, cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent', outline: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {n}
      </button>
    );
  };

  return (
    <div style={{ fontFamily: "'PT Sans Narrow', system-ui, sans-serif", background: '#faf9f6', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#003056', color: 'white' }}>
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{survey.title}</div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>{survey.subtitle}</div>
          </div>
          {phase !== 'welcome' && (
            <div style={{ textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {phase === 'agenda' ? 'Tagesordnung' : phase === 'zus' ? 'Zusammenarbeit' : phase === 'num' ? 'Bewertung' : 'Freitext'}
            </div>
          )}
        </div>
        <div style={{ height: 3, background: '#8b0a1e' }} />
        <div style={{ height: 3, background: '#1a1815' }}>
          <div style={{ height: '100%', background: '#16a34a', width: progressPct + '%', transition: 'width 0.3s', borderRadius: '0 2px 2px 0' }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: phase === 'welcome' || phase.includes('intro') ? 0 : '20px 20px 100px' }}>

        {/* Welcome */}
        {phase === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#003056', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="28" height="28" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 5 C50 5, 35 25, 35 40 C35 50, 42 55, 50 55 C58 55, 65 50, 65 40 C65 25, 50 5, 50 5Z M30 50 C20 55, 15 65, 20 75 C25 82, 35 80, 40 75 L50 60 L60 75 C65 80, 75 82, 80 75 C85 65, 80 55, 70 50 L50 65 Z M48 60 L48 95 L52 95 L52 60 Z"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>BL-O-Meter</h2>
            <p style={{ fontSize: 15, color: '#5c5850', margin: 0, lineHeight: 1.5 }}>Deine anonyme Rückmeldung. Ca. 4 Minuten.</p>
            <button onClick={() => goNext('agenda', 0)} style={{
              marginTop: 28, padding: '14px 36px', borderRadius: 12, background: '#003056', color: 'white',
              border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}>Los geht&apos;s</button>
            <div style={{ marginTop: 16, fontSize: 12, color: '#9e9a92', display: 'flex', alignItems: 'center', gap: 6 }}>
              Anonym &middot; Einmalig &middot; <a href="/datenschutz" style={{ color: '#003056', textDecoration: 'underline' }}>Datenschutz</a>
            </div>
          </div>
        )}

        {/* Section intros */}
        {phase === 'zus-intro' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, padding: '40px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Zusammenarbeit</h2>
            <p style={{ fontSize: 14, color: '#5c5850', marginTop: 8 }}>Wie bewertest du unsere Zusammenarbeit?</p>
            <button onClick={() => goNext('zus', 0)} style={{ marginTop: 24, padding: '12px 32px', borderRadius: 12, background: '#003056', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Weiter</button>
          </div>
        )}
        {phase === 'num-intro' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, padding: '40px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Bewertungen</h2>
            <p style={{ fontSize: 14, color: '#5c5850', marginTop: 8 }}>Noch ein paar Einschätzungen auf Zahlenskalen.</p>
            <button onClick={() => goNext('num', 0)} style={{ marginTop: 24, padding: '12px 32px', borderRadius: 12, background: '#003056', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Weiter</button>
          </div>
        )}

        {/* Agenda questions */}
        {phase === 'agenda' && (
          <div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {survey.agenda_items.map((_, i) => (
                <div key={i} style={{
                  width: i === qIdx ? 18 : 7, height: 7, borderRadius: 4, transition: 'all 0.2s',
                  backgroundColor: agendaAnswers[i] !== null ? (LIKERT.find(l => l.value === agendaAnswers[i])?.color || '#16a34a') : i === qIdx ? '#003056' : '#d4d0c8',
                }} />
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as any, letterSpacing: '0.08em', color: '#9e9a92', marginBottom: 6 }}>
                Thema {qIdx + 1} / {survey.agenda_items.length}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', lineHeight: 1.2 }}>
                {survey.agenda_items[qIdx]?.label}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LIKERT.map(opt => (
                  <LikertButton key={opt.value} opt={opt} selected={agendaAnswers[qIdx] === opt.value} onClick={() => handleAgendaAnswer(opt.value)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Zusammenarbeit questions */}
        {phase === 'zus' && (
          <div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 16, justifyContent: 'center' }}>
              {survey.zusammenarbeit_items.map((_, i) => (
                <div key={i} style={{
                  width: i === qIdx ? 18 : 7, height: 7, borderRadius: 4, transition: 'all 0.2s',
                  backgroundColor: zusAnswers[i] !== null ? (LIKERT.find(l => l.value === zusAnswers[i])?.color || '#16a34a') : i === qIdx ? '#003056' : '#d4d0c8',
                }} />
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', lineHeight: 1.3 }}>
                {survey.zusammenarbeit_items[qIdx]}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LIKERT.map(opt => (
                  <LikertButton key={opt.value} opt={opt} selected={zusAnswers[qIdx] === opt.value} onClick={() => handleZusAnswer(opt.value)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Numeric questions */}
        {phase === 'num' && (
          <div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as any, letterSpacing: '0.08em', color: '#9e9a92', marginBottom: 6 }}>
                Frage {qIdx + 1} / {survey.numeric_items.length}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', lineHeight: 1.3 }}>
                {survey.numeric_items[qIdx].label}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7a756c', marginBottom: 4 }}>
                <span>wenig</span><span>sehr</span>
              </div>
              {(() => {
                const item = survey.numeric_items[qIdx];
                const rows = item.max <= 5
                  ? [Array.from({ length: item.max - item.min + 1 }, (_, i) => item.min + i)]
                  : [Array.from({ length: 5 }, (_, i) => item.min + i), Array.from({ length: 5 }, (_, i) => item.min + 5 + i)];
                return rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    {row.map(n => (
                      <NumButton key={n} n={n} max={item.max}
                        selected={numAnswers[item.key] === n}
                        onClick={() => setNumAnswers(prev => ({ ...prev, [item.key]: n }))} />
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Freitext */}
        {phase === 'text' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Zum Schluss...</h3>
            {survey.freitext_items.map(item => (
              <div key={item.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#3d3a36', marginBottom: 6 }}>
                  {item.label}
                </label>
                <textarea value={textAnswers[item.key] || ''} onChange={e => setTextAnswers(prev => ({ ...prev, [item.key]: e.target.value }))}
                  rows={2} placeholder="Optional"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '2px solid #e8e5df', fontSize: 15, resize: 'vertical' as any, boxSizing: 'border-box' as any }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      {['num', 'text'].includes(phase) && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(transparent, #faf9f6 25%)', display: 'flex', gap: 10, zIndex: 10,
        }}>
          {phase === 'num' && (
            <button onClick={() => {
              if (qIdx < survey.numeric_items.length - 1) goNext(undefined, qIdx + 1);
              else goNext('text', 0);
            }}
              disabled={numAnswers[survey.numeric_items[qIdx]?.key] === null}
              style={{
                flex: 1, height: 50, borderRadius: 14,
                background: numAnswers[survey.numeric_items[qIdx]?.key] !== null ? '#003056' : '#d4d0c8',
                color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}>
              Weiter
            </button>
          )}
          {phase === 'text' && (
            <button onClick={handleSubmit} disabled={submitting} style={{
              flex: 1, height: 50, borderRadius: 14, background: '#8b0a1e',
              color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}>
              {submitting ? 'Senden...' : 'Absenden'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
