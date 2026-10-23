# Wright: upgrade to persistent contacts and independent tasks

[简体中文](../WRIGHT_UPGRADE.md) | [English](WRIGHT_UPGRADE.md)

October 23, 2026. Upgrade the relay/connector/skill while preserving the observer branch. Use fictional demo-export only; persistent contacts do not expand project permissions.

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
