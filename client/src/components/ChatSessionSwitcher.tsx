'use client';

// Chat session switcher card — floating overlay to list and switch CLI chat sessions

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import { sendToMachine } from '@/lib/connection';
import type { ChatSession } from '@shared/types';

interface ChatSessionSwitcherProps {
  machineId: string;
  sessionId: string;
  onClose: () => void;
}

export default function ChatSessionSwitcher({ machineId, sessionId, onClose }: ChatSessionSwitcherProps) {
  const tc = useTranslations('common');
  const { chatSessionsCache } = useStore();
  const cacheKey = `${machineId}:${sessionId}`;
  const chatSessions = chatSessionsCache[cacheKey] || [];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sendToMachine(machineId, { type: 'list_chat_sessions', sessionId });
    // Give it a moment to respond
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [machineId, sessionId]);

  // Update loading state when data arrives
  useEffect(() => {
    if (chatSessions.length > 0) setLoading(false);
  }, [chatSessions]);

  const switchTo = (mode: 'new' | 'continue' | 'resume', chatSessionId?: string) => {
    sendToMachine(machineId, {
      type: 'switch_chat_session',
      sessionId,
      mode,
      chatSessionId,
    });
    onClose();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', maxHeight: '70vh',
        background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', animation: 'slideUp 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>Chat Sessions</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        {/* Quick actions */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => switchTo('new')} style={actionBtnStyle}>
            New Chat
          </button>
          <button onClick={() => switchTo('continue')} style={actionBtnStyle}>
            Continue Last
          </button>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
              {tc('loading')}
            </div>
          ) : chatSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No previous chat sessions found
            </div>
          ) : (
            chatSessions.map((cs: ChatSession) => (
              <button
                key={cs.id}
                onClick={() => switchTo('resume', cs.id)}
                className="card-interactive"
                style={{
                  display: 'block', width: '100%', padding: '12px 14px', marginBottom: '6px',
                  borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cs.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                  <span>{cs.id.slice(0, 12)}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{formatTime(cs.updatedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer',
  fontSize: '12px', fontWeight: 500,
};
