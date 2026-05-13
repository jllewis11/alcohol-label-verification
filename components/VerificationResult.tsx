'use client';

import { FieldResult, VerificationResult as VerificationResultType } from '@/lib/types';

interface Props {
  result: VerificationResultType;
}

const statusConfig = {
  approved:    { label: 'APPROVED',    class: 'badge-approved' },
  rejected:    { label: 'REJECTED',    class: 'badge-rejected' },
  needs_review:{ label: 'NEEDS REVIEW', class: 'badge-needs-review' },
};

const fieldStatusStyle: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  pass:       { icon: '✓', color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)' },
  fail:       { icon: '✗', color: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)' },
  warning:    { icon: '▲', color: 'var(--amber)',  bg: 'var(--amber-bg)',  border: 'var(--amber-border)' },
  unreadable: { icon: '?', color: 'var(--ink-faint)', bg: 'var(--cream-dark)', border: 'var(--border)' },
};

const fieldLabels: Record<string, string> = {
  brandName:        'Brand Name',
  classType:        'Class / Type',
  alcoholContent:   'Alcohol Content',
  netContents:      'Net Contents',
  bottlerInfo:      'Bottler Info',
  countryOfOrigin:  'Country of Origin',
  governmentWarning:'Government Warning',
};

function FieldRow({ field }: { field: FieldResult }) {
  const s = fieldStatusStyle[field.status] ?? fieldStatusStyle.unreadable;
  const isGov = field.field === 'governmentWarning';

  return (
    <div style={{
      border: `1px solid ${isGov ? 'var(--amber-border)' : s.border}`,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      {/* Field header */}
      <div style={{
        background: isGov ? 'var(--amber-bg)' : s.bg,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: `1px solid ${isGov ? 'var(--amber-border)' : s.border}`,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: s.color,
          width: 18,
          textAlign: 'center',
          flexShrink: 0,
        }}>{s.icon}</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--ink-muted)',
          flex: 1,
        }}>
          {fieldLabels[field.field] ?? field.field}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isGov && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              letterSpacing: '0.06em',
              color: 'var(--amber)',
              background: 'white',
              border: '1px solid var(--amber-border)',
              padding: '1px 5px',
              borderRadius: 2,
            }}>EXACT</span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.05em',
            color: s.color,
            fontWeight: 700,
          }}>{field.status.toUpperCase()}</span>
        </div>
      </div>
      {/* Values */}
      <div style={{ background: 'white', padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--ink-faint)', marginBottom: 3 }}>APPLICATION</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink)', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {field.applicationValue || '—'}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--ink-faint)', marginBottom: 3 }}>EXTRACTED FROM LABEL</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink)', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {field.labelValue || '—'}
          </p>
        </div>
      </div>
      {field.note && (
        <div style={{ background: 'var(--cream-dark)', padding: '6px 12px', borderTop: `1px solid ${s.border}` }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: s.color, fontStyle: 'italic' }}>
            {field.note}
          </p>
        </div>
      )}
    </div>
  );
}

export default function VerificationResult({ result }: Props) {
  const { label, class: cls } = statusConfig[result.overallStatus];

  return (
    <div className="flex flex-col gap-3">
      {/* Overall status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderRadius: 6,
        border: '1.5px solid',
        borderColor: result.overallStatus === 'approved' ? 'var(--green-border)' : result.overallStatus === 'rejected' ? 'var(--red-border)' : 'var(--amber-border)',
        background: result.overallStatus === 'approved' ? 'var(--green-bg)' : result.overallStatus === 'rejected' ? 'var(--red-bg)' : 'var(--amber-bg)',
      }}>
        <span className={`font-display ${cls}`} style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          padding: '2px 10px',
          borderRadius: 4,
        }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.04em', color: 'var(--ink-faint)' }}>
          {result.processingTimeMs} ms
        </span>
      </div>

      {result.imageQualityNote && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)', fontStyle: 'italic', padding: '0 4px' }}>
          {result.imageQualityNote}
        </p>
      )}

      {/* Field rows */}
      <div className="flex flex-col gap-2">
        {result.fields.map((field) => (
          <FieldRow key={field.field} field={field} />
        ))}
      </div>
    </div>
  );
}
