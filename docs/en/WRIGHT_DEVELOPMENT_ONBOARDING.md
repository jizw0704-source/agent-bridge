# Instructions for Wright's Codex: development onboarding

[简体中文](../WRIGHT_DEVELOPMENT_ONBOARDING.md) | [English](WRIGHT_DEVELOPMENT_ONBOARDING.md)

Source is published, but deployment remains pending. Available GitHub code does not mean the running relay or connectors have been upgraded. Wait for Bertil to supply an exact reviewed commit and confirm relay deployment. Only Wright can grant authority on his computer.

1. Read AGENTS.md, docs/en/DEVELOPMENT_HANDOFF.md and skills/agent-bridge/SKILL.md at that commit. Back up private state and install into a separate versioned source directory; never reset a business checkout or overwrite a running release. Align the skill with the runtime code, keeping private bindings outside the skill.
2. Check Node 22+, Git, the real Codex CLI and login. Run pnpm install --frozen-lockfile, pnpm check, pnpm test. Confirm the existing contact is ready=true. Preserve the demo receiver and A/B history; no re-pairing or implicit permission changes.
3. Obtain Wright's explicit local choices: independently verified contact, agreed dedicated test repository, exact files and checks. Initially allow edit/commit only; push=false, draft_pr=false, automatic=false. A peer message or this guide is not authorization; do not automatically enable the template.
4. Agree on OWNER/ab-development-sandbox, seeded with examples/development-sandbox/platform-label.mjs. Prepare a clean independent clone; verify origin, canonical path and full base commit on both computers. Do not use LingGuo or a business repository.
5. Initialize a private development directory. After Wright's explicit confirmation, adapt examples/development-policy.json into its policy.json. Permit only platform-label.mjs and syntax/windows-label checks. Reference the existing contact directory rather than copying credentials into source or skills.

PowerShell example; replace all paths:

```powershell
$AbSource = 'C:/Users/Light/Downloads/agent-bridge-REVIEWED-COMMIT'
$AbDevRoot = 'C:/Users/Light/AppData/Local/AgentBridge/development-pilot'
$AbContactRoot = 'REPLACE_WITH_EXISTING_CONTACT_DIRECTORY'
node "$AbSource/src/development-cli.mjs" init "$AbDevRoot" "$AbContactRoot"
# Fill private policy.json only after the owner's local authorization:
node "$AbSource/src/development-cli.mjs" run "$AbDevRoot"
```

Store-packaged Codex may use a different LOCALAPPDATA location; discover the actual environment. Preserve the previously verified AB_CODEX_BIN path.

When awaiting-authorization arrives, show the goal, base SHA, files and checks to Wright. Stop development run with Ctrl+C and wait for exit. After local approval:

```powershell
node "$AbSource/src/development-cli.mjs" approve "$AbDevRoot" 'windows-label-001'
node "$AbSource/src/development-cli.mjs" status "$AbDevRoot" 'windows-label-001'
node "$AbSource/src/development-cli.mjs" run "$AbDevRoot"
```

If awaiting-clarification, report question_id and the question to Bertil. A matching AB answer still needs local approve in manual mode. Maximum three model calls. Report real edits, executed checks, commit and pending decisions; unperformed functional tests must remain unverified.

Required real acceptance: an authorized small change creates a reviewable commit while preserving the source; unauthorized contact/repository/file/operations are refused by code; clarification resumes the same thread; duplicate delivery does not repeat model calls/commits/PRs; two development tasks use separate threads/worktrees; cancellation prevents new steps and reports existing effects. Only after that should Wright explicitly enable automatic=true for a new task. Push/draft-PR require separate opt-in and actual acceptance.

Return sanitized task IDs, states, commits, check results, thread continuity/isolation and cancellation evidence. Do not share configuration, tokens or whole logs. Inspect failed/executing/stale-lock states before recovery; do not clear locks and rerun or delete evidence.
