import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { safeLogoUrl, handleImgFallback, DEFAULT_LOGO } from '../lib/imageUtils';

interface Props {
  pushNotification: (n: { icon: string; title: string; body: string; type: any }) => void;
  onProfileSaved?: (profile: { name: string; logoUrl: string; primaryColor: string; secondaryColor: string; language: string }) => void;
}

export default function SettingsTab({ pushNotification, onProfileSaved }: Props) {
  const [name, setName]               = useState('My Sports Academy');
  const [logoUrl, setLogoUrl]         = useState('');
  const [primaryColor, setPrimary]    = useState('#6366f1');
  const [secondaryColor, setSecondary]= useState('#f59e0b');
  const [language, setLanguage]       = useState('en');
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState('');
  const [loading, setLoading]         = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    api.getAcademyProfile()
      .then((p: any) => {
        if (p?.name)           setName(p.name);
        if (p?.logo_url)       setLogoUrl(safeLogoUrl(p.logo_url));
        if (p?.primary_color)  setPrimary(p.primary_color);
        if (p?.secondary_color)setSecondary(p.secondary_color);
        if (p?.language)       setLanguage(p.language);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const safeLogo = safeLogoUrl(logoUrl);
      await api.updateAcademyProfile({ name, logoUrl: safeLogo, primaryColor, secondaryColor, language });
      setMsg('✅ Academy profile saved successfully.');
      onProfileSaved?.({ name, logoUrl: safeLogo, primaryColor, secondaryColor, language });
      pushNotification({
        icon: '⚙️', title: 'Settings Updated',
        body: `Academy profile "${name}" was saved.`, type: 'system'
      });
    } catch {
      setMsg('⚡ Saved locally (backend offline).');
      onProfileSaved?.({ name, logoUrl: safeLogoUrl(logoUrl), primaryColor, secondaryColor, language });
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3500);
  };

  const handleResetDemo = () => {
    pushNotification({ icon: '🗑️', title: 'Data Reset', body: 'Demo data has been cleared.', type: 'system' });
    setShowResetConfirm(false);
    setMsg('Demo data reset (UI state). Reload the page to restore seed data from database.');
    setTimeout(() => setMsg(''), 4000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    color: 'white', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.76rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.45)', marginBottom: '0.45rem', letterSpacing: '0.05em'
  };

  if (loading) return (
    <div style={{ color: 'rgba(255,255,255,0.4)', padding: '3rem', textAlign: 'center' }}>
      Loading academy profile…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="grid-2-equal">

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            🏛️ Academy Identity
          </h4>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>ACADEMY NAME</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
            </div>

            <div>
              <label style={labelStyle}>LOGO URL</label>
              <input
                value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://…/logo.png"
                style={inputStyle}
              />
              {logoUrl && (
                <img
                  src={safeLogoUrl(logoUrl)} alt="Logo preview"
                  onError={e => handleImgFallback(e, DEFAULT_LOGO)}
                  style={{ marginTop: '0.75rem', height: '48px', borderRadius: '8px', objectFit: 'contain' }}
                />
              )}
            </div>

            <div>
              <label style={labelStyle}>LANGUAGE</label>
              <select
                value={language} onChange={e => setLanguage(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="ar">🇹🇳 العربية</option>
              </select>
            </div>

            <button
              type="submit" disabled={saving}
              style={{
                padding: '0.85rem', borderRadius: '10px', border: 'none',
                background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: 'white', fontWeight: 700, fontSize: '0.95rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all 0.2s', marginTop: '0.25rem'
              }}
            >
              {saving ? 'Saving…' : 'Save Academy Profile'}
            </button>

            {msg && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#10b981', fontWeight: 600, margin: 0 }}>
                {msg}
              </p>
            )}
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.5rem' }}>
              🎨 Brand Colors
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'PRIMARY COLOR', value: primaryColor, setter: setPrimary },
                { label: 'SECONDARY COLOR', value: secondaryColor, setter: setSecondary },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="color" value={value}
                      onChange={e => setter(e.target.value)}
                      style={{ width: '48px', height: '48px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                    />
                    <input
                      value={value} onChange={e => setter(e.target.value)}
                      style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '1.5rem', padding: '1.25rem', borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>LIVE PREVIEW</p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  flexShrink: 0
                }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{name || 'Academy Name'}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Brand identity preview</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(239,68,68,0.15)' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#f87171' }}>
              ⚠️ Danger Zone
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.25rem' }}>
              These actions are irreversible. Proceed with extreme caution.
            </p>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 600, cursor: 'pointer',
                fontSize: '0.88rem', transition: 'all 0.2s'
              }}
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5,5,10,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem',
        }}>
          <div className="glass-card" style={{
            maxWidth: '440px', width: '100%', padding: '2rem',
            border: '1px solid rgba(239,68,68,0.25)', borderRadius: '16px',
          }}>
            <h4 style={{ color: '#f87171', fontWeight: 800, fontSize: '1.2rem', margin: '0 0 0.75rem' }}>
              Reset all demo data?
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              This will clear local UI state for players, events, and invoices. Database seed data in XAMPP is not deleted. This action cannot be undone from the UI.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                  color: 'white', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none',
                  background: '#dc2626', color: 'white', fontWeight: 800, cursor: 'pointer',
                }}
              >
                Yes, reset demo data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
