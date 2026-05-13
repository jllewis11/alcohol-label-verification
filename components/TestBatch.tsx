'use client';

import { useState, useEffect, useRef } from 'react';
import { generateTestLabels, TestLabel } from '@/lib/generateTestLabels';
import { VerificationResult } from '@/lib/types';

type CellStatus = 'idle' | 'running' | 'approved' | 'rejected' | 'needs_review' | 'error';

interface TestResult {
  label: TestLabel;
  status: CellStatus;
  result?: VerificationResult;
  error?: string;
  actualStatus?: 'approved' | 'rejected' | 'needs_review';
  matched?: boolean; // actual matches expected
}

type RunState = 'idle' | 'generating' | 'running' | 'done';

const TOTAL_PRESETS = [20, 50, 100, 200, 500];
const BATCH_SIZE_OPTIONS = [5, 10, 20, 50, 100];

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

const statusColors: Record<CellStatus, string> = {
  idle: 'bg-gray-200',
  running: 'bg-blue-300 animate-pulse',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  needs_review: 'bg-yellow-400',
  error: 'bg-gray-400',
};

const statusLabel: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  needs_review: 'Needs Review',
};

export default function TestBatch() {
  const [runState, setRunState] = useState<RunState>('idle');
  const [results, setResults] = useState<TestResult[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(100);
  const [batchSize, setBatchSize] = useState(20);
  const startRef = useRef<number>(0);

  const numBatches = Math.ceil(totalCount / batchSize);

  useEffect(() => {
    if (runState !== 'running') return;
    const interval = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
    return () => clearInterval(interval);
  }, [runState]);

  const done = results.filter((r) => r.status !== 'idle' && r.status !== 'running').length;
  const approvedCount = results.filter((r) => r.status === 'approved').length;
  const rejectedCount = results.filter((r) => r.status === 'rejected').length;
  const needsReviewCount = results.filter((r) => r.status === 'needs_review').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const wrongPredictions = results.filter((r) => r.status !== 'idle' && r.status !== 'running' && r.status !== 'error' && r.matched === false);

  const handleRun = async () => {
    setRunState('generating');
    setTotalTime(null);
    setElapsed(0);

    // Generate labels (runs in browser using Canvas API)
    await new Promise((resolve) => setTimeout(resolve, 50)); // let UI update
    const labels = generateTestLabels(totalCount);

    const initial: TestResult[] = labels.map((l) => ({ label: l, status: 'idle' }));
    setResults(initial);
    setRunState('running');
    startRef.current = Date.now();

    // Split into N chunks of batchSize, run all concurrently
    const chunks = chunk(labels, batchSize);

    await Promise.all(
      chunks.map(async (chunkLabels, chunkIdx) => {
        // Mark all in this chunk as running
        setResults((prev) => {
          const next = [...prev];
          chunkLabels.forEach((l) => {
            next[l.id] = { ...next[l.id], status: 'running' };
          });
          return next;
        });

        const items = chunkLabels.map((l) => ({
          imageBase64: l.imageBase64,
          mimeType: 'image/jpeg',
          applicationData: l.applicationData,
        }));

        const fd = new FormData();
        fd.append('items', JSON.stringify(items));

        try {
          const res = await fetch('/api/verify-batch', { method: 'POST', body: fd });
          if (!res.ok || !res.body) {
            setResults((prev) => {
              const next = [...prev];
              chunkLabels.forEach((l) => {
                next[l.id] = { ...next[l.id], status: 'error', error: 'Batch request failed' };
              });
              return next;
            });
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done: streamDone, value } = await reader.read();
            if (streamDone) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed: { index: number; result: VerificationResult | null; error: string | null } = JSON.parse(line);
                const globalIdx = chunkIdx * 20 + parsed.index;
                const label = labels[globalIdx];
                if (!label) continue;

                const actualStatus = parsed.result?.overallStatus ?? undefined;
                const cellStatus: CellStatus = parsed.error
                  ? 'error'
                  : (actualStatus as CellStatus) ?? 'error';

                setResults((prev) => {
                  const next = [...prev];
                  next[globalIdx] = {
                    ...next[globalIdx],
                    status: cellStatus,
                    result: parsed.result ?? undefined,
                    error: parsed.error ?? undefined,
                    actualStatus,
                    matched: actualStatus ? actualStatus === label.expectedStatus : undefined,
                  };
                  return next;
                });
              } catch {
                // skip
              }
            }
          }

          // Mark any still-running items in this chunk as errors (timeout/missing response)
          setResults((prev) => {
            const next = [...prev];
            chunkLabels.forEach((l) => {
              if (next[l.id].status === 'running') {
                next[l.id] = { ...next[l.id], status: 'error', error: 'No response received' };
              }
            });
            return next;
          });
        } catch {
          setResults((prev) => {
            const next = [...prev];
            chunkLabels.forEach((l) => {
              if (next[l.id].status === 'running') {
                next[l.id] = { ...next[l.id], status: 'error', error: 'Network error' };
              }
            });
            return next;
          });
        }
      })
    );

    const total = Date.now() - startRef.current;
    setTotalTime(total);
    setRunState('done');
  };

  const hovered = hoveredId !== null ? results[hoveredId] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Stress Test</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Generates synthetic labels and runs them as {numBatches} concurrent batch{numBatches !== 1 ? 'es' : ''} of {batchSize}
            </p>
          </div>
          {runState === 'idle' || runState === 'done' ? (
            <button
              type="button"
              onClick={handleRun}
              className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              {runState === 'done' ? 'Run Again' : 'Run Test'}
            </button>
          ) : (
            <div className="flex-shrink-0 flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {runState === 'generating' ? 'Generating...' : `${(elapsed / 1000).toFixed(1)}s`}
            </div>
          )}
        </div>

        {/* Controls — only shown when not running */}
        {(runState === 'idle' || runState === 'done') && (
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Labels</span>
              <div className="flex gap-1">
                {TOTAL_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTotalCount(n)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors
                      ${totalCount === n
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batch Size</span>
              <div className="flex gap-1">
                {BATCH_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setBatchSize(n)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors
                      ${batchSize === n
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 justify-end">
              <span className="text-xs text-gray-400 tabular-nums">
                {numBatches} concurrent batch{numBatches !== 1 ? 'es' : ''} × {batchSize} labels
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      {results.length > 0 && (
        <div className="flex gap-0 border-b border-gray-100">
          {[
            { label: 'Approved', count: approvedCount, color: 'text-green-700 bg-green-50 border-green-100' },
            { label: 'Rejected', count: rejectedCount, color: 'text-red-700 bg-red-50 border-red-100' },
            { label: 'Needs Review', count: needsReviewCount, color: 'text-yellow-700 bg-yellow-50 border-yellow-100' },
            { label: 'Errors', count: errorCount, color: 'text-gray-600 bg-gray-50 border-gray-100' },
            { label: 'Complete', count: done, color: 'text-blue-700 bg-blue-50 border-blue-100' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`flex-1 text-center py-2.5 border-r last:border-r-0 ${color}`}>
              <div className="text-lg font-bold tabular-nums">{count}</div>
              <div className="text-xs font-medium">{label}</div>
            </div>
          ))}
          {totalTime !== null && (
            <div className="flex-1 text-center py-2.5 border-l text-purple-700 bg-purple-50 border-purple-100">
              <div className="text-lg font-bold tabular-nums">{(totalTime / 1000).toFixed(1)}s</div>
              <div className="text-xs font-medium">Total Time</div>
            </div>
          )}
        </div>
      )}

      {runState === 'idle' && (
        <div className="p-6 text-center">
          <div className="flex justify-center mb-3">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${Math.min(totalCount, 20)}, minmax(0, 1fr))`, maxWidth: 360 }}
            >
              {Array.from({ length: Math.min(totalCount, 100) }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-sm bg-gray-200" />
              ))}
              {totalCount > 100 && (
                <div className="col-span-full text-xs text-gray-400 mt-1">+{totalCount - 100} more</div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-3">
            Press Run Test to generate and verify {totalCount} synthetic labels
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {[
              { label: `~${Math.round(totalCount * 0.2)} APPROVED`, color: 'bg-green-100 text-green-700' },
              { label: `~${Math.round(totalCount * 0.7)} REJECTED`, color: 'bg-red-100 text-red-700' },
              { label: `~${Math.round(totalCount * 0.1)} NEEDS REVIEW`, color: 'bg-yellow-100 text-yellow-700' },
            ].map(({ label, color }) => (
              <span key={label} className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{label}</span>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="p-5 flex flex-col gap-5">
          {/* Progress bar */}
          {runState === 'running' && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{done} / {totalCount} complete</span>
                <span>{(elapsed / 1000).toFixed(1)}s elapsed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(done / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Results grid — columns scale with total count */}
          <div className="relative">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${Math.min(results.length, 20)}, minmax(0, 1fr))` }}
            >
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`w-full aspect-square rounded-sm cursor-pointer transition-all hover:scale-110 hover:z-10 relative
                    ${statusColors[r.status]}
                    ${r.matched === false ? 'ring-2 ring-white ring-offset-1 ring-offset-orange-400' : ''}
                  `}
                  onMouseEnter={() => setHoveredId(i)}
                  onMouseLeave={() => setHoveredId(null)}
                  title={`#${i + 1} ${r.label.scenarioName}`}
                />
              ))}
            </div>

            {/* Tooltip */}
            {hovered && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-xl shadow-2xl z-20 pointer-events-none overflow-hidden"
                style={{ minWidth: 200, maxWidth: 260 }}>
                {/* Label image */}
                <div className="bg-gray-800 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/jpeg;base64,${hovered.label.imageBase64}`}
                    alt="Generated label"
                    className="max-h-32 max-w-full object-contain rounded"
                  />
                </div>
                <div className="px-3 py-2">
                  <div className="font-semibold">#{hovered.label.id + 1} — {hovered.label.scenarioName}</div>
                  {hovered.actualStatus && (
                    <div className="mt-0.5">
                      Result: <span className={
                        hovered.actualStatus === 'approved' ? 'text-green-400' :
                        hovered.actualStatus === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                      }>{statusLabel[hovered.actualStatus]}</span>
                      {' '}(expected: {statusLabel[hovered.label.expectedStatus] ?? hovered.label.expectedStatus})
                    </div>
                  )}
                  {hovered.status === 'running' && <div className="text-blue-300">Processing...</div>}
                  {hovered.status === 'idle' && <div className="text-gray-400">Queued</div>}
                  {hovered.error && <div className="text-red-300">Error: {hovered.error}</div>}
                  {hovered.result?.processingTimeMs && (
                    <div className="text-gray-400">{hovered.result.processingTimeMs}ms</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { color: 'bg-green-500', label: 'Approved' },
              { color: 'bg-red-500', label: 'Rejected' },
              { color: 'bg-yellow-400', label: 'Needs Review' },
              { color: 'bg-blue-300', label: 'Processing' },
              { color: 'bg-gray-200', label: 'Queued' },
              { color: 'bg-gray-400', label: 'Error' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${color}`} />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gray-400 ring-2 ring-orange-400 ring-offset-1" />
              <span className="text-gray-600">Unexpected result</span>
            </div>
          </div>

          {/* Flagged items */}
          {runState === 'done' && (wrongPredictions.length > 0 || rejectedCount > 0 || needsReviewCount > 0) && (
            <div className="flex flex-col gap-3">
              {wrongPredictions.length > 0 && (
                <div className="border border-orange-200 rounded-lg overflow-hidden">
                  <div className="bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800 border-b border-orange-200">
                    Unexpected Results ({wrongPredictions.length}) — actual differed from expected
                  </div>
                  <div className="divide-y divide-orange-100 max-h-48 overflow-y-auto">
                    {wrongPredictions.map((r) => (
                      <div key={r.label.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                        <span className="font-mono text-gray-500 w-8">#{r.label.id + 1}</span>
                        <span className="text-gray-700 flex-1">{r.label.scenarioName}</span>
                        <span className="text-gray-500">expected <strong>{statusLabel[r.label.expectedStatus]}</strong></span>
                        <span className="text-orange-700 font-medium">got {r.actualStatus ? statusLabel[r.actualStatus] : '?'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rejectedCount > 0 && (
                <details className="border border-red-200 rounded-lg overflow-hidden">
                  <summary className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 cursor-pointer hover:bg-red-100 border-b border-red-200">
                    Rejected Labels ({rejectedCount}) — click to expand
                  </summary>
                  <div className="divide-y divide-red-50 max-h-64 overflow-y-auto">
                    {results.filter((r) => r.status === 'rejected').map((r) => (
                      <div key={r.label.id} className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-gray-500 w-8">#{r.label.id + 1}</span>
                          <span className="font-medium text-gray-800">{r.label.applicationData.brandName || r.label.scenarioName}</span>
                          <span className="text-gray-500 flex-1">{r.label.scenarioName}</span>
                          <span className="text-gray-400">{r.result?.processingTimeMs}ms</span>
                        </div>
                        {r.result?.fields.filter((f) => f.status === 'fail').map((f) => (
                          <div key={f.field} className="ml-11 mt-0.5 text-red-600">
                            ✗ {f.field}: {f.note || `"${f.labelValue}" ≠ "${f.applicationValue}"`}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {needsReviewCount > 0 && (
                <details className="border border-yellow-200 rounded-lg overflow-hidden">
                  <summary className="bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800 cursor-pointer hover:bg-yellow-100 border-b border-yellow-200">
                    Needs Review ({needsReviewCount}) — requires agent attention
                  </summary>
                  <div className="divide-y divide-yellow-50 max-h-48 overflow-y-auto">
                    {results.filter((r) => r.status === 'needs_review').map((r) => (
                      <div key={r.label.id} className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-gray-500 w-8">#{r.label.id + 1}</span>
                          <span className="font-medium text-gray-800">{r.label.scenarioName}</span>
                          <span className="text-gray-400 flex-1">{r.result?.imageQualityNote ?? ''}</span>
                          <span className="text-gray-400">{r.result?.processingTimeMs}ms</span>
                        </div>
                        {r.result?.fields.filter((f) => f.status === 'unreadable' || f.status === 'warning').map((f) => (
                          <div key={f.field} className="ml-11 mt-0.5 text-yellow-700">
                            ⚠ {f.field}: {f.note || f.status}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Timing summary */}
          {runState === 'done' && totalTime !== null && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-200">
              <div className="font-semibold text-gray-800 mb-1">Timing Summary</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <span>Total wall time</span><span className="font-mono font-semibold">{(totalTime / 1000).toFixed(2)}s</span>
                <span>Avg per label</span><span className="font-mono font-semibold">{(totalTime / totalCount).toFixed(0)}ms</span>
                <span>Concurrency</span><span className="font-mono font-semibold">{numBatches} batch{numBatches !== 1 ? 'es' : ''} × {batchSize} labels</span>
                <span>Labels processed</span><span className="font-mono font-semibold">{totalCount}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
