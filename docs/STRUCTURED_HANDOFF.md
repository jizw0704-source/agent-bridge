# 结构化交接 v1

[简体中文](STRUCTURED_HANDOFF.md) | [English](en/STRUCTURED_HANDOFF.md)

2026-10-21：已实现本地发送前校验与排队入口，尚未部署或通过真实双方模型验收。它是 AB 的应用内容格式，不是 A2A 协议或新的网络协议。

## 先解决什么

把反复解释的事项组织成固定字段：同一 case_id 表示同一问题，revision 表示本次报告版本，tested_version／changed_version 表示所测／所改代码版本；这些含义不能混淆。自然语言仍用于表达复现步骤、观察、建议和不确定性。

五类内容：test_report（测试报告）、clarification（澄清问题）、proposal（处理方案）、fix_report（修复报告）、retest_result（复测结果）。每类都包含 summary 和固定 details 字段，最后明确 requested_response。完整必填字段见 src/handoff.mjs，示例见 examples/fictional-test-report.json。未知字段会被拒绝；空问题／步骤／观察会被拒绝。未执行测试须明确写明，不能将模型建议当成证据。

## 使用

在源码目录执行：

```sh
node src/peer-cli.mjs send-structured /absolute/private/peer /absolute/fictional-report.json
```

Windows 使用实际绝对路径并加引号。JSON 文件支持 UTF-8 BOM。校验通过后只创建原有 draft.json；后台收件器负责传送。草稿已存在时拒绝覆盖。成功只代表排队，不代表接收或验收。

结构化 JSON 被编码为已有 body 字符串，外层 id/task_id/kind/reply_to 不变，因此不要求中转或观察室新增字段。仍受 8000 字符上限；references 只表示已知消息／报告引用，不自动获取附件或仓库。当前没有摘要缓存、差量合并、版本顺序检查或跨引用解析，revision 不能自动防止旧版本覆盖。

当前 scope 只允许 fictional，外层仍是 demo-export。fix_report 和 retest_result 都只能表示虚构场景，不能据此执行代码、审批或扩大权限。schema 校验保证字段结构，不保证内容真实或无敏感信息；发送前仍由主人确认披露范围。

旧收件器可以把正文交给模型阅读；自动回复依然可能是中文文字，不保证符合该 schema。本次实现没有改动后台会话或服务器，也没有向 Wright 发送消息。观察室如何展示折叠字段由其开发分支后续选择，不把其 UI 行为称为已验收。

## 下一次验收

先核查有效房间和双方接收器，用虚构报告完成“报告 → 澄清 → 补充 → 结论”，比对问题遗漏、错误理解和人工补充次数。真实模型 token 与耗时需要实际采集；压缩 JSON 的字节数不是模型费用节省证据。再决定是否增加结构化输出校验及引用／差量机制。
