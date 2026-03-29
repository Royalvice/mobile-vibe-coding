// Shared types for mobile-vibe-coding

// --- Machine & Connection ---

export type ConnectionType = 'direct' | 'tailscale' | 'lan';

export interface MachineConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  connectionType: ConnectionType;
  /** Tailscale hostname, only when connectionType === 'tailscale' */
  tailscaleHost?: string;
}

export interface AppConfig {
  version: number;
  machines: MachineConfig[];
  preferences: {
    fontSize: number;
    locale: 'en' | 'zh';
  };
}

// --- Session ---

export type AgentTool = 'codex' | 'claude-code';

export interface SessionInfo {
  id: string;
  name: string;
  tool: AgentTool;
  workdir: string;
  createdAt: number;
  /** Whether the CLI process is still alive */
  alive: boolean;
}

// --- Hardware Status ---

export interface GpuInfo {
  name: string;
  utilizationPercent: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  temperatureC: number | null;
}

export interface HwStatus {
  timestamp: number;
  cpu: {
    usagePercent: number;
    loadAvg: [number, number, number];
  };
  ram: {
    usedMB: number;
    totalMB: number;
  };
  disk: {
    usedGB: number;
    totalGB: number;
    path: string;
  }[];
  gpus: GpuInfo[];
}

// --- Interactive Prompt ---

export interface PromptOption {
  key: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

export interface InteractivePrompt {
  id: string;
  sessionId: string;
  question: string;
  options: PromptOption[];
  allowFreeInput: boolean;
  detectedAt: number;
}

// --- Auto Mode ---

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  /** Which agent tool this template is for, or 'any' */
  targetTool: AgentTool | 'any';
}

export interface AutoModeConfig {
  enabled: boolean;
  /** Polling interval in ms as fallback (event-driven is primary) */
  pollIntervalMs: number;
  /** Prompt templates to cycle through */
  templates: PromptTemplate[];
  /** Whether to auto-approve CLI permission prompts */
  autoApprove: boolean;
}

// --- Event Log ---

export type EventSeverity = 'info' | 'warn' | 'error';

export interface EventLogEntry {
  id: string;
  timestamp: number;
  sessionId: string;
  severity: EventSeverity;
  message: string;
  /** What action was taken (e.g., 'auto_approved', 'skipped', 'prompt_sent') */
  action?: string;
}
