'use client';

import { ApplicationData } from '@/lib/types';

interface ApplicationFormProps {
  data: ApplicationData;
  onChange: (data: ApplicationData) => void;
}

const fields: { key: keyof ApplicationData; label: string; required: boolean; placeholder: string }[] = [
  { key: 'brandName',      label: 'Brand Name',          required: true,  placeholder: "e.g. Stone's Throw" },
  { key: 'classType',      label: 'Class / Type',         required: true,  placeholder: 'e.g. Kentucky Straight Bourbon Whiskey' },
  { key: 'alcoholContent', label: 'Alcohol Content',      required: true,  placeholder: 'e.g. 45% Alc./Vol. (90 Proof)' },
  { key: 'netContents',    label: 'Net Contents',         required: true,  placeholder: 'e.g. 750 mL' },
  { key: 'bottlerInfo',    label: 'Bottler Information',  required: true,  placeholder: 'e.g. Bottled by XYZ Distillery, City, State' },
  { key: 'countryOfOrigin',label: 'Country of Origin',   required: false, placeholder: 'e.g. USA' },
];

export default function ApplicationForm({ data, onChange }: ApplicationFormProps) {
  const handleChange = (key: keyof ApplicationData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ height: 1, flex: 1, background: 'var(--border-light)' }} />
        <p className="field-label">Application Data</p>
        <div style={{ height: 1, flex: 1, background: 'var(--border-light)' }} />
      </div>

      {fields.map(({ key, label, required, placeholder }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label htmlFor={key} className="field-label flex items-center gap-1">
            {label}
            {required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
          </label>
          <input
            id={key}
            type="text"
            value={data[key] ?? ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full px-3 py-2"
            style={{ fontSize: '0.8125rem' }}
          />
        </div>
      ))}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 6,
        background: 'var(--green-bg)',
        border: '1px solid var(--green-border)',
      }}>
        <svg style={{ width: 14, height: 14, color: 'var(--green)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--green)', fontWeight: 600 }}>
            CANONICAL TTB WARNING LOCKED
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--green)', opacity: 0.75, marginTop: 1 }}>
            Exact match enforced automatically
          </p>
        </div>
      </div>
    </div>
  );
}
