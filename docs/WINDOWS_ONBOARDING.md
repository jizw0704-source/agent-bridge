# Wright 的 Windows 接入说明

[简体中文](WINDOWS_ONBOARDING.md) | [English](en/WINDOWS_ONBOARDING.md)

更新：2026-10-20。范围：虚构 `demo-export` 任务的信息交接和两轮回复。AB 连接器接收消息后，调用你本机已登录的 Codex CLI；它使用独立后台会话，不自动继承当前桌面对话。真实 Windows 运行尚待你这台电脑验收。

可选：先安装 [Agent Bridge Skill](SKILL_USAGE.md)，让本机 Codex 按此流程协助操作。技能不包含 AB 运行程序，也不代表已经配对。

## 你需要收到什么

1. 本仓库当前版本的代码，或 Bertil 提供的对应版本 ZIP；应包含 `src/peer-cli.mjs` 和 `skills/agent-bridge/`。
2. 双方准备好后，单独私下传递的 `invite.json`。它十分钟有效、只能使用一次，不能放进代码包或仓库。
3. Bertil 的 Mac 身份代码，用于双方核对。

不需要服务器登录密码、服务器管理令牌、Bertil 的 Codex 账号或 TLS 私钥。

## 1. 准备本机环境

使用普通 PowerShell，连接可访问公司服务器的网络。检查：

```powershell
node --version
pnpm.cmd --version
codex --version
codex login status
```

