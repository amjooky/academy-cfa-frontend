import React, { useState } from 'react';
import { PLAN_LABELS, PLAN_AMOUNTS } from '../lib/mappers';

interface Player {
  id: string;
  name: string;
  team: string;
}

interface IssueInvoiceModalProps {
  players: Player[];
  onClose: () => void;
  onConfirm: (playerId: string, amount: string, plan?: string) => void;
  isLoading: boolean;
}

export default function IssueInvoiceModal({ players, onClose, onConfirm, isLoading }: IssueInvoiceModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id || '');
  const [plan, setPlan] = useState<keyof typeof PLAN_AMOUNTS>('monthly');
  const [amount, setAmount] = useState(String(PLAN_AMOUNTS.monthly));
  const [errorMsg, setErrorMsg] = useState('');

  const handlePlanChange = (newPlan: keyof typeof PLAN_AMOUNTS) => {
    setPlan(newPlan);
    setAmount(String(PLAN_AMOUNTS[newPlan]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setErrorMsg('Please select a player.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }
    setErrorMsg('');
    onConfirm(selectedPlayerId, amount, plan);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 5, 10, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.25rem',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.02)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '1.25rem',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.color = '#fff'}>✕</button>

        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Academy Invoicing</span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginTop: '0.25rem', marginBottom: '0.25rem' }}>+ Issue New Invoice</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Create a new billing invoice for rostered players.</p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            color: '#fca5a5'
          }}>{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Player</label>
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '0.9rem'
              }}
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.team}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Formule (plan)</label>
            <select
              value={plan}
              onChange={e => handlePlanChange(e.target.value as keyof typeof PLAN_AMOUNTS)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '0.9rem'
              }}
            >
              {Object.entries(PLAN_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label} — {PLAN_AMOUNTS[key]} TND</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Amount (TND)</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '0.9rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            className="glow-btn"
            disabled={isLoading || players.length === 0}
            style={{ padding: '0.85rem', borderRadius: '10px', fontWeight: 700, marginTop: '0.5rem' }}
          >
            {isLoading ? 'Issuing...' : 'Issue Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}
