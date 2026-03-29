# 手机直连远端 Codex / Claude Code 方案调研

更新时间：2026-03-27

## 结论先行

如果你的硬要求是下面四条同时成立：

1. 手机端尽量接近原生 CLI
2. `slash commands` 原样可用
3. session 能切换或恢复
4. 你输入的 raw text 和 Codex / Claude Code 输出的 raw text 必须原封不动透传，不做转译

那么目前最成熟、最稳、实现成本最低的路线，不是“消息机器人”，而是“远端终端透传”：

- 第一推荐：`手机 SSH 客户端 + tmux + mosh/ssh`
- 第二推荐：`手机浏览器 Web Terminal + tmux`
- 第三推荐：`code-server / Coder + 浏览器终端`

如果目标是“统一接入 Codex 和 Claude Code”，最佳抽象层也应该放在“终端层”，而不是分别对接两家 agent 的专有 UI。因为 Codex 和 Claude Code 本质上都已经是终端型 agent；只要终端被完整透传，`/model`、`/compact`、`/resume`、审批/选择题交互、会话恢复这些都天然保留。

## 你的需求拆解

### 真正的硬需求

- 保留终端控制语义，而不是只保留“聊天内容”
- 保留交互式选择题、审批、补充 note 的输入流程
- 支持多 session，不止单轮会话
- 手机上能长期挂着，网络切换后尽量不断

### 这意味着什么

这基本排除了“简单把 stdout/stderr 转成 IM 文本消息”的方案。因为 Codex / Claude Code 的很多能力依赖：

- PTY / TTY 语义
- 键盘特殊键
- 终端控制序列
- 交互式菜单、审批界面、选择器
- 长连接和会话恢复

只要中间层把终端 UI 重新解释成“聊天消息”，原生体验就会明显打折。

## 方案一：手机 SSH 客户端 + tmux + mosh/ssh

### 适配度

- 原始文本透传：极高
- `slash commands`：原生支持
- session 切换：通过 `tmux` 原生支持
- 选择题/补充 note：保留 CLI 原交互
- 前端实现成本：最低
- 成熟度：最高

### 典型组合

- iPhone / iPad：Blink Shell、Termius
- Android：TabSSH、Termius
- 服务端：`tmux` + `ssh`，移动网络环境下优先 `mosh`

### 为什么它最符合你的要求

这条路本质上没有“桥接 AI agent 协议”，只是让手机直接接到远端 shell。Codex 和 Claude Code 仍然运行在原本的远端终端里，所以：

- 你的输入就是发往 agent 的原始终端输入
- agent 输出就是终端原始输出
- 不需要额外定义 slash command 映射
- 不需要把“选择题”重新建模成卡片或按钮

### 当前成熟产品与证据

- Blink Shell 官方 App Store 说明明确强调 iOS 上的 `Mosh`、完整 SSH、面向远端开发的能力，并强调连接在移动场景下可持续恢复。
- Termius 官方站点与 iOS 页面都强调多标签、多 session、移动端虚拟功能键、SFTP、跨端同步。
- TabSSH 官方页明确写了“true tabbed interface”和 “tmux-compatible keyboard shortcuts”。
- `mosh` 官方站点长期定位就是移动网络下比 SSH 更稳的远程 shell。

### 优点

- 最接近“像原生一样”
- 开发量几乎为零
- 同时兼容 Codex 和 Claude Code
- 安全边界清晰，系统结构简单

### 缺点

- 体验高度依赖手机终端 app 的键盘设计
- iOS 后台限制仍然存在，只能靠 `mosh + tmux` 降低影响
- 如果你希望“像聊天 app 一样通知我 agent 在问问题”，需要额外补一层通知

### 适合你吗

如果你优先要“现在就能用，而且尽量原生”，这是最优解。

## 方案二：Web Terminal 网关，手机浏览器访问

### 适配度

- 原始文本透传：高
- `slash commands`：原生支持
- session 切换：通过 `tmux` 支持
- 选择题/补充 note：大体保留
- 前端实现成本：中低
- 成熟度：高

### 典型组件

