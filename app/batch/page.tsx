'use client';

import { useState, useEffect } from 'react';
import BatchUploader, { BatchItem } from '@/components/BatchUploader';
import BatchProgress, { BatchResultItem } from '@/components/BatchProgress';
import TestBatch from '@/components/TestBatch';
import Link from 'next/link';
import { VerificationResult } from '@/lib/types';

export default function BatchPage() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [results, setResults] = useState<BatchResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(interval);
  }, [loading]);

  const isReady = items.length > 0 && !loading;

  const handleVerifyAll = async () => {
    if (!isReady) return;
    setLoading(true);
    setError(null);

    const initialResults: BatchResultItem[] = items.map((item) => ({
      id: item.id,
      fileName: item.file.name,
      preview: item.preview,
      status: 'processing',
    }));
    setResults(initialResults);

    try {
      // Scan all items concurrently via /api/scan
      await Promise.allSettled(
        items.map(async (item) => {
          const fd = new FormData();
          fd.append('image', item.file);
          try {
            const res = await fetch('/api/scan', { method: 'POST', body: fd });
            const json = await res.json();
            setResults((prev) => {
              if (!prev) return prev;
              const next = [...prev];
              const idx = next.findIndex((r) => r.id === item.id);
              if (idx === -1) return next;
              next[idx] = {
                ...next[idx],
                status: 'done',
                result: res.ok ? (json as VerificationResult) : undefined,
                error: res.ok ? undefined : (json.error ?? 'Scan failed'),
              };
              return next;
            });
          } catch {
            setResults((prev) => {
              if (!prev) return prev;
              const next = [...prev];
              const idx = next.findIndex((r) => r.id === item.id);
              if (idx !== -1) next[idx] = { ...next[idx], status: 'done', error: 'Network error' };
              return next;
            });
          }
        })
      );
    } catch {
      setError('Batch scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">TTB Batch Label Verification</h1>
            <p className="text-xs text-gray-500 mt-0.5">Verify multiple labels at once — upload images and fill in application data</p>
          </div>
          <Link href="/" className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
            Single Label
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: manual batch upload */}
        <div className="flex flex-col gap-6">
        {!results && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <BatchUploader items={items} onChange={setItems} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-800">Batch Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {!results && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleVerifyAll}
              disabled={!isReady || loading}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-all
                ${isReady && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {loading
                ? `Scanning ${items.length} labels... ${(elapsed / 1000).toFixed(1)}s`
                : `Scan All (${items.length} label${items.length !== 1 ? 's' : ''})`}
            </button>
            {items.length === 0 && (
              <p className="text-xs text-center text-gray-400">Upload images above to begin</p>
            )}
          </div>
        )}

        {results && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Batch Results</h2>
              <button
                type="button"
                onClick={() => { setResults(null); setItems([]); setError(null); }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Start New Batch
              </button>
            </div>
            <BatchProgress items={results} />
          </div>
        )}
        </div>{/* end left column */}

        {/* Right: 100-label stress test */}
        <div>
          <TestBatch />
        </div>
        </div>{/* end grid */}
      </div>
    </main>
  );
}
