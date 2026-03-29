// Zustand store for global app state — supports multiple machines simultaneously

import { create } from 'zustand';
import type { SessionInfo, ChatSession, HwStatus, InteractivePrompt, EventLogEntry, AppConfig, MachineConfig } from '@shared/types';

interface AppState {
  // Per-machine connection status
  machineStatuses: Record<string, 'connected' | 'disconnected' | 'reconnecting'>;
  setMachineStatuses: (s: Record<string, 'connected' | 'disconnected' | 'reconnecting'>) => void;
  getMachineStatus: (machineId: string) => 'connected' | 'disconnected' | 'reconnecting';

  // Machines
  machines: MachineConfig[];
  setMachines: (m: MachineConfig[]) => void;

  // Per-machine sessions
  machineSessions: Record<string, SessionInfo[]>;
  setMachineSessions: (machineId: string, sessions: SessionInfo[]) => void;
  removeSession: (machineId: string, sessionId: string) => void;

  // Per-machine hardware status
  machineHwStatus: Record<string, HwStatus>;
  setMachineHwStatus: (machineId: string, status: HwStatus) => void;

  // Per-machine auto mode
  machineAutoMode: Record<string, boolean>;
  setMachineAutoMode: (machineId: string, enabled: boolean) => void;

  // Per-machine event log
  machineEventLogs: Record<string, EventLogEntry[]>;
  setMachineEventLog: (machineId: string, entries: EventLogEntry[]) => void;
  addMachineEvent: (machineId: string, entry: EventLogEntry) => void;

  // Prompt card (global — one at a time)
  activePrompt: InteractivePrompt | null;
  setActivePrompt: (p: InteractivePrompt | null) => void;

  // Config
  config: AppConfig;
  setConfig: (c: AppConfig) => void;

  // Terminal writers: "machineId:sessionId" -> write callback
  terminalWriters: Map<string, (data: string) => void>;
  registerTerminalWriter: (key: string, writer: (data: string) => void) => void;
  unregisterTerminalWriter: (key: string) => void;

  // Directory browser: machineId -> { path, dirs }
  dirListCache: Record<string, { path: string; dirs: string[] }>;
  setDirList: (machineId: string, path: string, dirs: string[]) => void;

  // Chat sessions: "machineId:sessionId" -> ChatSession[]
  chatSessionsCache: Record<string, ChatSession[]>;
  setChatSessions: (machineId: string, sessionId: string, sessions: ChatSession[]) => void;
}

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  machines: [],
  preferences: { fontSize: 14, locale: 'en' },
};

export const useStore = create<AppState>((set, get) => ({
  machineStatuses: {},
  setMachineStatuses: (machineStatuses) => set({ machineStatuses }),
  getMachineStatus: (machineId) => get().machineStatuses[machineId] || 'disconnected',

  machines: [],
  setMachines: (machines) => set({ machines }),

  machineSessions: {},
  setMachineSessions: (machineId, sessions) =>
    set((state) => ({
      machineSessions: { ...state.machineSessions, [machineId]: sessions },
    })),
  removeSession: (machineId, sessionId) =>
    set((state) => ({
      machineSessions: {
        ...state.machineSessions,
        [machineId]: (state.machineSessions[machineId] || []).filter((s) => s.id !== sessionId),
      },
    })),

  machineHwStatus: {},
  setMachineHwStatus: (machineId, status) =>
    set((state) => ({
      machineHwStatus: { ...state.machineHwStatus, [machineId]: status },
    })),

  machineAutoMode: {},
  setMachineAutoMode: (machineId, enabled) =>
    set((state) => ({
      machineAutoMode: { ...state.machineAutoMode, [machineId]: enabled },
    })),

  machineEventLogs: {},
  setMachineEventLog: (machineId, entries) =>
    set((state) => ({
      machineEventLogs: { ...state.machineEventLogs, [machineId]: entries },
    })),
  addMachineEvent: (machineId, entry) =>
    set((state) => ({
      machineEventLogs: {
        ...state.machineEventLogs,
        [machineId]: [...(state.machineEventLogs[machineId] || []), entry],
      },
    })),

  activePrompt: null,
  setActivePrompt: (activePrompt) => set({ activePrompt }),

  config: DEFAULT_CONFIG,
  setConfig: (config) => set({ config, machines: config.machines }),

  terminalWriters: new Map(),
  registerTerminalWriter: (key, writer) => {
    const writers = new Map(get().terminalWriters);
    writers.set(key, writer);
    set({ terminalWriters: writers });
  },
  unregisterTerminalWriter: (key) => {
    const writers = new Map(get().terminalWriters);
    writers.delete(key);
    set({ terminalWriters: writers });
  },

  dirListCache: {},
  setDirList: (machineId, path, dirs) =>
    set((state) => ({
      dirListCache: { ...state.dirListCache, [machineId]: { path, dirs } },
    })),

  chatSessionsCache: {},
  setChatSessions: (machineId, sessionId, sessions) =>
    set((state) => ({
      chatSessionsCache: { ...state.chatSessionsCache, [`${machineId}:${sessionId}`]: sessions },
    })),
}));
