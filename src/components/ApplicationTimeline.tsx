import React from 'react';

const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'review', label: 'Under Review' },
  { key: 'done', label: 'Approved' },
] as const;

export default function ApplicationTimeline({ status }: { status: string }) {
  const s = (status || 'pending').toLowerCase();
  const activeIdx = s === 'active' ? 2 : s === 'rejected' ? 1 : 1;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
      {STEPS.map((step, idx) => {
        const done = s === 'active' ? idx <= 2 : idx <= activeIdx;
        const isRejected = s === 'rejected' && idx === 2;
        return (
          <React.Fragment key={step.key}>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.2rem 0.45rem',
              borderRadius: '4px',
              background: isRejected ? 'rgba(239,68,68,0.2)' : done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
              color: isRejected ? '#f87171' : done ? '#34d399' : 'rgba(255,255,255,0.4)',
            }}>
              {isRejected && idx === 2 ? 'Rejected' : step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem' }}>→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
