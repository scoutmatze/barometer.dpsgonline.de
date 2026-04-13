
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileSpreadsheet, Check } from 'lucide-react';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; surveyId: number } | null>(null);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    if (date) formData.append('survey_date', date);

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Import fehlgeschlagen'); return; }
      setResult({ imported: data.imported, surveyId: data.surveyId });
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
          <button onClick={() => router.push('/admin')} className="opacity-70 hover:opacity-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="text-base font-bold">Excel-Import</div>
            <div className="text-xs opacity-50">Alte Forms-Umfragen einspielen</div>
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border border-dpsg-gray-200 bg-white p-6">
          {result ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-dpsg-gray-900">Import erfolgreich!</h3>
              <p className="mt-1 text-sm text-dpsg-gray-500">{result.imported} Rückmeldungen importiert.</p>
              <div className="mt-6 flex justify-center gap-2">
                <button onClick={() => router.push('/admin/' + result.surveyId)}
                  className="rounded-lg bg-dpsg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-dpsg-blue-light">
                  Auswertung ansehen
                </button>
                <button onClick={() => { setResult(null); setFile(null); }}
                  className="rounded-lg bg-dpsg-gray-100 px-4 py-2 text-sm font-semibold text-dpsg-gray-700">
                  Weitere importieren
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-dpsg-blue" />
                <h2 className="text-lg font-bold text-dpsg-gray-900">Forms-Export importieren</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Excel-Datei (.xlsx)</label>
                  <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-dpsg-blue/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-dpsg-blue" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Titel *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. BL I/2026"
                    className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Beschreibung</label>
                  <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="z.B. Bundesleitung Februar 2026"
                    className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Datum</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm" />
                </div>

                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

                <button onClick={handleImport} disabled={loading || !file || !title}
                  className="flex items-center gap-2 rounded-lg bg-dpsg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-dpsg-blue-light disabled:opacity-50">
                  <Upload className="h-4 w-4" /> {loading ? 'Importiere...' : 'Importieren'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
