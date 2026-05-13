'use client';

import { useCallback, useState } from 'react';
import { ApplicationData } from '@/lib/types';
import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/validation';

export interface BatchItem {
  id: string;
  file: File;
  preview: string;
  applicationData: ApplicationData;
  extracting?: boolean;
  extractError?: string;
}

interface Props {
  items: BatchItem[];
  onChange: (items: BatchItem[] | ((prev: BatchItem[]) => BatchItem[])) => void;
}

const emptyAppData = (): ApplicationData => ({
  brandName: '',
  classType: '',
  alcoholContent: '',
  netContents: '',
  bottlerInfo: '',
  countryOfOrigin: '',
  governmentWarning: CANONICAL_GOVERNMENT_WARNING,
});

async function extractFromFile(file: File): Promise<ApplicationData> {
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch('/api/extract', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Extraction failed');
  return json as ApplicationData;
}

export default function BatchUploader({ items, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const valid = ['image/jpeg', 'image/png', 'image/webp'];
      const newItems: BatchItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!valid.includes(file.type)) continue;
        newItems.push({
          id: `${Date.now()}-${i}`,
          file,
          preview: URL.createObjectURL(file),
          applicationData: emptyAppData(),
          extracting: true,
        });
      }

      if (newItems.length === 0) return;
      onChange([...items, ...newItems]);

      // Extract all new items concurrently
      await Promise.all(
        newItems.map(async (item) => {
          try {
            const appData = await extractFromFile(item.file);
            onChange((prev: BatchItem[]) =>
              prev.map((p) =>
                p.id === item.id ? { ...p, applicationData: appData, extracting: false } : p
              )
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Could not read label';
            onChange((prev: BatchItem[]) =>
              prev.map((p) =>
                p.id === item.id ? { ...p, extracting: false, extractError: msg } : p
              )
            );
          }
        })
      );
    },
    [items, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const updateItem = (id: string, key: keyof ApplicationData, value: string) => {
    onChange(items.map((item) =>
      item.id === id ? { ...item, applicationData: { ...item.applicationData, [key]: value } } : item
    ));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload multiple label images"
        />
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-gray-700">Drop label images here</p>
          <p className="text-xs text-gray-500">Fields auto-filled by AI — JPG, PNG, WebP</p>
        </div>
      </div>

      {items.map((item, idx) => {
        const isExpanded = expandedId === item.id;
        return (
          <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt={`Label ${idx + 1}`} className="w-16 h-16 object-contain rounded border bg-white flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">Label {idx + 1} — {item.file.name}</p>
                {item.extracting && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-blue-600">Reading label fields...</span>
                  </div>
                )}
                {!item.extracting && item.extractError && (
                  <p className="text-xs text-red-500 mt-0.5">{item.extractError} — fill fields manually</p>
                )}
                {!item.extracting && !item.extractError && item.applicationData.brandName && (
                  <p className="text-xs text-green-600 mt-0.5">✓ Fields extracted — review below</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {isExpanded ? 'Hide' : 'View Label'}
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded flex-shrink-0"
                aria-label={`Remove label ${idx + 1}`}
              >
                Remove
              </button>
            </div>

            {/* Full label preview */}
            {isExpanded && (
              <div className="bg-gray-100 flex justify-center p-4 border-b border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt={`Full label ${idx + 1}`} className="max-h-80 max-w-full object-contain rounded-lg shadow" />
              </div>
            )}

            {/* Editable fields */}
            <div className={`p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${item.extracting ? 'opacity-40 pointer-events-none' : ''}`}>
              {([
                ['brandName', 'Brand Name', true],
                ['classType', 'Class / Type', true],
                ['alcoholContent', 'Alcohol Content', true],
                ['netContents', 'Net Contents', true],
                ['bottlerInfo', 'Bottler Info', true],
                ['countryOfOrigin', 'Country of Origin', false],
              ] as [keyof ApplicationData, string, boolean][]).map(([key, label, required]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={item.applicationData[key] ?? ''}
                    onChange={(e) => updateItem(item.id, key, e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={required}
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Government Warning <span className="text-red-500">*</span>
                  <span className="ml-1 text-amber-600">(exact match)</span>
                </label>
                <textarea
                  value={item.applicationData.governmentWarning}
                  onChange={(e) => updateItem(item.id, 'governmentWarning', e.target.value)}
                  rows={3}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
