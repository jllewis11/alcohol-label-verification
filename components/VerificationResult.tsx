'use client';

import { FieldResult, VerificationResult as VerificationResultType } from '@/lib/types';

interface Props {
  result: VerificationResultType;
}

const statusConfig = {
  approved: { label: 'APPROVED', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  rejected: { label: 'REJECTED', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  needs_review: { label: 'NEEDS REVIEW', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
};

const fieldStatusIcon = {
  pass: { icon: '✓', color: 'text-green-600', bg: 'bg-green-50' },
  fail: { icon: '✗', color: 'text-red-600', bg: 'bg-red-50' },
  warning: { icon: '⚠', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  unreadable: { icon: '?', color: 'text-gray-500', bg: 'bg-gray-50' },
};

const fieldLabels: Record<string, string> = {
  brandName: 'Brand Name',
  classType: 'Class / Type',
  alcoholContent: 'Alcohol Content',
  netContents: 'Net Contents',
  bottlerInfo: 'Bottler Information',
  countryOfOrigin: 'Country of Origin',
  governmentWarning: 'Government Warning',
};

function FieldRow({ field, isGovWarning }: { field: FieldResult; isGovWarning: boolean }) {
  const icon = fieldStatusIcon[field.status];
  return (
    <div className={`rounded-lg border p-3 ${isGovWarning ? 'border-2 border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${icon.color} ${icon.bg}`}>
          {icon.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">
              {fieldLabels[field.field] ?? field.field}
            </span>
            {isGovWarning && (
              <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Exact match required
              </span>
            )}
            <span className="text-xs text-gray-400 uppercase">{field.matchType}</span>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-500 uppercase tracking-wide">Application</span>
              <p className="mt-0.5 text-gray-700 break-words">{field.applicationValue || '—'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500 uppercase tracking-wide">Label (extracted)</span>
              <p className="mt-0.5 text-gray-700 break-words">{field.labelValue || '—'}</p>
            </div>
          </div>
          {field.note && (
            <p className="mt-2 text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2">{field.note}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerificationResult({ result }: Props) {
  const status = statusConfig[result.overallStatus];

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-xl border-2 ${status.border} ${status.bg} p-4 flex items-center justify-between`}>
        <div>
          <span className={`text-2xl font-extrabold tracking-wider ${status.text}`}>{status.label}</span>
          {result.imageQualityNote && (
            <p className="text-xs text-gray-600 mt-1">{result.imageQualityNote}</p>
          )}
        </div>
        <span className="text-xs text-gray-500 tabular-nums">{result.processingTimeMs} ms</span>
      </div>

      <div className="flex flex-col gap-2">
        {result.fields.map((field) => (
          <FieldRow
            key={field.field}
            field={field}
            isGovWarning={field.field === 'governmentWarning'}
          />
        ))}
      </div>
    </div>
  );
}
