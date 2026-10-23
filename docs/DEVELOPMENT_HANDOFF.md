# 真实开发任务交接最小版本

[简体中文](DEVELOPMENT_HANDOFF.md) | [English](en/DEVELOPMENT_HANDOFF.md)

部署更新：服务器与 Mac 已部署并通过检查；Wright 本机开发执行仍待授权。见 [部署与首任务准备](DEVELOPMENT_DEPLOYMENT.md)。以下未部署描述为源码发布时的历史状态。

2026-10-23：已完成本地实现与审核，源码发布，尚未部署；当前公司服务器和 Mac 常驻连接器仍运行旧通信版本。此前[真实 Mac／Windows 通信验收](WRIGHT_ACCEPTANCE.md)已通过；新开发权限的真实双端验收仍待 Wright 本机授权及双方测试仓库确认。

## 最小流程

Bertil 的本地 Codex 把需求整理为 handoff JSON，通过明确的 development-v1 任务发送。Wright 的独立开发收件器读取本机 policy.json：联系人身份＋关系 ID、仓库映射、文件清单、检查、编辑／提交／推送／草稿 PR 权限必须匹配。默认等待本机 approve；只有该联系人明确配置 automatic=true 才自动执行。远端不能更新 policy.json，也不能用“已经授权”的文字代替许可。

Codex 仅收到授权文件的文本快照，禁用工具，返回完整文件替换方案或一个澄清问题。AB 程序检查路径和操作，创建 ab/dev-* 独立分支及 worktree，写文件、检查并提交。每任务单独模型上下文、工作区与状态。最多三次模型调用，问题与答复通过 question_id 精确匹配，答复本身不扩大权限。

状态：awaiting-authorization（待授权）、awaiting-clarification（待澄清）、executing（执行中）、awaiting-review（待审核）、rejected、failed、cancelled。结果包括文件改动、检查是否通过、提交、分支、可选草稿 PR、未完成项和主人决策。推送或建 PR 发生异常时保留原状态，不自动重新执行；需核对远端实际结果。

## 边界由程序执行

- demo-export 不变；旧收件器不会处理 development-v1。任务 scope 与消息 scope 必须匹配。
- 仓库标识 OWNER/REPO 只映射接收端本机 canonical path；交接没有本机绝对路径字段。资料引用只作文本，不自动下载或访问。
- 起始版本必须为已在本机存在的完整 40 位提交。源工作区必须干净；有用户改动时拒绝，保留改动，改用主人准备的干净克隆，不 stash/reset。
- 只修改授权清单中的已有普通 UTF-8 文本文件；拒绝 ..、绝对路径、符号链接、.git、目录和二进制。每文件最多 24 KB，最多 20 文件。模型无法选择执行命令或新增工具权限。
- 检查只支持 node-syntax（Node --check）、json（解析）、contains（固定文本断言）。不执行 npm/pnpm 脚本、任意 shell、包安装或完整构建。没有执行任意第三方代码的通用沙箱；扩展这类检查须先实现可靠进程隔离。远端无法指定命令。
- 每步比对授权和 Git 配置，模型等待期间工作区出现人工变更则停止并保留；提交只包含本任务文件。本机 status/cancel 离线可用。Git 禁用 hooks、fsmonitor、全局配置和签名；拒绝仓库内自定义 filter/命令/include 配置。模型使用隔离空目录、read-only、禁用 shell/MCP/网页等工具。不是赋予 Codex 任意工作区写权限。
- push、draft_pr 默认 false；开启后通过 gh 本机登录取得临时、按目标 URL 限定的推送凭据，不写入仓库或命令参数；禁用重定向及自定义推送路由，仅支持映射一致的 HTTPS GitHub origin、专用分支及显式本机 PR base。不会合并、发布、部署、删项目，也不会读取未列出的资料。
- 同一个任务 ID＋交接内容重复投递返回原状态；内容不同报冲突。消息及报告使用稳定 ID。执行前持久化 executing；崩溃后不自动重试，先人工检查。PR 创建中断也不自动重建。
- 取消为持久标记，每个步骤开始前检查；不会强行回滚或终止已开始的 Git／模型步骤。接收器在模型处理期间每 500 ms 尝试收取同任务取消；网络中断时远端取消可能延迟，本机 cancel 可直接写标记。结果保留已经产生的文件、分支、提交或错误。不启动后续步骤。

## 命令与本机授权

源码中的新入口（没有新增生产依赖）：

