'use client';

import { useCallback, useState } from 'react';

interface LabelUploaderProps {
  onImageSelected: (file: File) => void;
  selectedFile: File | null;
}

export default function LabelUploader({ onImageSelected, selectedFile }: LabelUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      const valid = ['image/jpeg', 'image/png', 'image/webp'];
      if (!valid.includes(file.type)) {
        alert('Please upload a JPG, PNG, or WebP image.');
        return;
      }
      onImageSelected(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm font-semibold text-gray-700">Upload Label Image</label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload label image file"
        />
        {preview && selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Label preview" className="max-h-64 max-w-full rounded-lg object-contain shadow" />
            <span className="text-xs text-gray-500">{selectedFile.name}</span>
            <span className="text-xs text-blue-600 font-medium">Click or drag to replace</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">Drag and drop label image here</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse — JPG, PNG, WebP accepted</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
