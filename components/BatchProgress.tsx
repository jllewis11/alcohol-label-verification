'use client';

import { useState } from 'react';
import { VerificationResult } from '@/lib/types';

export type ItemStatus = 'queued' | 'processing' | 'done';

export interface BatchResultItem {
  id: string;
  fileName: string;
  preview: string;
  status: ItemStatus;
  result?: VerificationResult;
  error?: string;
}

interface Props {
  items: BatchResultItem[];
}

const overallColors = {
  approved: 'text-green-700 bg-green-100 border-green-200',
  rejected: 'text-red-700 bg-red-100 border-red-200',
  needs_review: 'text-yellow-700 bg-yellow-100 border-yellow-200',
};

const borderColors = {
  approved: 'border-green-300',
  rejected: 'border-red-300',
  needs_review: 'border-yellow-300',
};

export default function BatchProgress({ items }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const done = items.filter((i) => i.status === 'done');
  const approved = done.filter((i) => i.result?.overallStatus === 'approved').length;
  const rejected = done.filter((i) => i.result?.overallStatus === 'rejected').length;
  const needsReview = done.filter((i) => i.result?.overallStatus === 'needs_review').length;
  const errors = done.filter((i) => i.error).length;

  return (
    <div className="flex flex-col gap-4">
      {done.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">
            {done.length} / {items.length} complete
          </span>
          <span className="text-sm text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{approved} approved</span>
          <span className="text-sm text-red-700 bg-red-100 px-2 py-0.5 rounded-full">{rejected} rejected</span>
          <span className="text-sm text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{needsReview} needs review</span>
          {errors > 0 && (
            <span className="text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{errors} errors</span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          const borderClass = item.result ? borderColors[item.result.overallStatus] : 'border-gray-200';

          return (
            <div
              key={item.id}
              className={`border rounded-xl overflow-hidden bg-white transition-all ${borderClass}`}
            >
              {/* Row */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                aria-expanded={isExpanded}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt={`Label ${idx + 1}`}
                  className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.fileName}</p>
                  {item.status === 'queued' && <p className="text-xs text-gray-400">Queued</p>}
                  {item.status === 'processing' && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-2/3" />
                      </div>
                      <span className="text-xs text-blue-600 whitespace-nowrap">Processing...</span>
                    </div>
                  )}
                  {item.status === 'done' && item.error && (
                    <p className="text-xs text-red-600 mt-0.5">Error: {item.error}</p>
                  )}
                  {item.status === 'done' && item.result && (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${overallColors[item.result.overallStatus]}`}>
                        {item.result.overallStatus.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{item.result.processingTimeMs} ms</span>
                      <span className="text-xs text-gray-400">
                        {item.result.fields.filter((f) => f.status === 'pass').length}/{item.result.fields.length} fields pass
                      </span>
                    </div>
                  )}
                </div>
                {item.status === 'done' && (
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Expanded view */}
              {isExpanded && item.result && (
                <div className="border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-0">
                  {/* Label image */}
                  <div className="flex items-center justify-center bg-gray-50 p-4 border-b sm:border-b-0 sm:border-r border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt="Label"
                      className="max-h-72 max-w-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                  {/* Field results */}
                  <div className="p-3 flex flex-col gap-1.5 overflow-y-auto max-h-80">
                    {item.result.fields.map((f) => (
                      <div key={f.field} className={`flex items-start gap-2 text-xs rounded-lg px-2.5 py-2
                        ${f.status === 'pass' ? 'bg-green-50' : f.status === 'fail' ? 'bg-red-50' : f.status === 'warning' ? 'bg-yellow-50' : 'bg-gray-50'}`}
                      >
                        <span className={`font-bold mt-0.5 flex-shrink-0
                          ${f.status === 'pass' ? 'text-green-600' : f.status === 'fail' ? 'text-red-600' : f.status === 'warning' ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {f.status === 'pass' ? '✓' : f.status === 'fail' ? '✗' : f.status === 'warning' ? '⚠' : '?'}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-gray-700">{f.field}</span>
                          {f.labelValue && <span className="text-gray-500 ml-1">— {f.labelValue}</span>}
                          {f.note && <p className="text-gray-500 italic mt-0.5">{f.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
