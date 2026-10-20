# 局域网内的双方 Agent 互通（v0.3.0 试验版）

[简体中文](LAN_PILOT.md) | [English](en/LAN_PILOT.md)

2026-10-20 后续更新：中转已部署至公司 Debian 服务器，Mac 到服务器的真实网络收发已验证。见[服务器部署记录](SERVER_DEPLOYMENT.md)。下文 Mac 托管方式仍可用于本地试验；Wright／Windows 联机仍待验收。

更新：2026-10-20。AB 连接双方已有 Agent；本轮只做虚构导出任务的信息协商。Mac 运行 HTTPS 中转，双方连接器主动收件。不会修改真实项目、写 GitHub、代替本人审批，或把现有桌面对话自动变成接收器。

## 本机验证结果

十四项自动测试通过，包含邀请过期／重复使用、配对确认、鉴权、限定任务、去重、重启、失败不重放、断线后重发缓存回复与 TLS 指纹不匹配拒绝。另用两个独立连接器进程，在同一 Mac 上经 HTTPS 完成双向共四次真实 Codex 回复（每侧两次），各侧会话连续，未调用工具，演示目录未变，空闲未出现回复循环。

初次 Mac 托管试验通过了 LAN 地址健康检查；后续已完成[公司服务器部署](SERVER_DEPLOYMENT.md)及 Mac 经真实网络收发验证。Wright 尚未加入；真实 Windows、对端防火墙和网络访问仍待验收。双方准备好后再生成或刷新限时邀请。

## 准备

两端需要 Node.js 22+、pnpm、可执行的 Codex CLI 和各自完成的本机登录。Mac 中转站另外需要 OpenSSL（用于本机证书）。无需把 Codex 凭证交给对方。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

自动测试目前在 Mac 验证，含 OpenSSL 与 Unix 可执行文件夹具；Windows 先完成安装和 `pnpm check`，其原生运行需单独验收。

Windows 若 `codex` 实际指向 `.cmd` 启动器而无法被 Node 调用，需要把 `AB_CODEX_BIN` 设置为可执行的 Codex `.exe` 绝对路径。此兼容性必须在 Wright 机器上实测，不能用 Mac 上的 Windows 角色模拟结果代替。

## 一、Mac 启动局域网中转

以下使用 `$HOME/.local/share/agent-bridge` 下的独立目录；已有目录不可重新 init。证书有效期七天；每个协作房间有效期一天。

```sh
pnpm relay init "$HOME/.local/share/agent-bridge/lan-relay"
pnpm relay tls "$HOME/.local/share/agent-bridge/lan-relay"
pnpm relay serve "$HOME/.local/share/agent-bridge/lan-relay" 8790 --lan
```

终端打印 Mac 的候选局域网地址和 SHA-256 证书指纹。选择与 Wright 同一网络的地址，如 `https://192.168.1.20:8790`，不是 127.0.0.1。`--lan` 监听所有 IPv4 接口并启用 TLS。仅在可信局域网使用；Wi-Fi 客户端隔离或防火墙可能阻止连接，需在真实两台电脑上检查。首次若 macOS 询问网络访问，应由主人决定是否允许。

保持中转终端运行；Ctrl+C 停止中转。状态保存在本机，重启用同一 serve 命令；异常退出残留的 relay.lock 需确认旧进程已退出再处理，不自动抢占。

## 二、Mac 创建邀请

另开终端。把地址和指纹替换为实际输出；指纹不是密码，可以在命令中使用。

```sh
pnpm peer create "$HOME/.local/share/agent-bridge/mac-peer" "$HOME/.local/share/agent-bridge/lan-relay" https://192.168.1.20:8790 ACTUAL_TLS_SHA256
```

程序仅打印邀请文件位置。对方尚未加入且房间未过期时，可执行 `pnpm peer invite DIRECTORY` 重新生成十分钟邀请，旧邀请立即失效；不会延长房间有效期。私下把 `mac-peer/invite.json` 交给 Wright，十分钟内加入，只能使用一次。不要共享 `config.json`、`admin.json`、TLS 私钥或整个运行目录；它们不是安装包的一部分。对方是否可以转发邀请取决于你们的信任，邀请本身不证明真实身份。

