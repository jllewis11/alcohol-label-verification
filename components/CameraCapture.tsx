'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

type CameraState = 'requesting' | 'streaming' | 'captured' | 'denied' | 'unavailable';

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  const startStream = useCallback(async () => {
    setCameraState('requesting');
    setCapturedUrl(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('streaming');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setCameraState('denied');
      } else {
        setCameraState('unavailable');
      }
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedUrl(dataUrl);
    setCameraState('captured');
    stopStream();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          onCapture(file);
        }
      },
      'image/jpeg',
      0.92
    );
  }, [onCapture, stopStream]);

  const handleRetake = useCallback(() => {
    setCapturedUrl(null);
    startStream();
  }, [startStream]);

  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm font-semibold text-gray-700">Camera Capture</label>

      <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center min-h-48">
        {cameraState === 'requesting' && (
          <div className="flex flex-col items-center gap-2 text-white">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            <p className="text-sm">Requesting camera access...</p>
          </div>
        )}

        {cameraState === 'denied' && (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18" />
            </svg>
            <p className="text-sm text-red-300 font-medium">Camera access denied</p>
            <p className="text-xs text-gray-400">Allow camera access in your browser settings, then try again.</p>
            <button
              type="button"
              onClick={startStream}
              className="text-xs text-blue-400 underline mt-1"
            >
              Try again
            </button>
          </div>
        )}

        {cameraState === 'unavailable' && (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <p className="text-sm text-gray-400">Camera not available on this device</p>
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraState === 'streaming' ? 'block' : 'hidden'}`}
          aria-label="Live camera feed"
        />

        {cameraState === 'captured' && capturedUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capturedUrl} alt="Captured label" className="w-full h-full object-cover" />
        )}

        {cameraState === 'streaming' && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
            <button
              type="button"
              onClick={handleCapture}
              className="flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg hover:bg-gray-100 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture &amp; Analyze
            </button>
          </div>
        )}

        {cameraState === 'captured' && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
            <button
              type="button"
              onClick={handleRetake}
              className="flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg hover:bg-gray-100 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retake
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {cameraState === 'streaming' && (
        <p className="text-xs text-gray-500 text-center">Point camera at the bottle label, then press Capture &amp; Analyze</p>
      )}
    </div>
  );
}
