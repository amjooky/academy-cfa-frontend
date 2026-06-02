import { useState } from 'react';

interface MarkAsPaidModalProps {
  invoice: {
    id: string;
    name: string;
    amount: string;
    currency: string;
    date: string;
  };
  onClose: () => void;
  onConfirm: (adminNote: string) => void;
  isLoading: boolean;
}

export default function MarkAsPaidModal({ invoice, onClose, onConfirm, isLoading }: MarkAsPaidModalProps) {
  const [adminNote, setAdminNote] = useState('');

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
        maxWidth: '480px',
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
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Payment Override</span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginTop: '0.25rem', marginBottom: '0.25rem' }}>Mark Invoice as Paid</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Manual auditing record for parental academy fees.</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Player / Child:</span>
            <strong style={{ color: 'white' }}>{invoice.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Invoice Due:</span>
            <span style={{ color: 'white', fontWeight: 600 }}>{invoice.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ color: 'white', fontWeight: 600 }}>Total Amount:</span>
            <strong style={{ color: 'var(--accent-green)', fontSize: '1.1rem' }}>{invoice.amount} {invoice.currency}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Audit / Admin Note <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>(Optional)</span>
          </label>
          <textarea
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            placeholder="e.g. Paid cash at the front office desk"
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'white',
              padding: '0.75rem',
              fontSize: '0.85rem',
              resize: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Cancel
          </button>
          
          <button
            onClick={() => onConfirm(adminNote)}
            disabled={isLoading}
            style={{
              flex: 1.5,
              background: 'linear-gradient(135deg, var(--accent-green) 0%, #10b981 100%)',
              color: '#000',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
