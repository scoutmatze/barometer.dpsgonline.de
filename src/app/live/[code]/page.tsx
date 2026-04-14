
'use client';
import { useState, useEffect, use, useCallback } from 'react';

const WEATHER = [
  { value: 1, label: 'Sonnig', icon: '\u2600\ufe0f', desc: 'Mir geht es richtig gut!', color: '#f59e0b', bg: '#fef3c7', border: '#fbbf24' },
  { value: 2, label: 'Leicht bewölkt', icon: '\u26c5', desc: 'Weitgehend gut', color: '#84cc16', bg: '#ecfccb', border: '#a3e635' },
  { value: 3, label: 'Bewölkt', icon: '\u2601\ufe0f', desc: 'Geht so', color: '#9e9a92', bg: '#f5f3ef', border: '#d4d0c8' },
  { value: 4, label: 'Regnerisch', icon: '\ud83c\udf27\ufe0f', desc: 'Nicht so gut', color: '#3b82f6', bg: '#dbeafe', border: '#60a5fa' },
  { value: 5, label: 'Gewittrig', icon: '\u26c8\ufe0f', desc: 'Ich brauche Unterstützung', color: '#7c3aed', bg: '#ede9fe', border: '#8b5cf6' },
];

function getFingerprint() {
  let fp = '';
  try { fp = localStorage.getItem('blometer-fp') || ''; } catch {}
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem('blometer-fp', fp); } catch {}
  }
  return fp;
}

function OpenQAResponses({ activityId, fp }: { activityId: number; fp: string }) {
  const [responses, setResponses] = useState<any[]>([]);
  const [voted, setVoted] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const poll = () => {
      fetch('/api/live/' + activityId + '/responses')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setResponses(d); })
        .catch(() => {});
    };
    poll();
    const i = setInterval(poll, 3000);
    return () => clearInterval(i);
  }, [activityId]);

  async function upvote(responseId: number) {
    if (voted[responseId]) return;
    await fetch('/api/live/upvote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_id: responseId, fingerprint: fp }),
    });
    setVoted(prev => ({ ...prev, [responseId]: true }));
  }

  if (responses.length === 0) return null;

  return (
    <div style={{ borderTop: '1px solid #e8e5df', paddingTop: 12 }}>
      <p style={{ fontSize: 12, color: '#9e9a92', marginBottom: 8 }}>Bisherige Vorschläge — tippe zum Hochvoten:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {responses
          .sort((a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0))
          .map((r: any) => (
            <button key={r.id} onClick={() => upvote(r.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', borderRadius: 10,
                border: voted[r.id] ? '2px solid #003056' : '1px solid #e8e5df',
                background: voted[r.id] ? 'rgba(0,48,86,0.05)' : '#f5f3ef',
                cursor: 'pointer', textAlign: 'left' as any,
                WebkitTapHighlightColor: 'transparent',
              }}>
              <span style={{
                minWidth: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: voted[r.id] ? '#003056' : '#e8e5df',
                color: voted[r.id] ? 'white' : '#5c5850',
                fontSize: 13, fontWeight: 700,
              }}>{r.upvotes || 0}</span>
              <span style={{ fontSize: 15, color: '#1a1815' }}>{r.value_text}</span>
            </button>
          ))}
      </div>
    </div>
  );
}

