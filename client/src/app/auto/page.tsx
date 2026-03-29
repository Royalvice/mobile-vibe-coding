'use client';

// Auto mode control page + prompt template editor

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import type { PromptTemplate } from '@shared/types';

export default function AutoPage() {
  const t = useTranslations('auto');
  const tc = useTranslations('common');
  const router = useRouter();
  const { autoModeEnabled, setAutoModeEnabled, eventLog } = useStore();

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [pollInterval, setPollInterval] = useState(180); // 3 minutes default
  const [editingId, setEditingId] = useState<string | null>(null);

  const addTemplate = () => {
    const id = `tpl-${Date.now()}`;
    setTemplates([...templates, { id, name: 'New Template', content: '', targetTool: 'any' }]);
    setEditingId(id);
  };

  const updateTemplate = (id: string, updates: Partial<PromptTemplate>) => {
    setTemplates(templates.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const toggleAuto = () => {
    // TODO: send set_auto_mode message via WebSocket
    setAutoModeEnabled(!autoModeEnabled);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{t('title')}</h1>
      </div>

      {/* Toggle */}
      <button
        onClick={toggleAuto}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          background: autoModeEnabled ? 'var(--success)' : 'var(--accent)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: 500,
          marginBottom: '20px',
          transition: 'background 0.2s ease',
        }}
      >
        {autoModeEnabled ? `● ${t('running')} — ${t('stop')}` : t('start')}
      </button>

      {/* Poll interval */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          {t('interval')}: {pollInterval}s
        </label>
        <input
          type="range"
          min={30}
          max={600}
          step={30}
          value={pollInterval}
          onChange={(e) => setPollInterval(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Templates */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>{t('templates')}</h2>
          <button onClick={addTemplate} style={smallBtnStyle}>+ {t('addTemplate')}</button>
        </div>

        {templates.map((tpl) => (
          <div key={tpl.id} style={{
            marginBottom: '10px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            overflow: 'hidden',
          }}>
            <div
              onClick={() => setEditingId(editingId === tpl.id ? null : tpl.id)}
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '14px' }}>{tpl.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tpl.targetTool}</span>
            </div>

            {editingId === tpl.id && (
              <div style={{ padding: '0 14px 14px' }}>
                <input
                  value={tpl.name}
                  onChange={(e) => updateTemplate(tpl.id, { name: e.target.value })}
                  placeholder="Template name"
                  style={inputStyle}
                />
                <textarea
                  value={tpl.content}
                  onChange={(e) => updateTemplate(tpl.id, { content: e.target.value })}
                  placeholder="Prompt content..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <select
                  value={tpl.targetTool}
                  onChange={(e) => updateTemplate(tpl.id, { targetTool: e.target.value as PromptTemplate['targetTool'] })}
                  style={inputStyle}
                >
                  <option value="any">Any</option>
                  <option value="codex">Codex</option>
                  <option value="claude-code">Claude Code</option>
                </select>
                <button onClick={() => deleteTemplate(tpl.id)} style={{ ...smallBtnStyle, color: 'var(--error)' }}>
                  {tc('delete')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Event log summary */}
      {eventLog.length > 0 && (
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '8px' }}>Event Log</h2>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {eventLog.slice(-20).reverse().map((e) => (
              <div key={e.id} style={{
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '12px',
              }}>
                <span style={{
                  color: e.severity === 'error' ? 'var(--error)' : e.severity === 'warn' ? 'var(--warning)' : 'var(--text-muted)',
                }}>
                  [{new Date(e.timestamp).toLocaleTimeString()}]
                </span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const smallBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '12px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  marginBottom: '8px',
  outline: 'none',
};
