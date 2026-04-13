
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Presentation, Link2, Copy, Check, QrCode } from 'lucide-react';
import ResultsView from '@/components/ResultsView';

export default function AdminResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/surveys/' + id + '/results')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [id]);

  function copyLink() {
    const url = window.location.origin + '/umfrage/open/' + id;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-dpsg-gray-400">Laden...</div>;
  if (!data?.survey) return <div className="flex min-h-screen items-center justify-center text-sm text-red-600">Nicht gefunden</div>;

  const survey = data.survey;

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="opacity-70 hover:opacity-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="text-base font-bold">{survey.title}</div>
              <div className="text-xs opacity-50">{survey.subtitle} &middot; {data.responses.length} Rückmeldungen</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLink}
              className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Kopiert!' : 'Link kopieren'}
            </button>
            <button onClick={() => router.push('/praesentation/' + id)}
              className="flex items-center gap-1 rounded-lg bg-dpsg-red px-3 py-1.5 text-xs font-semibold hover:bg-dpsg-red-light">
              <Presentation className="h-3 w-3" /> Präsentation
            </button>
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {data.responses.length === 0 ? (
          <div className="rounded-xl border border-dpsg-gray-200 bg-white py-16 text-center">
            <p className="text-sm text-dpsg-gray-500">Noch keine Rückmeldungen eingegangen.</p>
            {survey.status === 'draft' && (
              <p className="mt-2 text-xs text-dpsg-gray-400">Aktiviere die Umfrage, um Teilnahme-Links zu versenden.</p>
            )}
          </div>
        ) : (
          <ResultsView data={data} />
        )}
      </div>
    </div>
  );
}
