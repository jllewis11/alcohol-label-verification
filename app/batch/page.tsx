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

  const anyExtracting = items.some((i) => i.extracting);

  const isReady = items.length > 0 && !anyExtracting && items.every((item) => {
    const d = item.applicationData;
    return d.brandName.trim() && d.classType.trim() && d.alcoholContent.trim() &&
      d.netContents.trim() && d.bottlerInfo.trim() && d.governmentWarning.trim();
  });

  const handleVerifyAll = async () => {
    if (!isReady) return;
    setLoading(true);
    setError(null);

    setResults(items.map((item) => ({
      id: item.id,
      fileName: item.file.name,
      preview: item.preview,
      status: 'processing',
    })));

    try {
      const batchItems = await Promise.all(
        items.map(async (item) => {
          const bytes = await item.file.arrayBuffer();
          const base64 = Buffer.from(bytes).toString('base64');
          return { imageBase64: base64, mimeType: item.file.type, applicationData: item.applicationData };
        })
      );

      const fd = new FormData();
      fd.append('items', JSON.stringify(batchItems));

      const res = await fetch('/api/verify-batch', { method: 'POST', body: fd });
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Batch verification failed. Please try again.');
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed: { index: number; result: VerificationResult | null; error: string | null } = JSON.parse(line);
            setResults((prev) => {
              if (!prev) return prev;
              const next = [...prev];
              const item = items[parsed.index];
              if (!item) return next;
              const idx = next.findIndex((r) => r.id === item.id);
              if (idx === -1) return next;
              next[idx] = {
                ...next[idx],
                status: 'done',
                result: parsed.result ?? undefined,
                error: parsed.error ?? undefined,
              };
              return next;
            });
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header style={{ background: 'var(--navy)' }} className="px-6 py-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div style={{ width: 2, height: 32, background: 'rgba(255,255,255,0.25)' }} />
            <div>
              <h1 className="font-display text-white leading-none"
                style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                TTB Batch Verification
              </h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                ALCOHOL &amp; TOBACCO TAX AND TRADE BUREAU
              </p>
            </div>
          </div>
          <Link href="/"
            className="flex items-center gap-2 text-white transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              padding: '6px 14px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.07)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          >
            SINGLE LABEL
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* Left: batch upload + verify */}
          <div className="flex flex-col gap-4">
            {!results && (
              <div className="card p-5">
                <BatchUploader items={items} onChange={setItems} />
              </div>
            )}

            {error && (
              <div className="rounded-lg px-4 py-3 fade-up"
                style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--red)', fontWeight: 600 }}>ERROR</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--red)', marginTop: 4 }}>{error}</p>
              </div>
            )}

            {!results && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleVerifyAll}
                  disabled={!isReady || loading}
                  className="w-full py-3 px-6 transition-all"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.12em',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    background: isReady && !loading ? 'var(--navy)' : 'var(--border)',
                    color: isReady && !loading ? 'white' : 'var(--ink-faint)',
                    cursor: isReady && !loading ? 'pointer' : 'not-allowed',
                    boxShadow: isReady && !loading ? '0 2px 8px rgba(15,39,68,0.25)' : 'none',
                  }}
                >
                  {loading
                    ? `VERIFYING ${items.length} LABELS… ${(elapsed / 1000).toFixed(1)}s`
                    : anyExtracting
                    ? `READING… ${items.filter((i) => i.extracting).length} REMAINING`
                    : `VERIFY ALL — ${items.length} LABEL${items.length !== 1 ? 'S' : ''}`}
                </button>
                {items.length === 0 && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', textAlign: 'center', letterSpacing: '0.06em' }}>
                    Upload images above to begin
                  </p>
                )}
              </div>
            )}

            {results && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="field-label">Batch Results</p>
                  <button
                    type="button"
                    onClick={() => { setResults(null); setItems([]); setError(null); }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--navy)', letterSpacing: '0.06em', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                  >
                    NEW BATCH
                  </button>
                </div>
                <BatchProgress items={results} />
              </div>
            )}
          </div>

          {/* Right: stress test */}
          <div>
            <TestBatch />
          </div>

        </div>
      </main>
    </div>
  );
}
