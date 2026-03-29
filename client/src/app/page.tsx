'use client';

// Home page: machine list

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import { loadConfig } from '@/lib/config';

export default function HomePage() {
  const t = useTranslations('home');
  const router = useRouter();
  const { machines, setConfig, setMachines } = useStore();

  useEffect(() => {
    const config = loadConfig();
    setConfig(config);
    setMachines(config.machines);
  }, [setConfig, setMachines]);

  return (
    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600 }}>{t('title')}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push('/auto')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Auto
          </button>
          <button
            onClick={() => router.push('/settings')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Machine list */}
      {machines.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          color: 'var(--text-muted)',
        }}>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>{t('noMachines')}</p>
          <button
            onClick={() => router.push('/settings')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {t('addMachine')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {machines.map((machine) => (
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
              <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
                {machine.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {machine.host}:{machine.port} · {machine.connectionType}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
