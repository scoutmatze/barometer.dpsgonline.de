'use client';
import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Square, Radio, Copy, Check, Monitor, Unlock, Lock, Sun, Cloud, MessageSquare, Plus, Hash, HelpCircle } from 'lucide-react';

const WEATHER = [
  { value: 1, label: 'Sonnig', color: '#f59e0b', bg: '#fef3c7' },
  { value: 2, label: 'Leicht bewölkt', color: '#84cc16', bg: '#ecfccb' },
  { value: 3, label: 'Bewölkt', color: '#9e9a92', bg: '#f5f3ef' },
  { value: 4, label: 'Regnerisch', color: '#3b82f6', bg: '#dbeafe' },
  { value: 5, label: 'Gewittrig', color: '#7c3aed', bg: '#ede9fe' },
];

const TYPE_LABELS: Record<string, string> = {
  weather: 'Wettercheck', wordcloud: 'Word Cloud', poll: 'Poll', scale: 'Skala', openqa: 'Offene Frage',
};

export default function ManageLiveSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [pollOptions, setPollOptions] = useState('');

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

  async function addActivity(type: string, title: string, config: any, openImm: boolean) {
    await fetch('/api/live/' + id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ add_activity: { type, title, config, open_immediately: openImm } }),
    });
    setShowAdd(null); setNewTitle(''); setPollOptions('');
    fetchData();
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + '/live/' + session?.access_code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function startAdd(type: string) {
    const defaults: Record<string, string> = {
      weather: 'Wie geht es dir?', wordcloud: 'Was beschreibt deine Stimmung?',
      poll: 'Abstimmung', scale: 'Wie energiegeladen bist du?', openqa: 'Was sollten wir besprechen?',
    };
    setNewTitle(defaults[type] || '');
    setPollOptions(type === 'poll' ? 'Option A\nOption B\nEnthaltung' : '');
    setShowAdd(type);
  }

  function confirmAdd() {
    if (!showAdd || !newTitle.trim()) return;
    const config: any = {};
    if (showAdd === 'poll') {
      config.options = pollOptions.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (showAdd === 'scale') {
      config.min = 1; config.max = 10;
    }
    addActivity(showAdd, newTitle.trim(), config, session?.status === 'active');
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
              <div className="text-xs opacity-50">{session.subtitle} · Code: <span className="font-mono">{session.access_code}</span></div>
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
            <Radio className="h-4 w-4 animate-pulse" /> Session ist live · <span className="font-mono font-bold">{typeof window !== 'undefined' ? window.location.origin : ''}/live/{session.access_code}</span>
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
                    {TYPE_LABELS[act.type] || act.type}
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
              {act.type === 'poll' && responses.length > 0 && (() => {
                const options = act.config?.options || ['Ja', 'Nein'];
                return (
                  <div className="space-y-2">
                    {options.map((opt: string, oi: number) => {
                      const optCount = responses.filter((r: any) => r.value_numeric === oi).length;
                      const pct = count > 0 ? (optCount / count) * 100 : 0;
                      return (
                        <div key={oi}>
                          <div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-dpsg-gray-700">{opt}</span><span className="text-dpsg-gray-400">{optCount} ({pct.toFixed(0)}%)</span></div>
                          <div className="h-4 rounded-full bg-dpsg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-dpsg-blue transition-all" style={{ width: pct + '%' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Scale results */}
              {act.type === 'scale' && responses.length > 0 && (() => {
                const vals = responses.map((r: any) => r.value_numeric).filter((v: number) => v > 0);
                const avg = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
                const max = act.config?.max || 10;
                return (
                  <div className="text-center py-2">
                    <div className="text-4xl font-bold text-dpsg-blue">{avg.toFixed(1)}</div>
                    <div className="text-xs text-dpsg-gray-400">Durchschnitt von {max} · {vals.length} Antworten</div>
                  </div>
                );
              })()}

              {/* Open Q&A results */}
              {act.type === 'openqa' && responses.length > 0 && (
                <div className="space-y-1">
                  {responses.sort((a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0)).map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-dpsg-gray-50 px-3 py-2">
                      <span className="rounded-md bg-dpsg-blue/10 px-2 py-0.5 text-xs font-bold text-dpsg-blue">{r.upvotes || 0}</span>
                      <span className="text-sm text-dpsg-gray-700">{r.value_text}</span>
                    </div>
                  ))}
                </div>
              )}

              {responses.length === 0 && <p className="text-xs text-dpsg-gray-400">Noch keine Antworten</p>}

              {/* Comments (weather) */}
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
            {showAdd ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-dpsg-blue/10 px-2 py-1 text-xs font-semibold text-dpsg-blue">{TYPE_LABELS[showAdd]}</span>
                  <h3 className="text-sm font-bold text-dpsg-gray-600">Neue Aktivität</h3>
                </div>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titel / Frage"
                  className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20"
                  onKeyDown={e => { if (e.key === 'Enter' && showAdd !== 'poll') confirmAdd(); }} autoFocus />
                {showAdd === 'poll' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Optionen (eine pro Zeile)</label>
                    <textarea value={pollOptions} onChange={e => setPollOptions(e.target.value)} rows={4}
                      placeholder={"Option A\nOption B\nOption C\nEnthaltung"}
                      className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={confirmAdd} disabled={!newTitle.trim()}
                    className="rounded-lg bg-dpsg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-dpsg-blue-light disabled:opacity-50">
                    {session.status === 'active' ? 'Hinzufügen & öffnen' : 'Hinzufügen'}
                  </button>
                  <button onClick={() => setShowAdd(null)}
                    className="rounded-lg bg-dpsg-gray-100 px-4 py-2 text-sm font-semibold text-dpsg-gray-600">Abbrechen</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-dpsg-gray-400" />
                  <h3 className="text-sm font-bold text-dpsg-gray-600">Aktivität hinzufügen</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => startAdd('weather')} className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-4 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-50">
                    <Sun className="h-4 w-4 text-amber-500" /> Wettercheck
                  </button>
                  <button onClick={() => startAdd('wordcloud')} className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-4 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-50">
                    <Cloud className="h-4 w-4 text-blue-500" /> Word Cloud
                  </button>
                  <button onClick={() => startAdd('poll')} className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-4 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-50">
                    <MessageSquare className="h-4 w-4 text-purple-500" /> Poll
                  </button>
                  <button onClick={() => startAdd('scale')} className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-4 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-50">
                    <Hash className="h-4 w-4 text-green-600" /> Skala
                  </button>
                  <button onClick={() => startAdd('openqa')} className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-4 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-50">
                    <HelpCircle className="h-4 w-4 text-coral-500" /> Offene Frage
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