export default function LiveParticipant({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [weatherComment, setWeatherComment] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [sending, setSending] = useState(false);
  const fp = typeof window !== 'undefined' ? getFingerprint() : '';

  const fetchSession = useCallback(() => {
    fetch('/api/live/join/' + code).then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); return; }
      setSession(d);
    }).catch(() => setError('Verbindungsfehler'));
  }, [code]);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { const i = setInterval(fetchSession, 4000); return () => clearInterval(i); }, [fetchSession]);

  async function submitResponse(activityId: number, valueNumeric?: number, valueText?: string) {
    setSending(true);
    try {
      await fetch('/api/live/respond', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId, value_numeric: valueNumeric, value_text: valueText, fingerprint: fp }),
      });
      setSubmitted(prev => ({ ...prev, [activityId]: true }));
    } catch {}
    setSending(false);
  }

  if (error) return (
    <div style={{ fontFamily: "'PT Sans Narrow', system-ui, sans-serif", minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <p style={{ fontSize: 16, color: '#ef4444' }}>{error}</p>
      </div>
    </div>
  );

  if (!session) return (
    <div style={{ fontFamily: "'PT Sans Narrow', system-ui, sans-serif", minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 14, color: '#9e9a92' }}>Laden...</p>
    </div>
  );

  const openActivities = (session.activities || []).filter((a: any) => a.status === 'open');
  const closedActivities = (session.activities || []).filter((a: any) => a.status === 'closed');

  return (
    <div style={{ fontFamily: "'PT Sans Narrow', system-ui, sans-serif", background: '#faf9f6', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      <link href="https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#003056', color: 'white', padding: '14px 20px' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{session.title}</div>
        <div style={{ fontSize: 11, opacity: 0.5 }}>{session.subtitle || 'Live-Session'}</div>
      </div>
      <div style={{ height: 3, background: '#8b0a1e' }} />

      <div style={{ padding: '16px 16px 80px' }}>
        {openActivities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>&#9203;</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1815' }}>Warte auf die n&#228;chste Aktivit&#228;t...</p>
            <p style={{ fontSize: 13, color: '#7a756c', marginTop: 4 }}>Die Seite aktualisiert sich automatisch.</p>
          </div>
        )}

        {openActivities.map((act: any) => (
          <div key={act.id} style={{ marginBottom: 16 }}>
            {/* === WEATHER CHECK === */}
            {act.type === 'weather' && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1815', margin: '0 0 4px' }}>{act.title}</h3>
                <p style={{ fontSize: 13, color: '#7a756c', margin: '0 0 16px' }}>Tippe auf dein aktuelles Wetter</p>

                {submitted[act.id] ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>&#10003;</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>Danke! Dein Wetter wurde gespeichert.</p>
                    <p style={{ fontSize: 12, color: '#9e9a92', marginTop: 4 }}>Du kannst deine Antwort jederzeit &#228;ndern.</p>
                    <button onClick={() => setSubmitted(prev => ({ ...prev, [act.id]: false }))}
                      style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, border: '1px solid #d4d0c8', background: 'white', fontSize: 13, cursor: 'pointer' }}>
                      Antwort &#228;ndern
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {WEATHER.map(w => (
                        <button key={w.value} onClick={() => submitResponse(act.id, w.value, weatherComment || undefined)}
                          disabled={sending}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            width: '100%', minHeight: 64, padding: '12px 16px',
                            borderRadius: 14, border: '2px solid ' + w.border,
                            backgroundColor: w.bg, cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                          }}>
                          <span style={{ fontSize: 32, lineHeight: 1 }}>{w.icon}</span>
                          <div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: w.color }}>{w.label}</div>
                            <div style={{ fontSize: 12, color: '#5c5850' }}>{w.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <textarea value={weatherComment} onChange={e => setWeatherComment(e.target.value)}
                        placeholder="M&#246;chtest du noch etwas loswerden? (optional)"
                        rows={2} style={{
                          width: '100%', padding: '10px 14px', borderRadius: 12,
                          border: '2px solid #e8e5df', fontSize: 14, resize: 'vertical',
                          boxSizing: 'border-box',
                        }} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* === WORD CLOUD === */}
            {act.type === 'wordcloud' && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1815', margin: '0 0 4px' }}>{act.title}</h3>
                <p style={{ fontSize: 13, color: '#7a756c', margin: '0 0 16px' }}>Gib ein Wort oder einen kurzen Begriff ein</p>

                {submitted[act.id] ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>&#10003;</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>Dein Beitrag wurde gespeichert!</p>
                    <button onClick={() => setSubmitted(prev => ({ ...prev, [act.id]: false }))}
                      style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, border: '1px solid #d4d0c8', background: 'white', fontSize: 13, cursor: 'pointer' }}>
                      Antwort &#228;ndern
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={wordInput} onChange={e => setWordInput(e.target.value)}
                      placeholder="z.B. Vorfreude, Teamgeist..."
                      onKeyDown={e => { if (e.key === 'Enter' && wordInput.trim()) submitResponse(act.id, undefined, wordInput.trim()); }}
                      style={{
                        flex: 1, padding: '12px 14px', borderRadius: 12,
                        border: '2px solid #e8e5df', fontSize: 16,
                        boxSizing: 'border-box',
                      }} />
                    <button onClick={() => { if (wordInput.trim()) submitResponse(act.id, undefined, wordInput.trim()); }}
                      disabled={!wordInput.trim() || sending}
                      style={{
                        padding: '12px 20px', borderRadius: 12,
                        background: wordInput.trim() ? '#003056' : '#d4d0c8',
                        color: 'white', border: 'none', fontSize: 15, fontWeight: 700,
                        cursor: 'pointer',
                      }}>
                      &#10148;
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* === POLL with custom options === */}
            {act.type === 'poll' && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 16px' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1815', margin: '0 0 4px' }}>{act.title}</h3>
                <p style={{ fontSize: 13, color: '#7a756c', margin: '0 0 16px' }}>Wähle eine Option</p>
                {submitted[act.id] ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>&#10003;</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>Abgestimmt!</p>
                    <button onClick={() => setSubmitted(prev => ({ ...prev, [act.id]: false }))}
                      style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, border: '1px solid #d4d0c8', background: 'white', fontSize: 13, cursor: 'pointer' }}>
                      Antwort ändern
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(act.config?.options || ['Ja', 'Nein']).map((opt: string, oi: number) => (
                      <button key={oi} onClick={() => submitResponse(act.id, oi, opt)} disabled={sending}
                        style={{
                          width: '100%', minHeight: 52, padding: '12px 16px', borderRadius: 14,
                          border: '2px solid #d4d0c8', background: 'white', cursor: 'pointer',
                          fontSize: 16, fontWeight: 600, color: '#1a1815', textAlign: 'left',
                          WebkitTapHighlightColor: 'transparent',
                        }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* === SCALE === */}
            {act.type === 'scale' && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 16px' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1815', margin: '0 0 4px' }}>{act.title}</h3>
                <p style={{ fontSize: 13, color: '#7a756c', margin: '0 0 16px' }}>Wähle einen Wert</p>
                {submitted[act.id] ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>&#10003;</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>Gespeichert!</p>
                    <button onClick={() => setSubmitted(prev => ({ ...prev, [act.id]: false }))}
                      style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, border: '1px solid #d4d0c8', background: 'white', fontSize: 13, cursor: 'pointer' }}>
                      Antwort ändern
                    </button>
                  </div>
                ) : (() => {
                  const max = act.config?.max || 10;
                  const min = act.config?.min || 1;
                  const rows = max <= 5
                    ? [Array.from({ length: max - min + 1 }, (_, i) => min + i)]
                    : [Array.from({ length: 5 }, (_, i) => min + i), Array.from({ length: max - 5 }, (_, i) => min + 5 + i)];
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7a756c', marginBottom: 6, padding: '0 4px' }}>
                        <span>wenig</span><span>sehr</span>
                      </div>
                      {rows.map((row, ri) => (
                        <div key={ri} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                          {row.map(n => {
                            const pct = (n - min) / (max - min);
                            const color = pct >= 0.8 ? '#16a34a' : pct >= 0.6 ? '#65a30d' : pct >= 0.4 ? '#eab308' : pct >= 0.2 ? '#f97316' : '#ef4444';
                            return (
                              <button key={n} onClick={() => submitResponse(act.id, n)} disabled={sending}
                                style={{
                                  flex: 1, aspectRatio: '1', maxHeight: 56, minHeight: 44, borderRadius: 12,
                                  border: '2px solid #e8e5df', background: 'white', color: '#3d3a36',
                                  fontSize: 18, fontWeight: 700, cursor: 'pointer',
                                  WebkitTapHighlightColor: 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                {n}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* === OPEN Q&A === */}
            {act.type === 'openqa' && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e5df', padding: '20px 16px' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1815', margin: '0 0 4px' }}>{act.title}</h3>
                <p style={{ fontSize: 13, color: '#7a756c', margin: '0 0 16px' }}>Schreib deinen Vorschlag — du kannst mehrere einreichen</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input value={wordInput} onChange={e => setWordInput(e.target.value)}
                    placeholder="Dein Vorschlag..."
                    onKeyDown={e => { if (e.key === 'Enter' && wordInput.trim()) { submitResponse(act.id, undefined, wordInput.trim()); setWordInput(''); }}}
                    style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '2px solid #e8e5df', fontSize: 16, boxSizing: 'border-box' as any }} />
                  <button onClick={() => { if (wordInput.trim()) { submitResponse(act.id, undefined, wordInput.trim()); setWordInput(''); }}}
                    disabled={!wordInput.trim() || sending}
                    style={{ padding: '12px 20px', borderRadius: 12, background: wordInput.trim() ? '#003056' : '#d4d0c8', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    &#10148;
                  </button>
                </div>
                {/* Live responses with upvoting - fetched via polling */}
                <OpenQAResponses activityId={act.id} fp={fp} />
              </div>
            )}
          </div>
        ))}

        {/* Show closed activities that user already answered */}
        {closedActivities.filter((a: any) => submitted[a.id]).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, color: '#9e9a92', marginBottom: 8 }}>Bereits beantwortet:</p>
            {closedActivities.filter((a: any) => submitted[a.id]).map((a: any) => (
              <div key={a.id} style={{ padding: '8px 12px', background: '#f5f3ef', borderRadius: 8, marginBottom: 4, fontSize: 13, color: '#7a756c' }}>
                &#10003; {a.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
