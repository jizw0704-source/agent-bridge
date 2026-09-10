# GitHub 相似项目调研

[简体中文](RELATED_PROJECTS.md) | [English](en/RELATED_PROJECTS.md)

核查日期：2026-09-09。方法：搜索发现候选项目，再通过 GitHub API 核对仓库元数据并阅读 README 或官方文档。这是有代表性的初筛，不是全网穷尽，也不是源码安全审计或运行测试。

## 初步判断

Agent 间通信已有协议和实现；“个人 Agent 代表主人协调”也已有相近产品。建议将 Bridge 定位为面向工作与生活的个人代理协作层，重点验证易接入、低打扰、明确授权和可靠结果。差异是否成立仍需试用比较。

| 项目与直接来源 | 项目文档描述的方向 | 对 Bridge 的启发与限制 |
| --- | --- | --- |
| [A2A](https://github.com/a2aproject/A2A) | 不同实现的独立 Agent 进行能力发现、任务通信和结果交换 | 优先作为通信基础候选；个人联系人与双方确认体验仍需应用层设计 |
| [Agent Network Protocol](https://github.com/agent-network-protocol/AgentNetworkProtocol) | Agent 身份、发现、加密消息与开放网络协作 | 适合研究跨平台身份和开放网络；范围较广，首版不必完整实现 |
| [EnvoyMesh](https://github.com/allenpeng0705/EnvoyMesh) | 个人设备组成 P2P 网络，个人 Agent 按策略代理任务，提供外部 Agent Bridge | 与构想高度接近，应优先对照体验与接入边界；文档宣传不代表本次已验证能力 |
| [Tacit](https://github.com/tacitprotocol/tacit) | Agent 代理个人发现、建立信任和进行双方同意的介绍 | 接近人与人社交协作；v0.1 草案，项目所称身份防伪能力尚未核验 |
| [Society Protocol](https://github.com/societycomputer/society-protocol) | 将不同机器和团队的 Agent 接入 P2P 网络 | 参考接入方式和跨设备协作；还需评估是否满足独立主人的授权需求 |
| [MCP Gateway & Registry](https://github.com/agentic-community/mcp-gateway-registry/blob/main/docs/a2a.md) | Agent 注册、发现、访问控制，并可通过网关调用 | 参考身份与路由管理；企业治理部署对个人版可能偏重 |

## 活跃度与许可证快照

下表的推送时间采用 GitHub API 的 UTC 时间；星标仅表示关注度。六个仓库查询时均未归档。

| 项目 | Stars | 最近推送日期（UTC） | GitHub 识别的许可证 |
| --- | ---: | --- | --- |
| A2A | 25,696 | 2026-09-04 | Apache-2.0 |
| Agent Network Protocol | 1,421 | 2026-09-06 | Apache-2.0 |
| EnvoyMesh | 825 | 2026-09-08 | 未识别，需进一步核对 |
| Tacit | 3 | 2026-03-03 | MIT |
| Society Protocol | 8 | 2026-07-11 | MIT |
| MCP Gateway & Registry | 902 | 2026-09-09 | Apache-2.0 |

EnvoyMesh README 标注 MIT，但本次 GitHub API 的 license 字段为空，根目录列表也未见 LICENSE 文件，因此不能仅凭徽章确定可复制哪些代码。其他项目正式复用时同样应检查具体文件的许可证和依赖条款。

## 最值得进一步看的内容

EnvoyMesh 的 README 已有名为 Agent Bridge 的模块：网络层处理签名与策略，Agent 通过 HTTP 接收请求，Agent 不直接持有身份密钥。这与我们设想的适配器边界非常接近。名称“Agent Bridge”属于常见描述，本次没有做商标或唯一性检索。

A2A 值得优先做两个独立 Agent 的互通试验。协议规范已覆盖任务协作，但主人是否授权、确认是否过期、外部操作是否真的成功，需要我们另外建模。

Tacit 值得参考双方同意后再逐步披露信息的交互方式。其防欺诈、不可克隆等宣传不能仅凭 README 认定为已解决的问题。

ANP 的文档区分正式规范和未发布草案，采用时应锁定具体版本，不把草案中的能力当成 SDK 已实现功能。

## 可复核版本

- [A2A 本次查询版本](https://github.com/a2aproject/A2A/tree/98853be376c88df25e1704771cd3ea9ef8823a96)
- [ANP 本次查询版本](https://github.com/agent-network-protocol/AgentNetworkProtocol/tree/77caaaf746a6c23cd8368e68a4ae23793b270dd6)
- [EnvoyMesh 本次查询版本](https://github.com/allenpeng0705/EnvoyMesh/tree/b979b0f65d6cc801a8d7d115a2ac25f4f88dda62)
- [Tacit 本次查询版本](https://github.com/tacitprotocol/tacit/tree/e03773e62ba786baa797cc5cf98f08da093b7bbd)

## 建议路线

先借鉴 EnvoyMesh 和 Tacit 的实际产品方向，用 A2A 验证通信基础，再用约时间场景验证是否显著减少人工往返。更换模型、接入日历、开放陌生人发现、端到端加密和联邦网络，都应依据验证结果逐步决定。

本次未安装、执行或复制上述项目；尚未确认其性能、跨平台运行、真实安全性或全部兼容性。
