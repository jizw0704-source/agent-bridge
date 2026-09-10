# Roadmap and handoff

[简体中文](../ROADMAP.md) | [English](ROADMAP.md) · [Project home](../../README.en.md)

English edition: September 10, 2026.

## Current stage: product exploration

We selected automatic context organization with a Scenario Card; see [Product requirements](PRODUCT.md). Phases one through three below preserve an early technical roadmap proposal. The first scenario, execution permissions, technology stack, and protocol have not been selected. This checklist is not authorization to begin implementation.

- [x] Establish the direction of personal agent coordination across work and everyday life.
- [x] Document requirements, architecture proposals, and related projects.
- [x] Select automatic organization by role and scenario, with an inspectable and adjustable Scenario Card.
- [ ] Discuss the concrete experience, information presentation, and negotiation permissions.
- [ ] Select the first real-world validation scenario.
- [ ] Identify initial users and the agents they already use.
- [ ] Compare projects such as EnvoyMesh to decide whether to build, integrate, or contribute upstream.

## Phase one candidate: simulated negotiation

- [ ] Select and pin a technology stack and protocol version.
- [ ] Connect two independent identities with simulated calendars and request/proposal exchange.
- [ ] Handle both parties' confirmation, decline, cancellation, expiration, and negotiation limits.
- [ ] Verify minimal disclosure, deduplication, and renewed confirmation after a proposal changes.
- [ ] Provide a simple user interface and readable event records.

## Phase two candidate: real agent interoperability

- [ ] Check official integration methods for each agent.
- [ ] Demonstrate end-to-end interoperability between at least two distinct agent implementations.
- [ ] Separate authentication, authorization from the person represented, and model output.
- [ ] Add offline delivery, retries, cost budgets, stopping, and human takeover.

## Phase three candidate: trials in real scenarios

- [ ] Authorize calendar reads and writes separately; recheck availability before execution.
- [ ] Verify partial success, recovery from failures, and duplicate-execution prevention.
- [ ] Run a small trial and record completion rates, human interventions, time, cost, and unauthorized or incorrect commitments.
- [ ] Decide whether to expand the scheduling trial to everyday arrangements, delegated tasks, and request clarification.

## Guidance for future development discussions

Read the [handoff](HANDOFF.md), [project home](../../README.en.md), [product requirements](PRODUCT.md), [architecture draft](ARCHITECTURE.md), and [related projects](RELATED_PROJECTS.md).

Continue exploring needs, existing solutions, and product differences. Present concrete options, tradeoffs, and a recommendation one topic at a time. Scheduling, A2A, a single service, and the technology stack remain candidate proposals. Once implementation is authorized, use the selected scenario and its applicable acceptance criteria, and record actual commands and unfinished work.
