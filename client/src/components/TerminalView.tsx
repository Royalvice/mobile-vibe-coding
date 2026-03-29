'use client';

// Terminal view using xterm.js

import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalViewProps {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  fontSize?: number;
  /** Ref to write data into the terminal */
  writeRef?: React.MutableRefObject<((data: string) => void) | null>;
  /** Called after terminal is mounted and writeRef is set */
  onReady?: () => void;
}

export default function TerminalView({ onData, onResize, fontSize = 14, writeRef, onReady }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: '#08080c',
        foreground: '#e8e8ed',
        cursor: '#7c6fea',
        cursorAccent: '#08080c',
        selectionBackground: '#7c6fea44',
        black: '#1a1a26',
        red: '#e85a5a',
        green: '#5cb88a',
        yellow: '#e8b84a',
        blue: '#5a8ae8',
        magenta: '#b85ac8',
        cyan: '#5ac8c8',
        white: '#e8e8ed',
        brightBlack: '#5a5a6e',
        brightRed: '#ff7a7a',
        brightGreen: '#7cd8aa',
        brightYellow: '#ffd86a',
        brightBlue: '#7aaaf8',
        brightMagenta: '#d87ae8',
        brightCyan: '#7ae8e8',
        brightWhite: '#ffffff',
      },
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    term.onData(onData);
    term.onResize(({ cols, rows }) => onResize(cols, rows));

    if (writeRef) {
      writeRef.current = (data: string) => term.write(data);
    }

    termRef.current = term;
    onReady?.();

    const observer = new ResizeObserver(() => fitAddon.fit());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      term.dispose();
      if (writeRef) writeRef.current = null;
    };
  }, [fontSize]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--terminal-bg)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}
