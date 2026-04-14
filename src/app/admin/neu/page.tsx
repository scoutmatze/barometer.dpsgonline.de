
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList } from 'lucide-react';

export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('BL');
  const [agendaText, setAgendaText] = useState('');
  const [emails, setEmails] = useState('');
  const [openAccess, setOpenAccess] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!title.trim()) { setError('Titel ist erforderlich'); return; }
    setSaving(true);
    setError('');

    const agendaItems = agendaText.split('\n').map(s => s.trim()).filter(Boolean);
    const emailList = emails.split('\n').map(s => s.trim()).filter(s => s.includes('@'));

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          survey_date: date || null,
          category: category.trim() || 'BL',
          agenda_items: agendaItems,
          emails: emailList,
          open_access_enabled: openAccess,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Fehler beim Speichern'); return; }
      router.push('/admin');
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setSaving(false);
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
            <div className="text-base font-bold">Neue Sitzung</div>
            <div className="text-xs opacity-50">BL-O-Meter</div>
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border border-dpsg-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-dpsg-blue" />
            <h2 className="text-lg font-bold text-dpsg-gray-900">Sitzung anlegen</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Kürzel / Titel *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. BL II/2026"
                className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Beschreibung</label>
              <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="z.B. Bundesleitung Mai 2026"
                className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Datum</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">Kategorie</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="z.B. BL, Mitarbeitende, Veranstaltung"
                className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20"
                list="category-suggestions" />
              <datalist id="category-suggestions">
                <option value="BL" />
                <option value="Mitarbeitende" />
                <option value="Veranstaltung" />
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">
                Tagesordnungspunkte (einer pro Zeile)
              </label>
              <textarea value={agendaText} onChange={e => setAgendaText(e.target.value)}
                placeholder={"Strategie\nHaushalt\nZAT\n..."} rows={8}
                className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm font-[inherit] focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-dpsg-gray-600">
                E-Mail-Adressen für Teilnahme-Links (eine pro Zeile)
              </label>
              <textarea value={emails} onChange={e => setEmails(e.target.value)}
                placeholder={"name1@dpsg1300.de\nname2@dpsg1300.de"} rows={4}
                className="w-full rounded-lg border border-dpsg-gray-200 bg-white px-3 py-2 text-sm font-[inherit] focus:border-dpsg-blue focus:outline-none focus:ring-2 focus:ring-dpsg-blue/20" />
              <p className="mt-1 text-xs text-dpsg-gray-400">
                Jede Adresse erhält einen individuellen, einmaligen Teilnahme-Link.
                Die Zuordnung E-Mail zu Token wird nach Abschluss der Umfrage gelöscht.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="openAccess" checked={openAccess} onChange={e => setOpenAccess(e.target.checked)}
                className="h-4 w-4 rounded border-dpsg-gray-300 accent-dpsg-blue" />
              <label htmlFor="openAccess" className="text-sm text-dpsg-gray-700">
                Offenen Zugang aktivieren (für Teams-Link ohne E-Mail-Einladung)
              </label>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="rounded-lg bg-dpsg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-dpsg-blue-light disabled:opacity-50">
                {saving ? 'Speichern...' : 'Sitzung erstellen'}
              </button>
              <button onClick={() => router.push('/admin')}
                className="rounded-lg bg-dpsg-gray-100 px-5 py-2.5 text-sm font-semibold text-dpsg-gray-700 hover:bg-dpsg-gray-200">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
