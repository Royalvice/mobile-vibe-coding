// Config import/export utilities

import type { AppConfig } from '../../../shared/types';

const STORAGE_KEY = 'mvc-config';

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  machines: [],
  preferences: { fontSize: 14, locale: 'en' },
};

export function loadConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return JSON.parse(raw) as AppConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function exportConfig(config: AppConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mvc-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importConfig(file: File): Promise<AppConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const config = JSON.parse(reader.result as string) as AppConfig;
        if (!config.version || !config.machines) {
          reject(new Error('Invalid config format'));
          return;
        }
        resolve(config);
      } catch {
        reject(new Error('Failed to parse config file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
