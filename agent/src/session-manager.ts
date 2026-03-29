// Session manager: cross-platform session lifecycle for codex/cc
//
// Linux: tmux-backed sessions (persist across agent restarts)
// Windows: in-process node-pty sessions (live only while agent runs)

import { execSync } from 'child_process';
import * as pty from 'node-pty';
import { nanoid } from 'nanoid';
import type { SessionInfo, AgentTool } from '../../shared/types.js';

const IS_WINDOWS = process.platform === 'win32';
const TMUX_PREFIX = 'mvc-';

interface ManagedSession {
  info: SessionInfo;
  /** tmux session name (Linux only) */
  tmuxName?: string;
  /** Direct PTY handle (Windows only) */
  ptyProc?: pty.IPty;
}

function tmuxCmd(args: string): string {
  try {
    return execSync(`tmux ${args}`, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function toolCommand(tool: AgentTool): string {
  return tool === 'codex' ? 'codex' : 'claude';
}

function shellForPlatform(): string {
  return IS_WINDOWS
    ? process.env.COMSPEC || 'cmd.exe'
    : process.env.SHELL || '/bin/bash';
}

export class SessionManager {
  private sessions = new Map<string, ManagedSession>();

  constructor() {
    if (!IS_WINDOWS) {
      this.discoverTmuxSessions();
    }
  }

  // --- Linux: discover existing tmux sessions ---
  private discoverTmuxSessions(): void {
    const raw = tmuxCmd('list-sessions -F "#{session_name}" 2>/dev/null');
    if (!raw) return;

    for (const line of raw.split('\n')) {
      const name = line.trim();
      if (!name.startsWith(TMUX_PREFIX)) continue;

      const id = name.slice(TMUX_PREFIX.length);

      // Try to get the actual working directory from tmux pane
      let workdir = '~';
      const paneDir = tmuxCmd(`display-message -t "${name}" -p "#{pane_current_path}" 2>/dev/null`);
      if (paneDir) workdir = paneDir;

      this.sessions.set(id, {
        info: {
          id,
          name,
          tool: name.includes('codex') ? 'codex' : 'claude-code',
          workdir,
          createdAt: Date.now(),
          alive: true,
        },
        tmuxName: name,
      });
    }
  }

  create(tool: AgentTool, workdir: string, name?: string): SessionInfo {
    const id = nanoid(8);
    const cmd = toolCommand(tool);
    const displayName = name || `${tool}-${id}`;

    const info: SessionInfo = {
      id,
      name: displayName,
      tool,
      workdir,
      createdAt: Date.now(),
      alive: true,
    };

    if (IS_WINDOWS) {
      // Windows: spawn CLI directly via node-pty, keep handle in memory
      const proc = pty.spawn(shellForPlatform(), ['/c', cmd], {
        name: 'xterm-256color',
        cols: 120,
        rows: 40,
        cwd: workdir === '~' ? (process.env.USERPROFILE || 'C:\\') : workdir,
        env: process.env as Record<string, string>,
      });

      proc.onExit(() => {
        const session = this.sessions.get(id);
        if (session) session.info.alive = false;
      });

      this.sessions.set(id, { info, ptyProc: proc });
    } else {
      // Linux: create detached tmux session
      const tmuxName = `${TMUX_PREFIX}${id}`;
      const resolvedWorkdir = workdir === '~' ? (process.env.HOME || '/') : workdir;
      execSync(
        `tmux new-session -d -s "${tmuxName}" -c "${resolvedWorkdir}" "${cmd}"`,
        { encoding: 'utf-8' },
      );
      this.sessions.set(id, { info, tmuxName });
    }

    return info;
  }

  list(): SessionInfo[] {
    if (!IS_WINDOWS) {
      // Refresh alive status from tmux
      const liveSessions = new Set<string>();
      const raw = tmuxCmd('list-sessions -F "#{session_name}" 2>/dev/null');
      if (raw) {
        for (const line of raw.split('\n')) {
          liveSessions.add(line.trim());
        }
      }
      for (const [, session] of this.sessions) {
        if (session.tmuxName) {
          session.info.alive = liveSessions.has(session.tmuxName);
        }
      }
    }
    // Windows: alive status is updated by onExit callback

    return Array.from(this.sessions.values()).map((s) => s.info);
  }

  /**
   * Get the attachment target for a session.
   * Linux: returns { type: 'tmux', name: string }
   * Windows: returns { type: 'pty', proc: IPty }
   */
  getTarget(sessionId: string): { type: 'tmux'; name: string } | { type: 'pty'; proc: pty.IPty } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.tmuxName) {
      return { type: 'tmux', name: session.tmuxName };
    }
    if (session.ptyProc) {
      return { type: 'pty', proc: session.ptyProc };
    }
    return null;
  }

  kill(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.tmuxName) {
      try {
        execSync(`tmux kill-session -t "${session.tmuxName}"`, { encoding: 'utf-8' });
      } catch { /* may already be dead */ }
    }

    if (session.ptyProc) {
      session.ptyProc.kill();
    }

    session.info.alive = false;
    this.sessions.delete(sessionId);
    return true;
  }

  get(sessionId: string): SessionInfo | null {
    return this.sessions.get(sessionId)?.info ?? null;
  }

  get platform(): 'linux' | 'windows' {
    return IS_WINDOWS ? 'windows' : 'linux';
  }
}