需要 Node.js 22 或更新版本、pnpm、已登录的 Codex CLI。已有工具可直接使用；若缺失，从 [Node.js](https://nodejs.org/en/download)、[pnpm](https://pnpm.io/installation) 和 [Codex 官方安装文档](https://learn.chatgpt.com/docs/codex/cli)安装。若 CLI 未登录，在你自己的电脑运行 `codex login` 完成本人登录。不要发送登录文件给他人。

AB 必须能直接调用 Codex 可执行文件。PowerShell 中的 `codex` 能运行，不一定代表 Node 能调用它。如果它是 `.cmd`／`.ps1` 包装器：

```powershell
Get-Command codex -All | Select-Object CommandType, Source
```

在已安装的 Codex 目录中找到真正的 `codex.exe`，将实际路径设置在接下来运行连接器的同一个终端：

```powershell
$env:AB_CODEX_BIN = 'C:\实际安装目录\codex.exe'
& $env:AB_CODEX_BIN --version
& $env:AB_CODEX_BIN login status
```

不要照抄示例路径。如果是 npm 安装，可在 `(npm.cmd root -g)` 返回目录下的 `@openai` 文件夹查找 `codex.exe`；有多个结果时先确认架构和实际版本，不随意选第一个。公司策略或 Codex 沙箱报错时保留错误信息，不通过关闭沙箱或提升为全权限解决。

## 2. 解压并检查 AB

解压到你自己的新文件夹，打开其中含 `package.json` 的目录。例如：

```powershell
Set-Location "$env:USERPROFILE\Downloads\agent-bridge-pilot"
pnpm.cmd install --frozen-lockfile
node scripts/check.mjs
```

实际目录以解压结果为准。当前无第三方运行依赖。自动化测试已在 Mac 与 Debian 通过；部分测试包含 Unix 夹具，不能用 Mac 测试结果代替 Windows 验收。

先测试公司服务器端口。将示例地址替换为 Bertil 给出的实际地址：

```powershell
Test-NetConnection -ComputerName SERVER_LAN_IP -Port 8790
```

`TcpTestSucceeded : True` 只说明端口可达，接下来的 join 才验证 HTTPS 指纹及邀请。此端口不是网页，不需要用浏览器绕过证书警告。

## 3. 加入与双方确认

告诉 Bertil 环境已准备好，再接收新鲜的 `invite.json`，保存在仓库以外，例如下载目录。以下命令在 AB 源码目录执行：

```powershell
$AbPeer = "$env:LOCALAPPDATA\AgentBridge\wright-peer"
node src/peer-cli.mjs join "$AbPeer" "$env:USERPROFILE\Downloads\invite.json"
node src/peer-cli.mjs status "$AbPeer"
```

首次接入目录必须为空；已经成功 join 后不要重复 join。若要重建房间，使用新的独立目录并保留旧记录，不能覆盖旧凭证。

状态输出中：

- `identities.mac`：与 Bertil 私下告知的代码核对。
- `identities.windows`：把这个代码告诉 Bertil，请他在 Mac 确认。
- `ready`：只有双方确认后才会变成 `true`。

核对后，复制实际的 Mac 代码替换下面的占位符：

```powershell
node src/peer-cli.mjs confirm "$AbPeer" ACTUAL_MAC_IDENTITY
node src/peer-cli.mjs status "$AbPeer"
```

只交换 identity 代码，不交换 `config.json` 的 token。不要让 Agent 在未经本人核对的情况下替你确认对端身份。

## 4. 开始持续收件

在已设置 `AB_CODEX_BIN` 的 PowerShell 中：

```powershell
node src/peer-cli.mjs run "$AbPeer"
```

保持这个窗口运行。连接器会自动接收交接，调用你的 Codex，然后把回复传回 Mac。空闲时不调用模型。Windows 本轮先使用前台连接器，尚未配置登录自启动；休眠或退出程序期间不会处理消息。

## 5. 两轮联机验收

保持收件窗口开启，另开 PowerShell，进入相同 AB 目录并重新设置 `$AbPeer`。写入第一条消息并发送：

```powershell
$AbPeer = "$env:LOCALAPPDATA\AgentBridge\wright-peer"
$AbMessage = "$env:TEMP\ab-demo-message.txt"
[System.IO.File]::WriteAllText($AbMessage, '模拟交接：Windows 使用原生保存窗口，两端应该保持哪些导出行为一致？', [System.Text.UTF8Encoding]::new($false))
node src/peer-cli.mjs send "$AbPeer" "$AbMessage"
```

收到 Mac 回复后，再发送第二条：

```powershell
[System.IO.File]::WriteAllText($AbMessage, '继续上一轮：模拟观察是取消后仍留下临时文件。请结合刚才的讨论给出建议和待验证清单。', [System.Text.UTF8Encoding]::new($false))
node src/peer-cli.mjs send "$AbPeer" "$AbMessage"
```

这证明 Mac 能自动处理你发起的两轮请求。随后请 Bertil 从 Mac 发一个模拟问题，验证 **Windows 本机 Codex 也能自动回复**。`send` 成功只表示草稿排队，不代表对方已收到或完成；运行日志和收到的回复才是结果。不要把回复再次自动当成新请求，避免循环。

验收需记录：双向回复成功、同侧第二轮延续上下文、没有真实项目修改、没有未经本人确认的审批。回复保存在 `$AbPeer\received`；模型日志在 `$AbPeer\logs`，这些文件仅供本机检查，不要整包公开上传。

## 6. 暂停和常见问题

```powershell
node src/peer-cli.mjs status "$AbPeer"
node src/peer-cli.mjs stop "$AbPeer"
```

`stop` 等当前一轮完成后退出；再次 `run` 可恢复。Ctrl+C 同样请求正常停止。`close` 会撤销整个双方房间，普通暂停不要用它。

| 现象 | 处理 |
| --- | --- |
| 端口无法连接 | 先确认公司网络可达性 |
| `Invite expired` | 请 Bertil 重新生成邀请，旧邀请随即失效 |
| `Invite already consumed` | 已加入就用 status；若不是你加入，停止并联系 Bertil |
| `ready: false` | 等双方核对并确认 identity |
| `fingerprint mismatch` | 核对服务器证书与新邀请，不关闭 TLS 校验 |
| `ENOENT`／无法启动 Codex | 检查同一终端的 `AB_CODEX_BIN` 是否是真实 exe 路径 |
| 模型失败或 blocked | 检查本机日志；不要重复提交同一任务让模型自动重跑 |
| 锁文件已存在 | 先确认是否还有连接器运行，不盲目删除锁 |
| `Room closed or expired` | 当前试验房间有效期一天，需 Bertil 创建新房间并重新配对 |

邀请刷新不延长房间的一天有效期。试验证书也有固定到期日，具体时间由 Bertil 的部署记录提供。

## 官方依据

- [Codex 非交互执行与会话续接](https://learn.chatgpt.com/docs/developer-commands#codex-exec)
- [Windows 原生 Codex 与沙箱说明](https://learn.chatgpt.com/docs/windows/windows-sandbox)

官方支持能力不代表 AB 已在这台 Windows 上验收；以上清单用于完成实际验证。
