// WebSocket message protocol for Agent <-> Client communication
//
// All messages are JSON-encoded over WebSocket.
// Terminal I/O (output/input) carries raw text — no escaping, no transformation.

import type {
  SessionInfo,
  ChatSession,
  HwStatus,
  InteractivePrompt,
  AutoModeConfig,
  EventLogEntry,
  AgentTool,
  PromptTemplate,
} from './types';

// ============================================================
// Server -> Client messages
// ============================================================

/** Raw terminal output from a session PTY */
export interface OutputMessage {
  type: 'output';
  sessionId: string;
  /** Raw PTY bytes as UTF-8 string, including ANSI escape sequences */
  data: string;
}

/** Structured interactive prompt detected by output parser */
export interface PromptDetectedMessage {
  type: 'prompt_detected';
  prompt: InteractivePrompt;
}

/** Session list update */
export interface SessionListMessage {
  type: 'session_list';
  machineId: string;
  sessions: SessionInfo[];
}

/** A session has ended */
export interface SessionEndedMessage {
  type: 'session_ended';
  sessionId: string;
  reason: string;
}

/** Hardware status snapshot */
export interface HwStatusMessage {
  type: 'hw_status';
  status: HwStatus;
}

/** Auto mode state changed */
export interface AutoModeStatusMessage {
  type: 'auto_mode_status';
  enabled: boolean;
  /** Current template being executed, if any */
  currentTemplateId: string | null;
  /** Number of events since auto mode started */
  eventCount: number;
}

/** Event log entries (batch, for reconnection sync) */
export interface EventLogBatchMessage {
  type: 'event_log_batch';
  entries: EventLogEntry[];
  /** Whether there are more entries before these */
  hasMore: boolean;
}

/** Single new event log entry (real-time) */
export interface EventLogNewMessage {
  type: 'event_log_new';
  entry: EventLogEntry;
}

/** Directory listing response */
export interface DirListMessage {
  type: 'dir_list';
  path: string;
  dirs: string[];
}

/** Available CLI chat sessions for a given tool+workdir */
export interface ChatSessionListMessage {
  type: 'chat_session_list';
  sessionId: string;
  chatSessions: ChatSession[];
}

/** Error from agent */
export interface AgentErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

export type ServerMessage =
  | OutputMessage
  | PromptDetectedMessage
  | SessionListMessage
  | SessionEndedMessage
  | HwStatusMessage
  | AutoModeStatusMessage
  | EventLogBatchMessage
  | EventLogNewMessage
  | DirListMessage
  | ChatSessionListMessage
  | AgentErrorMessage;

// ============================================================
// Client -> Server messages
// ============================================================

/** Raw terminal input to a session PTY */
export interface InputMessage {
  type: 'input';
  sessionId: string;
  /** Raw user input, forwarded as-is to PTY stdin */
  data: string;
}

/** Reply to an interactive prompt (card selection) */
export interface PromptReplyMessage {
  type: 'prompt_reply';
  sessionId: string;
  promptId: string;
  selectedKey: string;
  note?: string;
}

/** Create a new session */
export interface CreateSessionMessage {
  type: 'create_session';
  tool: AgentTool;
  workdir: string;
  name?: string;
  /** 'new' = fresh chat, 'continue' = most recent, 'resume' = specific chatSessionId */
  mode?: 'new' | 'continue' | 'resume';
  /** CLI chat session id to resume (only when mode === 'resume') */
  chatSessionId?: string;
}

/** List available CLI chat sessions for a tmux session's tool+workdir */
export interface ListChatSessionsMessage {
  type: 'list_chat_sessions';
  sessionId: string;
}

/**
 * Hot-switch the CLI chat session inside an existing tmux session.
 * Kills the current CLI process and restarts with the target chat session.
 * The tmux session and WebSocket connection stay alive.
 */
export interface SwitchChatSessionMessage {
  type: 'switch_chat_session';
  sessionId: string;
  /** 'new' = fresh chat, 'continue' = most recent, 'resume' = specific id */
  mode: 'new' | 'continue' | 'resume';
  chatSessionId?: string;
}

/** Attach to an existing session (start receiving output) */
export interface AttachSessionMessage {
  type: 'attach_session';
  sessionId: string;
}

/** Detach from a session (stop receiving output) */
export interface DetachSessionMessage {
  type: 'detach_session';
  sessionId: string;
}

/** Kill a session */
export interface KillSessionMessage {
  type: 'kill_session';
  sessionId: string;
}

/** Request session list */
export interface ListSessionsMessage {
  type: 'list_sessions';
}

/** Request hardware status */
export interface RequestHwStatusMessage {
  type: 'request_hw_status';
}

/** Resize terminal */
export interface ResizeMessage {
  type: 'resize';
  sessionId: string;
  cols: number;
  rows: number;
}

/** Start/stop auto mode */
export interface SetAutoModeMessage {
  type: 'set_auto_mode';
  config: AutoModeConfig;
}

/** Request event log (for reconnection sync) */
export interface RequestEventLogMessage {
  type: 'request_event_log';
  /** Only return entries after this timestamp */
  sinceTimestamp?: number;
  limit?: number;
}

/** Browse directories on the remote machine */
export interface BrowseDirsMessage {
  type: 'browse_dirs';
  /** Parent path to list subdirectories of. Empty string = home directory */
  path: string;
}

/** Update prompt templates on the agent */
export interface UpdateTemplatesMessage {
  type: 'update_templates';
  templates: PromptTemplate[];
}

export type ClientMessage =
  | InputMessage
  | PromptReplyMessage
  | CreateSessionMessage
  | AttachSessionMessage
  | DetachSessionMessage
  | KillSessionMessage
  | ListSessionsMessage
  | ListChatSessionsMessage
  | SwitchChatSessionMessage
  | RequestHwStatusMessage
  | ResizeMessage
  | SetAutoModeMessage
  | RequestEventLogMessage
  | UpdateTemplatesMessage
  | BrowseDirsMessage;
