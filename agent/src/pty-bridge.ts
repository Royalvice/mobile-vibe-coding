// PTY bridge: relay I/O between a session and WebSocket callbacks
//
// Linux: attaches to a tmux session via a new node-pty process
// Windows: directly hooks into the existing node-pty process from SessionManager

import * as pty from 'node-pty';

export interface PtyBridgeCallbacks {
  onData: (data: string) => void;
  onExit: (code: number) => void;
}

export class PtyBridge {
  private proc: pty.IPty | null = null;
  private disposed = false;
  /** Whether we own the process (tmux attach) or are borrowing it (Windows direct) */
  private ownsProcess: boolean;
  private dataDisposable?: { dispose(): void };
  private exitDisposable?: { dispose(): void };

  /**
   * Attach to a tmux session (Linux) — spawns `tmux attach-session`
   */
  static attachTmux(
    tmuxName: string,
    cols: number,
    rows: number,
    callbacks: PtyBridgeCallbacks,
  ): PtyBridge {
    const bridge = new PtyBridge(true);

    bridge.proc = pty.spawn('tmux', ['attach-session', '-t', tmuxName], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: process.env.HOME || '/',
      env: process.env as Record<string, string>,
    });

    bridge.wireCallbacks(callbacks);
    return bridge;
  }

  /**
   * Hook into an existing node-pty process (Windows) — no new process spawned
   */
  static attachDirect(
    proc: pty.IPty,
    callbacks: PtyBridgeCallbacks,
  ): PtyBridge {
    const bridge = new PtyBridge(false);
    bridge.proc = proc;
    bridge.wireCallbacks(callbacks);
    return bridge;
  }

  private constructor(ownsProcess: boolean) {
    this.ownsProcess = ownsProcess;
  }

  private wireCallbacks(callbacks: PtyBridgeCallbacks): void {
    if (!this.proc) return;

    this.dataDisposable = this.proc.onData((data) => {
      if (!this.disposed) callbacks.onData(data);
    });

    this.exitDisposable = this.proc.onExit(({ exitCode }) => {
      if (!this.disposed) callbacks.onExit(exitCode);
    });
  }

  write(data: string): void {
    if (!this.disposed && this.proc) {
      this.proc.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    if (!this.disposed && this.proc) {
      this.proc.resize(cols, rows);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // Unhook event listeners
    this.dataDisposable?.dispose();
    this.exitDisposable?.dispose();

    // Only kill the process if we own it (tmux attach).
    // On Windows, the process belongs to SessionManager.
    if (this.ownsProcess && this.proc) {
      this.proc.kill();
    }

    this.proc = null;
  }
}