- `ttyd`
- Wetty
- 反向代理：Nginx / Caddy
- 会话层：`tmux`
- 内网穿透 / 远程访问：Tailscale / Cloudflare Tunnel / 自己的 HTTPS 域名

### 为什么这条路值得选

如果你想要“手机能用、前端实现越方便越好”，Web Terminal 是最平衡的路线。你不需要写一个完整的移动 App，也不需要把 Codex / Claude Code 的 UI 重做一遍。只要把浏览器里的 xterm.js 终端接到远端 PTY，就已经能保留大部分原始体验。

### 当前成熟产品与证据

- `ttyd` 官方 README 直接写的是 “Share your terminal over the web”，并支持可写入 TTY、SSL、WebSocket、IME/CJK。
- Coder 的 Web Terminal 官方文档明确说明其实现是 `Browser ↔ WebSocket ↔ PTY`，并支持会话重连与持久化 token。

### 优点

- 前端最容易“自己控住”
- 可以做一个统一入口页面，选择 `Codex`、`Claude Code`、不同机器、不同 `tmux` session
- 不依赖用户安装特定 SSH 客户端
- 很容易增加推送通知、会话列表、项目列表

### 缺点

- 手机浏览器键盘体验通常不如原生 SSH app
- 某些终端控制序列、复制粘贴、后台挂起体验不如原生终端
- 你仍然需要自己处理鉴权和公网暴露安全

### 适合你吗

如果你最终想做“统一前端”，这是我最推荐的产品化路线。

## 方案三：code-server / Coder

### 适配度

- 原始文本透传：高，但主要在其内置终端中成立
- `slash commands`：支持
- session 切换：依赖终端内 `tmux`
- 选择题/补充 note：支持
- 前端实现成本：中
- 成熟度：高

### 特点

这条路线不是单纯“终端共享”，而是“整个远端开发工作区进浏览器”。官方文档明确支持浏览器终端，并且有面向 iPad 的专门说明。

### 适合的场景

- 你不仅想在手机上问 agent，还想顺手看文件树、diff、日志
- 你愿意接受比纯终端更重一点的前端

### 主要不足

- 对手机小屏来说偏重
- 你的核心诉求其实是 agent CLI，而不是完整 IDE
- 若只为 Codex / Claude Code，复杂度比 `ttyd` 更高

## 方案四：Claude Code 官方 Remote Control

### 适配度

- 原始文本透传：中高
- `slash commands`：高
- session 切换：高
- 选择题/补充 note：高
- 前端实现成本：最低
- 成熟度：高，但仅限 Claude Code

### 为什么它值得单列

Anthropic 现在已经不是只有“云端 web 任务”了。官方文档明确提供 `Remote Control`：

- 可从手机、平板、浏览器继续本地 Claude Code 会话
- 会话仍然跑在你自己的机器上
- 本地文件系统、MCP、工具、项目配置都继续可用
- 手机、浏览器、终端三端会话保持同步
- 网络中断后支持自动重连
- 可以从现有 session 里直接执行 `/remote-control`

这已经非常接近你要的“手机像原生一样操作远端 Claude Code”。

### 但为什么它不能直接解决你的总目标

因为它只解决 Claude Code，不解决 Codex。你要的是“统一接入 Codex 和 Claude Code”，所以它非常适合拿来作为 Claude 一侧的现成能力，但不能直接作为统一方案。

### 实际判断

- 如果你要最快把 Claude Code 接到手机上，先直接用官方 `Remote Control`
- 如果你还要把 Codex 一起统一进去，仍然应以“终端层统一”作为总架构

## 方案五：Codex 官方移动/云表面

OpenAI 官方最近已经把 Codex 扩展到多个使用表面：

- Codex CLI
- IDE
- Web
- GitHub
- ChatGPT iOS app
- 独立 Codex app（当前资料显示为 macOS app）

OpenAI 帮助中心明确写到，Codex 现在可以在 terminal、IDE、web、GitHub，甚至 ChatGPT iOS app 之间联动，且本地与云之间可无状态感切换。

### 为什么它仍不是你的主方案

这条路线更适合：

- 发起任务
- 查看 agent 进度
- 在本地和云之间切换
- 管理并行 agent

