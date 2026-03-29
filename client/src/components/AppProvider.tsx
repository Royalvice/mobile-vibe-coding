'use client';

// App-level provider: loads config on mount, connects to all machines

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { loadConfig } from '@/lib/config';
import { useConnectAll } from '@/lib/connection';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { setConfig, setMachines } = useStore();

  // Load config once on app mount
  useEffect(() => {
    const config = loadConfig();
    setConfig(config);
    setMachines(config.machines);
  }, [setConfig, setMachines]);

  // Connect to all configured machines
  useConnectAll();

  return <>{children}</>;
}
