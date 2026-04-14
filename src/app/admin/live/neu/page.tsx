
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Sun, Cloud, MessageSquare, X } from 'lucide-react';

const ACTIVITY_TYPES = [
  { type: 'weather', label: 'Wettercheck', desc: 'Wie geht es dir? (Sonnig bis Gewittrig)', icon: Sun },
  { type: 'wordcloud', label: 'Word Cloud', desc: 'Sammle Begriffe von allen Teilnehmenden', icon: Cloud },
  { type: 'poll', label: 'Live-Poll', desc: 'Abstimmung mit vorgegebenen Optionen', icon: MessageSquare },
];

export default function NewLiveSessionPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState('');
  const [activities, setActivities] = useState<{ type: string; title: string; config: any }[]>([]);
  const [saving, setSaving] = useState(false);

  function addActivity(type: string) {
    const defaults: Record<string, string> = {
      weather: 'Wie geht es dir?',
      wordcloud: 'Was beschreibt deine Stimmung?',
      poll: 'Abstimmung',
    };
    setActivities(prev => [...prev, { type, title: defaults[type] || '', config: {} }]);
  }

  function removeActivity(i: number) {
    setActivities(prev => prev.filter((_, j) => j !== i));
  }

  function updateActivity(i: number, field: string, value: string) {
    setActivities(prev => prev.map((a, j) => j === i ? { ...a, [field]: value } : a));
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle, session_date: date || null, activities }),
      });
      const data = await res.json();
      if (res.ok) router.push('/admin/live/' + data.id);
    } catch { }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <button onClick={() => router.push('/admin/live')} className="opacity-70 hover:opacity-100"><ArrowLeft className="h-5 w-5" /></button>
          <div><div className="text-base font-bold">Neue Live-Session</div></div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>
      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <div className="rounded-xl border border-dpsg-gray-200 bg-white p-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Titel *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. BL III/2026"
              className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Beschreibung</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="z.B. Wochenende im Haus St. Georg"
              className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Datum</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Activities */}
        <div className="rounded-xl border border-dpsg-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-bold text-dpsg-gray-900">Aktivitäten</h3>

          {activities.map((a, i) => {
            const typeDef = ACTIVITY_TYPES.find(t => t.type === a.type);
            return (
              <div key={i} className="mb-3 flex items-center gap-3 rounded-lg border border-dpsg-gray-100 bg-dpsg-gray-50 p-3">
                <span className="rounded-md bg-dpsg-blue/10 px-2 py-1 text-xs font-semibold text-dpsg-blue">{typeDef?.label}</span>
                <input value={a.title} onChange={e => updateActivity(i, 'title', e.target.value)}
                  className="flex-1 rounded-md border border-dpsg-gray-200 bg-white px-2 py-1 text-sm" />
                <button onClick={() => removeActivity(i)} className="text-dpsg-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
              </div>
            );
          })}

          <div className="flex gap-2 mt-3">
            {ACTIVITY_TYPES.map(t => (
              <button key={t.type} onClick={() => addActivity(t.type)}
                className="flex items-center gap-1.5 rounded-lg border border-dpsg-gray-200 px-3 py-2 text-xs font-semibold text-dpsg-gray-600 hover:bg-dpsg-gray-50">
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="rounded-lg bg-dpsg-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-dpsg-blue-light disabled:opacity-50">
          {saving ? 'Erstellen...' : 'Session erstellen'}
        </button>
      </div>
    </div>
  );
}
