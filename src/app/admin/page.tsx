
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BarChart3, Upload, LogOut, ClipboardList, Lock, Unlock, Eye, Zap, GitCompare, KeyRound } from 'lucide-react';

interface Survey {
  id: number;
  title: string;
  subtitle: string;
  survey_date: string;
  status: string;
  response_count: number;
  agenda_items: any[];
  category: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('BL');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.role) setUserRole(d.role); });
    fetch('/api/categories').then(r => r.json()).then(cats => {
      if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
      else setCategories(['BL']);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/surveys?category=' + encodeURIComponent(activeCategory)).then(r => r.json()).then(data => {
      setSurveys(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [activeCategory]);

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  async function toggleStatus(id: number, newStatus: string) {
    await fetch('/api/surveys/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    // Refresh
    const data = await fetch('/api/surveys').then(r => r.json());
    setSurveys(Array.isArray(data) ? data : []);
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-amber-100 text-amber-700 border-amber-200',
      active: 'bg-green-100 text-green-700 border-green-200',
      closed: 'bg-dpsg-gray-100 text-dpsg-gray-600 border-dpsg-gray-200',
    };
    const labels: Record<string, string> = {
      draft: 'Entwurf', active: 'Aktiv', closed: 'Abgeschlossen',
    };
    return (
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      {/* Header */}
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="currentColor" className="opacity-40">
              <path d="M50 5 C50 5, 35 25, 35 40 C35 50, 42 55, 50 55 C58 55, 65 50, 65 40 C65 25, 50 5, 50 5Z M30 50 C20 55, 15 65, 20 75 C25 82, 35 80, 40 75 L50 60 L60 75 C65 80, 75 82, 80 75 C85 65, 80 55, 70 50 L50 65 Z M48 60 L48 95 L52 95 L52 60 Z"/>
            </svg>
            <div>
              <div className="text-base font-bold">BL-O-Meter</div>
              <div className="text-xs opacity-50">{userRole === 'ADMIN' ? 'Admin' : 'Moderator'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/profil')} className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100">
              <KeyRound className="h-3.5 w-3.5" /> PIN
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100">
              <LogOut className="h-3.5 w-3.5" /> Abmelden
            </button>
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-dpsg-gray-900">Sitzungen</h1>
            <p className="text-sm text-dpsg-gray-500">Rückmeldungen verwalten und auswerten</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/auswertung/vergleich?category=' + encodeURIComponent(activeCategory))}
              className="flex items-center gap-1.5 rounded-lg bg-dpsg-blue/10 px-3 py-2 text-xs font-semibold text-dpsg-blue hover:bg-dpsg-blue/20">
              <GitCompare className="h-3.5 w-3.5" /> Zeitvergleich
            </button>
            <button onClick={() => router.push('/admin/live')}
              className="flex items-center gap-1.5 rounded-lg bg-dpsg-red px-3 py-2 text-xs font-semibold text-white hover:bg-dpsg-red-light">
              <Zap className="h-3.5 w-3.5" /> Live-Sessions
            </button>
            {userRole === 'ADMIN' && (
              <button onClick={() => router.push('/admin/import')}
                className="flex items-center gap-1.5 rounded-lg bg-dpsg-gray-100 px-3 py-2 text-xs font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-200">
                <Upload className="h-3.5 w-3.5" /> Import
              </button>
            )}
            <button onClick={() => router.push('/admin/neu')}
              className="flex items-center gap-1.5 rounded-lg bg-dpsg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-dpsg-blue-light">
              <Plus className="h-4 w-4" /> Neue Sitzung
            </button>
          </div>
        </div>

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
          <button onClick={() => {
            const name = prompt('Name der neuen Kategorie:');
            if (name && name.trim()) {
              setCategories(prev => [...new Set([...prev, name.trim()])]);
              setActiveCategory(name.trim());
            }
          }}
            className="rounded-lg border border-dashed border-dpsg-gray-200 px-3 py-2 text-xs font-semibold text-dpsg-gray-400 hover:border-dpsg-gray-400 hover:text-dpsg-gray-600">
            + Kategorie
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-dpsg-gray-400">Laden...</div>
        ) : surveys.length === 0 ? (
          <div className="rounded-xl border border-dpsg-gray-200 bg-white py-16 text-center">
            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-dpsg-gray-300" />
            <p className="text-sm text-dpsg-gray-500">Noch keine Sitzungen angelegt.</p>
            <button onClick={() => router.push('/admin/neu')}
              className="mt-4 rounded-lg bg-dpsg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-dpsg-blue-light">
              Erste Sitzung erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map(s => (
              <div key={s.id}
                className="rounded-xl border border-dpsg-gray-200 bg-white p-5 transition-all hover:border-dpsg-blue/30 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-dpsg-gray-900">{s.title}</h3>
                      {statusBadge(s.status)}
                    </div>
                    <p className="mt-0.5 text-xs text-dpsg-gray-500">
                      {s.subtitle} &middot; {s.response_count} Rückmeldungen
                      {s.agenda_items && <> &middot; {s.agenda_items.length} TOPs</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === 'draft' && (
                      <button onClick={() => toggleStatus(s.id, 'active')}
                        className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200">
                        <Unlock className="h-3 w-3" /> Aktivieren
                      </button>
                    )}
                    {s.status === 'active' && (
                      <button onClick={() => toggleStatus(s.id, 'closed')}
                        className="flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                        <Lock className="h-3 w-3" /> Abschliessen
                      </button>
                    )}
                    <button onClick={() => router.push('/admin/' + s.id)}
                      className="flex items-center gap-1 rounded-lg bg-dpsg-blue/10 px-3 py-1.5 text-xs font-semibold text-dpsg-blue hover:bg-dpsg-blue/20">
                      <Eye className="h-3 w-3" /> Auswertung
                    </button>
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
