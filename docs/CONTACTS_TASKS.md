# 长期联系人与独立任务

[简体中文](CONTACTS_TASKS.md) | [English](en/CONTACTS_TASKS.md)

2026-10-23 部署更新：已部署到公司服务器与 Mac，并通过双任务真实 Codex 预验收；真实 Wright 新版仍待配对。见 [部署与证据](CONTACTS_DEPLOYMENT.md)。以下“本地实现”记录为部署前基线。

更新：2026-10-23。已实现本地服务、命令行和按任务分开的模型会话；使用自动测试完成验证。尚未部署到公司服务器，尚未验证 Wright／Kaysen 真实新式配对。旧房间与旧连接器继续按原规则工作，不自动迁移或延长。

## 使用关系

联系人是一对经过双方核对的身份，长期保留直至一方主动断开。每个联系人目录是一条独立连接；与 Wright、Kaysen 分别使用不同目录和各自连接器。现在没有统一联系人地址簿或多人群聊。存储仍沿用 rooms，新增 mode=contact；不再以这个容器的短期有效期代表每项协作。mac/windows 暂为旧协议的两个身份槽位，不限制实际操作系统；两个 Mac 也能占用不同槽位，仍需真实验收。

任务具有稳定 ID、标题、独立消息记录、active／archived 状态和独立 Codex 会话。任务归档不会删除联系人，也不代表业务结果已由主人验收。双方确认联系人后，都可创建与归档任务；暂不提供任务级双方审批。归档后历史可查，新消息被拒绝。服务器只允许无待处理请求、无未接收回复时归档；尚未发出的本地草稿仍须双方先检查处理。

邀请仍十分钟有效、单次使用。联系人本身 expires_at=null；TLS 证书仍会到期，凭证仍需私下保管。断开后现有凭证不能再访问该联系；记录保留，不提供删除或自动恢复。新联系需重新配对。

## 接入命令

双方都需新版服务与源码，不要将新版直接覆盖正在运行的快照。以下 ROOT 等为实际私有绝对路径，Windows 路径加引号。管理员只在自己的电脑／服务器使用 ADMIN，不把它给同事。

```sh
node src/contact-cli.mjs create ROOT ADMIN HTTPS_ORIGIN TLS_FINGERPRINT
node src/contact-cli.mjs invite ROOT
node src/contact-cli.mjs join PEER_ROOT INVITE_JSON
node src/contact-cli.mjs status ROOT
node src/contact-cli.mjs confirm ROOT VERIFIED_OTHER_IDENTITY
```

只在对方准备好时刷新／分享邀请，通过双方已知渠道分别核对身份。status 的 ready=true 后才能建任务或交换消息。新版 create/join 会在配置中保存 mode=contact，避免旧连接器误把全部任务当同一会话。旧 peer CLI 仍服务旧房间；新联系统一使用 contact-cli。

## 每次协作

```sh
node src/contact-cli.mjs task-create ROOT cancel-test-001 "虚构取消保存复测"
node src/contact-cli.mjs tasks ROOT
node src/contact-cli.mjs run ROOT
```

run 是持续前台收件器，沿用 AB_CODEX_BIN 所选的本机 Codex。另一个终端发送；任务 ID 在文件路径前：

```sh
node src/contact-cli.mjs send ROOT cancel-test-001 MESSAGE_TXT
node src/contact-cli.mjs send-structured ROOT cancel-test-001 REPORT_JSON
node src/contact-cli.mjs task-history ROOT cancel-test-001
node src/contact-cli.mjs task-archive ROOT cancel-test-001
node src/contact-cli.mjs stop ROOT
node src/contact-cli.mjs disconnect ROOT
```

创建任务使用用户提供的稳定 ID，重复同内容不新建；相同 ID 改标题会报冲突。发送要求明确 active 任务，不会自动套用最近任务。队列仍只有一个待发 draft，不能覆盖。stop 是暂停本机收件，disconnect 是撤销双方整条联系，操作前应明确意图。task-history 只读取本联系指定任务，不会访问别人的联系。

## 格式与兼容性

中转仍使用 /rooms/:id/... 路由；任务 API 为 GET/POST tasks、GET task-history?id=ID、POST archive-task。消息保留 task_id=demo-export 作为权限范围，新增 collaboration_id 作为本次任务标识；两者不能混淆。回复必须对应同一 collaboration_id 的请求。重复消息重发保持幂等，即使任务已归档也不会创建新消息。

联系人接收器保存 threads[collaboration_id]，切换任务不复用另一任务的会话；重启后仍续接对应会话。旧 peer-state.json 的 thread_id 不动，旧记录和凭证保留。多个不同联系不共享模型会话。

新任务暂限 demo-export 虚构信息交流，不会把其他正在开发的 PR 审阅权限扩展到新联系人任务。真实 RAG 报告、真实项目改动需另行明确授权和实现。长期联系不表示无限容量：当前最多 1000 项任务、每侧每任务 1000 请求，容量到达后需维护；尚无自动归档压缩、凭证轮换或磁盘配额管理。

观察室继续能读取原有消息字段，但任务分组需要 Wright 根据 collaboration_id 接入，不能声称已显示或验收。此次不修改观察室代码。

## 验证与上线顺序

自动验证包括：跨天与服务重启持久化、旧短期房间仍到期、联系人之间任务隔离、跨任务回复拒绝、待处理消息阻止归档、归档后历史与去重、模型会话按任务隔离和重启续接、创建／加入／排队／断开命令，以及 Skill 识别 null 到期时间。

下一步先核对双方部署版本并备份私有状态，在独立联系人目录完成新式真实配对与双任务验收，再切换正式联系。旧房间不自动复活、旧权限不自动转移；未做公司服务器升级或真实模型验证前，不视为已上线。
