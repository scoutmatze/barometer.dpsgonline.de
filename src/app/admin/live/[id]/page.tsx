
'use client';
import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Square, Radio, Copy, Check, Monitor, Unlock, Lock, Sun, Cloud, MessageSquare, Plus } from 'lucide-react';

const WEATHER = [
  { value: 1, label: 'Sonnig', color: '#f59e0b', bg: '#fef3c7' },
  { value: 2, label: 'Leicht bewölkt', color: '#84cc16', bg: '#ecfccb' },
  { value: 3, label: 'Bewölkt', color: '#9e9a92', bg: '#f5f3ef' },
  { value: 4, label: 'Regnerisch', color: '#3b82f6', bg: '#dbeafe' },
  { value: 5, label: 'Gewittrig', color: '#7c3aed', bg: '#ede9fe' },
];

export default function ManageLiveSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(() => {
    fetch('/api/live/' + id).then(r => r.json()).then(setSession);
    fetch('/api/live/' + id + '/results').then(r => r.json()).then(setResults);
  }, [id]);

  useEffect(() => { fetchData(); setLoading(false); }, [fetchData]);
  useEffect(() => { const interval = setInterval(fetchData, 3000); return () => clearInterval(interval); }, [fetchData]);

  async function toggleSession(status: string) {
    await fetch('/api/live/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchData();
  }

  async function toggleActivity(actId: number, status: string) {
    await fetch('/api/live/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity_id: actId, activity_status: status }) });
    fetchData();
  }

  async function addActivity(type: string, title: string, openImmediately: boolean) {
    await fetch('/api/live/' + id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ add_activity: { type, title, config: {}, open_immediately: openImmediately } }),
    });
    fetchData();
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + '/live/' + session?.access_code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  if (loading || !session) return <div className="flex min-h-screen items-center justify-center text-sm text-dpsg-gray-400">Laden...</div>;

  const activities = session.activities || [];

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/live')} className="opacity-70 hover:opacity-100"><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <div className="text-base font-bold">{session.title}</div>
              <div className="text-xs opacity-50">{session.subtitle} &middot; Code: <span className="font-mono">{session.access_code}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLink} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? 'Kopiert!' : 'Link'}
            </button>
            <button onClick={() => window.open('/beamer/' + session.access_code, '_blank')}
              className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
              <Monitor className="h-3 w-3" /> Beamer
            </button>
            {session.status === 'draft' && (
              <button onClick={() => toggleSession('active')} className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold hover:bg-green-600">
                <Play className="h-3 w-3" /> Starten
              </button>
            )}
            {session.status === 'active' && (
              <button onClick={() => toggleSession('closed')} className="flex items-center gap-1 rounded-lg bg-dpsg-red px-3 py-1.5 text-xs font-semibold hover:bg-dpsg-red-light">
                <Square className="h-3 w-3" /> Beenden
              </button>
            )}
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-4">
        {session.status === 'active' && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Radio className="h-4 w-4 animate-pulse" /> Session ist live &middot; Teilnahme-Link: <span className="font-mono font-bold">{window.location.origin}/live/{session.access_code}</span>
          </div>
        )}

        {/* Activities */}
        {activities.map((act: any) => {
          const actResults = results?.activities?.find((a: any) => a.id === act.id);
          const responses = actResults?.responses || [];
          const count = Number(actResults?.response_count || 0);

          return (
            <div key={act.id} className="rounded-xl border border-dpsg-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-dpsg-blue/10 px-2 py-1 text-xs font-semibold text-dpsg-blue">
                    {act.type === 'weather' ? 'Wettercheck' : act.type === 'wordcloud' ? 'Word Cloud' : 'Poll'}
                  </span>
                  <h3 className="text-sm font-bold text-dpsg-gray-900">{act.title}</h3>
                  <span className="text-xs text-dpsg-gray-400">{count} Antworten</span>
                </div>
                {session.status === 'active' && (
                  act.status === 'pending' || act.status === 'closed' ? (
                    <button onClick={() => toggleActivity(act.id, 'open')} className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200">
                      <Unlock className="h-3 w-3" /> Öffnen
                    </button>
                  ) : (
                    <button onClick={() => toggleActivity(act.id, 'closed')} className="flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                      <Lock className="h-3 w-3" /> Schließen
                    </button>
                  )
                )}
              </div>

              {/* Weather results */}
              {act.type === 'weather' && responses.length > 0 && (
                <div className="flex gap-2">
                  {WEATHER.map(w => {
                    const wCount = responses.filter((r: any) => r.value_numeric === w.value).length;
                    const pct = count > 0 ? (wCount / count) * 100 : 0;
                    return (
                      <div key={w.value} className="flex-1 rounded-lg border p-3 text-center" style={{ borderColor: w.color + '40', backgroundColor: w.bg }}>
                        <div className="text-2xl font-bold" style={{ color: w.color }}>{wCount}</div>
                        <div className="text-xs font-semibold" style={{ color: w.color }}>{w.label}</div>
                        <div className="text-xs text-dpsg-gray-400">{pct.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Word cloud results */}
              {act.type === 'wordcloud' && responses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const counts: Record<string, number> = {};
                    responses.forEach((r: any) => { if (r.value_text) { const w = r.value_text.trim().toLowerCase(); counts[w] = (counts[w] || 0) + 1; }});
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                    const max = sorted[0]?.[1] || 1;
                    return sorted.map(([word, c], i) => (
                      <span key={i} className="rounded-md px-2 py-1" style={{
                        fontSize: 13 + (c / max) * 10, fontWeight: c > 1 ? 700 : 500,
                        color: '#003056', opacity: 0.5 + (c / max) * 0.5,
                        backgroundColor: 'rgba(0,48,86,' + (0.05 + (c / max) * 0.08) + ')',
                      }}>{word} {c > 1 && <sup>{c}</sup>}</span>
                    ));
                  })()}
                </div>
              )}

              {/* Poll results */}
              {act.type === 'poll' && responses.length > 0 && (
                <div className="text-sm text-dpsg-gray-500">{count} Stimmen eingegangen</div>
              )}

              {responses.length === 0 && <p className="text-xs text-dpsg-gray-400">Noch keine Antworten</p>}

              {/* Comments */}
              {act.type === 'weather' && responses.filter((r: any) => r.value_text).length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-dpsg-gray-500">Kommentare:</p>
                  {responses.filter((r: any) => r.value_text).map((r: any, i: number) => (
                    <div key={i} className="rounded-lg bg-dpsg-gray-50 px-3 py-2 text-xs text-dpsg-gray-600">&ldquo;{r.value_text}&rdquo;</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Quick-Add Aktivität */}
        {(session.status === 'active' || session.status === 'draft') && (
          <div className="rounded-xl border border-dashed border-dpsg-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-dpsg-gray-400" />
              <h3 className="text-sm font-bold text-dpsg-gray-600">Aktivität hinzufügen</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => addActivity('weather', 'Wie geht es dir?', session.status === 'active')}
                className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-4 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-50 hover:border-dpsg-blue/30">
                <Sun className="h-4 w-4 text-amber-500" /> Wettercheck
              </button>
              <button onClick={() => addActivity('wordcloud', 'Was beschreibt deine Stimmung?', session.status === 'active')}
                className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-4 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-50 hover:border-dpsg-blue/30">
                <Cloud className="h-4 w-4 text-blue-500" /> Word Cloud
              </button>
              <button onClick={() => addActivity('poll', 'Abstimmung', session.status === 'active')}
                className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-4 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-50 hover:border-dpsg-blue/30">
                <MessageSquare className="h-4 w-4 text-purple-500" /> Live-Poll
              </button>
            </div>
            {session.status === 'active' && (
              <p className="mt-2 text-xs text-dpsg-gray-400">Wird sofort geöffnet und ist für Teilnehmende sichtbar.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
