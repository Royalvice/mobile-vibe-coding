// Zustand store for global app state

import { create } from 'zustand';
import type { SessionInfo, HwStatus, InteractivePrompt, EventLogEntry, AppConfig, MachineConfig } from '@shared/types';

interface AppState {
  // Connection
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  setConnectionStatus: (s: AppState['connectionStatus']) => void;

  // Machines
  machines: MachineConfig[];
  activeMachineId: string | null;
  setMachines: (m: MachineConfig[]) => void;
  setActiveMachine: (id: string | null) => void;

  // Sessions
  sessions: SessionInfo[];
  activeSessionId: string | null;
  setSessions: (s: SessionInfo[]) => void;
  setActiveSession: (id: string | null) => void;

  // Hardware
  hwStatus: HwStatus | null;
  setHwStatus: (s: HwStatus) => void;

  // Prompt card
  activePrompt: InteractivePrompt | null;
  setActivePrompt: (p: InteractivePrompt | null) => void;

  // Auto mode
  autoModeEnabled: boolean;
  setAutoModeEnabled: (e: boolean) => void;

  // Event log
  eventLog: EventLogEntry[];
  addEvent: (e: EventLogEntry) => void;
  setEventLog: (entries: EventLogEntry[]) => void;

  // Config
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
}

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  machines: [],
  preferences: { fontSize: 14, locale: 'en' },
};

export const useStore = create<AppState>((set) => ({
  connectionStatus: 'disconnected',
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  machines: [],
  activeMachineId: null,
  setMachines: (machines) => set({ machines }),
  setActiveMachine: (activeMachineId) => set({ activeMachineId }),

  sessions: [],
  activeSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (activeSessionId) => set({ activeSessionId }),

  hwStatus: null,
  setHwStatus: (hwStatus) => set({ hwStatus }),

  activePrompt: null,
  setActivePrompt: (activePrompt) => set({ activePrompt }),

  autoModeEnabled: false,
  setAutoModeEnabled: (autoModeEnabled) => set({ autoModeEnabled }),

  eventLog: [],
  addEvent: (e) => set((state) => ({ eventLog: [...state.eventLog, e] })),
  setEventLog: (eventLog) => set({ eventLog }),

  config: DEFAULT_CONFIG,
  setConfig: (config) => set({ config, machines: config.machines }),
}));
