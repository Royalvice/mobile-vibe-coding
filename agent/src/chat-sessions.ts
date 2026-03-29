// Chat session discovery: list available CLI chat sessions for codex/cc
//
// Claude Code: reads ~/.claude/projects/<project-hash>/sessions/
// Codex: reads ~/.codex/sessions/ (or similar)

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import type { ChatSession, AgentTool } from '../../shared/types.js';

/**
 * Discover available chat sessions for a given tool and workdir.
 */
export function listChatSessions(tool: AgentTool, workdir: string): ChatSession[] {
  switch (tool) {
    case 'claude-code':
      return listClaudeCodeSessions(workdir);
    case 'codex':
      return listCodexSessions(workdir);
  }
}

function listClaudeCodeSessions(workdir: string): ChatSession[] {
  // Claude Code stores sessions under ~/.claude/projects/<hash>/
  // The hash is based on the project path
  const resolvedDir = workdir === '~' ? homedir() : resolve(workdir);
  const claudeDir = join(homedir(), '.claude');

  const sessions: ChatSession[] = [];

  // Try to find sessions in the projects directory
  const projectsDir = join(claudeDir, 'projects');
  try {
    const projectDirs = readdirSync(projectsDir, { withFileTypes: true });
    for (const pd of projectDirs) {
      if (!pd.isDirectory()) continue;

      // Check if this project dir matches our workdir
      // Claude Code uses the path as part of the directory name
      const dirName = pd.name;

      // Look for session files in this project directory
      const sessionsPath = join(projectsDir, dirName);
      try {
        const files = readdirSync(sessionsPath, { withFileTypes: true });
        for (const f of files) {
          if (!f.name.endsWith('.json') || f.name.startsWith('.')) continue;

          try {
            const filePath = join(sessionsPath, f.name);
            const stat = statSync(filePath);
            const content = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);

            // Extract session info
            if (data.sessionId || data.id) {
              sessions.push({
                id: data.sessionId || data.id || f.name.replace('.json', ''),
                label: data.query?.slice(0, 60) || data.title || f.name.replace('.json', ''),
                tool: 'claude-code',
                workdir: resolvedDir,
                updatedAt: stat.mtimeMs,
              });
            }
          } catch {
            // Skip unreadable files
          }
        }
      } catch {
        // Skip unreadable dirs
      }
    }
  } catch {
    // ~/.claude/projects doesn't exist
  }

  // Also try the CLAUDE.md sessions directory pattern
  try {
    const localSessionsDir = join(resolvedDir, '.claude', 'sessions');
    const files = readdirSync(localSessionsDir, { withFileTypes: true });
    for (const f of files) {
      if (!f.isDirectory()) continue;
      const sessionId = f.name;
      const stat = statSync(join(localSessionsDir, f.name));
      sessions.push({
        id: sessionId,
        label: sessionId,
        tool: 'claude-code',
        workdir: resolvedDir,
        updatedAt: stat.mtimeMs,
      });
    }
  } catch {
    // No local sessions dir
  }

  // Sort by most recent first
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);

  // Deduplicate by id
  const seen = new Set<string>();
  return sessions.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function listCodexSessions(workdir: string): ChatSession[] {
  // Codex session discovery — check common locations
  const resolvedDir = workdir === '~' ? homedir() : resolve(workdir);
  const sessions: ChatSession[] = [];

  // Try ~/.codex/sessions or similar
  const codexDirs = [
    join(homedir(), '.codex', 'sessions'),
    join(homedir(), '.codex'),
  ];

  for (const dir of codexDirs) {
    try {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        if (f.name.startsWith('.')) continue;
        try {
          const filePath = join(dir, f.name);
          const stat = statSync(filePath);
          sessions.push({
            id: f.name.replace(/\.\w+$/, ''),
            label: f.name.replace(/\.\w+$/, ''),
            tool: 'codex',
            workdir: resolvedDir,
            updatedAt: stat.mtimeMs,
          });
        } catch { /* skip */ }
      }
    } catch { /* dir doesn't exist */ }
  }

  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  return sessions;
}

/**
 * Build the CLI command with appropriate session flags.
 */
export function buildToolCommand(
  tool: AgentTool,
  mode: 'new' | 'continue' | 'resume',
  chatSessionId?: string,
): string {
  const base = tool === 'codex' ? 'codex' : 'claude';

  switch (mode) {
    case 'new':
      return base;
    case 'continue':
      return `${base} --continue`;
    case 'resume':
      if (!chatSessionId) return base;
      return `${base} --resume ${chatSessionId}`;
  }
}
