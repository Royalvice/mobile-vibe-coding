'use client';

// Machine detail page: session list + hardware status + create session with workdir

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import { sendToMachine } from '@/lib/connection';
import HwMonitor from '@/components/HwMonitor';
import type { SessionInfo, AgentTool } from '@shared/types';

export default function MachinePage() {
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;

  const { machines, machineHwStatus, machineSessions, machineStatuses, dirListCache } = useStore();
  const machine = machines.find((m) => m.id === machineId);
  const status = machineStatuses[machineId] || 'disconnected';
  const sessions = machineSessions[machineId] || [];
  const hwStatus = machineHwStatus[machineId] || null;
  const dirInfo = dirListCache[machineId];

  const [creating, setCreating] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AgentTool | null>(null);
  const [workdir, setWorkdir] = useState('~');
  const [browsing, setBrowsing] = useState(false);

  // Request home directory listing when browsing starts
  useEffect(() => {
    if (browsing) {
      sendToMachine(machineId, { type: 'browse_dirs', path: '' });
    }
  }, [browsing, machineId]);

  const browseTo = (dir: string) => {
    const newPath = dirInfo ? `${dirInfo.path}/${dir}` : dir;
    setWorkdir(newPath);
    sendToMachine(machineId, { type: 'browse_dirs', path: newPath });
  };

  const browseUp = () => {
    if (!dirInfo) return;
    const parent = dirInfo.path.replace(/[/\\][^/\\]+$/, '') || '/';
    setWorkdir(parent);
    sendToMachine(machineId, { type: 'browse_dirs', path: parent });
  };

  const selectDir = () => {
    if (dirInfo) setWorkdir(dirInfo.path);
    setBrowsing(false);
  };

  const createSession = () => {
    if (!selectedTool) return;
    sendToMachine(machineId, { type: 'create_session', tool: selectedTool, workdir });
    setCreating(false);
    setSelectedTool(null);
    setWorkdir('~');
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
        <button onClick={() => router.back()} style={backBtnStyle}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{machine.name}</h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{machine.host}:{machine.port}</div>
        </div>
        <span style={{
          fontSize: '11px', padding: '4px 10px', borderRadius: '8px', fontWeight: 500,
          background: status === 'connected' ? 'var(--success-soft)' : status === 'reconnecting' ? 'var(--warning-soft)' : 'var(--error-soft)',
          color: status === 'connected' ? 'var(--success)' : status === 'reconnecting' ? 'var(--warning)' : 'var(--error)',
        }}>
          {tc(status)}
        </span>
      </div>

      <HwMonitor status={hwStatus} />

      {/* Sessions */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Sessions</h2>
          <button onClick={() => { setCreating(!creating); setSelectedTool(null); }} style={accentBtnStyle}>
            + {t('create')}
          </button>
        </div>

        {/* Create session flow */}
        {creating && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', marginBottom: '14px', animation: 'fadeIn 0.2s ease-out' }}>
            {/* Step 1: pick tool */}
            {!selectedTool ? (
              <>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Choose agent</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['codex', 'claude-code'] as const).map((tool) => (
                    <button key={tool} onClick={() => setSelectedTool(tool)} className="card-interactive" style={toolBtnStyle}>
                      {tool === 'codex' ? t('codex') : t('claudeCode')}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Step 2: pick workdir */}
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Workspace for {selectedTool === 'codex' ? 'Codex' : 'Claude Code'}
                </div>

                {/* Manual input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    value={workdir}
                    onChange={(e) => setWorkdir(e.target.value)}
                    placeholder="/path/to/project"
                    style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  />
                  <button onClick={() => setBrowsing(!browsing)} style={{ ...smallBtnStyle, whiteSpace: 'nowrap' }}>
                    {browsing ? 'Close' : 'Browse'}
                  </button>
                </div>

                {/* Directory browser */}
                {browsing && dirInfo && (
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '8px', marginBottom: '10px', maxHeight: '200px', overflow: 'auto' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', wordBreak: 'break-all' }}>
                      {dirInfo.path}
                    </div>
                    <button onClick={browseUp} style={dirItemStyle}>← ..</button>
                    {dirInfo.dirs.map((d) => (
                      <button key={d} onClick={() => browseTo(d)} style={dirItemStyle}>
                        📁 {d}
                      </button>
                    ))}
                    <button onClick={selectDir} style={{ ...smallBtnStyle, width: '100%', marginTop: '6px', background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
                      Use this directory
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setSelectedTool(null); setBrowsing(false); }} style={{ ...smallBtnStyle, flex: 1 }}>{tc('cancel')}</button>
                  <button onClick={createSession} style={{ ...smallBtnStyle, flex: 1, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
                    Create
                  </button>
                </div>
              </>
            )}
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
                padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                animation: `fadeIn 0.25s ease-out ${i * 40}ms both`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{s.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: 500,
                    background: s.alive ? 'var(--success-soft)' : 'var(--error-soft)',
                    color: s.alive ? 'var(--success)' : 'var(--error)',
                  }}>
                    {s.alive ? 'alive' : 'dead'}
                  </span>
                  <span onClick={(e) => killSession(s.id, e)} style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 6px' }}>✕</span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {s.tool} · {s.workdir}
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '32px', opacity: 0.7 }}>
              <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.4 }}>~</div>
              No sessions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', padding: '4px 8px',
};
const accentBtnStyle: React.CSSProperties = {
  padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
};
const toolBtnStyle: React.CSSProperties = {
  flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
};
const smallBtnStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
};
const dirItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '6px 8px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px', textAlign: 'left',
};
