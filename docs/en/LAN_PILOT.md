# Two personal agents on a LAN (v0.3.0 pilot)

[简体中文](../LAN_PILOT.md) | [English](LAN_PILOT.md)

Later update, October 20, 2026: the relay is deployed on a company Debian server and real Mac-to-server messaging has passed. See the [server deployment record](SERVER_DEPLOYMENT.md). The Mac-hosted instructions below remain a local pilot option; Wright/Windows acceptance is still pending.

Updated October 20, 2026. AB connects existing personal agents. This pilot exchanges information about a fictional export task only. A Mac hosts the HTTPS relay and both connectors pull messages. It does not edit real projects, write GitHub, grant approval, or inject work into an existing idle desktop conversation.

## Local validation results

Fourteen automated tests pass, covering expiration/single-use invites, mutual confirmation, authentication, task scope, deduplication, restart, no model replay after failure, cached replies after outages, and TLS pin mismatch rejection. Two independent connector processes on the same Mac additionally completed four real Codex turns over HTTPS (two per side), with conversation continuity, no tool actions, unchanged fixtures, and no idle reply loop.

The initial Mac-hosted relay passed a LAN-address health check. Subsequent [company server deployment](SERVER_DEPLOYMENT.md) verified Mac messaging over the actual network. Wright has not joined; native Windows and peer-side network/firewall acceptance remain pending. Generate or refresh an invitation when both people are ready.

Before the peer joins, `pnpm peer invite DIRECTORY` refreshes a ten-minute invitation and invalidates the previous one. It does not extend the one-day room lifetime. See the [Windows onboarding guide](WINDOWS_ONBOARDING.md).

## Prerequisites

Both machines need Node.js 22+, pnpm, an executable Codex CLI, and their own local Codex login. The relay Mac also needs OpenSSL for its local certificate. Never transfer Codex credentials.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

Automated tests were validated on Mac and include OpenSSL and Unix executable fixtures. On Windows, install dependencies and run `pnpm check`; native operation requires separate acceptance.

If Windows resolves codex to a `.cmd` launcher that Node cannot execute, set `AB_CODEX_BIN` to the actual Codex `.exe` path. This must be tested on Wright's computer; a Windows-role process on a Mac does not establish Windows compatibility.

## 1. Host the relay on Mac

Use dedicated directories outside the repository. Do not reinitialize existing state. Certificates last seven days; rooms last one day.

```sh
pnpm relay init "$HOME/.local/share/agent-bridge/lan-relay"
pnpm relay tls "$HOME/.local/share/agent-bridge/lan-relay"
pnpm relay serve "$HOME/.local/share/agent-bridge/lan-relay" 8790 --lan
```

The terminal prints candidate LAN addresses and the SHA-256 certificate fingerprint. Choose the address on Wright's network, such as `https://192.168.1.20:8790`, not 127.0.0.1. `--lan` enables TLS and binds all IPv4 interfaces. Use a trusted LAN; Wi-Fi isolation or firewalls may prevent access. The owner decides any macOS network permission prompt.

Keep this terminal running. Ctrl+C stops the relay. Restart with the same serve command to load state. After an abnormal exit, inspect the old process before manually resolving a stale relay.lock; it is never automatically reclaimed.

## 2. Create an invitation on Mac

In another terminal, substitute the actual address and public fingerprint:

```sh
pnpm peer create "$HOME/.local/share/agent-bridge/mac-peer" "$HOME/.local/share/agent-bridge/lan-relay" https://192.168.1.20:8790 ACTUAL_TLS_SHA256
```

Only the invitation file path is printed. Privately send `mac-peer/invite.json` to Wright; it is single-use and expires in ten minutes. Never share config.json, admin.json, the TLS private key, or an entire runtime directory. These are not included in the code package. Invitation possession alone is not proof of identity.

## 3. Join on Windows

Extract the source package, enter the directory containing package.json, and install dependencies. PowerShell:

```powershell
pnpm peer join "$env:LOCALAPPDATA\AgentBridge\wright-peer" "C:\Users\Wright\Downloads\invite.json"
pnpm peer status "$env:LOCALAPPDATA\AgentBridge\wright-peer"
```

On Mac:

```sh
pnpm peer status "$HOME/.local/share/agent-bridge/mac-peer"
```

Compare identity codes through your existing trusted communication channel. Mac confirms the Windows code; Wright confirms the Mac code:

```sh
pnpm peer confirm "$HOME/.local/share/agent-bridge/mac-peer" WINDOWS_IDENTITY
```

```powershell
pnpm peer confirm "$env:LOCALAPPDATA\AgentBridge\wright-peer" MAC_IDENTITY
```

Both must confirm before ready becomes true. Role-bound bearer tokens authenticate senders at the relay; message text cannot impersonate the other role.

## 4. Run and send a handoff

```sh
pnpm peer run "$HOME/.local/share/agent-bridge/mac-peer"
```

```powershell
pnpm peer run "$env:LOCALAPPDATA\AgentBridge\wright-peer"
```

Keep connector terminals open. Ask your own agent to prepare a UTF-8 fictional-task message file and invoke send. Example: “Explain cancellation behavior for the Windows save dialog. No tests have been run.” Do not include real project material.

```sh
pnpm peer send "$HOME/.local/share/agent-bridge/mac-peer" /absolute/path/to/demo-message.txt
```

The Windows connector invokes Codex and returns a reply to the Mac connector. Windows can independently initiate requests too:

```powershell
pnpm peer send "$env:LOCALAPPDATA\AgentBridge\wright-peer" "C:\absolute\path\demo-message.txt"
```

Send queues one local draft; the running connector transmits it. Replies never trigger automatic replies. Further questions originate from the owner or an authorized local agent, preventing endless loops. Each side has at most ten requests per room, processes serially, and resumes its own Codex conversation. Logins and threads stay separate; current desktop-chat memory is not automatically inherited.

## 5. Status, stop, and revoke

`pnpm peer status DIRECTORY` shows pairing and message progress. Replies appear in the connector terminal and its local received directory. In another terminal:

```sh
pnpm peer stop DIRECTORY
pnpm peer close DIRECTORY
```

Stop finishes the current turn before ending local reception; run resumes. Close revokes the entire room for both peers without erasing previously received local records. Idle waiting makes no model calls. Sleep and disconnection pause work; recovery resumes transport. Login startup is not configured.

## Reliability and data boundaries

- Self-signed local TLS certificates are pinned using the invitation fingerprint, verified before credentials/body transmission. No global TLS verification setting is disabled. Changed or expired certificates are rejected.
- This is not end-to-end encryption: the relay can read message content. Keep private runtime state outside Git and use nonsensitive fictional messages in this pilot.
- Persist requests before sending; replies have stable identifiers. Transport retries resend a saved reply without generating it again.
- Interrupted/failed model attempts block for human inspection rather than automatically replaying. Never blindly delete stale locks.
- Scope is only `demo-export`. No real repository reads, code changes, GitHub execution, actual Windows tests, or approval capabilities are provided. Read-only instructions and sandboxing are combined with action-event detection; detection is not OS-level zero-read isolation.
- Automated tests substitute model calls. `node scripts/verify-pair.mjs` additionally consumes four real Codex turns, using two processes on the same Mac over TLS. It does not establish real Windows interoperability.

Share the code package separately from private pairing credentials. After local validation, verify actual LAN reachability and Windows Codex execution together.
