'use client';

// Settings page: machine management, config import/export, language, font size

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import { saveConfig, exportConfig, importConfig } from '@/lib/config';
import { connectToMachine, disconnectFromMachine } from '@/lib/connection';
import type { MachineConfig, ConnectionType } from '@shared/types';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const router = useRouter();
  const { config, setConfig, setMachines, machines } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', host: '', port: '9876', connectionType: 'direct' as ConnectionType });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importConfig(file);
      setConfig(imported);
      setMachines(imported.machines);
      saveConfig(imported);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const addMachine = () => {
    if (!form.name || !form.host) return;
    const id = `m-${Date.now()}`;
    const machine: MachineConfig = {
      id,
      name: form.name,
      host: form.host,
      port: parseInt(form.port) || 9876,
      connectionType: form.connectionType,
    };
    const updated = { ...config, machines: [...config.machines, machine] };
    setConfig(updated);
    setMachines(updated.machines);
    saveConfig(updated);
    connectToMachine(machine);
    setAdding(false);
    setForm({ name: '', host: '', port: '9876', connectionType: 'direct' });
  };

  const removeMachine = (id: string) => {
    disconnectFromMachine(id);
    const updated = { ...config, machines: config.machines.filter((m) => m.id !== id) };
    setConfig(updated);
    setMachines(updated.machines);
    saveConfig(updated);
  };

  const updateFontSize = (size: number) => {
    const updated = { ...config, preferences: { ...config.preferences, fontSize: size } };
    setConfig(updated);
    saveConfig(updated);
  };

  const updateLocale = (locale: 'en' | 'zh') => {
    const updated = { ...config, preferences: { ...config.preferences, locale } };
    setConfig(updated);
    saveConfig(updated);
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{t('title')}</h1>
      </div>

      {/* Machines */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>Machines</h2>
          <button onClick={() => setAdding(!adding)} style={smallBtnStyle}>+ Add</button>
        </div>

        {adding && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)', marginBottom: '10px' }}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. My Server)" style={inputStyle} />
            <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="Host (e.g. 192.168.1.100)" style={inputStyle} />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} placeholder="Port" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
              <select value={form.connectionType} onChange={(e) => setForm({ ...form, connectionType: e.target.value as ConnectionType })} style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
                <option value="direct">Direct</option>
                <option value="lan">LAN</option>
                <option value="tailscale">Tailscale</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setAdding(false)} style={{ ...smallBtnStyle, flex: 1 }}>{tc('cancel')}</button>
              <button onClick={addMachine} style={{ ...smallBtnStyle, flex: 1, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>{tc('save')}</button>
            </div>
          </div>
        )}

        {machines.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', marginBottom: '6px' }}>
            <div>
              <div style={{ fontSize: '14px' }}>{m.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.host}:{m.port} · {m.connectionType}</div>
            </div>
            <button onClick={() => removeMachine(m.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          </div>
        ))}
      </section>

      {/* Config import/export */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fileRef.current?.click()} style={btnStyle}>{t('import')}</button>
          <button onClick={() => exportConfig(config)} style={btnStyle}>{t('export')}</button>
        </div>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      </section>

      {/* Language */}
      <section style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>{t('language')}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['en', 'zh'] as const).map((loc) => (
            <button key={loc} onClick={() => updateLocale(loc)} style={{
              ...btnStyle,
              background: config.preferences.locale === loc ? 'var(--accent-soft)' : 'var(--bg-card)',
              borderColor: config.preferences.locale === loc ? 'var(--accent)' : 'var(--border)',
            }}>
              {loc === 'en' ? 'English' : '中文'}
            </button>
          ))}
        </div>
      </section>

      {/* Font size */}
      <section>
        <label style={labelStyle}>{t('fontSize')}: {config.preferences.fontSize}px</label>
        <input type="range" min={10} max={22} value={config.preferences.fontSize} onChange={(e) => updateFontSize(Number(e.target.value))} style={{ width: '100%' }} />
      </section>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px',
};
const smallBtnStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
  background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '8px', outline: 'none',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px',
};
