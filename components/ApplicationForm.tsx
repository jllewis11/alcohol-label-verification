'use client';

import { ApplicationData } from '@/lib/types';
import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/validation';

interface ApplicationFormProps {
  data: ApplicationData;
  onChange: (data: ApplicationData) => void;
}

const fields: { key: keyof ApplicationData; label: string; required: boolean; placeholder: string }[] = [
  { key: 'brandName', label: 'Brand Name', required: true, placeholder: 'e.g. Stone\'s Throw' },
  { key: 'classType', label: 'Class / Type', required: true, placeholder: 'e.g. American Whiskey' },
  { key: 'alcoholContent', label: 'Alcohol Content (ABV)', required: true, placeholder: 'e.g. 45% Alc./Vol. (90 Proof)' },
  { key: 'netContents', label: 'Net Contents', required: true, placeholder: 'e.g. 750 mL' },
  { key: 'bottlerInfo', label: 'Bottler Information', required: true, placeholder: 'e.g. Bottled by XYZ Distillery, City, State 12345' },
  { key: 'countryOfOrigin', label: 'Country of Origin', required: false, placeholder: 'e.g. USA' },
];

export default function ApplicationForm({ data, onChange }: ApplicationFormProps) {
  const handleChange = (key: keyof ApplicationData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Application Data</h2>

      {fields.map(({ key, label, required, placeholder }) => (
        <div key={key} className="flex flex-col gap-1">
          <label htmlFor={key} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            id={key}
            type="text"
            value={data[key] ?? ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholder}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={required}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1">
        <label htmlFor="governmentWarning" className="text-sm font-medium text-gray-700">
          Government Warning Statement
          <span className="text-red-500 ml-1">*</span>
          <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Exact match required</span>
        </label>
        <textarea
          id="governmentWarning"
          value={data.governmentWarning}
          onChange={(e) => handleChange('governmentWarning', e.target.value)}
          rows={4}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none"
          required
        />
        <button
          type="button"
          onClick={() => handleChange('governmentWarning', CANONICAL_GOVERNMENT_WARNING)}
          className="self-start text-xs text-blue-600 hover:text-blue-800 underline mt-1"
        >
          Reset to canonical TTB text
        </button>
      </div>
    </div>
  );
}
