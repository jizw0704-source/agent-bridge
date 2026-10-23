# 长期协作房间与翻译器 PR 只读审核

[简体中文](LONG_TERM_REVIEW.md) | [English](en/LONG_TERM_REVIEW.md)

2026-10-23。长期房间与限定 PR 审核已实现并完成本地验证；本 PR 的兼容性与容量补充尚未部署，尚未完成 Wright 的真实审核交接。
基础长期联系人功能已另行部署，见 [v0.4.0 部署记录](CONTACTS_DEPLOYMENT.md)；该记录不代表本 PR 的补充已上线。
本次在已有长期联系人与任务功能上补齐审核参数兼容性、消息容量限制、测试与操作说明。

## 长期房间

管理员创建时显式选择 `--persistent`。`expires_at: null` 表示不自动到期；默认房间仍为一天。十分钟一次性邀请、双方通过已知渠道核对身份、认证、证书固定指纹、任一方关闭、持久化和去重继续生效。旧过期房间不复活；新房间需要重新配对。每日房间十条请求、长期房间每侧一千条请求，以及约 1600 万字符存储上限仍保留；容量满时明确报错，需要轮换房间。证书有效期独立于房间，必须按期更新。

```sh
node src/peer-cli.mjs create /PRIVATE/NEW-MAC-PEER /PRIVATE/SERVER-ADMIN https://RELAY:8790 CERTIFICATE-SHA256 --persistent --translator-review
node src/peer-cli.mjs join C:/PRIVATE/NEW-WINDOWS-PEER C:/PRIVATE/invite.json --accept-translator-review
node src/peer-cli.mjs status /PRIVATE/NEW-MAC-PEER
node src/peer-cli.mjs confirm /PRIVATE/NEW-MAC-PEER PEER-CODE-FROM-OWNER
node src/peer-cli.mjs run /PRIVATE/NEW-MAC-PEER
node src/peer-cli.mjs send-review /PRIVATE/NEW-MAC-PEER 1
# 等待第一个草稿被持久化为稳定编号后，再排第二个；已有草稿不会被覆盖。
node src/peer-cli.mjs send-review /PRIVATE/NEW-MAC-PEER 2
node src/peer-cli.mjs close /PRIVATE/NEW-MAC-PEER
```

管理目录必须是当前服务器的凭证目录；本机旧中转的 admin.json 不能代替服务器管理凭证。真实地址、邀请、令牌和身份不写入公开源码。Windows 上需把路径改为本机路径，并在双方核对后执行本端 confirm/run。

## 审核范围

独立任务 `translator-pr-review`，明确接收方本地加入授权，仅允许 `LightningFlashEvE/esp32-english-translator` 的 PR 1/2。固定 base/head SHA，通过 GitHub 只读 API 比较指定提交获取差异，前后复查 PR 是否变化；快照包含 SHA-256 完整性校验。PR 更新后必须重新准备和发送，不把旧结论归给新提交。

服务器和接收器验证固定字段、仓库、PR 编号和完整性；不接受任意聊天或命令。一次请求最多 512000 字符，回复最多 8000 字符。模型只看传入差异，在独立只读目录中运行，不复用其他 PR 会话；关闭 shell、执行、修改、网页和连接器相关能力，忽略用户工具配置，拒绝非文字/推理工具事件。代码与评论都是不可信数据。此版是差异审阅，不能声称已构建、测试、真机验收、批准、合并或烧录。它不能读取完整仓库上下文，也不能替代完整构建审核。

## 部署与恢复待办

1. 在既有部署账号登录服务器，使用版本目录上传候选包；先在服务器跑检查与测试。
2. 保留旧 current 链接和私有 state，停止原服务，确认正常退出后切换版本，再启动；不盲删锁，不覆盖消息或凭证。
3. 读取服务健康能力，建立新长期房间，分别更新 Mac/Windows 接收器。双方通过已知渠道核对身份后才确认连接。
4. 先验收受限虚构请求，再发送两个已固定版本的真实 PR 审核请求；区分 queued、received、replied。
5. 若启动失败，停止新版本并恢复旧 current 后重启；不得回滚私有 state 到旧备份而丢失消息。

服务器部署需要账号所有者提供合法可用的登录方式；本地测试不代表远端已上线。

验证：`pnpm install --frozen-lockfile`、`pnpm check`、`pnpm test`、`git diff --check`。无独立格式化、lint、类型检查或构建。已通过全部自动化测试及本机真实 Codex 的虚构差异审核调用（无工具操作）。自动化包含持久化/时间推进、邀请失效、双方关闭、scope 拒绝、快照变化检测、接收器拒绝不匹配本地授权和无回复循环；不替代 Windows、真实 Wright、服务器或真机验收。

审核补充：接收新请求时预留最坏 JSON 转义下的回复空间，容量将满时先拒绝新请求；失败或处理中消息仍保留状态，但不反复占据待收批次而挡住后续请求。