## 三、Wright 在 Windows 加入

解压代码包，进入含 package.json 的目录并安装依赖。PowerShell 示例（替换邀请文件路径）：

```powershell
pnpm peer join "$env:LOCALAPPDATA\AgentBridge\wright-peer" "C:\Users\Wright\Downloads\invite.json"
pnpm peer status "$env:LOCALAPPDATA\AgentBridge\wright-peer"
```

Mac 同样查看状态：

```sh
pnpm peer status "$HOME/.local/share/agent-bridge/mac-peer"
```

状态中有双方的 identity 代码。通过你们已知的沟通渠道互相核对：Mac 确认 windows 代码，Wright 确认 mac 代码。双方分别输入对方代码：

```sh
pnpm peer confirm "$HOME/.local/share/agent-bridge/mac-peer" WINDOWS_IDENTITY
```

```powershell
pnpm peer confirm "$env:LOCALAPPDATA\AgentBridge\wright-peer" MAC_IDENTITY
```

双方确认后 ready 才为 true。单次 bearer 凭证绑定角色；sender 由中转站确定，不能在消息正文里冒充。

## 四、双方运行与发起交接

```sh
pnpm peer run "$HOME/.local/share/agent-bridge/mac-peer"
```

```powershell
pnpm peer run "$env:LOCALAPPDATA\AgentBridge\wright-peer"
```

运行终端保持开启。在自己的 Agent 中让它准备一份 UTF-8 演示消息文件，然后调用 send；本轮只授权虚构任务通信，不读取真实项目。例如文件内容：“请说明 Windows 保存窗口取消时应该如何处理；目前没有执行测试。”

```sh
pnpm peer send "$HOME/.local/share/agent-bridge/mac-peer" /absolute/path/to/demo-message.txt
```

Wright 接收端自动调用 Codex，回复会回到 Mac 连接器并显示。也可从 Windows 发起独立请求：

```powershell
pnpm peer send "$env:LOCALAPPDATA\AgentBridge\wright-peer" "C:\absolute\path\demo-message.txt"
```

send 只写入一份本地草稿，运行中的连接器负责发送。回复不会自动触发再次回复，防止无意义循环；新问题由主人或已获授权的本地 Agent 发起。每侧每房间最多十个请求；同一侧串行处理、同一后台 Codex 会话续接。双方的线程与登录各自独立，不自动继承桌面聊天的全部记忆。

## 五、状态、停止和关闭

`pnpm peer status DIRECTORY` 显示配对与消息进度。运行日志显示收到答复；本地 received 目录保留回复。另开终端调用：

```sh
pnpm peer stop DIRECTORY
pnpm peer close DIRECTORY
```

stop 等当前 Codex 一轮结束后停止本侧收件；run 可恢复。close 会撤销整个协作房间，双方无法继续收发，不删除已经收到的本地记录。空闲不调用模型；电脑睡眠与网络离线期间等待，恢复后继续。未配置开机启动。

## 可靠性与数据边界

- 使用本机自签名 TLS 证书和邀请中的指纹校验，在发送凭证和消息前验证证书；不用关闭全局 TLS 校验。证书变化或过期会拒绝连接。
- 不是端到端加密：中转站能够读取消息正文。运行目录为本机私有数据，应保留在源代码仓库之外，不使用敏感真实内容做本轮试验。
- 请求先持久化再投递；回复使用稳定编号。网络失败后可重传已生成的同一回复，不再次调用模型。
- 未完成或失败的模型任务不自动重放，状态显示阻塞，需人工检查。陈旧进程锁不能盲目删除。
- 通信限定 `demo-export`；没有真实项目读取、代码修改、GitHub 执行、实际 Windows 测试或审批能力。只读提示与沙箱约束，并在事件中检测工具动作；检测不是零读取的系统隔离保证。
- 自动化测试是替代模型调用；`node scripts/verify-pair.mjs` 会额外运行四次真实 Codex，消耗账号用量，在同一 Mac 上用两个进程验证双向 TLS，不证明已连接真实 Windows。

代码包可以交给 Wright；配对凭证必须另外通过私密渠道交付。本机验证通过后，真实局域网可达性和 Windows Codex 调用由双方共同完成验收。
