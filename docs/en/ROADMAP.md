# Roadmap and handoff

[简体中文](../ROADMAP.md) | [English](ROADMAP.md) · [Project home](../../README.en.md)

Updated: October 20, 2026. Product exploration and validation design; no implementation exists.

## Selected and documented

- [x] Personal agent coordination across work and everyday life.
- [x] Automatic context organization with a Scenario Card.
- [x] First scenario: cross-platform handoffs, multiple communication rounds, and PR review with Wright.
- [x] Entry point: existing agents, AB inboxes and a progress view, and GitHub references.
- [x] [Bilingual worked example and mechanism diagram](WRIGHT_COLLABORATION.md). Example tests have not been executed.

## Next: verify integration and authority

- [ ] Select an authorized real Issue/PR.
- [ ] Identify both agents, devices, official integration methods, and offline behavior.
- [ ] Specify task scope, branches, editing/commit/GitHub-write permissions, and revocation.
- [ ] Define a minimal receipt/reply validation before choosing the stack and protocol.

## Then: simulation and minimal interoperability

- [ ] Handoff, acceptance, two clarification/feedback rounds, and visible waiting states.
- [ ] Check offline behavior, deduplication, cancellation, expiration, out-of-scope requests, and recovery.
- [ ] Bind tasks, messages, code versions, and evidence to avoid stale conclusions.
- [ ] Connect actual agents and GitHub; report real writes only after success.
- [ ] Prototype and verify the progress view under the applicable design rules.

## Real collaboration trial

- [ ] Complete two rounds without manual forwarding of intermediate messages; Wright performs formal approval personally.
- [ ] Compare with manual forwarding: count forwarding, explanations, waiting time, corrections, and incorrect actions.
- [ ] Gather willingness to reuse from both people and decide whether to expand.

Renting and scheduling remain everyday-life directions. Calendar integration, A2A, a single service, self-hosting, and deployment are not selected implementations.

Read the [handoff](HANDOFF.md), [product requirements](PRODUCT.md), and [worked example](WRIGHT_COLLABORATION.md), then consult earlier architecture and research as needed. Implementation needs a defined scope, actual commands, and evidence from validation.
