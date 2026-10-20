# Continuous Mac inbox and replies (local simulation)

[简体中文](../MAC_RECEIVER.md) | [English](MAC_RECEIVER.md)

Updated October 20, 2026. v0.2.0 continuously waits for local scripted Wright messages, runs real Codex serially, resumes one conversation, and writes replies. No real project edits, contact with Wright, GitHub writes, public endpoint, or desktop plugin.

## Use

```sh
pnpm install --frozen-lockfile
pnpm inbox init
pnpm inbox start
pnpm inbox status
```

The default directory is `~/.local/share/agent-bridge/mock-wright`, outside the project. Pass the same dedicated absolute path to each command to override it. Initialization accepts only an empty directory or one already marked by this program, refusing nonempty real projects.

Queue scripted messages (a round number selects the default directory; for a custom directory use `pnpm inbox mock /absolute/run-directory 1`):

```sh
pnpm inbox mock 1
pnpm inbox mock 2
pnpm inbox mock 3
pnpm inbox status
```

Messages can arrive later or be queued in advance. The receiver scans once per second and invokes Codex only for new messages with completed predecessors. Idle waiting makes no model calls. Round one asks about save dialogs and cancellation; round two supplies a temporary-file observation; round three requests an acceptance checklist. Higher positive rounds reuse the third fixture, still within one fixed task.

Replies are in `outbox/reply-wN.json`; progress is in `receiver-status.json`; the worker log is `receiver.log`. `archive` retains consumed messages, `rejected` holds rejected files and reasons, and `logs` holds Codex evidence. All peer messages are fictional; replies do not establish actual edits or test success.

## Stop and resume

```sh
pnpm inbox stop
pnpm inbox status
pnpm inbox start
```

Stopping creates a local STOP file. The current turn finishes or times out, then the worker exits without accepting another message. A turn is limited to three minutes, followed by two seconds for its process group to exit before force termination. Starting again clears STOP, restores state, and accepts subsequent messages. `pnpm inbox serve` runs in the foreground; Ctrl+C requests the same graceful stop. If STOP exists, use start to resume.

The detached worker does not require an open terminal. Processing pauses when the Mac sleeps and can continue after wake. Login startup and system restart recovery are not configured. An exclusive lock prevents duplicate workers. A lock left by an abnormal exit is not automatically reclaimed: inspect its PID, logs, and incomplete work, confirm the old process has exited, then resolve it manually. Never blindly remove a lock.

## Reliability boundaries

- Process `w1`, `w2`, `w3`, and later rounds serially, waiting if predecessors have not replied.
- Cache identical completed messages across restarts. Quarantine conflicting content under the same identifier.
- Reject malformed JSON, unsupported senders/tasks/identifiers, oversized files, and symlinks. Only inbox files trigger work, so replies do not create a self-sustaining conversation loop.
- Failed, timed-out, or interrupted attempts remain blocked without automatic replay or false success. Dependent rounds wait. There is no automatic retry or repair command; inspect evidence before manual recovery.
- This is local simulation only. The fixed `mock-wright` label is not cryptographic authentication; do not expose the directory to untrusted remote users.
- Codex remains read-only with unrelated user tool configuration excluded. Instructions limit it to communication, and tool-action events fail the run. Event checking detects actions afterwards; it is not OS-level zero-read isolation.

## Live validation on this Mac (October 20, 2026)

The detached receiver handled three messages delivered at different times with three real Codex turns. After round two it was stopped and restarted; round three resumed the same conversation. Redelivering round two left its event file older than the restarted worker, demonstrating no repeat invocation. All three turns had no tool actions; demo file content and count were unchanged.

Nine automated tests, syntax checks, and document checks pass. The final background worker is waiting with three replies; PID, conversation identifiers, raw replies, and evidence remain local. This did not test Windows or contact Wright. For subsequent validation and onboarding status, see [Mac server connector](MAC_SERVER_CONNECTOR.md).

## Checks and acceptance

```sh
pnpm check
pnpm test
```

Tests cover delayed delivery, idle waiting, conversation continuity, out-of-order queues, a third round, restart deduplication, duplicate workers, rejection, failure without replay, stopping during a turn, and real-directory protection. Automated tests use a substitute invoker. Real Codex receipt/reply and stop/restart are checked separately on this Mac. Logs and conversation identifiers remain local.

No UI, separate formatter, linter, type checker, or compilation step exists. `pnpm demo` remains available for the fixed two-round experiment; do not point it at the continuous receiver directory or run it concurrently against worker state.

Reference: [Codex non-interactive mode and resuming sessions](https://developers.openai.com/codex/noninteractive).
