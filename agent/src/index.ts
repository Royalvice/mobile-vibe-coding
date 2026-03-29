#!/usr/bin/env node
// mobile-vibe-coding agent — main entry point
// Starts a WebSocket server that bridges phone clients to tmux sessions

import { WebSocketServer, WebSocket } from 'ws';
import { SessionManager } from './session-manager.js';
import { PtyBridge } from './pty-bridge.js';
import { OutputParser } from './output-parser.js';
import { AutoModeController } from './auto-mode.js';
import { EventLog } from './event-log.js';
import { collectHwStatus } from './hw-monitor.js';
import type { ServerMessage, ClientMessage } from '../../shared/protocol.js';

const PORT = parseInt(process.env.MVC_PORT || '9876', 10);
const HW_POLL_INTERVAL = 5000;

// --- Singletons ---
const sessionManager = new SessionManager();
const eventLog = new EventLog();
const autoMode = new AutoModeController(eventLog);
const outputParser = new OutputParser();

// --- Client state ---
interface ClientState {
  ws: WebSocket;
  attachedSessions: Map<string, PtyBridge>;
}
const clients = new Set<ClientState>();

function broadcast(msg: ServerMessage): void {
  const raw = JSON.stringify(msg);
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(raw);
    }
  }
}

function sendTo(client: ClientState, msg: ServerMessage): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(msg));
  }
}

// --- Output parser callback ---
outputParser.onPromptDetected = (prompt, sessionId) => {
  // If auto mode handles it, don't send to clients
  if (autoMode.isRunning && autoMode.onPromptDetected(sessionId)) {
    broadcast({
      type: 'event_log_new',
      entry: eventLog.add(sessionId, 'info', `Auto-approved: ${prompt.question}`, 'auto_approved'),
    });
    return;
  }
  // Otherwise send to all clients as a card prompt
  broadcast({ type: 'prompt_detected', prompt });
};

// --- WebSocket server ---
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  const client: ClientState = { ws, attachedSessions: new Map() };
  clients.add(client);
  console.log(`Client connected (total: ${clients.size})`);

  // Send current session list on connect
  sendTo(client, {
    type: 'session_list',
    machineId: 'local',
    sessions: sessionManager.list(),
  });

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      sendTo(client, { type: 'error', code: 'PARSE_ERROR', message: 'Invalid JSON' });
      return;
    }
    handleMessage(client, msg);
  });

  ws.on('close', () => {
    // Clean up PTY bridges for this client
    for (const [, bridge] of client.attachedSessions) {
      bridge.dispose();
    }
    clients.delete(client);
    console.log(`Client disconnected (total: ${clients.size})`);
  });
});

// --- Message handler ---
function handleMessage(client: ClientState, msg: ClientMessage): void {
  switch (msg.type) {
    case 'create_session': {
      const info = sessionManager.create(msg.tool, msg.workdir, msg.name);
      broadcast({
        type: 'session_list',
        machineId: 'local',
        sessions: sessionManager.list(),
      });
      eventLog.add(info.id, 'info', `Session created: ${info.name} (${info.tool})`);
      break;
    }

    case 'attach_session': {
      const target = sessionManager.getTarget(msg.sessionId);
      if (!target) {
        sendTo(client, { type: 'error', code: 'NOT_FOUND', message: 'Session not found' });
        return;
      }
      // Detach existing bridge if any
      client.attachedSessions.get(msg.sessionId)?.dispose();

      const bridgeCallbacks = {
        onData: (data: string) => {
          sendTo(client, { type: 'output', sessionId: msg.sessionId, data });
          outputParser.feed(msg.sessionId, data);
        },
        onExit: (code: number) => {
          client.attachedSessions.delete(msg.sessionId);
          autoMode.unregisterBridge(msg.sessionId);
          sendTo(client, {
            type: 'session_ended',
            sessionId: msg.sessionId,
            reason: `Process exited with code ${code}`,
          });
        },
      };

      const bridge = target.type === 'tmux'
        ? PtyBridge.attachTmux(target.name, 120, 40, bridgeCallbacks)
        : PtyBridge.attachDirect(target.proc, bridgeCallbacks);

      client.attachedSessions.set(msg.sessionId, bridge);
      autoMode.registerBridge(msg.sessionId, bridge);
      break;
    }

    case 'detach_session': {
      const bridge = client.attachedSessions.get(msg.sessionId);
      if (bridge) {
        bridge.dispose();
        client.attachedSessions.delete(msg.sessionId);
        autoMode.unregisterBridge(msg.sessionId);
      }
      break;
    }

    case 'input': {
      const bridge = client.attachedSessions.get(msg.sessionId);
      if (bridge) bridge.write(msg.data);
      break;
    }

    case 'resize': {
      const bridge = client.attachedSessions.get(msg.sessionId);
      if (bridge) bridge.resize(msg.cols, msg.rows);
      break;
    }

    case 'prompt_reply': {
      const bridge = client.attachedSessions.get(msg.sessionId);
      if (!bridge) return;
      // Send the selected option key as terminal input
      // For inquirer-style prompts, arrow keys + enter would be needed,
      // but most CLI prompts accept the option number or text
      const input = msg.note ? `${msg.selectedKey}\n${msg.note}\n` : `${msg.selectedKey}\n`;
      bridge.write(input);
      break;
    }

    case 'kill_session': {
      sessionManager.kill(msg.sessionId);
      client.attachedSessions.get(msg.sessionId)?.dispose();
      client.attachedSessions.delete(msg.sessionId);
      autoMode.unregisterBridge(msg.sessionId);
      broadcast({
        type: 'session_list',
        machineId: 'local',
        sessions: sessionManager.list(),
      });
      break;
    }

    case 'list_sessions': {
      sendTo(client, {
        type: 'session_list',
        machineId: 'local',
        sessions: sessionManager.list(),
      });
      break;
    }

    case 'request_hw_status': {
      collectHwStatus().then((status) => {
        sendTo(client, { type: 'hw_status', status });
      });
      break;
    }

    case 'set_auto_mode': {
      if (msg.config.enabled) {
        autoMode.start(msg.config);
      } else {
        autoMode.stop();
      }
      broadcast({
        type: 'auto_mode_status',
        enabled: autoMode.isRunning,
        currentTemplateId: autoMode.currentTemplateId,
        eventCount: eventLog.count,
      });
      break;
    }

    case 'update_templates': {
      // Templates are pushed from phone and stored in auto mode config
      // They'll be used when auto mode starts
      eventLog.add('*', 'info', `Updated ${msg.templates.length} prompt templates`);
      break;
    }

    case 'request_event_log': {
      const result = eventLog.getSince(msg.sinceTimestamp, msg.limit);
      sendTo(client, {
        type: 'event_log_batch',
        entries: result.entries,
        hasMore: result.hasMore,
      });
      break;
    }
  }
}

// --- Periodic HW status broadcast ---
setInterval(async () => {
  if (clients.size === 0) return;
  try {
    const status = await collectHwStatus();
    broadcast({ type: 'hw_status', status });
  } catch {
    // Silently skip on error
  }
}, HW_POLL_INTERVAL);

console.log(`mobile-vibe-coding agent listening on ws://0.0.0.0:${PORT}`);
console.log(`Platform: ${sessionManager.platform}`);
console.log(`Sessions: ${sessionManager.list().length} existing`);
console.log('Ready.');
