'use client';

// Hardware monitor dashboard component

import { useTranslations } from 'next-intl';
import type { HwStatus } from '../../../shared/types';

interface HwMonitorProps {
  status: HwStatus | null;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{
      height: '6px',
      borderRadius: '3px',
      background: 'var(--bg-secondary)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        borderRadius: '3px',
        background: color,
        transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{value}</span>
      </div>
      {sub && <Bar value={parseFloat(value)} max={100} color={color} />}
    </div>
  );
}

export default function HwMonitor({ status }: HwMonitorProps) {
  const t = useTranslations('hw');

  if (!status) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>—</div>;
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid var(--border)',
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {t('title')}
      </h3>

      <Stat
        label={t('cpu')}
        value={`${status.cpu.usagePercent}%`}
        sub="bar"
        color="var(--accent)"
      />

      <Stat
        label={t('ram')}
        value={`${Math.round(status.ram.usedMB / 1024 * 10) / 10} / ${Math.round(status.ram.totalMB / 1024 * 10) / 10} GB`}
        sub="bar"
        color="var(--success)"
      />

      {status.disk.slice(0, 2).map((d, i) => (
        <Stat
          key={i}
          label={`${t('disk')} ${d.path}`}
          value={`${d.usedGB} / ${d.totalGB} GB`}
          sub="bar"
          color="var(--warning)"
        />
      ))}

      {status.gpus.map((gpu, i) => (
        <div key={i} style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('gpu')} {gpu.name}
          </div>
          <Stat
            label="Util"
            value={`${gpu.utilizationPercent}%`}
            sub="bar"
            color="var(--error)"
          />
          <Stat
            label="VRAM"
            value={`${gpu.memoryUsedMB} / ${gpu.memoryTotalMB} MB`}
            sub="bar"
            color="var(--error)"
          />
          {gpu.temperatureC !== null && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {gpu.temperatureC}°C
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