```sh
node src/development-cli.mjs init PRIVATE_DEV_ROOT EXISTING_CONTACT_ROOT
node src/development-cli.mjs send PRIVATE_DEV_ROOT TASK_ID PRIVATE_HANDOFF_JSON
node src/development-cli.mjs poll PRIVATE_DEV_ROOT
node src/development-cli.mjs run PRIVATE_DEV_ROOT
node src/development-cli.mjs status PRIVATE_DEV_ROOT TASK_ID
node src/development-cli.mjs approve PRIVATE_DEV_ROOT TASK_ID
node src/development-cli.mjs report PRIVATE_DEV_ROOT TASK_ID
node src/development-cli.mjs cancel PRIVATE_DEV_ROOT TASK_ID
node src/development-cli.mjs stop PRIVATE_DEV_ROOT
```

init 写空 policy（不授权任何人）。主人参考 [policy 模板](../examples/development-policy.json) 填写私有目录里的 policy.json，不能把模板原样当授权。Windows 路径用 JSON 转义或正斜线；仓库路径必须 canonical。approve 是本机实际执行入口，不由远端消息触发。开发 run/poll/approve 不要并发运行；执行手动 approve 前先暂停开发收件器，完成后重新启动。原 demo 收件器可继续运行；不要启动两份开发收件器。transport/engine 锁不自动删除，遗留锁需先确认原进程已停止。

开发回复及报告存入 PRIVATE_DEV_ROOT/transport.json，不触发模型自动回复。手动 approve 会发出结构化结果通知；发送遇到网络错误／锁冲突，先看本地 status 和 transport.json，再用 report 重发同状态（稳定 ID），不要再执行任务。run 收取到待授权状态后无需模型调用。

## 澄清与取消

本地 Codex 读到 awaiting-clarification 后，给主人整理问题，获准后发送：

```json
{"type":"answer","id":"windows-label-001","question_id":"q1","answer":"Use Windows for win32; keep all other labels unchanged."}
```

手动模式需要 Wright 再 approve；automatic 模式在校验本机授权后续接原 thread。远端取消用 send 发 `{"type":"cancel","id":"windows-label-001"}`；接收方本地可用 cancel，执行退出后用 report 通知。failed/executing/cancelled 不允许靠重复投递重新启动，保留现场，纠正后采用新任务 ID。

## 已验证与待验证

本地自动测试使用真实 Git worktree、实际写文件／检查／提交、局域网协议的 loopback relay，以及注入的模型提案：覆盖本机审批、自动授权、越权联系人／仓库／操作、脏工作区、符号链接、撤销权限、澄清续接、双任务隔离、重复投递、检查失败、取消和中断不重放。它们不是 Windows 验收。

额外实际调用了一次 Mac Codex，在临时仓库将 win32 映射为 Windows；独立分支生成提交，语法与文本检查通过，原源目录未改动。语法／文本检查不等于功能测试。

复现本机测试（最后一项显式调用模型并保留临时目录）：

```sh
pnpm check
pnpm test
git diff --check
node scripts/verify-development.mjs --real-codex
```

无独立 formatter/linter/type-check/build；本轮无 UI 改动。push／草稿 PR 路径已实现，但未真实对 GitHub 写入验证。尚未在 Windows 运行新执行器、未验证跨电脑开发澄清／执行／取消、未验证真实自动授权模式。见 [Wright 操作说明](WRIGHT_DEVELOPMENT_ONBOARDING.md)。

## 后续明确步骤

1. 本地代码审核与修复完成后提交／推送源码；本次源码发布不包含部署。
2. 备份后部署新 relay、新 Mac 和 Windows 源码；不覆盖正在运行快照。新服务器支持 task scope 后才可发开发任务。
3. 双方同意一个专用测试仓库，放入 examples/development-sandbox/platform-label.mjs；确认同一起始提交。不使用灵果或任何业务仓库。
4. Wright 自己配置联系人、仓库与操作许可，先 automatic=false；双方真实发一项小任务，检查独立分支、改动、检查和回报，再测澄清、重复、取消、另一任务隔离。
5. 首轮通过后由 Wright 本地明确改 automatic=true，另建任务验证自动执行。推送和草稿 PR 另行显式开启并验收。

本轮本地检查结果：pnpm check、54/54 自动测试、git diff --check、Skill 结构校验和新增文档链接检查通过。网络报告过长时 report_truncated=true，完整证据仍在接收端私有任务文件。
