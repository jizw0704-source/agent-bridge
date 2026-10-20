# Mac Codex 已接入服务器：验证与操作

[简体中文](MAC_SERVER_CONNECTOR.md) | [English](en/MAC_SERVER_CONNECTOR.md)

更新：2026-10-20。Mac 专用后台连接器已接入公司内网中转，使用本机已登录的 Codex CLI。通过 macOS LaunchAgent 实际完成两轮模拟 Wright 请求的真实 Codex 回复：同一会话延续、经服务器传输、无工具动作、演示目录不变、空闲无回复循环。测试房间已关闭。

正式配对使用独立的新房间和独立本地状态，目前处于 `waiting-for-pairing`。未联系真实 Wright，Windows 尚未联机验收；模拟验证不能证明真实双方已连接。连接器不是桌面聊天插件，不自动继承桌面当前对话。

## 本机布局与操作

私有目录：`~/.local/share/agent-bridge/mac-connector/`。其中 `app/src` 为运行代码快照，`mac-peer` 为正式身份与状态，`validation-peer` 为模拟验证记录，`service-logs` 为服务日志，`connection-result.json` 为不含令牌的验证摘要。凭证和日志不进入源码仓库。

LaunchAgent 名称为 `com.agentbridge.mac-peer`，本次已实际启动。`RunAtLoad=true`，配置为用户登录时启动；真实注销／重新登录尚未测试。没有启用异常退出自动重启。睡眠期间不会处理消息；程序运行时网络恢复可继续重试。

本机快捷入口：

```sh
~/.local/share/agent-bridge/mac-connector/ab status
~/.local/share/agent-bridge/mac-connector/ab invite
~/.local/share/agent-bridge/mac-connector/ab confirm WINDOWS_IDENTITY
~/.local/share/agent-bridge/mac-connector/ab send /absolute/path/to/fictional-message.txt
~/.local/share/agent-bridge/mac-connector/ab stop
~/.local/share/agent-bridge/mac-connector/ab start
```

`invite` 在对方尚未加入时刷新邀请，保存于 `mac-peer/invite.json`，不会打印令牌；旧邀请立即失效。只私下分享这个邀请文件，不分享 `config.json`、整个运行目录或 Codex 登录文件。双方通过已知渠道核对身份代码后，各自确认。状态 `ready=true` 后才开始交接处理。

`stop` 等当前一轮结束；`start` 启动已注册的后台服务。失败任务和残留锁需要检查，不自动重放。`close` 会撤销整个房间，不作为日常暂停。

当前房间有效至 **2026-10-21 10:51 UTC（北京时间 18:51）**；刷新十分钟邀请不会延长房间的一天寿命。到期需新房间和新的配对状态。服务器试验证书有效至 2026-10-27 10:44 UTC，证书更新时双方指纹也需更新。

## 验收状态

- 自动检查：Mac 与 Debian 各 16 项测试通过，包括邀请刷新权限／旧邀请失效／房间期限不延长，以及双方确认前不调用模型。
- 本次真实运行：Mac LaunchAgent 经服务器接收两条模拟消息，调用 Codex 两次，延续同一会话并自动回复。
- 正式房间：只有 Mac 身份，尚无真实对端消息；等待配对期间不调用模型。
- 后续：向 Wright 提供[Windows 接入说明](WINDOWS_ONBOARDING.md)及代码包；准备好后发新邀请，双方核对身份，完成真实双向验证。

后台运行代码为独立快照，后续仓库代码修改不会自动更新正在运行的服务。
