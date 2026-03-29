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
    return (
      <div className="page-enter" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '28px', marginBottom: '12px', opacity: 0.3 }}>✦</div>
        Machine not found
      </div>
    );
  }

  return (
    <div className="page-enter safe-bottom" style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{machine.name}</h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {machine.host}:{machine.port}
          </div>
        </div>
        <span style={{
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: '8px',
          background: status === 'connected' ? 'var(--success-soft)' : status === 'reconnecting' ? 'var(--warning-soft)' : 'var(--error-soft)',
          color: status === 'connected' ? 'var(--success)' : status === 'reconnecting' ? 'var(--warning)' : 'var(--error)',
          fontWeight: 500,
        }}>
          {tc(status)}
        </span>
      </div>

      {/* Hardware status */}
      <HwMonitor status={hwStatus} />

      {/* Sessions */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Sessions</h2>
          <button
            onClick={() => setCreating(!creating)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            + {t('create')}
          </button>
        </div>

        {/* Create session picker */}
        {creating && (
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '14px',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            {(['codex', 'claude-code'] as const).map((tool) => (
              <button
                key={tool}
                onClick={() => createSession(tool)}
                className="card-interactive"
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                }}
              >
                {tool === 'codex' ? t('codex') : t('claudeCode')}
              </button>
            ))}
          </div>
        )}

        {/* Session list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map((s: SessionInfo, i: number) => (
            <button
              key={s.id}
              className="card-interactive"
              onClick={() => router.push(`/session/${machineId}/${s.id}`)}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                animation: `fadeIn 0.25s ease-out ${i * 40}ms both`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{s.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                    background: s.alive ? 'var(--success-soft)' : 'var(--error-soft)',
                    color: s.alive ? 'var(--success)' : 'var(--error)',
                    fontWeight: 500,
                  }}>
                    {s.alive ? 'alive' : 'dead'}
                  </span>
                  <span
                    onClick={(e) => killSession(s.id, e)}
                    style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
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
            <div style={{
              color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center',
              padding: '32px', opacity: 0.7,
            }}>
              <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.4 }}>~</div>
              No sessions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
