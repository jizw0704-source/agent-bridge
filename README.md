# Agent Bridge

[简体中文](README.md) | [English](README.en.md)

2026-10-23：v0.4.0 长期联系人与独立任务已部署服务器和 Mac；真实 Codex 双任务预验收通过，Wright 新版 Windows 验收待完成。见 [部署记录](docs/CONTACTS_DEPLOYMENT.md)与 [Wright 升级说明](docs/WRIGHT_UPGRADE.md)。

让不同人的专属 AI Agent 在各自主人的授权范围内交流、协商并完成协作。

Connect people's personal AI agents for permission-aware communication and collaboration.

状态：产品探索＋通信试验版。2026-10-20 已部署公司内网 HTTPS 中转，并验证 Mac 经服务器完成模拟两轮收发；真实 Windows／Wright 接入待验收。创建于 2026-09-09。

## 为什么做这个项目

当两个人需要约时间、协调任务或澄清需求时，可以先由双方的 Agent 交换必要信息、整理候选方案，再把需要决定的事项交给主人。应用范围包括工作和生活，不限定科研或企业场景。

例如：用户 A 想和用户 B 约一次 30 分钟的交流。双方 Agent 只交换允许公开的候选时间，协商后返回一个方案；双方确认后，才进入日程创建步骤。双方的完整日历与私人知识库不需要互相共享。

## 初步定位

Bridge 是连接个人 Agent 的协作层，计划提供身份绑定、联系人、消息路由、授权规则、协商状态和结果记录。每个 Agent 仍由自己的主人控制。

已选择“自动组织＋场景名片”的产品方向：按本次身份和场景组织主人的诉求、偏好与相关信息，区分内部判断参考和对外表达内容，并让主人可查看、可调整。首个场景已确定为与 Wright 的跨平台开发协作；采用现有 Agent 内交接、AB 收件箱与进度页，并关联 GitHub 任务。租房保留为生活场景。

Agent2Agent（A2A，智能体间通信协议）是早期通信基础候选，技术选择待需求与产品形态明确后再决定。Agent Bridge 的应用级约定与 A2A 的协议字段需分别定义；当前没有实现或验证 A2A 兼容性。

已有相近项目，尤其是 EnvoyMesh 和 Tacit，因此不主张这个想法独有。项目价值需要通过实际使用验证：是否更容易接入现有 Agent，是否减少人的沟通成本，是否能准确遵守授权边界。

## 局域网双端试验（v0.3.0）

已实现 HTTPS 中转、单次限时邀请、双方确认、两端主动收件及请求／回复去重。Mac 或内网服务器可运行中转，Windows 使用同一连接器。见[局域网接入说明](docs/LAN_PILOT.md)与[服务器部署记录](docs/SERVER_DEPLOYMENT.md)。真实 Windows 与 Wright 联机仍需验收。

Mac 后台接入与验证见 [Mac 连接器说明](docs/MAC_SERVER_CONNECTOR.md)。Windows 的实际接入步骤见 [Wright 接入说明](docs/WINDOWS_ONBOARDING.md)。

## Codex Skill

可使用 `$agent-bridge` 检查连接、准备交接和按授权完成配对操作。见 [Skill 安装与使用](docs/SKILL_USAGE.md)。技能不会替代后台连接器或扩大当前虚构任务范围。

## 持续自动收件（v0.2.0）

运行 `pnpm inbox init` 与 `pnpm inbox start`，随后用 `pnpm inbox mock 1` 投递模拟消息。后台持续等待、自动回复并支持停止／重启。见[Mac 持续收件说明](docs/MAC_RECEIVER.md)。只处理演示任务，不修改真实项目。

## 本机运行

`pnpm install --frozen-lockfile` 后运行 `pnpm demo`。需要 Node.js 22+、pnpm 和已登录的 Codex CLI。模拟 Wright 自动投递两条消息，真实 Codex 在同一会话中回复；只读演示目录，不修改真实项目。见[运行说明](docs/LOCAL_DEMO.md)。

## 文档入口

- [本地项目进展页](project.html)：功能、流程、验证与下一步；[维护说明](docs/PROJECT_PAGE.md)。

- [与 Wright 协作的完整样例与机理图](docs/WRIGHT_COLLABORATION.md)

- [新对话交接：讨论总结与深入探索问题](docs/HANDOFF.md)
- [产品需求与首个验证场景](docs/PRODUCT.md)
- [架构与通信约定草案](docs/ARCHITECTURE.md)
- [GitHub 相似项目调研与选型建议](docs/RELATED_PROJECTS.md)
- [开发路线与交接提示](docs/ROADMAP.md)

## 当前交付与边界

已完成：产品文档、本机真实 Codex 回复、持续模拟收件、局域网 HTTPS 中转及公司服务器部署；Mac 经服务器完成两轮模拟消息和重启持久化验收。

待完成：双方真实身份核对、Windows／Wright 实际接入、真实双端 Agent 与 GitHub 接入、完整权限测试与用户试用。日历属于后续候选场景。当前原型使用 Node.js 内置能力，无第三方运行依赖；长期协议与部署仍可调整。

仓库不包含真实聊天记录、日历、个人凭证或第三方源码。

## 开源与参与

Agent Bridge 以 [MIT 许可证](LICENSE) 开源。目前包含产品文档、本机演示与局域网中转试验，并提供接入 Skill 与验证记录。欢迎通过 [Issues](https://github.com/jizw0704-source/agent-bridge/issues) 分享工作或生活中的真实协作需求、讨论产品方案，或提交文档改进。

欢迎使用中文或英文参与讨论。英文文档从 [English README](README.en.md) 进入；产品决策与状态变更应同步更新中英文版本。

分享案例时请去除个人身份、联系方式、合同原文、账户信息和凭证。文档中提及的第三方项目遵循各自的许可证。

- [结构化交接 v1：格式、校验与验收边界](docs/STRUCTURED_HANDOFF.md)

- [长期联系人与独立任务：本地实现与迁移边界](docs/CONTACTS_TASKS.md)

- [长期房间与翻译器 PR 只读审核](docs/LONG_TERM_REVIEW.md)：本次补充已完成本地验证，尚未部署或完成 Wright 真实审核交接。
