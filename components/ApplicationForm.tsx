'use client';

import { ApplicationData } from '@/lib/types';
import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/validation';

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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="governmentWarning" className="field-label flex items-center gap-1">
            Government Warning
            <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
          </label>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            letterSpacing: '0.06em',
            color: 'var(--amber)',
            background: 'var(--amber-bg)',
            border: '1px solid var(--amber-border)',
            padding: '1px 6px',
            borderRadius: 3,
          }}>EXACT MATCH</span>
        </div>
        <textarea
          id="governmentWarning"
          value={data.governmentWarning}
          onChange={(e) => handleChange('governmentWarning', e.target.value)}
          rows={4}
          required
          className="w-full px-3 py-2 resize-none"
          style={{ fontSize: '0.75rem', lineHeight: 1.6 }}
        />
        <button
          type="button"
          onClick={() => handleChange('governmentWarning', CANONICAL_GOVERNMENT_WARNING)}
          style={{
            alignSelf: 'flex-start',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.06em',
            color: 'var(--navy)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            marginTop: 2,
          }}
        >
          Reset to canonical TTB text
        </button>
      </div>
    </div>
  );
}
