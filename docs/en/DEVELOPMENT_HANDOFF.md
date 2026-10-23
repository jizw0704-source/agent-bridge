# Minimal real development handoff

[简体中文](../DEVELOPMENT_HANDOFF.md) | [English](DEVELOPMENT_HANDOFF.md)

Deployment update: relay and Mac are deployed and checked; Wright local execution still awaits authorization. See [deployment and first task](DEVELOPMENT_DEPLOYMENT.md). Undeployed text below is the historical source-publication checkpoint.

October 23, 2026: implemented and reviewed locally; source published, not deployed. The company relay and installed Mac receiver still run the previous communication release. [Actual Mac/Windows communication acceptance](WRIGHT_ACCEPTANCE.md) passed. Real cross-computer development execution requires Wright's own local authorization and an agreed test repository.

## Flow and authority

Bertil's local Codex prepares a handoff JSON and sends an explicitly scoped development-v1 task. Wright's dedicated development receiver checks its private policy.json for the verified identity AND contact room, repository mapping, exact files, checks, edit/commit/push/draft-PR permissions. Default behavior is awaiting-authorization. Only an explicit automatic=true entry for that contact enables automatic execution. Peer text cannot modify policy or grant permission.

Codex receives only authorized text snapshots, with tools disabled, and proposes complete replacement files or one clarification. Program code validates the proposal, creates a dedicated ab/dev-* branch and worktree, writes permitted files, runs registered checks, and commits. Each task has separate model context, worktree and state. At most three model calls; clarification replies must match question_id and cannot expand permission.

States: awaiting-authorization, awaiting-clarification, executing, awaiting-review, rejected, failed, cancelled. Reports include actual files changed, check outcomes, commit/branch, optional draft PR, remaining items and owner decisions. Network/PR failures retain evidence and do not automatically repeat execution; inspect remote results first.

## Enforced limits

- demo-export remains unchanged. Its worker skips development-v1; the relay enforces message/task scope matching.
- OWNER/REPO maps to a canonical local path. Remote handoffs have no local absolute-path field. References are text only, never automatically fetched.
- A full existing 40-character base commit is required. Dirty source workspaces are refused without stash/reset. Use a separate clean owner-prepared clone.
- Only listed existing regular UTF-8 text files may change: no parent traversal, absolute paths, symlinks, .git, directories or binary files. Maximum 20 files, 24 KB each. The model cannot choose commands or tools.
- Registered check types are node-syntax (Node --check), json (parse), and contains (fixed-text assertion). No arbitrary shell, package scripts, package installation or full build. There is no general sandbox for executing third-party project code; stronger process isolation must precede such an extension.
- Each step rechecks grants and Git configuration. Human edits during model processing stop the task without overwriting them; commits include only task files. Local status/cancel work offline. Git hooks, fsmonitor, global configuration and signing are disabled. Local custom filters/commands/includes are refused. Model invocation uses an empty isolated directory, read-only mode, and disabled shell/MCP/web tools.
- push and draft_pr default to false. Push uses local gh authentication through an ephemeral URL-scoped header rather than command-line or persisted credentials, with redirects and custom push routing disabled. Opt-in only supports a matching HTTPS GitHub origin, dedicated task branch and locally configured PR base. No merge, release, deployment, project deletion or unrelated-directory read operation is exposed.
- Repeated identical handoffs return saved state; changed content with the same task ID conflicts. Message/report IDs are stable. executing is persisted before side effects; interrupted attempts never silently restart, including interrupted PR creation.
- Cancellation is a persistent marker checked before each step. It does not roll back or forcibly terminate an already-started Git/model step. During model processing, the receiver checks for matching remote cancellation every 500 ms. Network failure may delay remote cancellation; local cancel writes the marker directly. Reports preserve already-created files, branches, commits and errors, and no further steps start once cancellation is observed.

## Commands and local policy

No production dependency was added:

```sh
node src/development-cli.mjs init PRIVATE_DEV_ROOT EXISTING_CONTACT_ROOT
node src/development-cli.mjs send PRIVATE_DEV_ROOT TASK_ID PRIVATE_HANDOFF_JSON
node src/development-cli.mjs poll PRIVATE_DEV_ROOT
node src/development-cli.mjs run PRIVATE_DEV_ROOT
node src/development-cli.mjs status PRIVATE_DEV_ROOT TASK_ID
node src/development-cli.mjs approve PRIVATE_DEV_ROOT TASK_ID
node src/development-cli.mjs report PRIVATE_DEV_ROOT TASK_ID
node src/development-cli.mjs cancel PRIVATE_DEV_ROOT TASK_ID
node src/development-cli.mjs stop PRIVATE_DEV_ROOT
```

init creates an empty policy granting nothing. The owner adapts the [policy template](../../examples/development-policy.json) into private policy.json, using JSON-escaped or forward-slash Windows paths and a canonical repository path. approve is a local execution action, never a peer-granted authorization. Do not run development run/poll/approve concurrently: pause the development receiver before manual approve, then restart it. The demo receiver may stay online. Do not start duplicate development receivers or remove stale locks before verifying that the previous process stopped.

Replies and reports are stored in private transport.json and do not trigger model reply loops. Manual approve sends a structured report. If notification fails or hits a lock, inspect local status/transport first, then use report to resend the same state with a stable ID; do not rerun execution.

Clarification answer example:

```json
{"type":"answer","id":"windows-label-001","question_id":"q1","answer":"Use Windows for win32; keep all other labels unchanged."}
```

Manual mode requires another local approve; automatic mode rechecks local policy and resumes the same thread. Remote cancellation uses send with `{"type":"cancel","id":"windows-label-001"}`. Local cancel is also available; use report after execution exits. Failed/executing/cancelled tasks do not restart on repeated delivery; inspect artifacts and use a new task ID after correction.

## Evidence and next deployment

Local automated tests use actual Git worktrees, file writes/checks/commits, a loopback relay and injected model proposals. They cover manual/automatic authorization, denied contacts/repositories/operations, dirty workspaces, symlinks, revocation, clarification/resumption, task isolation, duplicates, failed checks, cancellation and interruption without replay. They are not Windows acceptance.

An additional actual Mac Codex call changed win32 to Windows in an isolated temporary repository, passed syntax/text checks and produced a dedicated-branch commit without modifying the source checkout. Syntax/text checks are not functional tests.

```sh
pnpm check
pnpm test
git diff --check
node scripts/verify-development.mjs --real-codex
```

The last command explicitly invokes a model and retains its temporary directory. No separate formatter/linter/typechecker/build exists, and no UI changed. Push/draft-PR paths are implemented but have not performed actual GitHub writes. Windows execution and real cross-machine development clarification/execution/cancellation/automatic mode remain unverified.

Source review/fixes and publication are included in this release. Next: backup and deploy new relay and versioned peer releases; agree on a dedicated test repository seeded from examples/development-sandbox/platform-label.mjs; have Wright configure local grants with automatic=false; verify the small task, clarification, duplicates, cancellation and isolation. Then Wright may explicitly opt into automatic mode for a new task. Push/PR permissions need separate opt-in and acceptance. Never substitute a business repository such as LingGuo. See [Wright instructions](WRIGHT_DEVELOPMENT_ONBOARDING.md).

Local checks for this change passed: pnpm check, 54/54 automated tests, git diff --check, Skill structure validation and new documentation link checks. Oversized network reports use report_truncated=true; full evidence stays in the receiver's private task file.
