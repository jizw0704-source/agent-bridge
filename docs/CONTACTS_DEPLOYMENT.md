# v0.4.0 部署与双任务预验收

[简体中文](CONTACTS_DEPLOYMENT.md) | [English](en/CONTACTS_DEPLOYMENT.md)

日期：2026-10-23。运行源码提交为 `fec4b25778a04c802363423daaa797283e6a0539`。后续文档／Skill 路由说明的提交不自动改变运行代码。部署到公司中转与 Mac；观察室保持独立服务和开发分支。

## 已完成

- Mac 和 Debian 各 30 项自动测试通过；语法与 Skill 结构校验通过。
- 服务器私有状态和 previous-current 已备份，使用 releases/fec4b25778a0，原子切换 current 后服务 active。支持回退到备份所记录的发布目录；需要先停止服务并保留升级后的新状态，不应盲目覆盖新消息。
- Mac 使用独立发布快照、新联系人目录和已备份的 LaunchAgent 配置；Skill 安装副本已更新。旧 peer 与会话保留，不转换旧凭证。
- Mac 新联系人状态 mode=contact、expires_at=null、等待 Wright 新配对；无正式消息或正式任务。邀请在双方准备好时刷新，不因联系人长期有效而延长邀请。
- 通过真实公司网络的独立模拟联系调用真实 Codex 三次，完成任务 A、任务 B、返回 A。程序核对两个会话 ID 不同，A 回忆自己的标记而非 B；归档 A 后历史保留、新消息被拒绝，B 仍 active。模拟联系已关闭。
- 中转与观察室服务均 active。没有改动观察室代码或替 Wright 发送消息。

## 验收边界

上述模拟角色都运行在 Mac，不是 Wright 的 Windows；没有证明真实 Windows 已完成新版双任务验收。旧版已完成的双方互通不自动证明新版本。当前任务仍限虚构 demo-export，未执行真实项目修复／审批。

## Wright 升级

把 [升级说明](WRIGHT_UPGRADE.md)交给 Wright 的 Codex，使用与上述运行源码一致的提交。新联系使用 contact-cli，而不是旧 peer-cli。确认身份后创建 pilot-cancel-001 和 pilot-format-001，按说明进行两个方向、多任务交替、重启续接和归档验收。观察室按 collaboration_id 展示任务的能力需 Wright 单独验证。

服务器证书仍有效至 2026-10-27 10:44 UTC（北京时间 18:44），没有因长期联系人而自动续期。完整日志、凭证、原始模型输出、邀请与备份仅保存在私有目录，不进入 Git。
