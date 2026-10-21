# Wright 的 Windows 接入说明

[简体中文](WINDOWS_ONBOARDING.md) | [English](en/WINDOWS_ONBOARDING.md)

更新：2026-10-21。范围：虚构 `demo-export` 任务的信息交接和两轮回复。AB 连接器接收消息后，调用你本机已登录的 Codex CLI；它使用独立后台会话，不自动继承当前桌面对话。真实 Windows 运行尚待你这台电脑验收。

可选：先安装 [Agent Bridge Skill](SKILL_USAGE.md)，让本机 Codex 按此流程协助操作。技能不包含 AB 运行程序，也不代表已经配对。

## 直接交给 Wright 的 Codex 执行

> 请从 GitHub 仓库 https://github.com/jizw0704-source/agent-bridge 获取 AB 代码，并使用你本机的 Skill 安装器，从同一仓库安装 `skills/agent-bridge`。先检查已有目录、技能和绑定，不覆盖现有工作或凭证。读取仓库 AGENTS.md、本说明、docs/SKILL_USAGE.md 和技能 SKILL.md，完成 Windows 接入准备：Node.js 22+、Codex 本人登录状态、真实 codex.exe 路径、源码语法检查，以及仅含本机路径的私人绑定。缺少工具按本机权限与公司规则处理，不绕过策略。将所用提交编号记录下来，技能与运行源码使用同一版本。没有 Skill 安装器或 Python 时，从取得的源码复制技能目录。准备完成后给我一份结果摘要，等待 Bertil 提供新的私有 invite.json 和当前 Mac 身份代码；不要自行加入、确认身份、发消息或修改真实项目。

## 0. 从 GitHub 获取代码与安装 Skill

无需 Bertil 发送代码包。先检查本机已有 AB 目录；没有时，选择一个不存在的新目录克隆：

```powershell
git clone https://github.com/jizw0704-source/agent-bridge.git "$env:USERPROFILE\Downloads\agent-bridge"
Set-Location "$env:USERPROFILE\Downloads\agent-bridge"
$AbApp = (Get-Location).Path
$AbRevision = (git rev-parse HEAD).Trim()
```

示例目录已存在时不要直接重跑或重置。没有 Git 时从仓库的 Code → Download ZIP 获取源码并进入包含 package.json 的实际目录；记录下载版本，安装 Skill 时优先从这份源码复制，保证一致。

**有 Skill 安装器时优先从 GitHub 安装。** 让 Codex 读取其已安装的 skill-installer/SKILL.md 并定位脚本。下列命令仅在脚本存在、Python 3 可用且目标技能不存在时执行：

```powershell
$AbCodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$AbSkillHome = Join-Path $AbCodexHome 'skills'
$AbSkillTarget = Join-Path $AbSkillHome 'agent-bridge'
$AbInstaller = Join-Path $AbSkillHome '.system\skill-installer\scripts\install-skill-from-github.py'
# 先检查 Test-Path $AbInstaller、Python 版本及 $AbSkillTarget 是否已存在。
python "$AbInstaller" --repo jizw0704-source/agent-bridge --path skills/agent-bridge --ref "$AbRevision" --dest "$AbSkillHome"
```

`python` 仅为已确认可用的 Python 3 入口示例；若只有 `py -3`，使用该入口。不要为了此命令假定 Python 已安装。安装器遇到同名目录会停止；先比较内容，不删除重装或直接覆盖。

**没有安装器／Python 时：** 从刚取得的 GitHub 源码复制即可，无需另装 Python：

```powershell
New-Item -ItemType Directory -Force $AbSkillHome | Out-Null
if (Test-Path -LiteralPath $AbSkillTarget) {
  Write-Host '已有 agent-bridge Skill，请先比较内容。'
} else {
  Copy-Item -LiteralPath (Join-Path $AbApp 'skills\agent-bridge') -Destination $AbSkillTarget -Recurse
}
Test-Path -LiteralPath (Join-Path $AbSkillTarget 'SKILL.md')
```

正确结构是 `skills\agent-bridge\SKILL.md`。下一轮对话尝试 `$agent-bridge 检查我的接入准备情况`；未被发现时重开 Codex，或让当前 Codex 直接读取已安装 SKILL.md。Skill 安装不等于运行程序或配对完成。

**建立仅含路径的绑定。** 在源码目录确认 `$AbApp` 后执行；已有绑定先读取、核对，不覆盖：

```powershell
$AbPeer = Join-Path $env:LOCALAPPDATA 'AgentBridge\wright-peer'
$AbBinding = Join-Path $env:LOCALAPPDATA 'AgentBridge\skill-binding.json'
New-Item -ItemType Directory -Force (Split-Path $AbBinding) | Out-Null
if (Test-Path -LiteralPath $AbBinding) {
  Write-Host '已有绑定，请先读取并核对。'
} else {
  @{ app_dir = $AbApp; peer_dir = $AbPeer } | ConvertTo-Json |
    Set-Content -LiteralPath $AbBinding -Encoding utf8
}
```

完成下方环境检查后，运行 `node (Join-Path $AbSkillTarget 'scripts\ab-status.mjs') --offline`。尚未加入时没有 peer 配置是正常的。接入前请向 Bertil 报告源码提交、技能路径、Node／Codex 版本、真实 exe 核查结果、绑定和端口准备情况；不附凭证或整包日志。

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
