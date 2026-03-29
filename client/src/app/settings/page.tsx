'use client';

// Settings page: config import/export, language, font size

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import { saveConfig, exportConfig, importConfig } from '@/lib/config';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const router = useRouter();
  const { config, setConfig } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importConfig(file);
      setConfig(imported);
      saveConfig(imported);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleExport = () => exportConfig(config);

  const updateFontSize = (size: number) => {
    const updated = { ...config, preferences: { ...config.preferences, fontSize: size } };
    setConfig(updated);
    saveConfig(updated);
  };

  const updateLocale = (locale: 'en' | 'zh') => {
    const updated = { ...config, preferences: { ...config.preferences, locale } };
    setConfig(updated);
    saveConfig(updated);
    // Reload to apply locale change
    window.location.reload();
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

      {/* Config import/export */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fileRef.current?.click()} style={btnStyle}>
            {t('import')}
          </button>
          <button onClick={handleExport} style={btnStyle}>
            {t('export')}
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      </section>

      {/* Language */}
      <section style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>{t('language')}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['en', 'zh'] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => updateLocale(loc)}
              style={{
                ...btnStyle,
                background: config.preferences.locale === loc ? 'var(--accent-soft)' : 'var(--bg-card)',
                borderColor: config.preferences.locale === loc ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {loc === 'en' ? 'English' : '中文'}
            </button>
          ))}
        </div>
      </section>

      {/* Font size */}
      <section style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>{t('fontSize')}: {config.preferences.fontSize}px</label>
        <input
          type="range"
          min={10}
          max={22}
          value={config.preferences.fontSize}
          onChange={(e) => updateFontSize(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </section>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '13px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  marginBottom: '8px',
};
