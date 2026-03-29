'use client';

// Machine detail page: session list + hardware status

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import { sendToMachine } from '@/lib/connection';
import HwMonitor from '@/components/HwMonitor';
import type { SessionInfo } from '@shared/types';

export default function MachinePage() {
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;

  const { machines, machineHwStatus, machineSessions, machineStatuses } = useStore();
  const machine = machines.find((m) => m.id === machineId);
  const status = machineStatuses[machineId] || 'disconnected';
  const sessions = machineSessions[machineId] || [];
  const hwStatus = machineHwStatus[machineId] || null;
  const [creating, setCreating] = useState(false);

  const createSession = (tool: 'codex' | 'claude-code') => {
    sendToMachine(machineId, { type: 'create_session', tool, workdir: '~' });
    setCreating(false);
  };

  const killSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sendToMachine(machineId, { type: 'kill_session', sessionId });
  };

  if (!machine) {
    return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Machine not found</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{machine.name}</h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{machine.host}:{machine.port}</div>
        </div>
        <span style={{
          fontSize: '11px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: status === 'connected' ? 'var(--success)22' : status === 'reconnecting' ? 'var(--warning)22' : 'var(--error)22',
          color: status === 'connected' ? 'var(--success)' : status === 'reconnecting' ? 'var(--warning)' : 'var(--error)',
        }}>
          {tc(status)}
        </span>
      </div>

      {/* Hardware status */}
      <HwMonitor status={hwStatus} />

      {/* Sessions */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Sessions</h2>
          <button
            onClick={() => setCreating(!creating)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
          >
            + {t('create')}
          </button>
        </div>

        {creating && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button onClick={() => createSession('codex')} style={toolBtnStyle}>{t('codex')}</button>
            <button onClick={() => createSession('claude-code')} style={toolBtnStyle}>{t('claudeCode')}</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map((s: SessionInfo) => (
            <button
              key={s.id}
              onClick={() => router.push(`/session/${machineId}/${s.id}`)}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{s.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: s.alive ? 'var(--success)22' : 'var(--error)22',
                    color: s.alive ? 'var(--success)' : 'var(--error)',
                  }}>
                    {s.alive ? 'alive' : 'dead'}
                  </span>
                  <span
                    onClick={(e) => killSession(s.id, e)}
                    style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}
                  >
                    ✕
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {s.tool} · {s.workdir}
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
              No sessions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const toolBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px',
};
