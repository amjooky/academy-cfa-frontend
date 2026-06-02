import { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n/useI18n';

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'xp' | 'enrollment' | 'event' | 'eval' | 'system';
}

export default function NotificationPanel({ notifications, onDismiss, onClearAll }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#notif-panel') && !target.closest('#notif-bell')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const typeColors: Record<string, string> = {
    xp:         '#f59e0b',
    enrollment: '#10b981',
    event:      '#38bdf8',
    eval:       '#a78bfa',
    system:     '#6b7280',
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        id="notif-bell"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          padding: '0.5rem 0.65rem', cursor: 'pointer', fontSize: '1.1rem',
          color: 'white', transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px',
            background: '#ef4444', color: 'white', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '0.65rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0a0a0f'
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel Dropdown */}
      {open && (
        <div
          id="notif-panel"
          className="notif-dropdown"
          style={{
            background: 'rgba(18,18,28,0.97)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.notifications.title}</span>
              {unread > 0 && (
                <span style={{
                  marginLeft: '0.5rem', background: 'rgba(239,68,68,0.15)', color: '#f87171',
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '20px'
                }}>
                  {unread} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.78rem', cursor: 'pointer', padding: '0.25rem 0.5rem',
                  borderRadius: '6px', transition: 'color 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                {t.notifications.clearAll}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔕</div>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
                  background: n.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                  transition: 'background 0.2s'
                }}>
                  {/* Colour-coded icon */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: `${typeColors[n.type]}18`,
                    border: `1px solid ${typeColors[n.type]}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    {n.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.83rem', fontWeight: 600, margin: '0 0 0.2rem', color: 'white' }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: '0.77rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 0.3rem', lineHeight: 1.4 }}>
                      {n.body}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>{n.time}</span>
                  </div>

                  <button
                    onClick={() => onDismiss(n.id)}
                    style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
                      cursor: 'pointer', fontSize: '0.9rem', padding: '0', lineHeight: 1,
                      flexShrink: 0, transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
