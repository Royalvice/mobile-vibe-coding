# 架构与里程碑 — mobile-vibe-coding

## 架构概览

```
┌─────────────────────────────────┐
│  Client (Next.js + Capacitor)   │
│  Web / iOS / Android            │
│  ┌───────────┐ ┌─────────────┐ │
│  │ xterm.js  │ │ PromptCard  │ │
│  │ Terminal  │ │ (浮层卡片)   │ │
│  └───────────┘ └─────────────┘ │
│  ┌───────────┐ ┌─────────────┐ │
│  │ Session   │ │ HW Monitor  │ │
│  │ Manager   │ │ Dashboard   │ │
│  └───────────┘ └─────────────┘ │
└──────────┬──────────────────────┘
           │ wss:// (直连 agent)
           ▼
┌─────────────────────────────────┐
│  Remote Agent (Node.js)         │
│  ┌───────────┐ ┌─────────────┐ │
│  │ WS Server │ │ Output      │ │
│  │           │ │ Parser      │ │
│  └───────────┘ └─────────────┘ │
│  ┌───────────┐ ┌─────────────┐ │
│  │ tmux Mgr  │ │ Auto Mode   │ │
│  │ (PTY)     │ │ Controller  │ │
│  └───────────┘ └─────────────┘ │
│  ┌───────────┐ ┌─────────────┐ │
│  │ HW Monitor│ │ Event Log   │ │
│  └───────────┘ └─────────────┘ │
│           ↕ PTY                 │
│  tmux: [codex-1] [cc-2] [cc-3] │
└─────────────────────────────────┘
```

### 通信协议

Agent ↔ Client 通过 WebSocket 传输 JSON 消息，raw text 不做转译：

- `output` — PTY 原始输出，UTF-8 + ANSI 转义序列
- `input` — 用户原始输入
- `prompt` — 结构化交互式选择题（agent 检测到后额外发送）
- `prompt_reply` — 用户选择 + 可选 note
- `session_*` — session 生命周期管理
- `hw_status` — 硬件状态数据
- `auto_*` — auto 模式控制
- `event_log` — 事件日志拉取

### 网络策略

- Linux 机器：agent 直接监听端口，wss:// 直连
- Windows 机器：LAN 直连 或 Tailscale（agent 同样监听端口）
- Vercel 只托管前端静态资源，不做 WebSocket 中转

## 工作流 (WS)

| ID | 名称 | 描述 |
|----|------|------|
| WS-001 | 项目文档系统 | AGENTS.md + .agent-os/ 全部文档 + git 初始化 |
| WS-002 | Remote Agent | Node.js agent：WS server + tmux 管理 + PTY 桥接 + output parser + auto mode + HW monitor |
| WS-003 | 客户端 | Next.js + Capacitor：终端渲染 + 卡片交互 + session 管理 + 配置 + i18n |
| WS-004 | 共享协议层 | TypeScript 类型定义：消息协议 + 共享类型 |
| WS-005 | 集成 + 分发 | 端到端测试 + Vercel 部署 + Capacitor 构建 + README |

## 里程碑 (MS)

| ID | 里程碑 | 依赖 | 验收标准 | 状态 |
|----|--------|------|----------|------|
| MS-001 | 项目文档系统完成 | — | AGENTS.md + .agent-os/ 就位，git 初始化 | doing |
| MS-002 | Agent 基础通信 | MS-001 | agent 启动后浏览器能 WebSocket 连接，看到 shell 输出 | backlog |
| MS-003 | Session 管理 | MS-002 | 创建/切换/销毁 codex 和 cc 的 tmux session | backlog |
| MS-004 | 交互式 Prompt 卡片 | MS-003 | 检测选择题 → 弹出浮层卡片 → 选择后回传 | backlog |
| MS-005 | Auto 模式 | MS-003 | 手动开启后 agent 独立运行，自动 approve + prompt 模板 | backlog |
| MS-006 | 多机器管理 | MS-003 | 统一入口管理多台机器 session | backlog |
| MS-007 | 硬件监控 | MS-002 | 手机看到 GPU/CPU/RAM/Disk 状态 | backlog |
| MS-008 | i18n + 主题 | MS-003 | 中英双语，暗色治愈风格 | backlog |
| MS-009 | 三端打包 | MS-008 | Vercel + TestFlight + APK | backlog |
