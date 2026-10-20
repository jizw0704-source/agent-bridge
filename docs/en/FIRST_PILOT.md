# First real-peer pilot: scope and prerequisites

[简体中文](../FIRST_PILOT.md) | [English](FIRST_PILOT.md)

Date: October 20, 2026. The initiator accepted a small-scope pilot. This defines boundaries, not a claim that a real peer is connected.

## Product role

Each person continues talking to their own personal agent. AB connects those agents when coordination with another person is needed, transmits authorized information, and tracks task communication. Work and everyday life remain the long-term scope. AB neither replaces personal agents nor requires people to move their conversations into AB.

## Initial scope

- Two people: the initiator and Wright.
- One authorized shared project and one task.
- Handoff from an existing agent, including a task description, GitHub Issue/PR references, and the relevant code version.
- One handoff and at least two clarification/reply rounds without copying intermediate messages after initiation.
- Distinguish awaiting receipt, processing, replied, failure, and stopped. Receipt does not imply acceptance.
- Exchange information and recommendations only. Code changes follow the existing workflow. Automated GitHub writes, edits, formal approval, merge, and release are outside this pilot.

Progress feedback is required; a separate web dashboard is not. A reference does not authorize access to an entire repository or private conversation. Each side prepares shareable context under its own permissions.

## Existing evidence

The local Mac receiver has passed three real Codex turns, conversation continuity, stop/restart, and deduplication checks. Wright remains scripted. It runs an independent background Codex conversation, not an integration into the currently open desktop chat. Cross-machine communication between two real personal agents remains unverified.

## Peer prerequisites and pending verification

The initiator confirmed Wright can use Windows Codex, its CLI, and a connector. The pilot now uses a LAN HTTPS relay, without a public server; see the [setup guide](LAN_PILOT.md). Exact version, LAN reachability, and execution still need peer-side validation.

1. Whether Wright uses Windows desktop Codex and whether `codex --version` runs locally.
2. Whether a local connector can run while both people are online, with local Codex sign-in and communication tasks available.
3. A task and context both people are willing to use; the first exchange may remain a nonsensitive demonstration task.

Do not collect Wright's credentials, tokens, or private configuration. Verify compatibility and connection options after the initiator relays these details. A product name alone does not establish interface availability.

## Sequence

1. Reuse the Mac receiver and verify Windows prerequisites.
2. Propose transport and pairing appropriate to both environments, then implement a real peer connection.
3. Validate one request/reply, then two rounds, disconnection recovery, and duplicate delivery.
4. Track manual forwarding, corrections, waiting, and failures. After success, add GitHub status synchronization, Scenario Cards, and finer authorization, followed by more contacts and everyday-life scenarios.

Protocol and deployment remain open. This step does not expose a remote service, message Wright, or grant permission to change another project.
