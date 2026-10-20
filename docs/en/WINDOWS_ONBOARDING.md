# Wright's Windows onboarding

[简体中文](../WINDOWS_ONBOARDING.md) | [English](WINDOWS_ONBOARDING.md)

Updated October 20, 2026. Scope: fictional `demo-export` handoffs and two-round replies. AB invokes your locally authenticated Codex CLI in a separate background conversation, without automatically inheriting your current desktop chat. Actual Windows operation remains to be verified on your machine.

Optional: install the [Agent Bridge skill](SKILL_USAGE.md) so local Codex can follow this workflow. The skill does not include the runtime or establish pairing by itself.

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
