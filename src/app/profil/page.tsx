'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Check } from 'lucide-react';

export default function ProfilPage() {
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPin !== confirmPin) { setError('Neue PINs stimmen nicht überein'); return; }
    if (newPin.length < 4) { setError('Mindestens 4 Zeichen'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Fehler'); return; }
      setSuccess(true);
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <button onClick={() => router.back()} className="opacity-70 hover:opacity-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="text-base font-bold">Profil</div>
            <div className="text-xs opacity-50">PIN ändern</div>
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-md px-6 py-8">
        <div className="rounded-xl border border-dpsg-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-dpsg-blue" />
            <h2 className="text-lg font-bold text-dpsg-gray-900">PIN ändern</h2>
          </div>

          {success ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-sm font-bold text-green-700">PIN erfolgreich geändert!</p>
              <button onClick={() => setSuccess(false)} className="mt-4 text-xs text-dpsg-gray-500 hover:text-dpsg-gray-700">
                Erneut ändern
              </button>
            </div>
          ) : (
            <form onSubmit={handleChange} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Aktueller PIN</label>
                <input type="password" value={currentPin} onChange={e => setCurrentPin(e.target.value)}
                  className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20"
                  required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Neuer PIN</label>
                <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)}
                  className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20"
                  required minLength={4} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Neuer PIN bestätigen</label>
                <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)}
                  className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20"
                  required minLength={4} />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-dpsg-blue py-2.5 text-sm font-bold text-white hover:bg-dpsg-blue-light disabled:opacity-50">
                {loading ? 'Speichern...' : 'PIN ändern'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
