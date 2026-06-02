import React, { useState } from 'react';
import { useI18n } from '../lib/i18n/useI18n';

interface LandingPageProps {
  onSelectPortal: (portal: 'parent' | 'child' | 'staff') => void;
  onSelectRegister: () => void;
}

export default function LandingPage({ onSelectPortal, onSelectRegister }: LandingPageProps) {
  const { t, isRTL } = useI18n();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="lp-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .lp-container {
          min-height: 100vh;
          font-family: 'Outfit', sans-serif;
          background: #07050f;
          color: #ffffff;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 5rem;
        }

        /* ── Grid/Pitch background details ── */
        .lp-hero-bg {
          position: absolute;
          inset: 0;
          height: 100vh;
          background: 
            radial-gradient(circle at 50% 30%, rgba(220, 38, 38, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 10% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(220, 38, 38, 0.05) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .lp-hero-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(circle at 50% 40%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at 50% 40%, black 30%, transparent 80%);
        }

        /* ── Header ── */
        .lp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .lp-logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .lp-logo {
          width: 50px;
          height: 50px;
          object-fit: contain;
          filter: drop-shadow(0 0 10px rgba(220, 38, 38, 0.5));
        }

        .lp-title-wrap h1 {
          font-size: 1.25rem;
          font-weight: 900;
          background: linear-gradient(135deg, #ffffff 0%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .lp-title-wrap p {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin: 0.15rem 0 0;
          font-weight: 700;
        }

        /* ── Hero Section ── */
        .lp-hero {
          text-align: center;
          padding: 6rem 1.5rem 4rem;
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
        }

        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          background: rgba(220, 38, 38, 0.12);
          border: 1px solid rgba(220, 38, 38, 0.25);
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #f87171;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          animation: fadeSlideUp 0.6s ease both;
        }

        .lp-hero-title {
          font-size: 3.5rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin: 0 0 1.25rem;
          background: linear-gradient(180deg, #ffffff 30%, #e2e8f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: fadeSlideUp 0.7s 0.1s ease both;
        }

        .lp-hero-title span {
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .lp-hero-subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin: 0 0 2.5rem;
          animation: fadeSlideUp 0.8s 0.2s ease both;
        }

        /* ── Portals / Cards ── */
        .lp-portals-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          position: relative;
          z-index: 5;
        }

        .lp-section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .lp-section-header h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin: 0 0 0.5rem;
        }

        .lp-section-header p {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
        }

        .lp-portals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 4rem;
        }

        .lp-portal-card {
          background: rgba(13, 9, 29, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 2.25rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .lp-portal-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.5), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .lp-portal-card:hover {
          transform: translateY(-6px);
          border-color: rgba(220, 38, 38, 0.25);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(220, 38, 38, 0.05);
          background: rgba(18, 12, 38, 0.7);
        }

        .lp-portal-card:hover::before {
          opacity: 1;
        }

        .lp-portal-icon {
          font-size: 2.25rem;
          margin-bottom: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .lp-portal-card:hover .lp-portal-icon {
          background: rgba(220, 38, 38, 0.1);
          border-color: rgba(220, 38, 38, 0.3);
          color: #ef4444;
        }

        .lp-portal-name {
          font-size: 1.35rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          color: #ffffff;
        }

        .lp-portal-desc {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
          margin: 0 0 1.75rem;
          flex-grow: 1;
        }

        .lp-portal-btn {
          width: 100%;
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .lp-portal-card:hover .lp-portal-btn {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }

        /* ── Image Gallery ── */
        .lp-gallery-section {
          max-width: 1200px;
          margin: 0 auto 5rem;
          padding: 0 2rem;
          position: relative;
          z-index: 5;
        }

        .lp-gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .lp-gallery-item {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .lp-gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .lp-gallery-item:hover .lp-gallery-img {
          transform: scale(1.08);
        }

        .lp-gallery-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 50%, rgba(7, 5, 15, 0.9) 100%);
          display: flex;
          align-items: flex-end;
          padding: 1.5rem;
          opacity: 0.85;
          transition: opacity 0.3s;
        }

        .lp-gallery-item:hover .lp-gallery-overlay {
          opacity: 1;
        }

        .lp-gallery-text {
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        /* ── Lightbox Modal ── */
        .lp-lightbox {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: fadeIn 0.3s ease;
        }

        .lp-lightbox-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }

        .lp-lightbox-img {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .lp-lightbox-close {
          position: absolute;
          top: -3rem;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .lp-lightbox-close:hover {
          opacity: 1;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ── CTA Banner ── */
        .lp-cta-banner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          position: relative;
          z-index: 5;
        }

        .lp-cta-inner {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%);
          border: 1px solid rgba(220, 38, 38, 0.25);
          border-radius: 24px;
          padding: 3rem 2rem;
          text-align: center;
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
        }

        .lp-cta-inner::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(220, 38, 38, 0.1) 0%, transparent 60%);
          pointer-events: none;
        }

        .lp-cta-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
        }

        .lp-cta-desc {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          max-width: 500px;
          margin: 0 auto 1.75rem;
          line-height: 1.5;
        }

        .lp-cta-btn {
          padding: 0.9rem 2.25rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
          transition: all 0.25s;
        }

        .lp-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(220, 38, 38, 0.6);
        }

        /* ── Animations ── */
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .lp-portals-grid, .lp-gallery-grid {
            grid-template-columns: 1fr 1fr;
          }
          .lp-portals-grid .lp-portal-card:last-child {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .lp-hero-title {
            font-size: 2.5rem;
          }
          .lp-portals-grid {
            grid-template-columns: 1fr;
          }
          .lp-portals-grid .lp-portal-card:last-child {
            grid-column: span 1;
          }
          .lp-gallery-grid {
            grid-template-columns: 1fr 1fr;
          }
          .lp-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
          .lp-lightbox {
            padding: 1rem;
          }
          .lp-lightbox-close {
            top: -2.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .lp-gallery-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="lp-hero-bg" />

      {/* Header */}
      <header className="lp-header">
        <div className="lp-logo-section">
          <img src="/logo-cfa.png" alt="CFA Logo" className="lp-logo" />
          <div className="lp-title-wrap">
            <h1>Chermiti Football Academy</h1>
            <p>Portal Hub</p>
          </div>
        </div>
        <div>
          <button 
            type="button" 
            onClick={onSelectRegister} 
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            S'inscrire
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-badge">
          <span>⚽</span> Saison 2026 Printemps
        </div>
        <h2 className="lp-hero-title">
          Développez Votre <span>Potentiel</span> Footballistique
        </h2>
        <p className="lp-hero-subtitle">
          Bienvenue sur le portail officiel de la Chermiti Football Academy. 
          Suivez la progression de vos enfants, consultez les entraînements et accédez aux dossiers d'évaluation en temps réel.
        </p>
      </section>

      {/* Portal Selection Grid */}
      <section className="lp-portals-section">
        <div className="lp-section-header">
          <h2>Accès aux Portails</h2>
          <p>Choisissez le portail correspondant à votre profil pour vous connecter</p>
        </div>

        <div className="lp-portals-grid">
          {/* Parent Portal */}
          <div className="lp-portal-card" onClick={() => onSelectPortal('parent')}>
            <div className="lp-portal-icon">👨‍👩‍👧</div>
            <h3 className="lp-portal-name">Portail Parent</h3>
            <p className="lp-portal-desc">
              Accédez au calendrier des séances, gérez les abonnements et consultez les évaluations et les documents KYC de vos enfants.
            </p>
            <button type="button" className="lp-portal-btn">
              Se Connecter →
            </button>
          </div>

          {/* Player Portal */}
          <div className="lp-portal-card" onClick={() => onSelectPortal('child')}>
            <div className="lp-portal-icon">🏃</div>
            <h3 className="lp-portal-name">Espace Joueur</h3>
            <p className="lp-portal-desc">
              Suivez vos points XP, consultez vos rapports de progression individuels et restez informé des prochains entraînements.
            </p>
            <button type="button" className="lp-portal-btn">
              Accéder au Profil →
            </button>
          </div>

          {/* Staff Portal */}
          <div className="lp-portal-card" onClick={() => onSelectPortal('staff')}>
            <div className="lp-portal-icon">🏟️</div>
            <h3 className="lp-portal-name">Portail Staff / Entraîneur</h3>
            <p className="lp-portal-desc">
              Gérez les effectifs, planifiez les séances, complétez les feuilles de présence et attribuez les évaluations techniques.
            </p>
            <button type="button" className="lp-portal-btn">
              Espace Staff →
            </button>
          </div>
        </div>
      </section>

      {/* Image Gallery (Schedules) */}
      <section className="lp-gallery-section">
        <div className="lp-section-header">
          <h2>Horaires d'Entraînement</h2>
          <p>Consultez les plannings selon la catégorie d'âge de votre enfant</p>
        </div>

        <div className="lp-gallery-grid">
          <div className="lp-gallery-item" onClick={() => setSelectedImage('/images/gallery4.jpg')} style={{cursor: 'pointer'}}>
            <img src="/images/gallery4.jpg" alt="Horaires Natifs 2014/2015" className="lp-gallery-img" />
            <div className="lp-gallery-overlay">
              <span className="lp-gallery-text">Natifs 2014/2015</span>
            </div>
          </div>
          <div className="lp-gallery-item" onClick={() => setSelectedImage('/images/gallery1.jpg')} style={{cursor: 'pointer'}}>
            <img src="/images/gallery1.jpg" alt="Horaires Natifs 2016/2017" className="lp-gallery-img" />
            <div className="lp-gallery-overlay">
              <span className="lp-gallery-text">Natifs 2016/2017</span>
            </div>
          </div>
          <div className="lp-gallery-item" onClick={() => setSelectedImage('/images/gallery2.jpg')} style={{cursor: 'pointer'}}>
            <img src="/images/gallery2.jpg" alt="Horaires Natifs 2018/2019" className="lp-gallery-img" />
            <div className="lp-gallery-overlay">
              <span className="lp-gallery-text">Natifs 2018/2019</span>
            </div>
          </div>
          <div className="lp-gallery-item" onClick={() => setSelectedImage('/images/gallery3.jpg')} style={{cursor: 'pointer'}}>
            <img src="/images/gallery3.jpg" alt="Horaires Natifs 2020/2021" className="lp-gallery-img" />
            <div className="lp-gallery-overlay">
              <span className="lp-gallery-text">Natifs 2020/2021</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="lp-cta-banner">
        <div className="lp-cta-inner">
          <h3 className="lp-cta-title">Rejoignez la Chermiti Football Academy</h3>
          <p className="lp-cta-desc">
            Inscrivez votre enfant dès aujourd'hui pour intégrer nos programmes d'entraînement d'élite.
          </p>
          <button type="button" className="lp-cta-btn" onClick={onSelectRegister}>
            Commencer l'Inscription en Ligne
          </button>
        </div>
      </section>
      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="lp-lightbox" onClick={() => setSelectedImage(null)}>
          <div className="lp-lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lp-lightbox-close" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage} alt="Schedule Enlarge" className="lp-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}
