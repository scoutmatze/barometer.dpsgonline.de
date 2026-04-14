
'use client';
import { useState, useEffect, use, useCallback } from 'react';

const WEATHER = [
  { value: 1, label: 'Sonnig', icon: '\u2600\ufe0f', color: '#f59e0b', bg: '#fef3c7' },
  { value: 2, label: 'Leicht bewölkt', icon: '\u26c5', color: '#84cc16', bg: '#ecfccb' },
  { value: 3, label: 'Bewölkt', icon: '\u2601\ufe0f', color: '#9e9a92', bg: '#f5f3ef' },
  { value: 4, label: 'Regnerisch', icon: '\ud83c\udf27\ufe0f', color: '#3b82f6', bg: '#dbeafe' },
  { value: 5, label: 'Gewittrig', icon: '\u26c8\ufe0f', color: '#7c3aed', bg: '#ede9fe' },
];

export default function BeamerView({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [session, setSession] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Poll join endpoint continuously (handles session activation after page load)
  useEffect(() => {
    const pollJoin = () => {
      fetch('/api/live/join/' + code)
        .then(r => r.json())
        .then(d => {
          if (!d.error && d.id) {
            setSession(d);
            setSessionId(d.id);
          }
        })
        .catch(() => {});
    };
    pollJoin();
    const i = setInterval(pollJoin, 3000);
    return () => clearInterval(i);
  }, [code]);

  // Poll results once we have a session ID
  useEffect(() => {
    if (!sessionId) return;
    const pollResults = () => {
      fetch('/api/live/' + sessionId + '/results')
        .then(r => r.json())
        .then(setResults)
        .catch(() => {});
    };
    pollResults();
    const i = setInterval(pollResults, 2000);
    return () => clearInterval(i);
  }, [sessionId]);

  if (!session) return (
    <div style={{ background: '#003056', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'PT Sans Narrow', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&display=swap" rel="stylesheet" />
      <p style={{ fontSize: 20 }}>Laden...</p>
    </div>
  );

  const activities = results?.activities || [];
  const openActs = activities.filter((a: any) => a.status === 'open');
  const currentAct = openActs[0];

  return (
    <div style={{ background: '#003056', minHeight: '100vh', fontFamily: "'PT Sans Narrow', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{session.title}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{session.subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Mitmachen:</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: 'monospace', letterSpacing: 4 }}>{session.access_code}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={'/api/qr/' + session.access_code} alt="QR-Code" width={56} height={56}
            style={{ borderRadius: 6, background: 'white', padding: 4 }} />
        </div>
      </div>
      <div style={{ height: 4, background: '#8b0a1e' }} />

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        {!currentAct ? (
          <div style={{ textAlign: 'center' }}>
            {/* Large QR code on waiting screen */}
            <div style={{ display: 'inline-block', background: 'white', borderRadius: 16, padding: 16, marginBottom: 24 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={'/api/qr/' + session.access_code} alt="QR-Code" width={200} height={200} />
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: 'white', marginTop: 8 }}>Jetzt mitmachen!</h2>
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', marginTop: 8, fontFamily: 'monospace', letterSpacing: 3 }}>
              barometer.dpsgonline.de/live/{session.access_code}
            </p>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>
              Code: <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: 4, fontFamily: 'monospace' }}>{session.access_code}</span>
            </p>
          </div>
        ) : currentAct.type === 'weather' ? (
          /* === WEATHER BEAMER === */
          <div style={{ width: '100%', maxWidth: 1000 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', textAlign: 'center', marginBottom: 8 }}>{currentAct.title}</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 40 }}>
              {Number(currentAct.response_count)} Teilnehmende
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {WEATHER.map(w => {
                const responses = currentAct.responses || [];
                const count = responses.filter((r: any) => r.value_numeric === w.value).length;
                const total = responses.length || 1;
                const pct = (count / total) * 100;
                const barHeight = Math.max(pct * 2.5, 4);
                return (
                  <div key={w.value} style={{ flex: 1, maxWidth: 160, textAlign: 'center' }}>
                    {/* Bar */}
                    <div style={{ height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {count > 0 && (
                        <div style={{ fontSize: 28, fontWeight: 700, color: w.color, marginBottom: 8 }}>{count}</div>
                      )}
                      <div style={{
                        width: '80%', height: barHeight, borderRadius: '8px 8px 0 0',
                        backgroundColor: w.color, transition: 'height 0.5s ease',
                        opacity: count > 0 ? 1 : 0.15,
                      }} />
                    </div>
                    {/* Label */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 36 }}>{w.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{w.label}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{pct.toFixed(0)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : currentAct.type === 'wordcloud' ? (
          /* === WORD CLOUD BEAMER === */
          <div style={{ width: '100%', maxWidth: 900, textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 8 }}>{currentAct.title}</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>
              {Number(currentAct.response_count)} Beiträge
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {(() => {
                const responses = currentAct.responses || [];
                const counts: Record<string, number> = {};
                responses.forEach((r: any) => { if (r.value_text) { const w = r.value_text.trim().toLowerCase(); counts[w] = (counts[w] || 0) + 1; }});
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const max = sorted[0]?.[1] || 1;
                return sorted.map(([word, c], i) => (
                  <span key={i} style={{
                    fontSize: 18 + (c / max) * 32, fontWeight: c > 1 ? 700 : 500,
                    color: 'white', opacity: 0.4 + (c / max) * 0.6,
                    padding: '6px 16px',
                    background: 'rgba(255,255,255,' + (0.04 + (c / max) * 0.12) + ')',
                    borderRadius: 10, transition: 'all 0.3s',
                  }}>{word}</span>
                ));
              })()}
            </div>
          </div>
        ) : (
          /* === POLL BEAMER === */
          <div style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 40 }}>{currentAct.title}</h2>
            {(() => {
              const responses = currentAct.responses || [];
              const ja = responses.filter((r: any) => r.value_numeric === 1).length;
              const nein = responses.filter((r: any) => r.value_numeric === 0).length;
              const total = ja + nein || 1;
              return (
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 56, fontWeight: 700, color: '#16a34a' }}>{ja}</div>
                    <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Ja ({(ja/total*100).toFixed(0)}%)</div>
                  </div>
                  <div style={{ width: 2, background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 56, fontWeight: 700, color: '#ef4444' }}>{nein}</div>
                    <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Nein ({(nein/total*100).toFixed(0)}%)</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ height: 4, background: '#8b0a1e' }} />
      <div style={{ padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        <span>BL-O-Meter</span>
        <span>barometer.dpsgonline.de/live/{session.access_code}</span>
      </div>
    </div>
  );
}