但对你最关键的“统一接入双 agent + 原生 CLI 透传”，官方 Codex 移动表面目前仍不如“直接保留终端”更稳。

## 方案六：飞书 / 微信 / 企业微信 机器人桥接

### 能做什么

- 飞书消息卡片支持交互组件、表单容器、交互回传
- 理论上可以把 agent 的“需要确认/选择”的动作映射成卡片按钮或表单

### 但为什么我不建议把它作为主方案

这类方案最大的问题不是“能不能做”，而是“是否还能保持原生 CLI 语义”。

你的要求里最难的一条是：

- raw text 原封不动转发，不做任何转译

而飞书/微信这类 IM 平台天然是结构化消息平台，不是 PTY。飞书官方关于消息卡片的说明里，交互回传、卡片更新、表单组件都要通过卡片 JSON、回调地址、工作流或自定义代码来实现。也就是说，它更适合“把终端交互重建成业务卡片流”，不适合“原样终端透传”。

微信侧会更弱。公众号/服务号生态更适合菜单、模板消息、客服消息，不适合长时交互式终端。

### 结论

- 飞书：适合做通知层、审批层、提醒层，不适合做主操作面
- 微信/企业微信：更不适合做主操作面

## 真正可落地的推荐排序

### 推荐 1：先做“原生可用版”

技术栈：

- 远端机器运行 Codex / Claude Code
- `tmux` 管多 session
- `mosh` + `ssh`
- 手机端用 Blink Shell / Termius / TabSSH

这是最短路径，几乎立刻可用。

### 推荐 2：Claude 先走官方，统一层后补

技术栈：

- Claude Code：官方 `Remote Control`
- Codex：手机 SSH 或 Web Terminal
- 后续统一入口：Web 门户聚合

这条路的优点是你可以先把 Claude 侧做到“接近原生”，同时不给统一架构挖坑。

### 推荐 3：再做“统一 Web 门户版”

技术栈：

- 前端：移动优先 Web
- 后端：会话目录 + WebSocket 网关
- 终端层：`ttyd` 或自己用 xterm.js + PTY
- 会话层：`tmux`
- 访问控制：Tailscale / OAuth / 反向代理

这个版本最适合你后续自己做产品。重点不是“重新实现 Codex/Claude 的协议”，而是：

- 统一列出主机
- 统一列出 session
- 一键 attach 到 `codex` 或 `claude`
- 给用户加通知、入口和权限

### 推荐 4：把飞书做成“通知+唤醒”副通道

例如：

- agent 停下来等你确认时，飞书推一个卡片
- 点开卡片后跳转回 Web Terminal
- 真正输入仍然在终端里完成

这样飞书负责“提醒你”，不是“取代终端”。

## 如果你要自己做统一前端，技术判断很关键

### 我建议的实现原则

- 不要优先做“Codex 协议适配器 + Claude 协议适配器”
- 优先做“终端会话管理器”
- 把 `tmux` 作为统一 session 抽象

原因很简单：

- Claude Code 已有官方 SDK，支持 slash commands、session id、resume
- Codex 公开资料里目前仍以 CLI / IDE / Cloud tasks 为主，我没有找到一套与 Claude Agent SDK 对等、面向自建移动 UI 的官方稳定前端协议文档
- 因此，自建 UI 若想同时兼容两家，最稳的公共抽象不是 agent API，而是 PTY

## 最终建议

如果你让我给一个非常明确的选型建议：

- 短期上线：`Termius/Blink/TabSSH + tmux + mosh`
- 中期产品化：`移动 Web Terminal + tmux + Tailscale`
- 飞书/微信：只做通知，不做主交互面

你这个需求里，“统一接 Codex 和 Claude Code”与“保留原生体验”这两个目标并不冲突，但前提是你要把统一层做在终端层，而不是消息层。

## 现成 GitHub 开源项目

下面这些项目不是泛泛“远程开发工具”，而是已经明确面向手机上使用 AI coding agents。

### 第一梯队：最值得重点试

#### 1. Happy

- GitHub: https://github.com/slopus/happy
- 定位：面向 `Codex` 和 `Claude Code` 的移动端与 Web 客户端
- 开源情况：MIT
- 成熟度信号：GitHub 页面显示约 16k+ stars

