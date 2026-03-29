'use client';

// Multi-machine WebSocket connection manager
// Maintains one connection per machine, all active simultaneously

import { useEffect } from 'react';
import { useStore } from './store';
import type { ServerMessage, ClientMessage } from '@shared/protocol';
import type { MachineConfig } from '@shared/types';

interface MachineConnection {
  ws: WebSocket | null;
  status: 'connected' | 'disconnected' | 'reconnecting';
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectDelay: number;
}

const connections = new Map<string, MachineConnection>();
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 2000;

function getWsUrl(machine: MachineConfig): string {
  const host = machine.connectionType === 'tailscale' && machine.tailscaleHost
    ? machine.tailscaleHost
    : machine.host;
  return `ws://${host}:${machine.port}`;
}

function getOrCreateConn(machineId: string): MachineConnection {
  let conn = connections.get(machineId);
  if (!conn) {
    conn = { ws: null, status: 'disconnected', reconnectTimer: null, reconnectDelay: INITIAL_RECONNECT_DELAY };
    connections.set(machineId, conn);
  }
  return conn;
}

function updateStoreConnectionStatuses(): void {
  const statuses: Record<string, 'connected' | 'disconnected' | 'reconnecting'> = {};
  for (const [id, conn] of connections) {
    statuses[id] = conn.status;
  }
  useStore.getState().setMachineStatuses(statuses);
}

export function connectToMachine(machine: MachineConfig): void {
  const conn = getOrCreateConn(machine.id);

  // Clean up existing
  if (conn.reconnectTimer) {
    clearTimeout(conn.reconnectTimer);
    conn.reconnectTimer = null;
  }
  if (conn.ws) {
    conn.ws.close();
    conn.ws = null;
  }

  conn.status = 'reconnecting';
  updateStoreConnectionStatuses();

  const url = getWsUrl(machine);
  try {
    conn.ws = new WebSocket(url);
  } catch {
    scheduleReconnect(machine);
    return;
  }

  conn.ws.onopen = () => {
    conn.reconnectDelay = INITIAL_RECONNECT_DELAY;
    conn.status = 'connected';
    updateStoreConnectionStatuses();
    // Request initial state from this machine
    sendToMachine(machine.id, { type: 'list_sessions' });
    sendToMachine(machine.id, { type: 'request_hw_status' });
    sendToMachine(machine.id, { type: 'request_event_log', limit: 100 });
  };

  conn.ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      handleServerMessage(machine.id, msg);
    } catch { /* ignore */ }
  };

  conn.ws.onclose = () => {
    conn.status = 'disconnected';
    conn.ws = null;
    updateStoreConnectionStatuses();
    scheduleReconnect(machine);
  };

  conn.ws.onerror = () => {
    conn.ws?.close();
  };
}

function scheduleReconnect(machine: MachineConfig): void {
  const conn = getOrCreateConn(machine.id);
  // Only reconnect if machine is still in config
  const store = useStore.getState();
  if (!store.machines.find((m) => m.id === machine.id)) return;

  conn.status = 'reconnecting';
  updateStoreConnectionStatuses();

  conn.reconnectTimer = setTimeout(() => {
    connectToMachine(machine);
  }, conn.reconnectDelay);
  conn.reconnectDelay = Math.min(conn.reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
}

function handleServerMessage(machineId: string, msg: ServerMessage): void {
  const store = useStore.getState();

  switch (msg.type) {
    case 'session_list':
      // Store sessions per machine
      store.setMachineSessions(machineId, msg.sessions);
      break;
    case 'session_ended':
      store.removeSession(machineId, msg.sessionId);
      break;
    case 'hw_status':
      store.setMachineHwStatus(machineId, msg.status);
      break;
    case 'prompt_detected':
      store.setActivePrompt(msg.prompt);
      break;
    case 'auto_mode_status':
      store.setMachineAutoMode(machineId, msg.enabled);
      break;
    case 'event_log_batch':
      store.setMachineEventLog(machineId, msg.entries);
      break;
    case 'event_log_new':
      store.addMachineEvent(machineId, msg.entry);
      break;
    case 'output': {
      // Route to the correct terminal writer
      const key = `${machineId}:${msg.sessionId}`;
      store.terminalWriters.get(key)?.(msg.data);
      break;
    }
    case 'dir_list':
      store.setDirList(machineId, msg.path, msg.dirs);
      break;
    case 'error':
      console.error(`Agent error [${machineId}]: ${msg.code} — ${msg.message}`);
      break;
  }
}

/** Send a message to a specific machine's agent */
export function sendToMachine(machineId: string, msg: ClientMessage): void {
  const conn = connections.get(machineId);
  if (conn?.ws?.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify(msg));
  }
}

/** Disconnect from a specific machine */
export function disconnectFromMachine(machineId: string): void {
  const conn = connections.get(machineId);
  if (!conn) return;

  if (conn.reconnectTimer) {
    clearTimeout(conn.reconnectTimer);
    conn.reconnectTimer = null;
  }
  if (conn.ws) {
    conn.ws.close();
    conn.ws = null;
  }
  conn.status = 'disconnected';
  connections.delete(machineId);
  updateStoreConnectionStatuses();
}

/** Disconnect from all machines */
export function disconnectAll(): void {
  for (const [id] of connections) {
    disconnectFromMachine(id);
  }
}

/** Hook: connect to all configured machines on mount */
export function useConnectAll() {
  const { machines } = useStore();

  useEffect(() => {
    // Connect to any new machines
    for (const machine of machines) {
      const conn = connections.get(machine.id);
      if (!conn || conn.status === 'disconnected') {
        connectToMachine(machine);
      }
    }

    // Disconnect from removed machines
    for (const [id] of connections) {
      if (!machines.find((m) => m.id === id)) {
        disconnectFromMachine(id);
      }
    }
  }, [machines]);
}

/** Hook: register a terminal writer for a machine:session pair */
export function useTerminalWriter(
  machineId: string,
  sessionId: string,
  writer: ((data: string) => void) | null,
) {
  const { registerTerminalWriter, unregisterTerminalWriter } = useStore();
  const key = `${machineId}:${sessionId}`;

  useEffect(() => {
    if (writer) {
      registerTerminalWriter(key, writer);
    }
    return () => {
      unregisterTerminalWriter(key);
    };
  }, [key, writer, registerTerminalWriter, unregisterTerminalWriter]);
}
