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
    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600 }}>{t('title')}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => router.push('/auto')} style={headerBtnStyle}>Auto</button>
          <button onClick={() => router.push('/settings')} style={headerBtnStyle}>⚙</button>
        </div>
      </div>

      {/* Machine list */}
      {machines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>{t('noMachines')}</p>
          <button
            onClick={() => router.push('/settings')}
            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
          >
            {t('addMachine')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {machines.map((machine) => {
            const status = machineStatuses[machine.id] || 'disconnected';
            const sessions = machineSessions[machine.id] || [];
            const aliveSessions = sessions.filter((s) => s.alive);

            return (
              <button
                key={machine.id}
                onClick={() => router.push(`/machine/${machine.id}`)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>{machine.name}</span>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block',
                    background: status === 'connected' ? 'var(--success)' : status === 'reconnecting' ? 'var(--warning)' : 'var(--error)',
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {machine.host}:{machine.port} · {machine.connectionType}
                  {aliveSessions.length > 0 && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      {t('sessions', { count: aliveSessions.length })}
                    </span>
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

const headerBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
};
