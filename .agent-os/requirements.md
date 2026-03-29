# 需求文档 — mobile-vibe-coding

## 目标 (OBJ)

- **OBJ-001**：从手机统一连接远端 Codex CLI 和 Claude Code CLI，实现移动端 vibe coding
- **OBJ-002**：支持 auto 模式，睡觉时 agent 自主运行
- **OBJ-003**：提供服务器硬件监控（GPU/CPU/RAM/Disk）

## 需求 (REQ)

### 终端交互
- **REQ-001**：raw text 原样透传，不做任何转译或转义
- **REQ-002**：slash commands 原样支持
- **REQ-003**：交互式选择题检测后以浮层卡片展示，支持选择和添加 note
- **REQ-004**：基于 tmux 的 session 持久化

### Session 管理
- **REQ-005**：创建/切换/销毁/列出 session
- **REQ-006**：支持 Codex 和 Claude Code 两种 agent 类型

### 多机器管理
- **REQ-007**：统一入口，分机器管理
- **REQ-008**：每台机器独立的 session 列表
- **REQ-009**：Linux 公网直连，Windows LAN/Tailscale

### Auto 模式
- **REQ-010**：手机手动开关触发
- **REQ-011**：prompt 模板存手机，激活时推送到远端 agent，之后 agent 独立运行不依赖手机连接
- **REQ-012**：事件驱动 + 定时轮询兜底检测 CLI 等待输入
- **REQ-013**：复用 CLI 自带权限系统（Route A），agent 只做"检测等待 → 自动发 y"
- **REQ-014**：错误处理：跳过当前 + 继续下一个 + 记日志
- **REQ-015**：可编辑的 prompt 模板库

### 硬件监控
- **REQ-016**：GPU 状态（使用率、显存、温度）
- **REQ-017**：CPU 使用率/负载
- **REQ-018**：RAM 使用率
- **REQ-019**：Disk 空间

### 通知
- **REQ-020**：不需要实时后台推送，agent 本地记事件日志，手机重连后拉取

### UI/UX
- **REQ-021**：暗色主题，极简风格，治愈感设计
- **REQ-022**：i18n 从一开始就做中英双语
- **REQ-023**：三端一套代码（Web + iOS + Android）

### 配置
- **REQ-024**：JSON 文件导入导出，无后端数据库
- **REQ-025**：每台机器一条配置（地址、端口、连接方式）

## 验收标准 (AC)

- **AC-001**：手机浏览器能连接远端 agent，看到 codex/cc 的原始终端输出 → REQ-001
- **AC-002**：发送 `/help` 等 slash command 能正常工作 → REQ-002
- **AC-003**：触发 tool approval 时弹出浮层卡片，选择后 agent 继续 → REQ-003
- **AC-004**：断网重连后 session 仍在，输出不丢失 → REQ-004
- **AC-005**：能在多台机器间切换，各自 session 独立 → REQ-007, REQ-008
- **AC-006**：开启 auto 后关闭手机 app，agent 持续运行，重连后能看到事件日志 → REQ-010, REQ-011, REQ-020
- **AC-007**：手机上能看到 GPU/CPU/RAM/Disk 实时状态 → REQ-016~019
- **AC-008**：中英文切换正常 → REQ-022
- **AC-009**：Vercel 部署 + TestFlight + APK 均可用 → REQ-023

## 非目标

- 不做文件编辑器
- 不做多用户/团队协作
- 不做 git GUI
- 不做 IDE 功能（代码高亮、diff 渲染等）

## 硬约束

- 技术栈：Next.js + Capacitor (client) + Node.js (agent)
- 协议：MIT
- 鉴权：MVP 暂不做
- 推送：不依赖第三方推送服务
- 部署：Web 端 Vercel，iOS TestFlight，Android APK
