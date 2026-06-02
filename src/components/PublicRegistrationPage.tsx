import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { normalizeDobForSubmit } from '../lib/dateUtils';
import type { AuthUser } from './LoginScreen';

interface PublicRegistrationPageProps {
  onBackToLogin: () => void;
  onRegistered?: (user: AuthUser, accessToken: string) => void;
}

export default function PublicRegistrationPage({ onBackToLogin }: PublicRegistrationPageProps) {
  // Parent info
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentName, setParentName] = useState('');

  // Player info
  const [playerName, setPlayerName] = useState('');
  const [playerDob, setPlayerDob] = useState('');
  const [playerPosition, setPlayerPosition] = useState('Playmaker');
  const [playerTeam, setPlayerTeam] = useState('U13 Rookie');

  const [createChildAccount, setCreateChildAccount] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [useSamePasswordAsParent, setUseSamePasswordAsParent] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    parentEmail: string;
    playerName: string;
    childEmail?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formMountKey] = useState(() => `reg-${Date.now()}`);

  // Fresh form every visit — no login autofill leaking "password" demo placeholder
  useEffect(() => {
    setParentEmail('');
    setParentPassword('');
    setParentPhone('');
    setParentName('');
    setPlayerName('');
    setPlayerDob('');
    setChildEmail('');
    setChildPassword('');
    setCreateChildAccount(false);
    setUseSamePasswordAsParent(true);
    setSubmitted(false);
    setConfirmation(null);
    setErrorMsg('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentEmail || !parentPassword || !playerName || !playerDob) {
      setErrorMsg('Please fill in all mandatory fields (including date of birth).');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (createChildAccount && !childEmail.trim()) {
        setErrorMsg('Enter an email for your child\'s login (Enfant tab).');
        setIsLoading(false);
        return;
      }
      if (createChildAccount && !useSamePasswordAsParent && !childPassword) {
        setErrorMsg('Enter a password for your child, or use the same password as parent.');
        setIsLoading(false);
        return;
      }

      const reg = await api.registerPublic({
        parentEmail,
        parentPassword,
        parentPhone,
        parentName,
        fullName: playerName,
        dob: normalizeDobForSubmit(playerDob),
        position: playerPosition,
        team: playerTeam,
        createChildAccount,
        childEmail: createChildAccount ? childEmail.trim() : undefined,
        childPassword: createChildAccount && !useSamePasswordAsParent ? childPassword : undefined,
        useSamePasswordAsParent: createChildAccount ? useSamePasswordAsParent : undefined,
      });

      setConfirmation({
        parentEmail,
        playerName,
        childEmail: reg?.childAccount?.email,
      });
      setSubmitted(true);
      setPlayerName('');
      setPlayerDob('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to submit online registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #090514 0%, #0d0a25 50%, #110e30 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white'
    }} className="reg-page">
      <div className="glass-card reg-card" style={{
        width: '100%',
        maxWidth: '650px',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: '0.8rem',
            color: '#10b981',
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '0.3rem 0.8rem',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '0.75rem',
            border: '1px solid rgba(16,185,129,0.25)'
          }}>
            CFA — Chermiti Football Academy
          </span>
          <h2 style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Inscription en ligne
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Soumettez la candidature de votre enfant pour rejoindre l'académie.
          </p>
        </div>

        {submitted && confirmation ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <span style={{ fontSize: '3rem' }}>✓</span>
            <h3 style={{ color: '#34d399', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Application submitted!
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
              The academy will review your request within 48 hours. Your child is not enrolled until you receive approval.
            </p>
            <div style={{
              textAlign: 'left',
              background: 'rgba(0,0,0,0.2)',
              padding: '1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.7)',
            }}>
              <p style={{ margin: '0.25rem 0' }}><strong>Parent:</strong> {confirmation.parentEmail}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Player:</strong> {confirmation.playerName}</p>
              {confirmation.childEmail && (
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Child login (after approval):</strong> {confirmation.childEmail} — Enfant tab
                </p>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0 }}>
              After approval, sign in with the Parent tab using your email and password.
            </p>
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form
            key={formMountKey}
            onSubmit={handleSubmit}
            autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
          >
            
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Parent section */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.5rem' }}>
                👤 Parent / Guardian Information
              </h4>
              <div className="form-grid-2">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>Parent Full Name</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    placeholder="e.g. Slimane Laidouni"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="e.g. +216 98 123 456"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div className="form-grid-2">
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>Email Address</label>
                      <input
                        type="email"
                        required
                        value={parentEmail}
                        onChange={e => setParentEmail(e.target.value)}
                        placeholder="parent@example.com"
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          padding: '0.7rem',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>Choose Password</label>
                      <input
                        type="password"
                        required
                        name="cfa-parent-password"
                        autoComplete="new-password"
                        value={parentPassword}
                        onChange={e => setParentPassword(e.target.value)}
                        placeholder="Choose a password"
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          padding: '0.7rem',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Child section */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#a78bfa', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.5rem' }}>
                ⚽ Player (Child) Information
              </h4>
              <div className="form-grid-2">
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>Player Full Name</label>
                  <input
                    type="text"
                    required
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="e.g. Aissa Laidouni Jr"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="player-dob" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>
                    Date of Birth <span style={{ opacity: 0.6 }}>(AAAA-MM-JJ)</span>
                  </label>
                  <input
                    id="player-dob"
                    type="text"
                    inputMode="numeric"
                    required
                    name="player-dob"
                    autoComplete="off"
                    placeholder="2010-11-03"
                    pattern="\d{4}-\d{2}-\d{2}"
                    maxLength={10}
                    value={playerDob}
                    onChange={e => {
                      const v = e.target.value.replace(/[^\d-]/g, '').slice(0, 10);
                      setPlayerDob(v);
                    }}
                    onBlur={e => setPlayerDob(normalizeDobForSubmit(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>Optimal Position</label>
                  <select
                    value={playerPosition}
                    onChange={e => setPlayerPosition(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#110e30',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Playmaker">Playmaker</option>
                    <option value="Winger">Winger</option>
                    <option value="Center Back">Center Back</option>
                    <option value="Defensive Midfielder">Defensive Midfielder</option>
                    <option value="Striker">Striker</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>Preferred Squad Category</label>
                  <select
                    value={playerTeam}
                    onChange={e => setPlayerTeam(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#110e30',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="U17 Elite">U17 Elite (Ages 16-17)</option>
                    <option value="U15 Pro">U15 Pro (Ages 14-15)</option>
                    <option value="U13 Rookie">U13 Rookie (Ages 11-13)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{
              padding: '1.25rem',
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createChildAccount}
                  onChange={e => setCreateChildAccount(e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: '#6366f1' }}
                />
                <span>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#a5b4fc' }}>
                    Créer aussi un compte Enfant pour mon fils
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    Il pourra se connecter sur l’onglet Enfant et voir son calendrier et ses évaluations.
                  </span>
                </span>
              </label>
              {createChildAccount && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.35rem' }}>
                      Email Enfant (connexion onglet Enfant)
                    </label>
                    <input
                      type="email"
                      required={createChildAccount}
                      value={childEmail}
                      onChange={e => setChildEmail(e.target.value)}
                      placeholder="enfant@example.com"
                      style={{
                        width: '100%', padding: '0.7rem', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white', fontSize: '0.9rem', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    <input
                      type="checkbox"
                      checked={useSamePasswordAsParent}
                      onChange={e => setUseSamePasswordAsParent(e.target.checked)}
                    />
                    Même mot de passe que le parent
                  </label>
                  {!useSamePasswordAsParent && (
                    <input
                      type="password"
                      name="cfa-child-password"
                      autoComplete="new-password"
                      value={childPassword}
                      onChange={e => setChildPassword(e.target.value)}
                      placeholder="Mot de passe enfant"
                      style={{
                        width: '100%', padding: '0.7rem', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white', fontSize: '0.9rem', boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                  color: '#0d0a25',
                  border: 'none',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Submitting Registration...' : 'Submit Online Application'}
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.5)',
                  border: 'none',
                  padding: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
              >
                ← Already have an account? Sign In
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
