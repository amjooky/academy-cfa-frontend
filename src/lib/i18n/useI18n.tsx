// i18n context — useI18n.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en, { type Translations } from './en';
import fr from './fr';
import ar from './ar';

export type Locale = 'en' | 'fr' | 'ar';

const LOCALES: Record<Locale, Translations> = { en, fr, ar };
const RTL_LOCALES: Locale[] = ['ar'];
const STORAGE_KEY = 'cfa_locale';

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {},
  isRTL: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return saved && LOCALES[saved] ? saved : 'en';
  });

  const isRTL = RTL_LOCALES.includes(locale);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
  }, []);

  // Apply RTL direction to <html> element
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale, isRTL]);

  return (
    <I18nContext.Provider value={{ locale, t: LOCALES[locale], setLocale, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// ── Language Switcher UI component ────────────────────────────────────────────
const FLAG: Record<Locale, string> = { en: '🇬🇧', fr: '🇫🇷', ar: '🇹🇳' };

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  const locales: Locale[] = ['en', 'fr', 'ar'];

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        id="lang-switcher-btn"
        onClick={() => setOpen(o => !o)}
        title="Switch language"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '0.45rem 0.75rem',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          transition: 'all 0.2s',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      >
        {FLAG[locale]} {t.lang[locale]}
        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            background: 'rgba(15,15,25,0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '0.4rem',
            zIndex: 1000,
            minWidth: '160px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {locales.map(l => (
              <button
                key={l}
                type="button"
                id={`lang-option-${l}`}
                onClick={() => { setLocale(l); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: locale === l ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: locale === l ? '#a5b4fc' : 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: locale === l ? 700 : 500,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (locale !== l) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (locale !== l) e.currentTarget.style.background = 'transparent'; }}
              >
                {FLAG[l]} {t.lang[l]}
                {locale === l && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
