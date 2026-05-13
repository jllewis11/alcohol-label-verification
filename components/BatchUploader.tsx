'use client';

import { useCallback, useState } from 'react';

export interface BatchItem {
  id: string;
  file: File;
  preview: string;
}

interface Props {
  items: BatchItem[];
  onChange: (items: BatchItem[]) => void;
}

export default function BatchUploader({ items, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        });
      }
      if (newItems.length > 0) onChange([...items, ...newItems]);
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
          <p className="text-xs text-gray-500">AI scans each label for TTB compliance — JPG, PNG, WebP</p>
        </div>
      </div>

      {items.map((item, idx) => {
        const isExpanded = expandedId === item.id;
        return (
          <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 p-3 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt={`Label ${idx + 1}`} className="w-16 h-16 object-contain rounded border bg-white flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">Label {idx + 1}</p>
                <p className="text-xs text-gray-500 truncate">{item.file.name}</p>
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
            {isExpanded && (
              <div className="bg-gray-100 flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="Full label" className="max-h-80 max-w-full object-contain rounded-lg shadow" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
