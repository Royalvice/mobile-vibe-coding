'use client';

// Home page: machine list with live connection status

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const t = useTranslations('home');
  const router = useRouter();
  const { machines, machineStatuses, machineSessions } = useStore();

  return (
    <div className="page-enter safe-bottom" style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.3px' }}>
          {t('title')}
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          vibe coding, anywhere
        </p>
      </div>

      {/* Machine list */}
      {machines.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '16px', opacity: 0.4 }}>✦</div>
          <p style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            {t('noMachines')}
          </p>
          <p style={{ fontSize: '12px', marginBottom: '20px' }}>
            Add a machine to get started
          </p>
          <button
            onClick={() => router.push('/settings')}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {t('addMachine')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {machines.map((machine, i) => {
            const status = machineStatuses[machine.id] || 'disconnected';
            const sessions = machineSessions[machine.id] || [];
            const aliveSessions = sessions.filter((s) => s.alive);

            return (
              <button
                key={machine.id}
                className="card-interactive"
                onClick={() => router.push(`/machine/${machine.id}`)}
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  animationDelay: `${i * 50}ms`,
                  animation: `fadeIn 0.3s ease-out ${i * 50}ms both`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>{machine.name}</span>
                  <span
                    className={status === 'reconnecting' ? 'status-dot-reconnecting' : ''}
                    style={{
                      width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                      background: status === 'connected' ? 'var(--success)' : status === 'reconnecting' ? 'var(--warning)' : 'var(--error)',
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{machine.host}:{machine.port}</span>
                  <span style={{ opacity: 0.3 }}>·</span>
                  <span>{machine.connectionType}</span>
                  {aliveSessions.length > 0 && (
                    <>
                      <span style={{ opacity: 0.3 }}>·</span>
                      <span style={{ color: 'var(--accent)' }}>
                        {t('sessions', { count: aliveSessions.length })}
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
