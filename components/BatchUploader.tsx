'use client';

import { useCallback } from 'react';
import { ApplicationData } from '@/lib/types';
import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/validation';

export interface BatchItem {
  id: string;
  file: File;
  preview: string;
  applicationData: ApplicationData;
}

interface Props {
  items: BatchItem[];
  onChange: (items: BatchItem[]) => void;
}

const defaultAppData = (): ApplicationData => ({
  brandName: '',
  classType: '',
  alcoholContent: '',
  netContents: '',
  bottlerInfo: '',
  countryOfOrigin: '',
  governmentWarning: CANONICAL_GOVERNMENT_WARNING,
});

export default function BatchUploader({ items, onChange }: Props) {
  const handleFiles = useCallback(
    (files: FileList) => {
      const valid = ['image/jpeg', 'image/png', 'image/webp'];
      const newItems: BatchItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!valid.includes(file.type)) continue;
        newItems.push({
          id: `${Date.now()}-${i}`,
          file,
          preview: URL.createObjectURL(file),
          applicationData: defaultAppData(),
        });
      }
      onChange([...items, ...newItems]);
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
          <p className="text-sm font-medium text-gray-700">Drop multiple label images here</p>
          <p className="text-xs text-gray-500">JPG, PNG, WebP — click to browse</p>
        </div>
      </div>

      {items.map((item, idx) => (
        <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt={`Label ${idx + 1}`} className="w-16 h-16 object-contain rounded border bg-white" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Label {idx + 1}</p>
              <p className="text-xs text-gray-500">{item.file.name}</p>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded"
              aria-label={`Remove label ${idx + 1}`}
            >
              Remove
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      ))}
    </div>
  );
}
