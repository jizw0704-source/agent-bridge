# Wright：升级到长期联系人与独立任务

[简体中文](WRIGHT_UPGRADE.md) | [English](en/WRIGHT_UPGRADE.md)

日期：2026-10-23。这次升级中转、连接器和 Skill，保留观察室开发分支。只验证虚构 demo-export 任务；长期联系人不扩大真实项目权限。

## 给 Windows Codex 的执行说明

请获取 Agent Bridge 的 main 新版并读取 AGENTS.md、docs/CONTACTS_TASKS.md 和本说明。先保存当前版本、私有运行目录路径和本机设置；不要重置观察室分支，不覆盖旧 peer 状态或凭证。优先在新的源码目录使用已发布 v0.4.0 代码，不在正在运行的目录直接覆盖。记录 Bertil 提供的准确提交号并与之对齐。

将新源码的 skills/agent-bridge 更新到实际 CODEX_HOME/skills/agent-bridge，先备份已安装技能并检查差异，保留本机自定义。Skill 安装不会升级运行中的连接器。

确认 Node.js 22+、本人 Codex 登录和 AB_CODEX_BIN 的真实 codex.exe。原有前台收件器用旧源码的 peer-cli stop 正常停止；保留目录及记录。本次不撤销旧联系、不 close 旧房间。

创建新的本地联系人目录（必须为空），例如下面的路径；如已存在先检查，不能覆盖：

```powershell
$AbContact = Join-Path $env:LOCALAPPDATA 'AgentBridge\contacts\bertil-v040'
```

完成准备后告诉 Bertil，再接收新的 invite.json。不得复用旧房间邀请。新邀请仍十分钟有效，长期关系不自动到期。

```powershell
node src/contact-cli.mjs join "$AbContact" "$env:USERPROFILE\Downloads\invite.json"
node src/contact-cli.mjs status "$AbContact"
node src/contact-cli.mjs confirm "$AbContact" VERIFIED_MAC_IDENTITY
```

将 VERIFIED_MAC_IDENTITY 换成 Wright 本人通过原联系渠道核对过的代码，把 Windows identity 告诉 Bertil，让他独立确认。不能代替两位主人自动核对。确认结果应为 mode=contact、lifetime=persistent、expires_at=null、ready=true。

把私人 skill-binding.json 的 app_dir 指向新版源码，peer_dir 指向新联系人；先备份旧绑定再更新，只保存绝对路径。保持旧配置不变即可回看历史，不能把旧 token 粘贴进新配置。

在已设置 AB_CODEX_BIN 的终端运行：

```powershell
node src/contact-cli.mjs run "$AbContact"
```

## 两个独立任务验收

双方确认后，由 Bertil 创建两个任务：`pilot-cancel-001`（虚构取消保存）和 `pilot-format-001`（虚构导出格式）。双方可以使用 tasks 查看，task-history 查看指定任务。发送时必须指定任务 ID：

```powershell
node src/contact-cli.mjs tasks "$AbContact"
node src/contact-cli.mjs send "$AbContact" pilot-cancel-001 "$env:TEMP\ab-cancel.txt"
node src/contact-cli.mjs send "$AbContact" pilot-format-001 "$env:TEMP\ab-format.txt"
node src/contact-cli.mjs task-history "$AbContact" pilot-cancel-001
```

以上文件由本机 Codex 根据主人批准的虚构问题以 UTF-8 写入，不能发送真实项目内容。不要在同一 draft 尚未处理时连续排第二条；send 只表示本地排队。

建议验收顺序：任务 A 记住标记“松果-A23”，任务 B 记住“海盐-B71”；再回到 A，确认只回忆 A 的标记。随后从 Windows 发问，确认 Mac 也能在正确任务回答。记录双方每个任务的会话 ID 是否不同，同一任务第二轮是否续接；不要把模型自报独立当成程序隔离证据。回复已被收到且无待处理消息后，归档 A，确认 A 新消息被拒绝而 B 仍可交流。归档不是验收业务完成。

```powershell
node src/contact-cli.mjs task-archive "$AbContact" pilot-cancel-001
```

观察室分组可用消息 collaboration_id，任务范围 task_id 仍是 demo-export；接口见 docs/CONTACTS_TASKS.md。观察室是否已经正确分组需单独验证，本升级不改其界面。

## 回报结果

报告准确提交号、Skill 路径、身份互认状态、两个任务的双向请求／回复、会话隔离、归档结果及失败项。不要发送 config.json、邀请正文、账号文件或整包日志。stop 只暂停收件；disconnect 会撤销双方长期联系，不用于普通退出。证书有效期独立于联系人期限，联调前检查。
