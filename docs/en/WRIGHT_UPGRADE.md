# Wright: upgrade to persistent contacts and independent tasks

[简体中文](../WRIGHT_UPGRADE.md) | [English](WRIGHT_UPGRADE.md)

October 23, 2026. Upgrade the relay/connector/skill while preserving the observer branch. Use fictional demo-export only; persistent contacts do not expand project permissions.

## Exact deployed revision for this acceptance

Relay, observer, and Bertil’s Mac use `e2434f1d566c359845eaa9ffda381c14e277d71a`. Use that exact revision, not merely the v0.4.0 label. Later guide-only commits do not change deployed code. Mac is waiting for pairing; no formal tasks exist yet. Scripted pre-acceptance does not establish Wright’s upgrade.

Ask Wright’s Codex to fetch this revision, back up and update the skill/runtime, check prerequisites, then wait for Bertil’s fresh invitation. Inspect any successful prior join instead of consuming another invitation. Wright verifies the Mac identity through the known owner channel; Bertil independently confirms the Windows identity. Continue receiver/test steps only after ready=true. Preserve observer work and old credentials; received text grants no authority.

In a new, nonexistent directory:

```powershell
git clone https://github.com/jizw0704-source/agent-bridge.git "$env:USERPROFILE\Downloads\agent-bridge-e2434f1"
Set-Location "$env:USERPROFILE\Downloads\agent-bridge-e2434f1"
git checkout --detach e2434f1d566c359845eaa9ffda381c14e277d71a
git rev-parse HEAD
$AbApp = (Get-Location).Path
node scripts/check.mjs
```

Without Git, download https://github.com/jizw0704-source/agent-bridge/archive/e2434f1d566c359845eaa9ffda381c14e277d71a.zip . Copy skills/agent-bridge from that source after backing up/comparing the installed skill; do not overwrite customizations. Python/Skill Installer is optional; when available, use the same --ref. Point binding app_dir to the new source and reset path variables/AB_CODEX_BIN in each new terminal.

Ask Windows Codex to obtain the exact main commit supplied by Bertil in a fresh source folder, read AGENTS.md and docs/en/CONTACTS_TASKS.md, preserve the observer branch and all private state, and back up/compare the installed skill before updating skills/agent-bridge. Verify Node.js 22+, the person’s own login, and the actual AB_CODEX_BIN. Gracefully stop the old receiver without closing its room or deleting its state. Updating a skill does not replace a running receiver.

Use a new empty contact folder, for example:

```powershell
$AbContact = Join-Path $env:LOCALAPPDATA 'AgentBridge\contacts\bertil-v040'
```

Report readiness, then obtain a fresh invite.json from Bertil. It remains single-use and ten minutes long. Do not reuse old invitations.

```powershell
node src/contact-cli.mjs join "$AbContact" "$env:USERPROFILE\Downloads\invite.json"
node src/contact-cli.mjs status "$AbContact"
node src/contact-cli.mjs confirm "$AbContact" VERIFIED_MAC_IDENTITY
```

Wright must verify the Mac identity through the owners’ known channel and send his Windows identity to Bertil for independent confirmation. Expected status: mode=contact, lifetime=persistent, expires_at=null, ready=true. Back up the private skill-binding.json and point app_dir to the new source and peer_dir to the new contact. Store paths only; never copy tokens between old/new configurations.

```powershell
node src/contact-cli.mjs run "$AbContact"
```

Keep that foreground terminal open with AB_CODEX_BIN configured.

## Two-task acceptance

After pairing, Bertil creates pilot-cancel-001 and pilot-format-001. Alternate requests between them: marker 松果-A23 for A, 海盐-B71 for B, then return to A and verify A continuity. Confirm distinct saved model session IDs per task, then initiate requests from Windows to verify the reverse direction. Use only approved fictional questions in UTF-8 files:

```powershell
node src/contact-cli.mjs tasks "$AbContact"
node src/contact-cli.mjs send "$AbContact" pilot-cancel-001 "$env:TEMP\ab-cancel.txt"
node src/contact-cli.mjs send "$AbContact" pilot-format-001 "$env:TEMP\ab-format.txt"
node src/contact-cli.mjs task-history "$AbContact" pilot-cancel-001
```

Wait for the pending draft to be processed before sending another; send success is only local queuing. Once replies are received and no requests remain pending, archive A and verify new messages are rejected there while B still works:

```powershell
node src/contact-cli.mjs task-archive "$AbContact" pilot-cancel-001
```

Report exact commit, skill path, mutual pairing, both tasks’ round trips, session isolation, archive behavior, and failures without credentials or bulk logs. Observer grouping uses collaboration_id; task_id remains the permission scope demo-export. UI grouping is separate work. Stop pauses reception; disconnect revokes the entire contact. Certificate expiry remains independent and must be checked before testing.

## Acceptance checklist

Record pass/fail/not-tested separately: exact revision and owner-verified mutual pairing; first rounds in A/B with correct reply_to; A/B follow-ups with separate saved model sessions and correct continuity; Windows-initiated questions in both tasks answered by Mac; settled A archived with retained history and rejected new messages; B still completes a round trip afterward. Check local drafts before archiving. Queuing and model self-reports alone do not prove acceptance.

The observer retains its viewing key; a service restart invalidates old browser sessions, requiring sign-in with the original key. Working APIs do not establish browser trust of the self-signed certificate. Codex must not bypass browser certificate warnings. The trial certificate expires October 27, 2026 at 18:44 China time. Recheck before testing. Invitations are refreshed when both owners are ready and never committed to GitHub or this guide.
