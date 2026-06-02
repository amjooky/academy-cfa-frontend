import { useState } from 'react';
import { useI18n } from '../lib/i18n/useI18n';

interface PendingRegistrationCardProps {
  reg: {
    id: string;
    name: string;
    dob: string;
    position: string;
    team: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
  };
  onApprove: (id: string, team: string) => void;
  onReject: (id: string) => void;
}

export default function PendingRegistrationCard({ reg, onApprove, onReject }: PendingRegistrationCardProps) {
  const { t } = useI18n();
  const [selectedTeam, setSelectedTeam] = useState(reg.team || 'U13 Rookie');

  const parentName = reg.parentName?.trim() || '—';
  const parentEmail = reg.parentEmail?.trim() || '—';
  const parentPhone = reg.parentPhone?.trim() || '—';

  return (
    <div className="glass-card" style={{
      padding: '1.25rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, var(--accent-pink) 0%, var(--accent-purple) 100%)',
      }} />

      <div>
        <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0 }}>{reg.name}</h5>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.pendingCard.dob} {reg.dob}</span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        background: 'rgba(255,255,255,0.02)',
        padding: '0.75rem',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{t.pendingCard.position}</span>
          <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{reg.position}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{t.pendingCard.prefCategory}</span>
          <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>{reg.team}</span>
        </div>
      </div>

      <div style={{
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '0.5rem',
      }}>
        <div style={{ fontWeight: 700, color: '#e5e7eb', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.pendingCard.parentContact}</div>
        <div style={{ fontWeight: 600, color: '#a78bfa' }}>{parentName}</div>
        <div>{parentEmail}</div>
        <div>{parentPhone}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.pendingCard.assignSquad}</label>
        <select
          value={selectedTeam}
          onChange={e => setSelectedTeam(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '0.45rem',
            borderRadius: '6px',
            color: 'white',
            fontSize: '0.8rem',
          }}
        >
          <option value="U17 Elite">{t.teams['U17 Elite']}</option>
          <option value="U15 Pro">{t.teams['U15 Pro']}</option>
          <option value="U13 Rookie">{t.teams['U13 Rookie']}</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button
          onClick={() => onApprove(reg.id, selectedTeam)}
          style={{
            flex: 1,
            background: 'var(--accent-green)',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '8px',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          {t.pendingCard.approve}
        </button>
        <button
          onClick={() => onReject(reg.id)}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            color: '#f87171',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          {t.pendingCard.reject}
        </button>
      </div>
    </div>
  );
}