为什么值得重点看：

- README 明确写了 `Mobile and Web client for Codex and Claude Code`
- 官方功能页明确写有：
  - 实时 CLI 双向同步
  - 多 session 管理
  - 权限提示与批准
  - 自定义 slash commands
  - 自定义 agents 同步
  - 推送通知
- 它不是简单的 SSH 包装，而是专门围绕 AI agent 交互做了移动端 UI

与你需求的匹配度：

- `slash commands`：强
- session 切换：强
- 手机审批/选择：强
- 原始文本透传：中高，不是裸 PTY，而是包了一层同步协议

结论：

如果你想找“现成能用、而且明显是为手机 vibe coding 做的开源项目”，Happy 目前是最强候选之一。

#### 2. CloudCLI / Claude Code UI

- GitHub: https://github.com/siteboon/claudecodeui
- 定位：`Claude Code / Codex / Cursor CLI / Gemini CLI` 的桌面与移动端 UI
- 开源情况：GPL-3.0
- 成熟度信号：GitHub 页面显示约 9k+ stars

为什么值得重点看：

- README 明确写了 `desktop and mobile UI`
- 直接支持多 agent，不只 Claude
- 功能包括：
  - 集成 shell terminal
  - 文件树与编辑
  - Git 集成
  - session 管理、恢复、历史
  - 自动发现现有本地 session
- FAQ 里还专门拿自己和 Claude 官方 Remote Control 做对比

与你需求的匹配度：

- `slash commands`：高，因其直接对接原生 CLI session
- session 切换：高
- 手机使用：高
- 原始文本透传：中高，仍是 GUI 封装，不是完全裸终端

结论：

如果你更看重“统一多 agent + Web/mobile + 现成 UI”，它是非常值得实测的候选。

#### 3. MobileCLI

- 官网含 GitHub 入口: https://www.mobilecli.app/
- 定位：把 `Claude Code / Codex / Gemini CLI / OpenCode` 会话流到手机
- 开源情况：官方站点明确写 open source，但搜索结果里 GitHub 仓库入口不如前两者直观

为什么值得关注：

- 明确支持多 agent
- 明确支持：
  - terminal streaming
  - approvals
  - push notifications
  - session management
  - 多并发 session 切换
- 强调自托管、本机直连、Tailscale

与你需求的匹配度：

- 方向非常对
- 但当前公开资料里，GitHub 可见度和社区成熟度信号不如 Happy / CloudCLI 明确

结论：

值得试，但我会把它排在 Happy 和 CloudCLI 后面。

### 第二梯队：很有参考价值，但有明显边界

#### 4. Claude Code Viewer

- GitHub: https://github.com/d-kimuson/claude-code-viewer
- 定位：Claude Code 的全功能 Web 客户端
- 开源情况：MIT
- 成熟度信号：GitHub 页面显示约 1k+ stars

关键特性：

- 启动新会话
- 恢复现有 session
- pause/resume
- tool approval
- 移动端优化 UI
- 内置 Git 操作

边界：

- 只偏 Claude Code，不是 Codex + Claude 的统一方案

结论：

如果你决定先把 Claude 一侧做好，它很值得研究，尤其是它对 session log 与 approval 的处理。

#### 5. Paseo

- GitHub: https://github.com/getpaseo/paseo
- 定位：一个界面管理 `Claude Code / Codex / OpenCode` agents，支持手机、桌面、CLI
- 开源情况：AGPL-3.0
- 成熟度信号：GitHub 页面显示约 300+ stars

关键特性：

- 明确支持手机、桌面、CLI
- 有 daemon + Expo mobile app + CLI 的完整结构
- 支持多 agent orchestration
- 支持远端 host 模式

边界：

- 目前更像“agent manager / orchestrator”，不一定以“完全复刻原始 CLI”作为第一目标
- 社区成熟度暂时弱于 Happy / CloudCLI

结论：

如果你更想看“统一多 agent 的产品架构”，Paseo 很值得看源码。

#### 6. remolt.dev

- GitHub: https://github.com/nthh/remolt.dev
- 定位：浏览器里启动沙箱化 AI coding session
- 开源情况：MIT

