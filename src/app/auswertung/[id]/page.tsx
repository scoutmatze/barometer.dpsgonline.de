
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Presentation } from 'lucide-react';
import ResultsView from '@/components/ResultsView';

export default function AuswertungDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/surveys/' + id + '/results')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-dpsg-gray-400">Laden...</div>;
  if (!data?.survey) return <div className="flex min-h-screen items-center justify-center text-sm text-red-600">Nicht gefunden</div>;

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/auswertung')} className="opacity-70 hover:opacity-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="text-base font-bold">{data.survey.title}</div>
              <div className="text-xs opacity-50">{data.survey.subtitle} &middot; {data.responses.length} Rückmeldungen</div>
            </div>
          </div>
          <button onClick={() => router.push('/praesentation/' + id)}
            className="flex items-center gap-1 rounded-lg bg-dpsg-red px-3 py-1.5 text-xs font-semibold hover:bg-dpsg-red-light">
            <Presentation className="h-3 w-3" /> Präsentation
          </button>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <ResultsView data={data} />
      </div>
    </div>
  );
}
