# Mac／Wright Windows 双任务实际验收

[简体中文](WRIGHT_ACCEPTANCE.md) | [English](en/WRIGHT_ACCEPTANCE.md)

验收日期：2026-10-23。Mac 独立复核时间：11:26，北京时间。运行代码：`e2434f1d566c359845eaa9ffda381c14e277d71a`。

## 结论与范围

真实 Mac、Wright Windows Codex 和公司内网 HTTPS 中转已完成长期联系人配对、两个独立任务的双向两轮通信，以及归档一个任务后另一任务继续双向通信的验收。测试仅使用虚构 `demo-export` 信息，不代表真实应用导出功能、项目代码交接或生产运行已经验收。

| 验证项 | 实际结果 |
| --- | --- |
| 长期联系人 | 双方通过已知渠道核对身份并确认；ready=true，expires_at=null |
| 独立任务 | A：pilot-cancel-001；B：pilot-format-001；任务和回复归属均匹配 |
| 两轮双向通信 | 两任务分别完成 Mac 主动及 Windows 主动请求，各有回复和接收记录 |
| Mac 会话隔离与续接 | A、B 的 thread ID 不同；各任务第二轮沿用自己的原 ID，由本地 thread.started、turn.completed 和状态记录核实 |
| A 归档 | 状态 archived，8 条历史消息保留 |
| 归档后拒绝新消息 | 客户端拒绝；真实服务器返回 409: Task is archived；A 消息数保持 8 |
| 归档后 B 正向 | 新的 Mac→Windows→Mac 往返完成，原标记及本轮标记正确 |
| 归档后 B 反向 | Windows 新请求为 replied；匹配的 Mac 回复为 received，Windows 已确认接收 |
| 最终队列 | Mac 无待发草稿／未发送消息；服务器无待处理请求／未接收回复 |
| 最终关系状态 | A archived、B active，长期联系人仍 ready=true |

## 最后一轮的独立核验

Wright 于 11:23:44 报告反向测试完成。Mac 随后按请求与回复 ID 在服务器逐项核对：请求来自 Windows、属于 B，reply_to 精确匹配，回复已收到。请求没有提供原任务标记；Mac 回复从 B 的上下文回忆正确标记，复述本轮探针并概述 CSV 未决事项。本地模型事件确认本轮继续使用 B 原 thread ID，且 turn.completed。

本轮 Windows 只发送请求并接收回复，不产生新的 Windows 模型调用。Windows 报告其模型完成数前后均为 5；不能将收取回复称为 Windows 模型续接。Windows 本地会话 ID、收件器及草稿状态来自对端报告，Mac 未直接读取 Windows 磁盘。

## 证据与边界

完整请求／回复 ID、thread ID、时间及队列证据仅保存在双方私有验收目录；公开文档不发布身份、凭证、配置、网络地址或整包日志。Mac 私有证据包含 mac-round2-evidence.json、archive-rejection-evidence.json、archive-and-b-evidence.json、final-reverse-evidence.json。

早期部署文档中的“Windows 待验收”是当时状态；本记录更新真实双端通信结论。尚未覆盖长期稳定性、断网恢复、证书续期、真实工作权限、真实项目执行或业务结果验收；联系人长期保留不代表服务永不中断。B 保持 active，未重新配对或修改真实项目。
