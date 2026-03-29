// Session manager: create, list, attach, kill tmux sessions running codex/cc

import { spawn, execSync } from 'child_process';
import { nanoid } from 'nanoid';
import type { SessionInfo, AgentTool } from '../../shared/types.js';

interface ManagedSession {
  info: SessionInfo;
  tmuxName: string;
}

const TMUX_PREFIX = 'mvc-';

function tmuxCmd(args: string): string {
  try {
    return execSync(`tmux ${args}`, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function toolCommand(tool: AgentTool): string {
  switch (tool) {
    case 'codex':
      return 'codex';
    case 'claude-code':
      return 'claude';
  }
}

export class SessionManager {
  private sessions = new Map<string, ManagedSession>();

  constructor() {
    this.discoverExisting();
  }

  /** Scan for existing mvc- prefixed tmux sessions */
  private discoverExisting(): void {
    const raw = tmuxCmd('list-sessions -F "#{session_name}" 2>/dev/null');
    if (!raw) return;

    for (const line of raw.split('\n')) {
      const name = line.trim();
      if (!name.startsWith(TMUX_PREFIX)) continue;

      const id = name.slice(TMUX_PREFIX.length);
      this.sessions.set(id, {
        info: {
          id,
          name,
          tool: name.includes('codex') ? 'codex' : 'claude-code',
          workdir: '~',
          createdAt: Date.now(),
          alive: true,
        },
        tmuxName: name,
      });
    }
  }

  create(tool: AgentTool, workdir: string, name?: string): SessionInfo {
    const id = nanoid(8);
    const tmuxName = `${TMUX_PREFIX}${id}`;
    const cmd = toolCommand(tool);
    const displayName = name || `${tool}-${id}`;

    // Create detached tmux session running the agent CLI
    execSync(
      `tmux new-session -d -s "${tmuxName}" -c "${workdir}" "${cmd}"`,
      { encoding: 'utf-8' },
    );

    const info: SessionInfo = {
      id,
      name: displayName,
      tool,
      workdir,
      createdAt: Date.now(),
      alive: true,
    };

    this.sessions.set(id, { info, tmuxName });
    return info;
  }

  list(): SessionInfo[] {
    // Refresh alive status
    const liveSessions = new Set<string>();
    const raw = tmuxCmd('list-sessions -F "#{session_name}" 2>/dev/null');
    if (raw) {
      for (const line of raw.split('\n')) {
        liveSessions.add(line.trim());
      }
    }

    for (const [, session] of this.sessions) {
      session.info.alive = liveSessions.has(session.tmuxName);
    }

    return Array.from(this.sessions.values()).map((s) => s.info);
  }

  getTmuxName(sessionId: string): string | null {
    return this.sessions.get(sessionId)?.tmuxName ?? null;
  }

  kill(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    try {
      execSync(`tmux kill-session -t "${session.tmuxName}"`, {
        encoding: 'utf-8',
      });
    } catch {
      // Session may already be dead
    }

    session.info.alive = false;
    this.sessions.delete(sessionId);
    return true;
  }

  get(sessionId: string): SessionInfo | null {
    return this.sessions.get(sessionId)?.info ?? null;
  }
}
