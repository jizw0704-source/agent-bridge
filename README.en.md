# Agent Bridge

[简体中文](README.md) | [English](README.en.md)

Connect people's personal AI agents so they can communicate, negotiate, and coordinate within the permissions each person grants.

**Status: product exploration and design drafts. There is no runnable service yet.** Started on September 9, 2026.

## Why Agent Bridge?

Arranging a meeting, coordinating a task, or clarifying a request often involves repeated questions and explanations. Personal agents could exchange the necessary information, work through possible arrangements, and bring decisions back to the people they represent. Agent Bridge explores this for both work and everyday life.

For example, two people want to meet for 30 minutes. Their agents could exchange only the time slots they are allowed to share, propose an arrangement, and request confirmation before creating a calendar event. Neither person needs to share their full calendar or private knowledge base. This is a candidate scenario, not an implemented feature or a selected first release.

## Product direction

Bridge is a proposed coordination layer between personal agents. Its potential responsibilities include linking agents to the people they represent, contacts, message delivery, permissions, negotiation progress, and records of agreed outcomes. Each agent remains under its own person's control.

We have selected **automatic context organization with a Scenario Card** as the product direction. An agent organizes the person's relevant role, goals, preferences, and information for the current situation. The person can inspect and adjust the card. Information used privately to evaluate a proposal is distinguished from information the agent may share with the other party.

One person may be a tenant, a traveler, a hotel guest, or a colleague in different situations. An ongoing agent contact could support multiple interactions over time. Adding a contact does not grant access to the person's entire profile.

Rental arrangements are the current discussion example: understanding contract terms, negotiating payment dates, and following up on renewal decisions. The first validation scenario has not been selected.

Agent2Agent (A2A) is an early protocol candidate. We will choose the technical approach after clarifying user needs and the product experience. Application-level agreements must be distinguished from protocol fields; no A2A compatibility has been implemented or verified.

Related projects already exist, particularly EnvoyMesh and Tacit. We do not claim that this idea is unique. We need to test whether AB makes integration easier, reduces the effort of coordination, and respects the permissions people grant.

## Documentation

- [Product requirements and candidate validation scenarios](docs/en/PRODUCT.md)
- [Architecture and communication draft](docs/en/ARCHITECTURE.md)
- [Related projects and research boundaries](docs/en/RELATED_PROJECTS.md)
- [Roadmap and next steps](docs/en/ROADMAP.md)
- [Exploration context and handoff](docs/en/HANDOFF.md)

## What exists today

Completed: concept documentation, initial requirements, an architecture draft, and a preliminary review of related projects.

Still to do: a runnable prototype, identity verification across users, real agent integrations, calendar integration, permission tests, and user trials. Protocol and technology choices remain proposals; no dependencies have been selected.

This repository contains no real conversations, calendars, personal credentials, or third-party source code.

## Open source and participation

Agent Bridge is published under the [MIT License](LICENSE). The current contribution opportunity is product exploration and documentation. Share a work or everyday-life coordination problem, discuss a proposal, or suggest a documentation improvement through [Issues](https://github.com/jizw0704-source/agent-bridge/issues) or a pull request.

**English and Chinese contributions are welcome.** Keep product decisions and status changes aligned in both language versions.

Remove identifying details, contact information, actual contract text, account information, and credentials from examples you share. Referenced third-party projects remain subject to their own licenses.
