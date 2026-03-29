'use client';

// Quick-action toolbar for mobile terminal — special keys and common commands

interface QuickBarProps {
  onSend: (data: string) => void;
}

const keys = [
  { label: 'Esc', data: '\x1b' },
  { label: 'Tab', data: '\t' },
  { label: 'Ctrl+C', data: '\x03' },
  { label: 'Ctrl+D', data: '\x04' },
  { label: '↑', data: '\x1b[A' },
  { label: '↓', data: '\x1b[B' },
  { label: '/', data: '/' },
] as const;

export default function QuickBar({ onSend }: QuickBarProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      padding: '6px 8px',
      overflowX: 'auto',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
    }}>
      {keys.map((k) => (
        <button
          key={k.label}
          onClick={() => onSend(k.data)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
