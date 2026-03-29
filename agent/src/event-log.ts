// Event log: append-only local log for auto mode events

import { nanoid } from 'nanoid';
import type { EventLogEntry, EventSeverity } from '../../shared/types.js';

const MAX_ENTRIES = 10000;

export class EventLog {
  private entries: EventLogEntry[] = [];

  add(
    sessionId: string,
    severity: EventSeverity,
    message: string,
    action?: string,
  ): EventLogEntry {
    const entry: EventLogEntry = {
      id: nanoid(8),
      timestamp: Date.now(),
      sessionId,
      severity,
      message,
      action,
    };

    this.entries.push(entry);

    // Keep bounded
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES / 2);
    }

    return entry;
  }

  /** Get entries since a timestamp, with optional limit */
  getSince(sinceTimestamp = 0, limit = 200): { entries: EventLogEntry[]; hasMore: boolean } {
    const filtered = this.entries.filter((e) => e.timestamp > sinceTimestamp);
    const hasMore = filtered.length > limit;
    return {
      entries: filtered.slice(-limit),
      hasMore,
    };
  }

  getAll(): EventLogEntry[] {
    return [...this.entries];
  }

  get count(): number {
    return this.entries.length;
  }
}
