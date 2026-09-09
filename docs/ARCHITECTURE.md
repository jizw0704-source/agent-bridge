# 架构与通信约定草案

日期：2026-09-09。本文是设计建议，尚未实现。

## 组成

主人 A → 本地授权规则与 Agent A 适配器 ↔ Bridge 协作服务 ↔ Agent B 适配器与本地授权规则 ← 主人 B。

每个适配器负责接收结构化请求、调用所属 Agent、过滤允许分享的信息，再返回结构化结果。模型可辅助理解需求；权限和状态转换由确定性程序检查。

Bridge 第一版建议采用可自托管的单服务，负责联系人登记、任务记录和消息投递。P2P（Peer-to-Peer，点对点通信）和跨服务联邦留待需求明确后评估。

初版服务可看到被授权传递的消息内容，这不等于端到端加密。若后续加入端到端加密，服务端的内容过滤与审计边界也需要重新设计。

## 协议分工

| 范围 | 建议 |
| --- | --- |
| Agent 能力描述与远程任务通信 | 优先验证 A2A 及其 SDK |
| 主人身份、联系人关系、授权范围 | Bridge 应用层定义 |
| 协商、双方确认、执行结果 | Bridge 应用层状态机 |
| 单个 Agent 查询日历等工具 | 使用已有工具接口，必要时采用 MCP |

MCP（Model Context Protocol，模型上下文协议）可用于工具接入；它本身不完成双方主人的授权协商。A2A 传输成功也不代表业务已被双方确认。

## 应用级消息字段建议

这些字段是 Bridge 草案，不是已发布的 A2A 格式。实现前需对照选定版本，明确映射至协议的消息、任务及结构化数据部分。

| 字段 | 含义 |
| --- | --- |
| message_id / task_id | 消息去重标识与协商任务标识 |
| sender_agent / recipient_agent | 发件与收件 Agent，必须与认证主体匹配 |
| intent | 请求、提议、确认、拒绝、取消或执行结果 |
| proposal_version | 方案版本；确认必须绑定同一版本与内容 |
| constraints | 时间范围、时区、时长等结构化要求 |
| permitted_disclosure | 本次任务允许共享的信息范围 |
| expires_at | 请求或方案失效时间 |
| reply_to | 关联前序消息，限制无关回复和循环 |

收到消息时，将声明的权限与本地保存的授权取交集，不能因为对方声称有权限就放行。

## 业务状态

REQUESTED → NEGOTIATING → AWAITING_APPROVAL → APPROVED → EXECUTING → COMPLETED。

根据阶段允许转入 DECLINED、CANCELLED、EXPIRED 或 FAILED。重复消息不得使状态倒退。任意方案变化应回到待确认阶段，并清除旧方案的确认记录。

执行服务在提交外部操作前复查双方确认、授权是否撤销、方案是否过期。外部写入使用幂等标识，并保存可核查的执行回执。

## 接入顺序与技术建议

先用固定响应的模拟 Agent 跑通状态，再接入两个不同实现的 Agent，最后接入真实工具。

如采用 JavaScript/TypeScript，建议 pnpm 管理依赖；先比较 A2A JS SDK 与 Python SDK 的最小互通样例再锁定栈。当前没有安装依赖，没有运行服务，也没有访问任何人的真实数据。

参考：[A2A 官方仓库](https://github.com/a2aproject/A2A)、[A2A 规范](https://a2a-protocol.org/latest/specification/)、[A2A JS SDK](https://github.com/a2aproject/a2a-js)、[A2A Python SDK](https://github.com/a2aproject/a2a-python)。
