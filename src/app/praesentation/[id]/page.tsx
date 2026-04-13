
'use client';

import { useState, useEffect, use, useCallback } from 'react';

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

export default function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    fetch('/api/surveys/' + id + '/results').then(r => r.json()).then(setData);
  }, [id]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') setSlide(s => s + 1);
    if (e.key === 'ArrowLeft') setSlide(s => Math.max(0, s - 1));
    if (e.key === 'Escape') window.close();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!data?.survey) return <div style={{ background: '#003056', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>Laden...</div>;

  const { survey, responses } = data;
  const agendaItems = survey.agenda_items || [];
  const zusammenarbeitItems = survey.zusammenarbeit_items || [];
  const numericItems = survey.numeric_items || [];

  // Parse data
  const agendaAvgs = agendaItems.map((item: any) => {
    const vals = responses.flatMap((r: any) => (r.answers || []).filter((a: any) => a.section === 'agenda' && a.question_key === String(item.id)).map((a: any) => a.value_numeric || 0));
    return { label: item.label, avg: avg(vals) };
  }).sort((a: any, b: any) => b.avg - a.avg);

  const zusAvgs = zusammenarbeitItems.map((item: string, i: number) => {
    const vals = responses.flatMap((r: any) => (r.answers || []).filter((a: any) => a.section === 'zusammenarbeit' && a.question_key === String(i)).map((a: any) => a.value_numeric || 0));
    return { label: item, avg: avg(vals) };
  }).sort((a: any, b: any) => b.avg - a.avg);

  const numAvgs = numericItems.map((item: any) => {
    const vals = responses.flatMap((r: any) => (r.answers || []).filter((a: any) => a.section === 'numeric' && a.question_key === item.key).map((a: any) => a.value_numeric || 0)).filter((v: number) => v > 0);
    return { ...item, avg: avg(vals) };
  });

  const allThemen = responses.flatMap((r: any) => (r.answers || []).filter((a: any) => a.section === 'freitext' && a.question_key === 'themen').map((a: any) => a.value_text || '')).flatMap((t: string) => t.split(',')).map((s: string) => s.trim().toLowerCase()).filter(Boolean);

  const slides = [
    // 0: Title
    () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 100 100" fill="white" opacity={0.3}>
          <path d="M50 5 C50 5, 35 25, 35 40 C35 50, 42 55, 50 55 C58 55, 65 50, 65 40 C65 25, 50 5, 50 5Z M30 50 C20 55, 15 65, 20 75 C25 82, 35 80, 40 75 L50 60 L60 75 C65 80, 75 82, 80 75 C85 65, 80 55, 70 50 L50 65 Z M48 60 L48 95 L52 95 L52 60 Z"/>
        </svg>
        <h1 style={{ fontSize: 42, fontWeight: 700, color: 'white', margin: '16px 0 0' }}>BL-O-Meter</h1>
        <h2 style={{ fontSize: 24, fontWeight: 400, color: 'rgba(255,255,255,0.7)', margin: '8px 0' }}>{survey.title}</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>{survey.subtitle} &middot; {responses.length} Rückmeldungen</p>
      </div>
    ),
    // 1: Agenda
    () => (
      <div style={{ padding: '40px 60px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 24 }}>Tagesordnung</h2>
        {agendaAvgs.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{ width: 200, fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'right' }}>{item.label}</div>
            <div style={{ flex: 1, height: 22, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: (item.avg / 5 * 100) + '%', height: '100%', borderRadius: 6, background: likertColor(item.avg), transition: 'width 0.6s' }} />
            </div>
            <div style={{ width: 40, fontSize: 14, fontWeight: 700, color: likertColor(item.avg) }}>{item.avg > 0 ? item.avg.toFixed(1) : '--'}</div>
          </div>
        ))}
      </div>
    ),
    // 2: Zusammenarbeit
    () => (
      <div style={{ padding: '40px 60px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 24 }}>Zusammenarbeit</h2>
        {zusAvgs.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ width: 280, fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'right' }}>{item.label}</div>
            <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: (item.avg / 5 * 100) + '%', height: '100%', borderRadius: 6, background: likertColor(item.avg), transition: 'width 0.6s' }} />
            </div>
            <div style={{ width: 40, fontSize: 15, fontWeight: 700, color: likertColor(item.avg) }}>{item.avg.toFixed(1)}</div>
          </div>
        ))}
      </div>
    ),
    // 3: Numeric gauges
    () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 40 }}>Bewertungen</h2>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          {numAvgs.map((item: any, i: number) => {
            const pct = item.max > 0 ? (item.avg / item.max) * 100 : 0;
            const color = item.avg / item.max > 0.7 ? '#16a34a' : item.avg / item.max > 0.4 ? '#eab308' : '#f97316';
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto' }}>
                  <svg viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                    <circle cx="55" cy="55" r="48" fill="none" stroke={color} strokeWidth="8" strokeDasharray={(pct * 3.016) + ' 301.6'} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'white' }}>
                    {item.avg > 0 ? item.avg.toFixed(1) : '--'}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8, maxWidth: 130 }}>{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    // 4: Word cloud
    () => {
      const counts: Record<string, number> = {};
      allThemen.forEach((w: string) => { counts[w] = (counts[w] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const max = sorted[0]?.[1] || 1;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 32 }}>Was beschäftigt uns?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 600 }}>
            {sorted.map(([word, count], i) => (
              <span key={i} style={{
                fontSize: 14 + (count / max) * 20, fontWeight: count > 1 ? 700 : 500,
                color: 'white', opacity: 0.4 + (count / max) * 0.6,
                padding: '5px 14px', background: 'rgba(255,255,255,' + (0.04 + (count / max) * 0.12) + ')', borderRadius: 8,
              }}>{word}</span>
            ))}
          </div>
        </div>
      );
    },
  ];

  const currentSlide = Math.min(slide, slides.length - 1);

  return (
    <div style={{ background: '#003056', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'PT Sans Narrow', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {slides[currentSlide]()}
      </div>
      <div style={{ height: 4, background: '#8b0a1e' }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0', background: 'rgba(0,0,0,0.2)' }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)} style={{
            width: currentSlide === i ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
            background: currentSlide === i ? '#8b0a1e' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s',
          }} />
        ))}
      </div>
      {currentSlide > 0 && (
        <button onClick={() => setSlide(s => s - 1)} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 44, height: 44, borderRadius: 22, cursor: 'pointer', fontSize: 20 }}>&#8592;</button>
      )}
      {currentSlide < slides.length - 1 && (
        <button onClick={() => setSlide(s => s + 1)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 44, height: 44, borderRadius: 22, cursor: 'pointer', fontSize: 20 }}>&#8594;</button>
      )}
    </div>
  );
}
