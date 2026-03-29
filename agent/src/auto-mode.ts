// Auto mode controller: event-driven + polling auto-approve and prompt injection

import type { AutoModeConfig, PromptTemplate } from '../../shared/types.js';
import type { EventLog } from './event-log.js';
import type { PtyBridge } from './pty-bridge.js';

export class AutoModeController {
  private config: AutoModeConfig | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private templateIndex = 0;
  private eventLog: EventLog;

  /** Map of sessionId -> PtyBridge for writing auto responses */
  private bridges = new Map<string, PtyBridge>();

  constructor(eventLog: EventLog) {
    this.eventLog = eventLog;
  }

  registerBridge(sessionId: string, bridge: PtyBridge): void {
    this.bridges.set(sessionId, bridge);
  }

  unregisterBridge(sessionId: string): void {
    this.bridges.delete(sessionId);
  }

  start(config: AutoModeConfig): void {
    this.stop();
    this.config = config;
    this.templateIndex = 0;

    if (config.pollIntervalMs > 0) {
      this.pollTimer = setInterval(() => this.pollTick(), config.pollIntervalMs);
    }

    this.eventLog.add('*', 'info', 'Auto mode started', 'auto_started');
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.config) {
      this.eventLog.add('*', 'info', 'Auto mode stopped', 'auto_stopped');
    }
    this.config = null;
  }

  get isRunning(): boolean {
    return this.config !== null && this.config.enabled;
  }

  get currentTemplateId(): string | null {
    if (!this.config || this.config.templates.length === 0) return null;
    return this.config.templates[this.templateIndex % this.config.templates.length].id;
  }

  /**
   * Called by output parser when a prompt is detected.
   * If auto mode is on and autoApprove is true, automatically send 'y'.
   */
  onPromptDetected(sessionId: string): boolean {
    if (!this.config?.autoApprove) return false;

    const bridge = this.bridges.get(sessionId);
    if (!bridge) return false;

    bridge.write('y\n');
    this.eventLog.add(sessionId, 'info', 'Auto-approved CLI prompt', 'auto_approved');
    return true;
  }

  /** Periodic tick: send next prompt template if CLI appears idle */
  private pollTick(): void {
    if (!this.config || this.config.templates.length === 0) return;

    const template = this.config.templates[this.templateIndex % this.config.templates.length];

    for (const [sessionId, bridge] of this.bridges) {
      // Check if template targets this session's tool type
      // For now, send to all sessions (tool filtering can be added later)
      try {
        bridge.write(template.content + '\n');
        this.eventLog.add(
          sessionId,
          'info',
          `Sent prompt template: ${template.name}`,
          'prompt_sent',
        );
      } catch (err) {
        this.eventLog.add(
          sessionId,
          'error',
          `Failed to send template: ${(err as Error).message}`,
          'prompt_failed',
        );
        // Skip and continue per REQ-014
      }
    }

    this.templateIndex++;
  }
}
