
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Zap, Users, Radio, Lock } from 'lucide-react';

export default function LiveSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/live').then(r => r.json()).then(d => { setSessions(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = { draft: 'bg-amber-100 text-amber-700', active: 'bg-green-100 text-green-700', closed: 'bg-dpsg-gray-100 text-dpsg-gray-600' };
    const labels: Record<string, string> = { draft: 'Entwurf', active: 'Live', closed: 'Beendet' };
    return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${styles[s] || styles.draft}`}>{s === 'active' && <Radio className="mr-1 h-3 w-3 animate-pulse" />}{labels[s] || s}</span>;
  };

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="opacity-70 hover:opacity-100"><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <div className="text-base font-bold">Live-Sessions</div>
              <div className="text-xs opacity-50">Wettercheck, Word Cloud, Live-Polls</div>
            </div>
          </div>
          <button onClick={() => router.push('/admin/live/neu')} className="flex items-center gap-1.5 rounded-lg bg-dpsg-red px-4 py-2 text-sm font-semibold hover:bg-dpsg-red-light">
            <Plus className="h-4 w-4" /> Neue Session
          </button>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8">
        {loading ? <div className="py-20 text-center text-sm text-dpsg-gray-400">Laden...</div> : sessions.length === 0 ? (
          <div className="rounded-xl border border-dpsg-gray-200 bg-white py-16 text-center">
            <Zap className="mx-auto mb-3 h-10 w-10 text-dpsg-gray-300" />
            <p className="text-sm text-dpsg-gray-500">Noch keine Live-Sessions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} onClick={() => router.push('/admin/live/' + s.id)}
                className="cursor-pointer rounded-xl border border-dpsg-gray-200 bg-white p-5 transition-all hover:border-dpsg-blue/30 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-dpsg-gray-900">{s.title}</h3>
                      {statusBadge(s.status)}
                    </div>
                    <p className="mt-0.5 text-xs text-dpsg-gray-500">
                      {s.subtitle} · Code: <span className="font-mono font-bold">{s.access_code}</span> · {s.activity_count} Aktivitäten · {s.participant_count} Teilnehmende
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
