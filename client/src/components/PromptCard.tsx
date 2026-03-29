'use client';

// Floating card overlay for interactive prompts

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { InteractivePrompt } from '@shared/types';

interface PromptCardProps {
  prompt: InteractivePrompt;
  onReply: (selectedKey: string, note?: string) => void;
  onDismiss: () => void;
}

export default function PromptCard({ prompt, onReply, onDismiss }: PromptCardProps) {
  const t = useTranslations('prompt');
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (!selected) return;
    onReply(selected, note || undefined);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border)',
        animation: 'slideUp 0.2s ease-out',
      }}>
        {/* Question */}
        <p style={{
          margin: '0 0 16px',
          fontSize: '15px',
          color: 'var(--text-primary)',
          lineHeight: 1.5,
        }}>
          {prompt.question}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {prompt.options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: selected === opt.key
                  ? '1.5px solid var(--accent)'
                  : '1px solid var(--border)',
                background: selected === opt.key ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
              {opt.recommended && (
                <span style={{ color: 'var(--accent)', fontSize: '12px', marginLeft: '8px' }}>
                  recommended
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Note input */}
        {prompt.allowFreeInput && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('addNote')}
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              resize: 'none',
              marginBottom: '12px',
              outline: 'none',
            }}
          />
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onDismiss}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: selected ? 'var(--accent)' : 'var(--bg-hover)',
              color: selected ? '#fff' : 'var(--text-muted)',
              cursor: selected ? 'pointer' : 'default',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
          >
            {t('confirm')}
          </button>
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
