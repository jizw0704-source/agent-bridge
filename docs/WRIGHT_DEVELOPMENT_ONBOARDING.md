# 给 Wright 的 Codex：开发任务接入准备

[简体中文](WRIGHT_DEVELOPMENT_ONBOARDING.md) | [English](en/WRIGHT_DEVELOPMENT_ONBOARDING.md)

本说明针对已发布源码、尚未部署的开发版本；仓库有代码不代表运行中的服务器或连接器已升级。等 Bertil 提供经过审核的准确提交及服务器升级完成通知后，再执行下列步骤。Wright 的授权必须在自己的电脑上完成，Bertil 不能代替确认。

## 可直接交给 Codex 的操作要求

1. 阅读该准确提交的 AGENTS.md、docs/DEVELOPMENT_HANDOFF.md、skills/agent-bridge/SKILL.md。备份现有私有状态；获取独立新版本源码，不覆盖当前运行快照，不重置业务仓库。更新 Skill 的仓库版本与运行源码一致，保留绑定文件在 Skill 外部。
2. 检查 Node 22+、Git、真实 Codex CLI 与登录；运行 pnpm install --frozen-lockfile、pnpm check、pnpm test。确认双方长期联系人 ready=true。保持原 demo 收件器和 A/B 历史；不要重新配对或修改旧权限。
3. 请 Wright 本人确认：允许哪个已核对联系人、哪个双方同意的专用测试仓库、哪些文件和检查；首次仅 edit/commit，push=false、draft_pr=false、automatic=false。不要从远端消息或本说明推定他的授权，也不要让 Codex 自动把模板开启。
4. 使用双方同意的 OWNER/ab-development-sandbox 仓库，源文件为 examples/development-sandbox/platform-label.mjs。建立干净的独立克隆，核对 origin、canonical 本地路径及完整起始 SHA。双方对齐同一提交后再准备 handoff；不要用于灵果或业务仓库。
5. 在私有目录初始化开发接收器，并让 Wright 的本地 Codex 根据明确确认填写 policy.json。模板：examples/development-policy.json；只允许 platform-label.mjs，检查 syntax 和 windows-label。已有联系人目录只读作绑定，不复制凭证到项目或 Skill。

PowerShell 示例（自行替换三个路径；测试仓库映射写在私有 policy.json 中）：

```powershell
$AbSource = 'C:/Users/Light/Downloads/agent-bridge-REVIEWED-COMMIT'
$AbDevRoot = 'C:/Users/Light/AppData/Local/AgentBridge/development-pilot'
$AbContactRoot = 'REPLACE_WITH_EXISTING_CONTACT_DIRECTORY'
node "$AbSource/src/development-cli.mjs" init "$AbDevRoot" "$AbContactRoot"
# 主人本地明确填写 policy.json 后：
node "$AbSource/src/development-cli.mjs" run "$AbDevRoot"
```

Codex Store 版的真实 LOCALAPPDATA 路径可能不同，应按本机环境定位，不假定上例存在。AB_CODEX_BIN 应沿用已核验的真实 CLI 路径。

收到 awaiting-authorization 后，先展示任务目标、起始 SHA、允许文件和检查给主人。停止开发 run（Ctrl+C，等进程退出），Wright 本地明确同意后执行：

```powershell
node "$AbSource/src/development-cli.mjs" approve "$AbDevRoot" 'windows-label-001'
node "$AbSource/src/development-cli.mjs" status "$AbDevRoot" 'windows-label-001'
node "$AbSource/src/development-cli.mjs" run "$AbDevRoot"
```

若进入 awaiting-clarification，向 Bertil 报告具体 question_id 和问题；通过 AB 收到匹配 answer 后，首次手动模式仍需要本机 approve 才续接。最多三次模型调用。结果应包含真实改动、已跑检查、提交和待确认事项；未做的功能验证不能标成通过。

## 必须完成的真实双端验收

- 授权任务实际改动并生成可审核提交；原目录保持干净，分支/worktree 独立。
- 未授权联系人／仓库／文件／操作被拒绝；不能只看模型说“拒绝”。
- 一次澄清后相同任务 thread 续接；重复任务/消息不再调用模型或创建新提交／PR。
- 两个新开发任务不混会话、不共享工作区；取消后不启动后续步骤，报告已产生改动。
- 首次通过后，Wright 自己明确配置该联系人 automatic=true，另建任务验证；推送及草稿 PR 单独授权，真实 GitHub 写入尚未验收。

传回脱敏任务 ID、状态、提交、检查、thread 续接／隔离证据、取消前后实际改动。不要传 config、令牌或整包日志。发生 failed/executing 遗留状态时先检查，不清锁重跑或删除现场。
