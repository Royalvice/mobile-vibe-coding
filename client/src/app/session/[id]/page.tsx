'use client';

// Session terminal page — the core interaction view

import { useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useStore } from '@/lib/store';
import PromptCard from '@/components/PromptCard';

// xterm.js only works in browser
const TerminalView = dynamic(() => import('@/components/TerminalView'), { ssr: false });

export default function SessionPage() {
  const t = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { activePrompt, setActivePrompt } = useStore();
  const writeRef = useRef<((data: string) => void) | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // TODO: get machine URL from config based on route context
  // For now, use a placeholder that will be wired up properly
  const agentUrl = typeof window !== 'undefined'
    ? localStorage.getItem('mvc-debug-agent-url') || 'ws://localhost:9876'
    : 'ws://localhost:9876';

  useEffect(() => {
    const ws = new WebSocket(agentUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Attach to session
      ws.send(JSON.stringify({ type: 'attach_session', sessionId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'output':
            if (msg.sessionId === sessionId) {
              writeRef.current?.(msg.data);
            }
            break;
          case 'prompt_detected':
            if (msg.prompt.sessionId === sessionId) {
              setActivePrompt(msg.prompt);
            }
            break;
          case 'session_ended':
            if (msg.sessionId === sessionId) {
              router.back();
            }
            break;
        }
      } catch {
        // Ignore
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [agentUrl, sessionId, setActivePrompt, router]);

  const handleTermData = useCallback((data: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'input', sessionId, data }));
  }, [sessionId]);

  const handleResize = useCallback((cols: number, rows: number) => {
    wsRef.current?.send(JSON.stringify({ type: 'resize', sessionId, cols, rows }));
  }, [sessionId]);

  const handlePromptReply = useCallback((selectedKey: string, note?: string) => {
    wsRef.current?.send(JSON.stringify({
      type: 'prompt_reply',
      sessionId,
      promptId: activePrompt?.id,
      selectedKey,
      note,
    }));
    setActivePrompt(null);
  }, [sessionId, activePrompt, setActivePrompt]);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal header */}
      <div style={{
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px',
          }}
        >
          ← {t('back')}
        </button>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {sessionId}
        </span>
      </div>

      {/* Terminal */}
      <div style={{ flex: 1, padding: '4px' }}>
        <TerminalView
          onData={handleTermData}
          onResize={handleResize}
          writeRef={writeRef}
        />
      </div>

      {/* Prompt card overlay */}
      {activePrompt && (
        <PromptCard
          prompt={activePrompt}
          onReply={handlePromptReply}
          onDismiss={() => setActivePrompt(null)}
        />
      )}
    </div>
  );
}
