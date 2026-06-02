import React, { useState } from 'react';
import * as api from '../api';
import type { AccountType } from '../api';
import { useI18n, LanguageSwitcher } from '../lib/i18n/useI18n';

export type AuthUser = {
  email: string;
  role: 'ACADEMY_ADMIN' | 'COACH' | 'PARENT' | 'PLAYER';
  children?: Array<{ id: string; full_name: string; team?: string; status?: string }>;
  playerProfile?: { id: string; full_name: string; team?: string; position?: string };
};

interface Props {
  onLogin: (user: AuthUser, accessToken: string) => void;
  onRegisterClick: () => void;
  onBackToHome?: () => void;
  initialAccountType?: AccountType;
}

const DEMO_EMAIL: Record<AccountType, string> = {
  parent: '',
  child: '',
  staff: 'admin@cfa.tn',
};
const DEMO_PASSWORD = 'admin';

// Floating particle component
function Particles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: i % 3 === 0 ? '6px' : i % 3 === 1 ? '4px' : '3px',
            height: i % 3 === 0 ? '6px' : i % 3 === 1 ? '4px' : '3px',
            borderRadius: '50%',
            background: i % 4 === 0
              ? 'rgba(220,38,38,0.6)'
              : i % 4 === 1
              ? 'rgba(255,255,255,0.3)'
              : i % 4 === 2
              ? 'rgba(220,38,38,0.35)'
              : 'rgba(255,255,255,0.15)',
            left: `${8 + i * 8}%`,
            top: `${15 + ((i * 37) % 70)}%`,
            animation: `floatParticle ${4 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginScreen({ onLogin, onRegisterClick, onBackToHome, initialAccountType }: Props) {
  const { t } = useI18n();
  const [accountType, setAccountType] = useState<AccountType>(initialAccountType || 'staff');
  const [email, setEmail] = useState(DEMO_EMAIL[initialAccountType || 'staff']);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const ACCOUNT_TYPES_DYNAMIC = [
    { id: 'parent' as AccountType, label: t.login.tabParent, icon: '👨‍👩‍👧', desc: 'Family portal' },
    { id: 'child' as AccountType, label: t.login.tabChild, icon: '⚽', desc: 'Player portal' },
    { id: 'staff' as AccountType, label: t.login.tabStaff, icon: '🏟️', desc: 'Admin portal' },
  ];

  const pickType = (type: AccountType) => {
    setAccountType(type);
    setEmail(DEMO_EMAIL[type]);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password, accountType);
      if (!data?.accessToken || !data?.user) {
        setError(t.login.invalidResponse);
        return;
      }
      onLogin({
        email: data.user.email,
        role: data.user.role,
        children: data.user.children,
        playerProfile: data.user.playerProfile,
      }, data.accessToken);
    } catch (err: any) {
      // Improved error handling for child accounts with pending approval
      if (accountType === 'child' && (err?.message?.includes('500') || err?.message?.includes('Internal Server Error'))) {
        setError('Votre compte est en attente d\'approbation. Veuillez contacter l\'académie.');
      } else {
        setError(err?.message || 'Connection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const activeTab = ACCOUNT_TYPES_DYNAMIC.find(a => a.id === accountType);

  return (
    <div className="ls-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-18px) rotate(180deg); opacity: 1; }
        }
        @keyframes slowDrift {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.04) rotate(2deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(220,38,38,0.5)) drop-shadow(0 0 40px rgba(220,38,38,0.2)); }
          50% { filter: drop-shadow(0 0 32px rgba(220,38,38,0.8)) drop-shadow(0 0 64px rgba(220,38,38,0.35)); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spinnerRotate {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.9); opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .ls-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Outfit', sans-serif;
          background: #07050f;
          position: relative;
          overflow: hidden;
        }

        /* ── Left hero panel ── */
        .ls-hero {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          overflow: hidden;
        }

        /* Animated football pitch lines */
        .ls-pitch {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 65% 55% at 50% 55%, rgba(220,38,38,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 100% 100% at 50% 50%, rgba(10,5,30,0.6) 0%, transparent 70%);
          z-index: 0;
        }
        .ls-pitch::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            /* Center circle */
            radial-gradient(circle 120px at 50% 52%, transparent 115px, rgba(255,255,255,0.045) 116px, rgba(255,255,255,0.045) 119px, transparent 120px),
            /* Outer boundary */
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
            /* Center line */
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 100% 100%, 80px 80px, 80px 80px, 100% 50%;
          background-position: center, 0 0, 0 0, 0 50%;
          animation: slowDrift 12s ease-in-out infinite;
        }
        .ls-pitch::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 240px;
          height: 240px;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(255,255,255,0.035);
          border-radius: 50%;
        }

        /* Red mesh gradient glow */
        .ls-glow-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(70px);
        }
        .ls-glow-blob--1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(220,38,38,0.22) 0%, transparent 70%);
          top: -100px; left: -100px;
        }
        .ls-glow-blob--2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(153,27,27,0.18) 0%, transparent 70%);
          bottom: -80px; right: -80px;
          animation: slowDrift 16s ease-in-out infinite reverse;
        }
        .ls-glow-blob--3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(220,38,38,0.1) 0%, transparent 70%);
          top: 40%; right: 10%;
        }

        /* Logo container */
        .ls-logo-wrap {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          animation: fadeSlideUp 0.8s ease both;
        }
        .ls-logo-img {
          width: 180px;
          height: 180px;
          object-fit: contain;
          animation: logoGlow 3s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }
        .ls-logo-ring {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 2px solid rgba(220,38,38,0.35);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulseRing 2.5s ease-out infinite;
        }
        .ls-logo-ring-2 {
          animation-delay: 1.25s;
        }

        .ls-academy-name {
          text-align: center;
          z-index: 2;
        }
        .ls-academy-name h1 {
          font-size: 1.75rem;
          font-weight: 900;
          background: linear-gradient(135deg, #ffffff 0%, #ef4444 60%, #dc2626 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.03em;
          margin: 0 0 0.25rem;
          line-height: 1.1;
        }
        .ls-academy-name p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin: 0;
        }

        /* Stats strip at bottom of hero */
        .ls-stats {
          position: absolute;
          bottom: 2.5rem;
          left: 0; right: 0;
          display: flex;
          justify-content: center;
          gap: 3rem;
          z-index: 2;
          animation: fadeSlideUp 0.8s 0.4s ease both;
        }
        .ls-stat {
          text-align: center;
        }
        .ls-stat-num {
          font-size: 1.5rem;
          font-weight: 900;
          color: #ef4444;
          line-height: 1;
        }
        .ls-stat-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0.2rem;
        }
        .ls-stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.08);
          align-self: stretch;
        }

        /* ── Right form panel ── */
        .ls-form-panel {
          width: 480px;
          max-width: 100%;
          background: rgba(12, 8, 24, 0.95);
          backdrop-filter: blur(32px);
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 2.5rem;
          position: relative;
          z-index: 5;
        }

        .ls-form-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(180deg, transparent 0%, #dc2626 40%, #ef4444 60%, transparent 100%);
        }

        /* Tab selector */
        .ls-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .ls-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0.75rem 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
        }
        .ls-tab:hover {
          border-color: rgba(220,38,38,0.3);
          background: rgba(220,38,38,0.06);
          color: rgba(255,255,255,0.7);
        }
        .ls-tab--active {
          border-color: rgba(220,38,38,0.6) !important;
          background: rgba(220,38,38,0.12) !important;
          color: white !important;
          box-shadow: 0 0 20px rgba(220,38,38,0.15), inset 0 0 12px rgba(220,38,38,0.05);
        }
        .ls-tab-icon {
          font-size: 1.2rem;
        }
        .ls-tab-label {
          font-size: 0.72rem;
          font-weight: 700;
        }
        .ls-tab-desc {
          font-size: 0.6rem;
          opacity: 0.6;
          font-weight: 500;
        }

        /* Input field wrapper */
        .ls-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .ls-field label {
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .ls-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .ls-input-icon {
          position: absolute;
          left: 0.9rem;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.25);
          pointer-events: none;
          transition: color 0.2s;
        }
        .ls-input {
          width: 100%;
          padding: 0.9rem 0.9rem 0.9rem 2.6rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: white;
          font-size: 0.9rem;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .ls-input::placeholder { color: rgba(255,255,255,0.2); }
        .ls-input:focus {
          border-color: rgba(220,38,38,0.6);
          background: rgba(220,38,38,0.05);
          box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
        }
        .ls-input-focused .ls-input-icon { color: rgba(220,38,38,0.7); }
        .ls-eye-btn {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.2s;
        }
        .ls-eye-btn:hover { color: rgba(255,255,255,0.7); }

        /* Error message */
        .ls-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
          font-size: 0.83rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          animation: fadeSlideUp 0.3s ease;
        }

        /* Submit button */
        .ls-submit {
          width: 100%;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
          color: white;
          font-size: 0.95rem;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 20px rgba(220,38,38,0.35);
          margin-top: 0.5rem;
        }
        .ls-submit::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transition: left 0.5s ease;
        }
        .ls-submit:hover::before { left: 100%; }
        .ls-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(220,38,38,0.5);
        }
        .ls-submit:active { transform: translateY(0); }
        .ls-submit:disabled {
          opacity: 0.7;
          cursor: wait;
          transform: none;
        }

        /* Spinner */
        .ls-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spinnerRotate 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 0.5rem;
        }

        /* Register link */
        .ls-register-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.82rem;
          color: rgba(255,255,255,0.35);
          background: none;
          border-bottom: none;
          border-left: none;
          border-right: none;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          width: 100%;
          transition: color 0.2s;
        }
        .ls-register-link:hover { color: rgba(255,255,255,0.7); }
        .ls-register-link span {
          color: #ef4444;
          font-weight: 700;
          transition: color 0.2s;
        }
        .ls-register-link:hover span { color: #f87171; }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .ls-root { flex-direction: column; }
          .ls-hero {
            min-height: 280px;
            padding: 2rem 1.5rem 1.5rem;
          }
          .ls-logo-img { width: 110px; height: 110px; }
          .ls-logo-ring { width: 130px; height: 130px; }
          .ls-academy-name h1 { font-size: 1.3rem; }
          .ls-stats { display: none; }
          .ls-form-panel {
            width: 100%;
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.06);
            padding: 2rem 1.5rem;
          }
          .ls-form-panel::before { display: none; }
        }
      `}</style>

      {/* ── Left hero panel ── */}
      <div className="ls-hero">
        <div className="ls-pitch" />
        <div className="ls-glow-blob ls-glow-blob--1" />
        <div className="ls-glow-blob ls-glow-blob--2" />
        <div className="ls-glow-blob ls-glow-blob--3" />
        <Particles />

        <div className="ls-logo-wrap">
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <div className="ls-logo-ring" />
            <div className="ls-logo-ring ls-logo-ring-2" />
            {logoOk ? (
              <img
                src="/logo-cfa.png"
                alt="Chermiti Football Academy"
                className="ls-logo-img"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div style={{
                width: 180, height: 180, borderRadius: '50%',
                background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', fontWeight: 900, color: 'white',
                animation: 'logoGlow 3s ease-in-out infinite',
              }}>CFA</div>
            )}
          </div>

          <div className="ls-academy-name">
            <h1>Chermiti Football Academy</h1>
            <p>CFA · Official Management Portal</p>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="ls-stats">
          <div className="ls-stat">
            <div className="ls-stat-num">3</div>
            <div className="ls-stat-label">Squads</div>
          </div>
          <div className="ls-stat-divider" />
          <div className="ls-stat">
            <div className="ls-stat-num">U17</div>
            <div className="ls-stat-label">Top Category</div>
          </div>
          <div className="ls-stat-divider" />
          <div className="ls-stat">
            <div className="ls-stat-num">2026</div>
            <div className="ls-stat-label">Season</div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="ls-form-panel">
        {/* Header navigation bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          {onBackToHome ? (
            <button
              type="button"
              onClick={onBackToHome}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '0.35rem', transition: 'color 0.2s', padding: 0
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              ← Accueil
            </button>
          ) : <div />}
          <LanguageSwitcher />
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '2rem', animation: 'fadeSlideUp 0.6s ease both' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>
            {activeTab?.icon} {activeTab?.desc}
          </p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>
            {t.login.title}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>
            {t.login.subtitle}
          </p>
        </div>

        {/* Account type tabs */}
        <div className="ls-tabs" style={{ animation: 'fadeSlideUp 0.6s 0.1s ease both' }}>
          {ACCOUNT_TYPES_DYNAMIC.map((at) => (
            <button
              key={at.id}
              type="button"
              className={`ls-tab${accountType === at.id ? ' ls-tab--active' : ''}`}
              onClick={() => pickType(at.id)}
            >
              <span className="ls-tab-icon">{at.icon}</span>
              <span className="ls-tab-label">{at.label}</span>
              <span className="ls-tab-desc">{at.desc}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          key={`login-${accountType}`}
          onSubmit={handleSubmit}
          autoComplete="on"
          style={{ animation: 'fadeSlideUp 0.6s 0.2s ease both' }}
        >
          {/* Email */}
          <div className="ls-field">
            <label htmlFor="cfa-email">Email</label>
            <div className={`ls-input-wrap${focusedField === 'email' ? ' ls-input-focused' : ''}`}>
              <span className="ls-input-icon">✉</span>
              <input
                id="cfa-email"
                type="email"
                name={`cfa-login-email-${accountType}`}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="your@email.com"
                required
                className="ls-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="ls-field">
            <label htmlFor="cfa-password">Password</label>
            <div className={`ls-input-wrap${focusedField === 'password' ? ' ls-input-focused' : ''}`}>
              <span className="ls-input-icon">🔒</span>
              <input
                id="cfa-password"
                type={showPassword ? 'text' : 'password'}
                name={`cfa-login-password-${accountType}`}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                required
                className="ls-input"
              />
              <button
                type="button"
                className="ls-eye-btn"
                onClick={() => setShowPassword(s => !s)}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="ls-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="ls-submit">
            {loading && <span className="ls-spinner" />}
            {loading ? t.login.loading : (
              accountType === 'staff'  ? t.login.submitStaff
              : accountType === 'parent' ? t.login.submitParent
              : t.login.submitChild
            )}
          </button>
        </form>

        {/* Register link */}
        <button
          type="button"
          onClick={onRegisterClick}
          className="ls-register-link"
        >
          <span>+</span> {t.login.registerLink}
        </button>

        {/* Footer */}
        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.15)',
          letterSpacing: '0.04em',
        }}>
          © 2026 Chermiti Football Academy · All rights reserved
        </p>
      </div>
    </div>
  );
}
