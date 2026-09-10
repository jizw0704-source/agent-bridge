# Architecture and communication draft

[简体中文](../ARCHITECTURE.md) | [English](ARCHITECTURE.md) · [Project home](../../README.en.md)

Design baseline: September 9, 2026. English edition: September 10, 2026. These are early proposals, not an implemented or selected architecture. Product exploration takes priority.

## Components

Person A → local authorization rules and Agent A adapter ↔ Bridge coordination service ↔ Agent B adapter and local authorization rules ← Person B.

Each adapter receives structured requests, invokes its agent, filters information permitted for disclosure, and returns structured results. A model may help interpret requests; deterministic program logic checks permissions and state transitions.

An early proposal is a single self-hostable service for contact registration, task records, and message delivery. Peer-to-peer (P2P) communication and federation across services would be evaluated after requirements are clearer.

In this proposal, the service can read authorized messages passing through it. That is not end-to-end encryption. Introducing end-to-end encryption would require revisiting server-side filtering and audit boundaries.

## Protocol responsibilities

| Scope | Proposal |
| --- | --- |
| Agent capability descriptions and remote task communication | Evaluate Agent2Agent (A2A) and its software development kits (SDKs) |
| People, agent contacts, and authorization scope | Defined by the Bridge application |
| Negotiation, both parties' confirmation, and execution results | Bridge application state machine |
| Tools used by one agent, such as calendar queries | Existing tool interfaces, including Model Context Protocol (MCP) where appropriate |

MCP can provide tool access; it does not itself negotiate authorization from both people. Successful A2A transmission does not establish their agreement to a business action.

## Proposed application message fields

These fields belong to the Bridge draft, not an established A2A schema. Before implementation, map them to messages, tasks, and structured data in the selected protocol version.

| Field | Meaning |
| --- | --- |
| message_id / task_id | Message deduplication identifier and negotiation task identifier |
| sender_agent / recipient_agent | Sending and receiving agents; must match authenticated identities |
| intent | Request, proposal, confirmation, decline, cancellation, or execution result |
| proposal_version | Confirmations bind to the same version and content |
| constraints | Structured requirements, such as time range, time zone, and duration |
| permitted_disclosure | Information the task may share |
| expires_at | Request or proposal expiration |
| reply_to | Previous message reference, limiting unrelated replies and loops |

Intersect claimed permissions with locally stored authorization. A sender's claim of authority is not sufficient to permit an action.

## Application states

REQUESTED → NEGOTIATING → AWAITING_APPROVAL → APPROVED → EXECUTING → COMPLETED.

Allow transitions to DECLINED, CANCELLED, EXPIRED, or FAILED as appropriate to the current stage. Duplicate messages must not move the state backwards. A changed proposal returns to awaiting approval and clears confirmation records for the previous version.

Before submitting an external action, recheck both confirmations, revocation, and expiration. Use idempotency identifiers for external writes and retain verifiable execution receipts.

## Integration sequence and technology proposals

Start with fixed-response simulated agents to exercise states, then connect two distinct agent implementations, followed by real tools.

If JavaScript or TypeScript is chosen, use pnpm. Compare minimal A2A JavaScript and Python interoperability examples before choosing the stack. No dependencies have been installed, no service is running, and no person's real data has been accessed.

References: [A2A repository](https://github.com/a2aproject/A2A), [A2A specification](https://a2a-protocol.org/latest/specification/), [A2A JavaScript SDK](https://github.com/a2aproject/a2a-js), [A2A Python SDK](https://github.com/a2aproject/a2a-python).
