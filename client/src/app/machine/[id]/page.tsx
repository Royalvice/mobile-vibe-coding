'use client';

// Machine detail page: session list + hardware status

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import HwMonitor from '@/components/HwMonitor';
import type { SessionInfo } from '../../../../shared/types';

export default function MachinePage() {
  const t = useTranslations('session');
  const tHw = useTranslations('hw');
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;

  const { machines, hwStatus, setHwStatus, sessions, setSessions } = useStore();
  const machine = machines.find((m) => m.id === machineId);
  const wsRef = useRef<WebSocket | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!machine) return;

    const url = machine.connectionType === 'tailscale' && machine.tailscaleHost
      ? `ws://${machine.tailscaleHost}:${machine.port}`
      : `ws://${machine.host}:${machine.port}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'list_sessions' }));
      ws.send(JSON.stringify({ type: 'request_hw_status' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'session_list') setSessions(msg.sessions);
        if (msg.type === 'hw_status') setHwStatus(msg.status);
      } catch { /* ignore */ }
    };

    return () => { ws.close(); };
  }, [machine, setSessions, setHwStatus]);

  const createSession = (tool: 'codex' | 'claude-code') => {
    wsRef.current?.send(JSON.stringify({
      type: 'create_session',
      tool,
      workdir: '~',
    }));
    setCreating(false);
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
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{machine.name}</h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{machine.host}:{machine.port}</div>
        </div>
      </div>

      {/* Hardware status */}
      <HwMonitor status={hwStatus} />

      {/* Sessions */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Sessions</h2>
          <button
            onClick={() => setCreating(!creating)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            + {t('create')}
          </button>
        </div>

        {/* Create session picker */}
        {creating && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button onClick={() => createSession('codex')} style={toolBtnStyle}>
              {t('codex')}
            </button>
            <button onClick={() => createSession('claude-code')} style={toolBtnStyle}>
              {t('claudeCode')}
            </button>
          </div>
        )}

        {/* Session list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map((s: SessionInfo) => (
            <button
              key={s.id}
              onClick={() => router.push(`/session/${s.id}`)}
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
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: s.alive ? 'var(--success)22' : 'var(--error)22',
                  color: s.alive ? 'var(--success)' : 'var(--error)',
                }}>
                  {s.alive ? 'alive' : 'dead'}
                </span>
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
  flex: 1,
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '13px',
};
