// PTY bridge: attach to a tmux session via node-pty and relay I/O over callbacks

import * as pty from 'node-pty';

export interface PtyBridgeCallbacks {
  onData: (data: string) => void;
  onExit: (code: number) => void;
}

export class PtyBridge {
  private proc: pty.IPty;
  private disposed = false;

  constructor(
    tmuxSessionName: string,
    cols: number,
    rows: number,
    callbacks: PtyBridgeCallbacks,
  ) {
    this.proc = pty.spawn('tmux', ['attach-session', '-t', tmuxSessionName], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: process.env.HOME || '/',
      env: process.env as Record<string, string>,
    });

    this.proc.onData((data) => {
      if (!this.disposed) callbacks.onData(data);
    });

    this.proc.onExit(({ exitCode }) => {
      if (!this.disposed) callbacks.onExit(exitCode);
    });
  }

  write(data: string): void {
    if (!this.disposed) {
      this.proc.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    if (!this.disposed) {
      this.proc.resize(cols, rows);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.proc.kill();
  }
}
