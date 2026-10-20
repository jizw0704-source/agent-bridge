# Local Mac Codex two-round handoff demo

[简体中文](../LOCAL_DEMO.md) | [English](LOCAL_DEMO.md)

Update: the [continuous receiver](MAC_RECEIVER.md) supports background waiting and multiple rounds. This page describes the original fixed two-round demo, retained as `pnpm demo`.

October 20, 2026: a runnable local communication experiment. Wright is scripted; Mac replies come from real Codex CLI calls. No remote service, desktop plugin, real GitHub writes, or Windows tests are included.

## Run

Requires Node.js 22+, pnpm, Codex on PATH, and an existing Codex login. The inspected local CLI is `0.163.0-alpha.10.2`. No model is forced; CLI defaults apply. Running the demo uses account usage.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm demo
```

No third-party runtime dependencies, compilation, separate formatter, or type checker exist. `pnpm check` checks JavaScript syntax; `pnpm test` covers conversation continuity, deduplication, rejection, and failures. There is no UI to verify in a browser.

## Behavior

The program creates a system temporary directory containing `inbox`, `outbox`, `state.json`, `logs`, and a `sandbox` with one fictional requirement.

1. Scripted Wright queues a handoff; the connector scans the inbox and runs read-only Codex.
2. Codex explains platform behavior and asks a question; its reply enters the outbox automatically.
3. Scripted Wright supplies a cancellation observation. The connector resumes the exact conversation identifier for the second real reply.
4. Reload state and redeliver the second message to verify no additional invocation. Check the demo workspace is unchanged and write `result.json`.

Each turn has a three-minute timeout. Errors stop processing without automatic replay of potentially completed work. Failures require inspection. This is a single-process, serial, fixed-task demo; never share a run directory between concurrent processes.

Each default run gets a fresh directory. An optional dedicated absolute directory can be passed with `pnpm demo /absolute/path/to/demo-run`. Never point it at a real project. Reusing a successful run returns cached replies; use a fresh directory for fresh verification.

## Verified results (October 20, 2026)

- Real Codex completed two rounds in the same conversation: a cancellation-behavior question followed by recommendations to defer writes and a list of checks after scripted clarification.
- Reloading state and redelivering round two returned the cached reply without another Codex invocation.
- Both turns completed without tool actions. File content and file count in the demo workspace remained unchanged.
- Frozen-lockfile installation, `pnpm check`, `pnpm test`, and `git diff --check` passed. The three automated tests use a substitute invoker; live Codex behavior was verified separately.
- Existing live-run evidence was rechecked before this commit without additional model calls. Conversation identifiers, raw events, and temporary paths remain local and are not published.

## Permissions and limits

The CLI uses a read-only sandbox and never-ask approval policy. User configuration is ignored to avoid unrelated MCP tools. Instructions require message-only replies without tools, commands, file inspection, or external tool requests; unexpected action events fail the demo. This is not OS-level zero-read isolation: Codex still needs authentication and model network requests.

Real projects are never used as Codex working directories. Runtime state and logs stay out of Git; Codex persists its own resumable conversation. Replies are recommendations, not evidence of edits, tests, or Wright's approval.

Inbox scanning is driven by the demo, not a persistent service or cross-machine delivery. Display in existing desktop conversations is unverified. Continuous reception, authenticated peers, project permissions, and a real counterpart connector remain future work.

Reference: [Codex non-interactive mode](https://developers.openai.com/codex/noninteractive).
