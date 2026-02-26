'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { useI18n } from '@/i18n/i18n.context';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await authApi.register({ name, email, password });
      setAuth(data);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.register.errorDefault'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          color: #f0ede8;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(202,169,104,0.1) 0%, transparent 55%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(138,110,245,0.07) 0%, transparent 50%);
          pointer-events: none;
        }
        .login-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 0%, transparent 75%);
          pointer-events: none;
        }
        .bg-symbol {
          position: absolute;
          bottom: -6rem;
          right: -5rem;
          font-size: 36rem;
          font-weight: 700;
          color: rgba(202,169,104,0.035);
          line-height: 1;
          pointer-events: none;
          user-select: none;
          letter-spacing: -0.05em;
          z-index: 0;
        }
        .login-card {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 860px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(202,169,104,0.04);
        }
        .brand-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.75rem;
          overflow: hidden;
          background: #0d0d16;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .brand-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 100% 60% at 10% 90%, rgba(202,169,104,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 90% 10%, rgba(138,110,245,0.08) 0%, transparent 50%);
          pointer-events: none;
        }
        .brand-panel-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 90% 90% at 20% 80%, black 0%, transparent 65%);
        }
        .brand-panel-symbol {
          position: absolute;
          bottom: -3rem;
          left: -2rem;
          font-size: 18rem;
          font-weight: 700;
          color: rgba(202,169,104,0.05);
          line-height: 1;
          pointer-events: none;
          user-select: none;
          letter-spacing: -0.05em;
        }
        .brand-logo { display: flex; align-items: center; gap: 0.7rem; position: relative; z-index: 1; }
        .brand-symbol { font-size: 1.6rem; color: #caa968; line-height: 1; }
        .brand-name { font-family: 'DM Serif Display', serif; font-size: 1.35rem; letter-spacing: -0.01em; color: #f0ede8; }
        .brand-dash { color: rgba(240,237,232,0.3); margin: 0 0.1rem; }
        .brand-slogan { font-size: 0.68rem; font-weight: 300; color: rgba(240,237,232,0.45); letter-spacing: 0.08em; text-transform: uppercase; }
        .brand-center { position: relative; z-index: 1; }
        .brand-headline { font-family: 'DM Serif Display', serif; font-size: clamp(1.9rem, 3vw, 2.6rem); line-height: 1.1; letter-spacing: -0.03em; color: #f0ede8; margin-bottom: 1.25rem; }
        .brand-headline em { font-style: italic; color: #caa968; }
        .brand-description { font-size: 0.85rem; font-weight: 300; line-height: 1.7; color: rgba(240,237,232,0.45); }
        .brand-footer { position: relative; z-index: 1; font-size: 0.68rem; color: rgba(240,237,232,0.18); letter-spacing: 0.05em; }

        .form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.75rem;
          background: #0f0f18;
        }
        .form-container { width: 100%; max-width: 20rem; }
        .form-eyebrow { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #caa968; margin-bottom: 1rem; }
        .form-title { font-family: 'DM Serif Display', serif; font-size: 1.9rem; letter-spacing: -0.02em; color: #f0ede8; margin-bottom: 0.4rem; }
        .form-subtitle { font-size: 0.82rem; font-weight: 300; color: rgba(240,237,232,0.4); margin-bottom: 2rem; line-height: 1.5; }
        .field-group { display: flex; flex-direction: column; gap: 1.1rem; margin-bottom: 1.75rem; }
        .field { display: flex; flex-direction: column; gap: 0.45rem; }
        .field-label { font-size: 0.72rem; font-weight: 500; letter-spacing: 0.04em; color: rgba(240,237,232,0.45); text-transform: uppercase; }
        .field-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 7px;
          padding: 0.7rem 0.9rem;
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          color: #f0ede8;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .field-input::placeholder { color: rgba(240,237,232,0.18); }
        .field-input:focus { border-color: rgba(202,169,104,0.5); background: rgba(202,169,104,0.04); }
        .error-msg { font-size: 0.78rem; color: #e07070; margin-top: -0.5rem; margin-bottom: 0.5rem; }
        .submit-btn {
          width: 100%;
          padding: 0.8rem 1rem;
          background: #caa968;
          border: none;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          color: #0a0a0f;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .submit-btn:hover:not(:disabled) { background: #d4b878; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .form-footer { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 0.8rem; color: rgba(240,237,232,0.3); }
        .form-footer a { color: #caa968; text-decoration: none; font-weight: 500; }
        .form-footer a:hover { text-decoration: underline; }

        @media (max-width: 680px) {
          .login-card { grid-template-columns: 1fr; max-width: 22rem; }
          .brand-panel { display: none; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        <div className="bg-symbol">◈</div>

        <div className="login-card">
          <div className="brand-panel">
            <div className="brand-panel-grid" />
            <div className="brand-panel-symbol">◈</div>
            <div className="brand-logo">
              <span className="brand-symbol">◈</span>
              <span className="brand-name">Lumen<span className="brand-dash"> — </span></span>
              <span className="brand-slogan">Knowledge Hub</span>
            </div>
            <div className="brand-center">
              <h1 className="brand-headline">
                {t('auth.brand.registerHeadline1')}<br />
                <em>{t('auth.brand.registerHeadline2')}</em>
              </h1>
              <p className="brand-description">
                {t('auth.brand.registerDescription')}
              </p>
            </div>
            <div className="brand-footer">© 2026 Lumen</div>
          </div>

          <div className="form-panel">
            <div className="form-container">
              <p className="form-eyebrow">{t('auth.register.eyebrow')}</p>
              <h2 className="form-title">{t('auth.register.title')}</h2>
              <p className="form-subtitle">{t('auth.register.subtitle')}</p>

              <form onSubmit={handleRegister}>
                <div className="field-group">
                  <div className="field">
                    <label className="field-label">{t('auth.register.name')}</label>
                    <input
                      className="field-input"
                      type="text"
                      placeholder={t('auth.register.namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">{t('auth.register.email')}</label>
                    <input
                      className="field-input"
                      type="email"
                      placeholder={t('auth.register.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">{t('auth.register.password')}</label>
                    <input
                      className="field-input"
                      type="password"
                      placeholder={t('auth.register.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {error && <p className="error-msg">{error}</p>}

                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      {t('auth.register.loading')}
                    </>
                  ) : (
                    t('auth.register.submit')
                  )}
                </button>
              </form>

              <div className="form-footer">
                {t('auth.register.hasAccount')}{' '}
                <Link href="/login">{t('auth.register.login')}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
