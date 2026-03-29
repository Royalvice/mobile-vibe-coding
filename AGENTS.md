# mobile-vibe-coding — Project Contract

## What This Project Is

An open-source tool for mobile vibe coding: connect your phone to remote Codex CLI and Claude Code CLI sessions over WebSocket, with full terminal fidelity, interactive prompt cards, auto mode, and hardware monitoring.

Tech stack: Next.js + Capacitor (client) · Node.js (remote agent) · MIT license.

## Recovery Order

When resuming work on this project, read in this order:

1. This file (`AGENTS.md`)
2. `.agent-os/project-index.md` — current state, active workstreams, top next action
3. Active items referenced from the index
4. `.agent-os/run-log.md` — most recent entries
5. Dive deeper only if needed

Do not re-read the entire project unless the index and recent log are insufficient.

## Document Layout

```
mobile-vibe-coding/
├─ AGENTS.md                          ← this file (project contract)
├─ CLAUDE.md                          ← hard link to AGENTS.md
├─ .agent-os/
│  ├─ project-index.md                ← current truth, fast recovery
│  ├─ requirements.md                 ← human-owned goals and constraints
│  ├─ change-decisions.md             ← later scope changes (append-only)
│  ├─ architecture-milestones.md      ← architecture + milestone plan
│  ├─ todo.md                         ← work inventory
│  ├─ acceptance-report.md            ← evidence ledger
│  ├─ lessons-learned.md              ← failed explorations and traps
│  └─ run-log.md                      ← recent agent activity
├─ docs/
│  └─ mobile-codex-claude-remote-survey.md  ← initial research
├─ agent/                             ← remote agent (Node.js)
├─ client/                            ← mobile/web client (Next.js + Capacitor)
└─ shared/                            ← shared protocol types
```

## Update Discipline

Update state documents when any of these happen:

- A new TODO is created
- An item changes state (backlog → doing → done → verified)
- A blocker appears or clears
- A milestone is reached or replanned
- Evidence is produced
- An exploration fails or is abandoned
- A work session ends

Minimum updates per event:

| Event | Must update |
|-------|------------|
| New TODO | `todo.md`, maybe `project-index.md` |
| State transition | `todo.md`, `project-index.md`, maybe `run-log.md` |
| Blocker | `todo.md`, `project-index.md` |
| Evidence | `acceptance-report.md`, maybe `project-index.md` |
| Failed exploration | `lessons-learned.md`, maybe `todo.md` |
| Milestone done | `architecture-milestones.md`, `acceptance-report.md`, `project-index.md` |
| Session end | `run-log.md` |

## Truthfulness Guardrail

- Never claim completion without evidence
- Never hide failed explorations
- Use `hypothesis`, `unverified`, `partial`, or `blocked` for uncertain states
- A TODO is not closed until implementation + verification + bookkeeping are all done

## Escalation Rules

Escalate to the human only when:

- A question requires human judgment and cannot be inferred
- A hard external blocker prevents progress
- Multiple exploration paths have failed and the project is stuck
- The goal appears internally inconsistent under stated constraints

Do not escalate for architecture or implementation choices — those are agent-owned.

## Item ID Convention

Use typed, globally unique IDs across all documents:

- `OBJ-NNN` objectives
- `REQ-NNN` requirements
- `AC-NNN` acceptance criteria
- `WS-NNN` workstreams
- `MS-NNN` milestones
- `TD-NNN` TODOs
- `RSK-NNN` risks
- `EXP-NNN` explorations
- `EV-NNN` evidence
- `CD-NNN` change decisions

## Language Convention

- Project documents: Chinese (user's language)
- Code comments and `print`/`console.log` output: English
- UI strings: i18n (Chinese + English)
- Git commit messages: English

## Coding Standards

- 2 spaces indentation for frontend code
- UTF-8 encoding
- `PascalCase` for React components and classes
- `camelCase` for variables, functions, hooks
- `kebab-case` for non-component file names
- Prettier + ESLint
- Commit format: `type: short summary` (e.g., `feat: add session manager`)
- Do not commit secrets, API keys, or `.env` files
