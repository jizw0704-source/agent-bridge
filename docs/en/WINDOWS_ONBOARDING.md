# Wright's Windows onboarding

[简体中文](../WINDOWS_ONBOARDING.md) | [English](WINDOWS_ONBOARDING.md)

Updated October 21, 2026. Scope: fictional `demo-export` handoffs and two-round replies. AB invokes your locally authenticated Codex CLI in a separate background conversation, without automatically inheriting your current desktop chat. Actual Windows operation remains to be verified on your machine.

Optional: install the [Agent Bridge skill](SKILL_USAGE.md) so local Codex can follow this workflow. The skill does not include the runtime or establish pairing by itself.

## Instructions to give Wright’s Codex

> Fetch AB from https://github.com/jizw0704-source/agent-bridge and use your local Skill Installer to install `skills/agent-bridge` from the same repository. Inspect existing code, skills, and bindings before changing anything; preserve work and credentials. Read AGENTS.md, this guide, docs/en/SKILL_USAGE.md, and the skill SKILL.md. Prepare Windows: Node.js 22+, the person’s own Codex login, the actual codex.exe, source syntax checks, and a private path-only binding. Follow local permissions and company policy for missing tools. Record the commit and use the same revision for code and skill. If the installer or Python is absent, copy the skill from the downloaded source. Report readiness and wait for Bertil’s new private invite.json and current Mac identity. Do not join, confirm identities, send messages, or edit real projects during preparation.

## 0. Get code and install the skill from GitHub

No code archive from Bertil is needed. Inspect any existing checkout first. Otherwise clone into a new, nonexistent directory:

```powershell
git clone https://github.com/jizw0704-source/agent-bridge.git "$env:USERPROFILE\Downloads\agent-bridge"
Set-Location "$env:USERPROFILE\Downloads\agent-bridge"
$AbApp = (Get-Location).Path
$AbRevision = (git rev-parse HEAD).Trim()
```

Do not reset an existing directory. Without Git, use Code → Download ZIP in the repository, enter the actual folder containing package.json, and record its version. Copy the skill from that source to keep versions aligned.

**Prefer the local Skill Installer when available.** Ask Codex to read its installed skill-installer/SKILL.md and locate the script. Execute this only after checking the script, Python 3, and an absent destination:

```powershell
$AbCodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$AbSkillHome = Join-Path $AbCodexHome 'skills'
$AbSkillTarget = Join-Path $AbSkillHome 'agent-bridge'
$AbInstaller = Join-Path $AbSkillHome '.system\skill-installer\scripts\install-skill-from-github.py'
# Check the installer, Python version, and existing target before running.
python "$AbInstaller" --repo jizw0704-source/agent-bridge --path skills/agent-bridge --ref "$AbRevision" --dest "$AbSkillHome"
```

`python` means a verified Python 3 entry point; use `py -3` if that is the available entry point. Do not assume Python exists. The installer refuses an existing destination; compare it rather than deleting or overwriting.

**Without the installer or Python**, copy directly from the GitHub checkout; installing Python is unnecessary:

```powershell
New-Item -ItemType Directory -Force $AbSkillHome | Out-Null
if (Test-Path -LiteralPath $AbSkillTarget) {
  Write-Host 'Existing agent-bridge skill: inspect and compare first.'
} else {
  Copy-Item -LiteralPath (Join-Path $AbApp 'skills\agent-bridge') -Destination $AbSkillTarget -Recurse
}
Test-Path -LiteralPath (Join-Path $AbSkillTarget 'SKILL.md')
```

Expected structure: `skills\agent-bridge\SKILL.md`. Try `$agent-bridge Check my onboarding readiness` on the next turn. Reopen Codex if discovery fails, or explicitly read the installed SKILL.md. Installation does not start a connector or establish pairing.

**Create a private path-only binding.** Verify `$AbApp` first. Read and inspect any existing binding rather than overwriting:

```powershell
$AbPeer = Join-Path $env:LOCALAPPDATA 'AgentBridge\wright-peer'
$AbBinding = Join-Path $env:LOCALAPPDATA 'AgentBridge\skill-binding.json'
New-Item -ItemType Directory -Force (Split-Path $AbBinding) | Out-Null
if (Test-Path -LiteralPath $AbBinding) {
  Write-Host 'Existing binding: read and inspect first.'
} else {
  @{ app_dir = $AbApp; peer_dir = $AbPeer } | ConvertTo-Json |
    Set-Content -LiteralPath $AbBinding -Encoding utf8
}
```

After prerequisite checks below, run `node (Join-Path $AbSkillTarget 'scripts\ab-status.mjs') --offline`. Missing peer configuration before joining is expected. Report the source commit, skill path, Node/Codex versions, actual exe verification, binding, and port readiness to Bertil, without credentials or bulk logs.

## What to receive

Obtain the current repository source or Bertil's matching source ZIP, a fresh private `invite.json` when both people are ready, and Bertil's Mac identity code. The source should include `src/peer-cli.mjs` and `skills/agent-bridge/`. Invitations last ten minutes and are single-use; keep them outside the source archive and repository. No server password, admin token, Bertil's Codex credentials, or TLS private key is needed.

## 1. Check prerequisites

In ordinary PowerShell on a network that can reach the company server:

```powershell
node --version
pnpm.cmd --version
codex --version
codex login status
```