关键特性：

- 浏览器通过 WebSocket 连接 `tmux` TTY
- 断线重连后恢复原终端状态
- 容器会话持久化
- 支持 Claude Code 等终端 agent

边界：

- 更偏“浏览器里的沙箱终端平台”
- 不是专门的手机 AI coding companion
- 公开资料里未明确强调 Codex 手机体验

结论：

如果你想做“Web Terminal + 容器 + tmux”的统一平台，它是一个很好的架构参考。

### 第三梯队：可做副通道，不建议做主方案

#### 7. Claude-Code-Remote

- GitHub: https://github.com/JessyTsui/Claude-Code-Remote
- 定位：通过 Email / Telegram / LINE / 桌面通知远程控制 Claude Code

优点：

- 很适合做通知和轻量回复
- Telegram 带按钮
- 已考虑 tmux 与 PTY 注入

缺点：

- 只偏 Claude
- 本质还是消息平台桥接
- 不符合你“原始文本终端体验尽量完整保留”的主目标

#### 8. claude-code-telegram

- GitHub: https://github.com/RichardAtCT/claude-code-telegram
- 定位：Telegram bot 远程访问 Claude Code

优点：

- 手机可用
- 有 session persistence

缺点：

- 单平台、单 agent
- 聊天机器人语义重于终端语义

## 我对这些开源项目的判断

如果只从“手机 vibe coding 开源现成度”看，我会这样排：

1. Happy
2. CloudCLI / Claude Code UI
3. MobileCLI
4. Claude Code Viewer
5. Paseo
6. remolt.dev

如果只从“最贴近你最初的硬性要求”看，我会这样排：

1. `tmux + SSH/Web Terminal` 这类终端层方案
2. Happy
3. CloudCLI
4. Claude 官方 Remote Control（仅 Claude）
5. 其他消息桥接类项目

原因很直接：

- 终端层方案最能保证 raw text 与交互语义不被中间层改写
- Happy 和 CloudCLI 是最接近“手机原生 AI coding companion”的现成开源实现
- Telegram / Email / 飞书式桥接很适合通知，但天然不是 PTY

## 参考资料

- OpenAI Codex CLI: https://developers.openai.com/codex/cli
- OpenAI Codex release notes / app notes: https://help.openai.com/en/articles/10128477
- Anthropic Claude Code Remote Control: https://code.claude.com/docs/en/remote-control
- Anthropic Claude Code on the web: https://code.claude.com/docs/en/claude-code-on-the-web
- Anthropic Claude Code skills / slash commands: https://code.claude.com/docs/en/slash-commands
- Anthropic Claude Code session management SDK: https://docs.claude.com/zh-CN/docs/claude-code/sdk/sdk-sessions
- Anthropic Claude Code VS Code integration: https://docs.claude.com/en/docs/claude-code/ide-integrations
- Happy: https://github.com/slopus/happy
- Happy features: https://happy.engineering/docs/features/
- CloudCLI / Claude Code UI: https://github.com/siteboon/claudecodeui
- Claude Code Viewer: https://github.com/d-kimuson/claude-code-viewer
- AgentAPI: https://github.com/coder/agentapi
- Paseo: https://github.com/getpaseo/paseo
- remolt.dev: https://github.com/nthh/remolt.dev
- Claude-Code-Remote: https://github.com/JessyTsui/Claude-Code-Remote
- claude-code-telegram: https://github.com/RichardAtCT/claude-code-telegram
- Coder Web Terminal: https://coder.com/docs/user-guides/workspace-access/web-terminal
- code-server iPad guidance: https://coder.com/docs/code-server/ipad
- ttyd: https://github.com/tsl0922/ttyd
- Blink Shell App Store: https://apps.apple.com/us/app/blink-shell-build-code/id1594898306
- Termius iPhone/iPad App Store: https://apps.apple.com/us/app/termius-modern-ssh-client/id549039908
- Termius official site: https://www.termius.com/
- TabSSH official site: https://tabssh.github.io/
- Mosh official site: https://mosh.org/
- Moshi: https://getmoshi.app/
- 飞书消息卡片交互案例: https://www.feishu.cn/content/7319786721459863556
