'use client';

// Session terminal page — core interaction view
// Route: /session/[machineId]/[id]

import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useStore } from '@/lib/store';
import { sendToMachine, useTerminalWriter } from '@/lib/connection';
import PromptCard from '@/components/PromptCard';
import QuickBar from '@/components/QuickBar';

const TerminalView = dynamic(() => import('@/components/TerminalView'), { ssr: false });

export default function SessionPage() {
  const t = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const machineId = params.machineId as string;
  const sessionId = params.id as string;

  const { activePrompt, setActivePrompt, machineStatuses } = useStore();
  const status = machineStatuses[machineId] || 'disconnected';
  const writeRef = useRef<((data: string) => void) | null>(null);
  const [writerReady, setWriterReady] = useState(false);

  // Attach to session on mount
  useEffect(() => {
    sendToMachine(machineId, { type: 'attach_session', sessionId });
    return () => {
      sendToMachine(machineId, { type: 'detach_session', sessionId });
    };
  }, [machineId, sessionId]);

  // Register terminal writer so connection manager can route output here
  useTerminalWriter(machineId, sessionId, writerReady ? writeRef.current : null);

  const handleTermData = useCallback((data: string) => {
    sendToMachine(machineId, { type: 'input', sessionId, data });
  }, [machineId, sessionId]);

  const handleResize = useCallback((cols: number, rows: number) => {
    sendToMachine(machineId, { type: 'resize', sessionId, cols, rows });
  }, [machineId, sessionId]);

  const handlePromptReply = useCallback((selectedKey: string, note?: string) => {
    sendToMachine(machineId, {
      type: 'prompt_reply',
      sessionId,
      promptId: activePrompt?.id ?? '',
      selectedKey,
      note,
    });
    setActivePrompt(null);
  }, [machineId, sessionId, activePrompt, setActivePrompt]);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
          >
            ← {t('back')}
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{sessionId}</span>
        </div>
        <span style={{
          fontSize: '10px',
          width: '8px', height: '8px', borderRadius: '50%',
          background: status === 'connected' ? 'var(--success)' : 'var(--error)',
          display: 'inline-block',
        }} />
      </div>

      {/* Terminal */}
      <div style={{ flex: 1, padding: '4px', minHeight: 0 }}>
        <TerminalView
          onData={handleTermData}
          onResize={handleResize}
          writeRef={writeRef}
          onReady={() => setWriterReady(true)}
        />
      </div>

      {/* Quick action bar for mobile */}
      <QuickBar onSend={handleTermData} />

      {/* Prompt card overlay */}
      {activePrompt && activePrompt.sessionId === sessionId && (
        <PromptCard
          prompt={activePrompt}
          onReply={handlePromptReply}
          onDismiss={() => setActivePrompt(null)}
        />
      )}
    </div>
  );
}
