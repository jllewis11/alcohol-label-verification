'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(from);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Incorrect access code. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Code+Pro:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          background-color: #f4f5f7;
          background-image:
            linear-gradient(rgba(30, 58, 95, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 58, 95, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 2rem 1rem;
        }

        .login-card {
          background: #ffffff;
          border: 1px solid #d8dde6;
          border-top: 4px solid #1e3a5f;
          border-radius: 2px;
          width: 100%;
          max-width: 400px;
          padding: 3rem 2.5rem;
          box-shadow:
            0 4px 6px -1px rgba(30, 58, 95, 0.06),
            0 10px 30px -5px rgba(30, 58, 95, 0.08);
          animation: cardReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .seal-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 1.75rem;
          animation: sealReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        @keyframes sealReveal {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }

        .seal-ring {
          width: 72px;
          height: 72px;
          border: 2px solid #1e3a5f;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          position: relative;
        }

        .seal-ring::before {
          content: '';
          position: absolute;
          inset: 4px;
          border: 1px solid rgba(30, 58, 95, 0.25);
          border-radius: 50%;
        }

        .header-block {
          text-align: center;
          margin-bottom: 2rem;
          animation: headerReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        @keyframes headerReveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .agency-label {
          font-family: 'Source Code Pro', monospace;
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #6b7a8d;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .system-title {
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 1.375rem;
          font-weight: 700;
          color: #1e3a5f;
          line-height: 1.3;
          margin-bottom: 0.375rem;
          letter-spacing: -0.01em;
        }

        .auth-subtitle {
          font-size: 0.8rem;
          color: #8a95a3;
          font-weight: 300;
          letter-spacing: 0.03em;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #d8dde6 30%, #d8dde6 70%, transparent);
          margin-bottom: 1.75rem;
        }

        .form-block {
          animation: formReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }

        @keyframes formReveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .field-label {
          display: block;
          font-family: 'Source Code Pro', monospace;
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: #5a6475;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .password-input {
          width: 100%;
          font-family: 'Source Code Pro', monospace;
          font-size: 0.875rem;
          font-weight: 400;
          color: #1e3a5f;
          background: #f8f9fb;
          border: 1px solid #c8d0db;
          border-radius: 2px;
          padding: 0.75rem 1rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          letter-spacing: 0.05em;
          box-sizing: border-box;
        }

        .password-input::placeholder {
          color: #adb5c0;
          letter-spacing: 0.03em;
        }

        .password-input:focus {
          border-color: #1e3a5f;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.08);
        }

        .password-input.error-state {
          border-color: #c0392b;
          background: #fff8f8;
        }

        .password-input.error-state:focus {
          box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.08);
        }

        .error-message {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #c0392b;
          font-weight: 400;
          display: flex;
          align-items: flex-start;
          gap: 0.375rem;
          animation: errorSlide 0.2s ease both;
        }

        @keyframes errorSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .error-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .submit-btn {
          width: 100%;
          margin-top: 1.25rem;
          padding: 0.8125rem 1.5rem;
          background: #1e3a5f;
          color: #ffffff;
          border: none;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.15s;
        }

        .submit-btn:hover:not(:disabled)::after {
          background: rgba(255,255,255,0.06);
        }

        .submit-btn:hover:not(:disabled) {
          background: #152d4a;
          box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
          transform: translateY(-1px);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .submit-btn:disabled {
          background: #6b7a8d;
          cursor: not-allowed;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .footer-note {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid #eef0f3;
          text-align: center;
          font-family: 'Source Code Pro', monospace;
          font-size: 0.6rem;
          color: #adb5c0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1.8;
          animation: footerReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both;
        }

        @keyframes footerReveal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          <div className="seal-wrapper">
            <div className="seal-ring">
              <svg width="34" height="38" viewBox="0 0 34 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17 1L2 7.5V19C2 27.5 8.5 35.5 17 37C25.5 35.5 32 27.5 32 19V7.5L17 1Z"
                  fill="#1e3a5f"
                  stroke="#1e3a5f"
                  strokeWidth="0.5"
                />
                <path
                  d="M17 5L5.5 10.25V19C5.5 26 10.75 32.5 17 33.75C23.25 32.5 28.5 26 28.5 19V10.25L17 5Z"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="0.75"
                />
                <path
                  d="M12 19.5L15.5 23L22.5 15.5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="10" y1="27" x2="24" y2="27" stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" />
                <line x1="12" y1="29.5" x2="22" y2="29.5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
              </svg>
            </div>
          </div>

          <div className="header-block">
            <p className="agency-label">U.S. Dept. of Treasury · TTB</p>
            <h1 className="system-title">TTB Label Verification</h1>
            <p className="auth-subtitle">Authorized Access Only</p>
          </div>

          <div className="divider" />

          <form className="form-block" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="access-code" className="field-label">
                Access Code
              </label>
              <input
                id="access-code"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Enter access code"
                className={`password-input${error ? ' error-state' : ''}`}
                autoComplete="current-password"
                autoFocus
                required
              />
              {error && (
                <div className="error-message" role="alert">
                  <svg className="error-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="6" stroke="#c0392b" strokeWidth="1"/>
                    <path d="M6.5 3.5V7" stroke="#c0392b" strokeWidth="1.25" strokeLinecap="round"/>
                    <circle cx="6.5" cy="9.25" r="0.625" fill="#c0392b"/>
                  </svg>
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Authenticating...
                </>
              ) : (
                'Access System'
              )}
            </button>
          </form>

          <div className="footer-note">
            Restricted System · Authorized Users Only<br />
            Activity may be monitored and recorded
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #d8dde6', borderTopColor: '#1e3a5f', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
