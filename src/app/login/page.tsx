
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Anmeldung fehlgeschlagen');
        return;
      }
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/auswertung');
      router.refresh();
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dpsg-blue text-white">
              <svg width="28" height="28" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 5 C50 5, 35 25, 35 40 C35 50, 42 55, 50 55 C58 55, 65 50, 65 40 C65 25, 50 5, 50 5Z M30 50 C20 55, 15 65, 20 75 C25 82, 35 80, 40 75 L50 60 L60 75 C65 80, 75 82, 80 75 C85 65, 80 55, 70 50 L50 65 Z M48 60 L48 95 L52 95 L52 60 Z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dpsg-gray-900">BL-O-Meter</h1>
          <p className="mt-1 text-sm text-dpsg-gray-500">Deutsche Pfadfinder*innenschaft Sankt Georg</p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-dpsg-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-dpsg-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-dpsg-gray-200 bg-white pl-10 pr-3 py-2 text-sm
                  focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20"
                  placeholder="deine@email.de" required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">PIN</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-dpsg-gray-400" />
                <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                  className="w-full rounded-lg border border-dpsg-gray-200 bg-white pl-10 pr-3 py-2 text-sm
                  focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20"
                  placeholder="Dein PIN" required />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-dpsg-blue py-2.5 text-sm font-bold text-white
              hover:bg-dpsg-blue-light transition-colors disabled:opacity-50">
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-dpsg-gray-400">
          Zugang nur für Admin und BL-Mitglieder
        </p>
        <p className="mt-2 text-center">
          <a href="/datenschutz" className="text-xs text-dpsg-blue underline hover:text-dpsg-blue-light">Datenschutz</a>
        </p>
      </div>
    </div>
  );
}
