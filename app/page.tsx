'use client';

import { useState, useEffect } from 'react';
import LabelUploader from '@/components/LabelUploader';
import CameraCapture from '@/components/CameraCapture';
import ApplicationForm from '@/components/ApplicationForm';
import VerificationResultComponent from '@/components/VerificationResult';
import { ApplicationData, VerificationResult } from '@/lib/types';
import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/validation';
import Link from 'next/link';

const defaultData = (): ApplicationData => ({
  brandName: '',
  classType: '',
  alcoholContent: '',
  netContents: '',
  bottlerInfo: '',
  countryOfOrigin: '',
  governmentWarning: CANONICAL_GOVERNMENT_WARNING,
});

function isFormComplete(image: File | null, data: ApplicationData): boolean {
  return !!(
    image &&
    data.brandName.trim() &&
    data.classType.trim() &&
    data.alcoholContent.trim() &&
    data.netContents.trim() &&
    data.bottlerInfo.trim() &&
    data.governmentWarning.trim()
  );
}

type InputTab = 'upload' | 'camera';

export default function Home() {
  const [tab, setTab] = useState<InputTab>('upload');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [appData, setAppData] = useState<ApplicationData>(defaultData());
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [scanBanner, setScanBanner] = useState(false);

  useEffect(() => {
    if (!image) { setImagePreview(null); return; }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(interval);
  }, [loading]);

  const handleCapture = async (file: File) => {
    setImage(file);
    setResult(null);
    setError(null);
    setScanBanner(false);
    setExtracting(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not read label. Try a clearer photo.');
      } else {
        setAppData(json as ApplicationData);
        setScanBanner(true);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleVerify = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setError(null);
    const fd = new FormData();
    fd.append('image', image);
    fd.append('applicationData', JSON.stringify(appData));
    try {
      const res = await fetch('/api/verify', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Verification failed. Please try again.');
      } else {
        setResult(json);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const ready = isFormComplete(image, appData) && !loading && !extracting;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header style={{ background: 'var(--navy)' }} className="px-6 py-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div style={{ width: 2, height: 32, background: 'rgba(255,255,255,0.25)' }} />
            <div>
              <h1
                className="font-display text-white leading-none"
                style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' }}
              >
                TTB Label Verification
              </h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                ALCOHOL &amp; TOBACCO TAX AND TRADE BUREAU
              </p>
            </div>
          </div>
          <Link
            href="/batch"
            className="flex items-center gap-2 text-white transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              padding: '6px 14px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.07)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          >
            BATCH VERIFY
          </Link>
        </div>
      </header>

      {/* Step bar */}
      <div style={{ background: 'var(--navy-light)', borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-6 flex-wrap">
          {[
            { n: '01', text: 'Upload or photograph label' },
            { n: '02', text: 'Review extracted fields' },
            { n: '03', text: 'Verify against application' },
            { n: '04', text: 'Review result' },
          ].map(({ n, text }, i, arr) => (
            <div key={n} className="flex items-center gap-2">
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.05em',
              }}>{n}</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.01em' }}>{text}</span>
              {i < arr.length - 1 && (
                <span style={{ color: 'rgba(255,255,255,0.18)', marginLeft: 4, fontSize: '0.75rem' }}>›</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* LEFT: Input */}
          <div className="flex flex-col gap-4">

            {/* Tab switcher + upload/camera */}
            <div className="card overflow-hidden">
              <div style={{ borderBottom: '1px solid var(--border)' }} className="flex">
                {(['upload', 'camera'] as InputTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 transition-colors"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                      fontWeight: 500,
                      color: tab === t ? 'var(--navy)' : 'var(--ink-faint)',
                      background: tab === t ? 'var(--cream)' : 'white',
                      borderBottom: tab === t ? '2px solid var(--navy)' : '2px solid transparent',
                    }}
                  >
                    {t === 'upload' ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {t === 'upload' ? 'UPLOAD IMAGE' : 'USE CAMERA'}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {tab === 'upload'
                  ? <LabelUploader onImageSelected={handleCapture} selectedFile={image} />
                  : <CameraCapture onCapture={handleCapture} />
                }
              </div>
            </div>

            {/* Status banners */}
            {scanBanner && (
              <div className="flex items-center justify-between rounded-lg px-4 py-3 fade-up"
                style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--green)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600 }}>
                    Fields extracted — review and update to match your COLA application data
                  </p>
                </div>
                <button type="button" onClick={() => setScanBanner(false)}
                  style={{ color: 'var(--green)', fontSize: '1.1rem', lineHeight: 1, marginLeft: 8 }}>×</button>
              </div>
            )}

            {extracting && (
              <div className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                  style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--navy)', letterSpacing: '0.03em' }}>
                  Reading label fields…
                </p>
              </div>
            )}

            {/* Application form */}
            <div className="card p-5">
              <ApplicationForm data={appData} onChange={setAppData} />
            </div>

            {/* Verify button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={!ready}
              className="w-full py-3 px-6 transition-all font-display"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                fontWeight: 600,
                borderRadius: 6,
                background: ready ? 'var(--navy)' : 'var(--border)',
                color: ready ? 'white' : 'var(--ink-faint)',
                cursor: ready ? 'pointer' : 'not-allowed',
                border: 'none',
                boxShadow: ready ? '0 2px 8px rgba(15,39,68,0.25)' : 'none',
                transform: 'none',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => ready && ((e.currentTarget.style.background = 'var(--navy-light)'))}
              onMouseLeave={e => ready && ((e.currentTarget.style.background = 'var(--navy)'))}
            >
              {loading ? `ANALYZING… ${(elapsed / 1000).toFixed(1)}s` : 'VERIFY LABEL'}
            </button>

            {!image && !extracting && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textAlign: 'center', letterSpacing: '0.06em' }}>
                Upload or photograph a label to begin
              </p>
            )}
          </div>

          {/* RIGHT: Results */}
          <div className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg px-4 py-3 fade-up"
                style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--red)', fontWeight: 600 }}>ERROR</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--red)', marginTop: 4 }}>{error}</p>
              </div>
            )}

            {result && (
              <div className="card overflow-hidden fade-up">
                {imagePreview && (
                  <div style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--cream-dark)' }}
                    className="flex justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Submitted label"
                      className="max-h-60 max-w-full object-contain rounded shadow-sm" />
                  </div>
                )}
                <div className="p-5">
                  <p className="field-label mb-4">Verification Result</p>
                  <VerificationResultComponent result={result} />
                </div>
              </div>
            )}

            {!result && !error && !loading && (
              <div className="card flex flex-col items-center justify-center text-center gap-3 p-10" style={{ minHeight: 200 }}>
                <div style={{ width: 40, height: 40, border: '2px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--ink-faint)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
                  AWAITING VERIFICATION
                </p>
              </div>
            )}

            {loading && (
              <div className="card flex flex-col items-center justify-center gap-4 p-10" style={{ minHeight: 200 }}>
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }} />
                <div className="text-center">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
                    ANALYZING WITH GPT-4O VISION
                  </p>
                  <p className="font-display" style={{ fontSize: '2rem', color: 'var(--navy)', marginTop: 6, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {(elapsed / 1000).toFixed(1)}<span style={{ fontSize: '1rem', opacity: 0.5, marginLeft: 2 }}>s</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
