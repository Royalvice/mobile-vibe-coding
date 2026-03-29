// Output parser: detect interactive prompts from CLI terminal output
//
// Strategy: watch raw PTY output for patterns that indicate codex/cc
// is waiting for user input on a multiple-choice prompt.
// When detected, emit a structured InteractivePrompt.

import { nanoid } from 'nanoid';
import type { InteractivePrompt, PromptOption } from '../../shared/types.js';

// Strip ANSI escape sequences for pattern matching
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
}

/**
 * Claude Code prompt pattern:
 *   ? How would you like to proceed?
 *   ❯ Option A (Recommended)
 *     Option B
 *     Option C
 *
 * Codex prompt pattern (similar inquirer-style):
 *   ? Select an option:
 *   ❯ First choice
 *     Second choice
 */
const QUESTION_RE = /^\?\s+(.+)$/m;
const OPTION_RE = /^[\s]*[❯›>●○\s]\s*(.+)$/;

export class OutputParser {
  private buffer = '';
  private lastEmitTime = 0;
  /** Minimum ms between prompt detections to avoid duplicates */
  private debounceMs = 500;

  onPromptDetected?: (prompt: InteractivePrompt, sessionId: string) => void;

  feed(sessionId: string, data: string): void {
    this.buffer += data;

    // Keep buffer bounded
    if (this.buffer.length > 8192) {
      this.buffer = this.buffer.slice(-4096);
    }

    this.tryDetect(sessionId);
  }

  private tryDetect(sessionId: string): void {
    const now = Date.now();
    if (now - this.lastEmitTime < this.debounceMs) return;

    const clean = stripAnsi(this.buffer);
    const lines = clean.split('\n');

    // Look for question pattern
    let questionIdx = -1;
    let questionText = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(QUESTION_RE);
      if (match) {
        questionIdx = i;
        questionText = match[1].trim();
        break;
      }
    }

    if (questionIdx < 0 || !questionText) return;

    // Collect options after the question
    const options: PromptOption[] = [];
    for (let i = questionIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const optMatch = lines[i].match(OPTION_RE);
      if (optMatch) {
        const label = optMatch[1].trim();
        const isRecommended = label.toLowerCase().includes('recommended');
        options.push({
          key: String(options.length + 1),
          label: label.replace(/\s*\(recommended\)\s*/i, '').trim(),
          recommended: isRecommended,
        });
      }
    }

    if (options.length < 2) return;

    this.lastEmitTime = now;
    this.buffer = '';

    const prompt: InteractivePrompt = {
      id: nanoid(8),
      sessionId,
      question: questionText,
      options,
      allowFreeInput: true,
      detectedAt: now,
    };

    this.onPromptDetected?.(prompt, sessionId);
  }

  reset(): void {
    this.buffer = '';
  }
}
