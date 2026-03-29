# mobile-vibe-coding

Mobile vibe coding with Codex & Claude Code. Connect your phone to remote AI coding agents over WebSocket — full terminal fidelity, interactive prompt cards, auto mode, and hardware monitoring.

## Why

Existing mobile solutions for AI coding CLIs lose terminal interaction semantics — slash commands break, session switching is clunky, interactive prompts get mangled. This project keeps the terminal layer intact while adding a mobile-optimized UI on top.

## Architecture

```
Phone (Next.js + Capacitor)  ←— wss:// —→  Remote Agent (Node.js)
                                                    ↕ PTY
                                              tmux / conpty
                                            [codex] [claude]
```

- **Client**: Next.js + Capacitor — one codebase for Web, iOS, Android
- **Agent**: Node.js daemon — manages tmux (Linux) or conpty (Windows) sessions
- **Protocol**: JSON over WebSocket, raw terminal text passed through untouched

## Features

- Raw terminal I/O — no escaping, no transformation
- Interactive prompt detection → floating card overlay
- Multi-machine management with unified entry
- Auto mode — agent runs autonomously while you sleep
- Hardware monitoring (GPU/CPU/RAM/Disk)
- i18n (English + Chinese)
- Dark minimal UI with a calming aesthetic

## Quick Start

### Agent (on your dev machine)

```bash
cd agent
npm install
npm run dev
# Listening on ws://0.0.0.0:9876
```

### Client (local dev or deploy to Vercel)

```bash
cd client
npm install
npm run dev
# Open http://localhost:3000
```

### Connect

Add your machine in Settings (import/export JSON config), or quick-test via browser console:

```js
localStorage.setItem('mvc-config', JSON.stringify({
  version: 1,
  machines: [{ id: 'dev', name: 'My Server', host: 'YOUR_HOST', port: 9876, connectionType: 'direct' }],
  preferences: { fontSize: 14, locale: 'en' }
}));
location.reload();
```

## Platform Support

| Platform | Session Persistence | Notes |
|----------|-------------------|-------|
| Linux | tmux (survives agent restart) | Primary target |
| Windows | In-process (lives with agent) | conpty via node-pty |

## Auto Mode

1. Create prompt templates on your phone
2. Toggle auto mode on
3. Templates are pushed to the remote agent
4. Agent runs independently — auto-approves CLI prompts, cycles through templates
5. Phone can disconnect; check results when you wake up

## Tech Stack

- **Client**: Next.js 15, Capacitor 6, xterm.js, Zustand, next-intl, Tailwind CSS
- **Agent**: Node.js, node-pty, ws, systeminformation
- **Shared**: TypeScript protocol types

## Distribution

- Web: Vercel
- iOS: TestFlight
- Android: APK

## License

MIT
