'use client';

import { useCallback, useState } from 'react';

interface LabelUploaderProps {
  onImageSelected: (file: File) => void;
  selectedFile: File | null;
}

export default function LabelUploader({ onImageSelected, selectedFile }: LabelUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const valid = ['image/jpeg', 'image/png', 'image/webp'];
    if (!valid.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    onImageSelected(file);
    setPreview(URL.createObjectURL(file));
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col gap-3">
      <label className="field-label">Label Image</label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className="relative transition-all"
        style={{
          border: `2px dashed ${dragOver ? 'var(--navy)' : 'var(--border)'}`,
          borderRadius: 6,
          padding: 20,
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(15,39,68,0.04)' : 'var(--cream)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
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
            <img src={preview} alt="Label preview"
              className="max-h-56 max-w-full object-contain rounded shadow-sm" />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
              {selectedFile.name}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--navy)', letterSpacing: '0.06em' }}>
              CLICK OR DRAG TO REPLACE
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <svg style={{ width: 40, height: 40, color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 500 }}>Drag label image here</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', letterSpacing: '0.05em', marginTop: 4 }}>
                OR CLICK TO BROWSE — JPG · PNG · WEBP
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
