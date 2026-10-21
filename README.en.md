# Agent Bridge

[简体中文](README.md) | [English](README.en.md)

Connect people's personal AI agents so they can communicate, negotiate, and coordinate within the permissions each person grants.

**Status: product exploration plus a communication pilot. On October 20, 2026, a company LAN HTTPS relay was deployed and a Mac completed two simulated messaging rounds through it. Actual Windows/Wright interoperability remains unverified.** Started on September 9, 2026.

## Why Agent Bridge?

Arranging a meeting, coordinating a task, or clarifying a request often involves repeated questions and explanations. Personal agents could exchange the necessary information, work through possible arrangements, and bring decisions back to the people they represent. Agent Bridge explores this for both work and everyday life.

For example, two people want to meet for 30 minutes. Their agents could exchange only the time slots they are allowed to share, propose an arrangement, and request confirmation before creating a calendar event. Neither person needs to share their full calendar or private knowledge base. This is a candidate scenario, not an implemented feature or a selected first release.

## Product direction

Bridge is a proposed coordination layer between personal agents. Its potential responsibilities include linking agents to the people they represent, contacts, message delivery, permissions, negotiation progress, and records of agreed outcomes. Each agent remains under its own person's control.

We have selected **automatic context organization with a Scenario Card** as the product direction. An agent organizes the person's relevant role, goals, preferences, and information for the current situation. The person can inspect and adjust the card. Information used privately to evaluate a proposal is distinguished from information the agent may share with the other party.

One person may be a tenant, a traveler, a hotel guest, or a colleague in different situations. An ongoing agent contact could support multiple interactions over time. Adding a contact does not grant access to the person's entire profile.

The selected first scenario is cross-platform development with Wright: handoffs within existing agents, AB inboxes and a progress view, and GitHub task references. Renting remains an everyday-life scenario.

Agent2Agent (A2A) is an early protocol candidate. We will choose the technical approach after clarifying user needs and the product experience. Application-level agreements must be distinguished from protocol fields; no A2A compatibility has been implemented or verified.

Related projects already exist, particularly EnvoyMesh and Tacit. We do not claim that this idea is unique. We need to test whether AB makes integration easier, reduces the effort of coordination, and respects the permissions people grant.

## LAN two-peer pilot (v0.3.0)

HTTPS relay, expiring single-use invitations, mutual confirmation, two pulling connectors, and request/reply deduplication are implemented. A Mac or LAN server hosts the relay; Windows uses the same connector. See the [LAN guide](docs/en/LAN_PILOT.md) and [server deployment record](docs/en/SERVER_DEPLOYMENT.md). Actual Windows interoperability with Wright remains to validate.

See [Mac connector validation](docs/en/MAC_SERVER_CONNECTOR.md). For actual Windows setup, see [Wright onboarding](docs/en/WINDOWS_ONBOARDING.md).

## Codex skill

Use `$agent-bridge` to inspect connections, prepare handoffs and perform authorized pairing operations. See [installation and usage](docs/en/SKILL_USAGE.md). The skill neither replaces the background connector nor expands the fictional pilot scope.

## Continuous inbox (v0.2.0)

Run `pnpm inbox init` and `pnpm inbox start`, then queue a fixture with `pnpm inbox mock 1`. The background worker waits, replies, and supports stop/restart. See the [Mac receiver guide](docs/en/MAC_RECEIVER.md). Only fictional tasks are handled; real project code is not modified.

## Run locally

Run `pnpm install --frozen-lockfile`, then `pnpm demo`. Requires Node.js 22+, pnpm, and an authenticated Codex CLI. Scripted Wright queues two messages; real Codex replies in one conversation against a read-only fictional workspace. Real project code is not modified. See the [run guide](docs/en/LOCAL_DEMO.md).

## Documentation

- [Local project progress page](project.html): capabilities, flow, evidence, and next steps; [maintenance guide](docs/en/PROJECT_PAGE.md).

- [Worked collaboration example with Wright and mechanism diagram](docs/en/WRIGHT_COLLABORATION.md)

- [Product requirements and candidate validation scenarios](docs/en/PRODUCT.md)
- [Architecture and communication draft](docs/en/ARCHITECTURE.md)
- [Related projects and research boundaries](docs/en/RELATED_PROJECTS.md)
- [Roadmap and next steps](docs/en/ROADMAP.md)
- [Exploration context and handoff](docs/en/HANDOFF.md)

## What exists today

Completed: product documents, local real Codex replies, continuous scripted reception, a LAN HTTPS relay, and company server deployment. A Mac passed two simulated messaging rounds and restart persistence through the server.

Still to do: real owner identity comparison, actual Windows/Wright reception, two real agent endpoints, GitHub integration, full permission tests, and user trials. Calendar integration belongs to a later candidate scenario. The prototype uses built-in Node.js capabilities without third-party runtime dependencies; long-term protocol and deployment choices remain open.

This repository contains no real conversations, calendars, personal credentials, or third-party source code.

## Open source and participation

Agent Bridge is published under the [MIT License](LICENSE). The current pilot includes documentation, local demos, and LAN transport, with an onboarding skill and validation records. Share a work or everyday-life coordination problem, discuss a proposal, or suggest a documentation improvement through [Issues](https://github.com/jizw0704-source/agent-bridge/issues) or a pull request.

**English and Chinese contributions are welcome.** Keep product decisions and status changes aligned in both language versions.

Remove identifying details, contact information, actual contract text, account information, and credentials from examples you share. Referenced third-party projects remain subject to their own licenses.
