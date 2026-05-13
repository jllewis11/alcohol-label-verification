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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">TTB Label Verification</h1>
            <p className="text-xs text-gray-500 mt-0.5">Alcohol &amp; Tobacco Tax and Trade Bureau — Label Compliance</p>
          </div>
          <Link href="/batch" className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
            Batch Verification
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Firewall notice — only relevant if running locally on agency network */}
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Agency network users:</strong> If verification fails to connect, your network firewall may be blocking the AI service.
            Use the <strong>deployed web URL</strong> instead of running locally — it routes through Vercel and bypasses agency firewall restrictions.
          </span>
        </div>

        {/* Step guide */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { n: '1', text: 'Upload or photograph the label' },
            { n: '2', text: 'Review auto-filled application data' },
            { n: '3', text: 'Click Verify Label' },
            { n: '4', text: 'Review results' },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
              <span>{text}</span>
              {n !== '4' && <span className="text-gray-300 ml-1 hidden sm:inline">›</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            {/* Tab switcher */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setTab('upload')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2
                    ${tab === 'upload'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setTab('camera')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2
                    ${tab === 'camera'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use Camera
                </button>
              </div>
              <div className="p-5">
                {tab === 'upload' ? (
                  <LabelUploader onImageSelected={setImage} selectedFile={image} />
                ) : (
                  <CameraCapture onCapture={handleCapture} />
                )}
              </div>
            </div>

            {/* Scan banner */}
            {scanBanner && (
              <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800 font-medium">Label scanned — review fields below before verifying</p>
                </div>
                <button type="button" onClick={() => setScanBanner(false)}
                  className="text-green-600 hover:text-green-800 text-lg leading-none ml-2" aria-label="Dismiss">
                  ×
                </button>
              </div>
            )}

            {/* Extracting state */}
            {extracting && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <p className="text-sm text-blue-700 font-medium">Reading label fields from image...</p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <ApplicationForm data={appData} onChange={setAppData} />
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={!ready}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-all
                ${ready
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-[0.99]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {loading
                ? `Verifying... ${(elapsed / 1000).toFixed(1)}s`
                : 'Verify Label'}
            </button>

            {!image && !extracting && (
              <p className="text-xs text-center text-gray-400">
                {tab === 'upload' ? 'Upload an image to enable verification' : 'Capture a photo to enable verification'}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {imagePreview && (
                  <div className="border-b border-gray-100 bg-gray-50 flex justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Submitted label"
                      className="max-h-64 max-w-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Verification Results</h2>
                  <VerificationResultComponent result={result} />
                </div>
              </div>
            )}

            {!result && !error && !loading && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center text-center gap-3 min-h-48">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-400">Results will appear here after verification</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center gap-4 min-h-48">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Analyzing label with GPT-4o Vision...</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">{(elapsed / 1000).toFixed(1)}s</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
