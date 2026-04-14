
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, BarChart3, Eye, GitCompare } from 'lucide-react';

export default function AuswertungPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['BL']);
  const [activeCategory, setActiveCategory] = useState('BL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(cats => {
      if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/surveys?category=' + encodeURIComponent(activeCategory)).then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : [];
      setSurveys(list.filter((s: any) => s.status === 'closed' || s.status === 'active'));
      setLoading(false);
    });
  }, [activeCategory]);

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="currentColor" className="opacity-40">
              <path d="M50 5 C50 5, 35 25, 35 40 C35 50, 42 55, 50 55 C58 55, 65 50, 65 40 C65 25, 50 5, 50 5Z M30 50 C20 55, 15 65, 20 75 C25 82, 35 80, 40 75 L50 60 L60 75 C65 80, 75 82, 80 75 C85 65, 80 55, 70 50 L50 65 Z M48 60 L48 95 L52 95 L52 60 Z"/>
            </svg>
            <div>
              <div className="text-base font-bold">BL-O-Meter</div>
              <div className="text-xs opacity-50">Auswertung</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/auswertung/vergleich?category=' + encodeURIComponent(activeCategory))}
              className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
              <GitCompare className="h-3 w-3" /> Vergleich
            </button>
            <button onClick={logout} className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100">
              <LogOut className="h-3.5 w-3.5" /> Abmelden
            </button>
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-1 text-xl font-bold text-dpsg-gray-900">Sitzungen</h1>
        <p className="mb-4 text-sm text-dpsg-gray-500">Ergebnisse und Vergleiche einsehen</p>

        {/* Category Tabs */}
        <div className="mb-5 flex items-center gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={'rounded-lg px-4 py-2 text-sm font-semibold transition-all '
                + (activeCategory === cat
                  ? 'bg-dpsg-blue text-white'
                  : 'bg-dpsg-gray-100 text-dpsg-gray-600 hover:bg-dpsg-gray-200')}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-dpsg-gray-400">Laden...</div>
        ) : (
          <div className="space-y-3">
            {surveys.map(s => (
              <div key={s.id} onClick={() => router.push('/auswertung/' + s.id)}
                className="cursor-pointer rounded-xl border border-dpsg-gray-200 bg-white p-5 transition-all hover:border-dpsg-blue/30 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-dpsg-gray-900">{s.title}</h3>
                    <p className="text-xs text-dpsg-gray-500">
                      {s.subtitle} &middot; {s.response_count} Rückmeldungen
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-dpsg-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