Use Node.js 22+, pnpm, and an authenticated Codex CLI. Reuse existing installations. If missing, use the official [Node.js](https://nodejs.org/en/download), [pnpm](https://pnpm.io/installation), and [Codex installation](https://learn.chatgpt.com/docs/codex/cli) instructions. If needed, run `codex login` yourself; do not share authentication files.

A working PowerShell `codex` command might be a `.cmd` or `.ps1` wrapper that Node cannot spawn directly. Inspect it:

```powershell
Get-Command codex -All | Select-Object CommandType, Source
```

Locate the actual installed `codex.exe` and set its real path in the same terminal that will run the connector:

```powershell
$env:AB_CODEX_BIN = 'C:\actual-install-folder\codex.exe'
& $env:AB_CODEX_BIN --version
& $env:AB_CODEX_BIN login status
```

Do not copy the placeholder path. For npm installations, inspect `@openai` beneath the directory returned by `npm.cmd root -g`. If multiple executables exist, confirm architecture/version rather than choosing the first. Preserve sandbox and enterprise policies; record errors instead of switching to unrestricted access.

## 2. Extract and check AB

Extract into a new personal folder and enter the directory containing `package.json`. For example:

```powershell
Set-Location "$env:USERPROFILE\Downloads\agent-bridge-pilot"
pnpm.cmd install --frozen-lockfile
node scripts/check.mjs
Test-NetConnection -ComputerName SERVER_LAN_IP -Port 8790
```

Use the actual extracted path and server address provided by Bertil. There are no third-party runtime dependencies. Tests passed on Mac and Debian, but some fixtures are Unix-specific. TCP success does not establish TLS or invitation validity; join verifies those. This port is not a browser UI and does not require bypassing browser certificate warnings.

## 3. Join and confirm

Tell Bertil you are ready, then receive a fresh invitation outside the repository, such as in Downloads. From the AB source folder:

```powershell
$AbPeer = "$env:LOCALAPPDATA\AgentBridge\wright-peer"
node src/peer-cli.mjs join "$AbPeer" "$env:USERPROFILE\Downloads\invite.json"
node src/peer-cli.mjs status "$AbPeer"
```

Initial setup needs an empty directory. Do not repeat join after success. For a replacement room use a new directory and preserve old records.

Compare `identities.mac` with Bertil's separately provided code. Send only your `identities.windows` code to Bertil so he can confirm you. After comparing, replace the placeholder:

```powershell
node src/peer-cli.mjs confirm "$AbPeer" ACTUAL_MAC_IDENTITY
node src/peer-cli.mjs status "$AbPeer"
```

`ready` becomes true only after both confirmations. Do not exchange config tokens or let agents confirm identities without the respective person's comparison.

## 4. Run the inbox

In the terminal with `AB_CODEX_BIN` configured:

```powershell
node src/peer-cli.mjs run "$AbPeer"
```

Keep it open. Requests invoke local Codex and replies go back through AB; idle waiting makes no model calls. Windows login startup is not configured in this pilot. Sleeping or closed computers do not process messages.

## 5. Two-round acceptance

Keep the receiver terminal open. Open another PowerShell in the same AB directory, set the variables again, then send:

```powershell
$AbPeer = "$env:LOCALAPPDATA\AgentBridge\wright-peer"
$AbMessage = "$env:TEMP\ab-demo-message.txt"
[System.IO.File]::WriteAllText($AbMessage, 'Fictional handoff: Windows uses a native save dialog. Which export behaviors must match?', [System.Text.UTF8Encoding]::new($false))
node src/peer-cli.mjs send "$AbPeer" "$AbMessage"
```

After receiving the reply:

```powershell
[System.IO.File]::WriteAllText($AbMessage, 'Continuing the previous round: simulated cancellation leaves a temporary file. Suggest next steps and checks using our earlier discussion.', [System.Text.UTF8Encoding]::new($false))
node src/peer-cli.mjs send "$AbPeer" "$AbMessage"
```

This verifies two requests handled by the Mac. Then ask Bertil to send a fictional question from the Mac to verify **your Windows Codex can also reply automatically**. A successful send only queues a draft; logs and received replies establish actual completion. Replies must not automatically trigger more requests.

Record bidirectional replies, same-side context continuity, unchanged real projects, and no unauthorized approvals. Replies are in `$AbPeer\received`; model logs are in `$AbPeer\logs`. Keep these local rather than uploading entire runtime folders.

## 6. Stop and troubleshoot

```powershell
node src/peer-cli.mjs status "$AbPeer"
node src/peer-cli.mjs stop "$AbPeer"
```

Stop or Ctrl+C finishes the current turn before exiting; run resumes. `close` revokes the entire shared room and is not a normal pause.

| Symptom | Action |
| --- | --- |
| TCP unavailable | Check company-network reachability |
| Invite expired | Ask Bertil to refresh; previous invites become invalid |
| Invite already consumed | Use status if you joined; otherwise stop and contact Bertil |
| ready false | Both people must compare and confirm identities |
| Fingerprint mismatch | Verify the certificate and invitation; keep TLS checks enabled |
| ENOENT / Codex cannot start | Verify the actual exe path in the receiver terminal |
| Failed/blocked model task | Inspect local logs; do not automatically replay the same task |
| Existing lock | Check for a running connector before handling a stale lock |
| Room closed or expired | Rooms last one day; Bertil must create a new room and pair again |

Refreshing an invite does not extend room lifetime. The pilot certificate also has a fixed expiry recorded by Bertil.

## Official references

- [Non-interactive Codex execution and session continuation](https://learn.chatgpt.com/docs/developer-commands#codex-exec)
- [Native Windows Codex and sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox)

Official product support does not establish AB interoperability on this Windows machine; complete the acceptance steps above.
