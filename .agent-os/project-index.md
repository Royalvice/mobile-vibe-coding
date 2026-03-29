# 项目索引 — mobile-vibe-coding

## 当前目标

构建一个开源的手机端 vibe coding 工具，统一连接远端 Codex CLI 和 Claude Code CLI，支持 auto 模式和硬件监控。

## 活跃工作流

| ID | 工作流 | 状态 |
|----|--------|------|
| WS-001 | 项目文档系统初始化 | done |
| WS-002 | Remote Agent (Node.js) | done (scaffold) |
| WS-003 | 客户端 (Next.js + Capacitor) | done (scaffold) |
| WS-004 | 共享协议层 | done |
| WS-005 | 集成测试 + 打包分发 | backlog |

## 当前最高优先级下一步

安装依赖、验证构建、修复类型错误，然后进入 MS-002（Agent 基础通信端到端验证）。

## 活跃阻塞

无。

## 最近重要变更

- 2026-03-29：项目需求审问完成，所有关键决策锁定
- 2026-03-29：AGENTS.md 重写为项目合约
- 2026-03-29：.agent-os/ 状态文档系统创建完成
- 2026-03-29：shared/ 协议层定义完成（protocol.ts + types.ts）
- 2026-03-29：agent/ 骨架搭建完成（7 个模块）
- 2026-03-29：client/ 骨架搭建完成（6 个页面 + 3 个组件 + 3 个 lib + i18n）

## 关键文档指针

- 需求决策：`.agent-os/requirements.md`
- 架构与里程碑：`.agent-os/architecture-milestones.md`
- TODO 列表：`.agent-os/todo.md`
- 前期调研：`docs/mobile-codex-claude-remote-survey.md`
