# Agent Bridge: exploration context and handoff

[简体中文](../HANDOFF.md) | [English](HANDOFF.md) · [Project home](../../README.en.md)

Original exploration record: September 9, 2026. Bilingual update: September 10, 2026.

## Latest progress: takes precedence over earlier suggestions

- The initiator requested open source publication. The repository is public under the MIT License. Published material consists of product and design documentation; there is no runnable service.
- The selected product direction is **automatic context organization with a Scenario Card**. The agent prepares relevant roles, goals, preferences, and information for the current situation, in a form the person can inspect and adjust. See [Product requirements v0.2](PRODUCT.md).
- Adding agent contacts creates ongoing interpersonal connections. Roles and situations shape how the agent represents its person; a contact relationship does not grant access to the entire personal profile.
- Renting is the current discussion example, covering contract understanding, actionable proposals for payment arrangements, deposits, and renewal follow-up. It is not a selected first MVP.
- Private evaluation context must be distinguished from information disclosed to the counterpart. Storage location, interface, confirmation timing, automatic commitments, and payment permissions remain undecided.
- Discuss one topic at a time, presenting concrete options, tradeoffs, and a recommendation before inviting a choice or revision. Avoid repeated open-ended questioning.
- A proposed flow is: a one-sentence request → automatic card preparation → agent negotiation → follow-up based on agreed terms. A conversation-centered interface with an expandable card and separate personal/counterpart views has been suggested, not selected. Continue from these proposals rather than restarting the discussion or beginning technical implementation.
- English documentation was requested to make the project accessible to an international audience. Keep both language versions aligned on decisions, scope, and status; English and Chinese discussion contributions are welcome.

## 1. Intent

Each person has a personal agent. When coordination is needed between people, their agents should communicate first and return issues requiring human judgment. The proposed connection between these agents is called Agent Bridge.

The scope includes both work and everyday life. It must not be narrowed to internal company agent orchestration, research tools, or a calendar application. The project is in exploration; there is no request to implement the entire system yet.

## 2. Established directions and open proposals

| Item | Status |
| --- | --- |
| Connect different people's personal agents | Explicit core direction |
| Cover work and everyday life | Explicit scope |
| Use the working name Agent Bridge and create a GitHub repository | Requested and completed |
| Review related GitHub projects | Six projects screened initially |
| Automatic context organization with a Scenario Card | Selected product direction |
| Authorization, necessary disclosure, and outcome confirmation | Proposed design principles; detailed experience remains open |
| Scheduling as the first minimum viable product (MVP) | Suggested, not selected |
| A2A and a self-hostable single service | Technical candidates, not selected or verified |
| Build independently, integrate a project, or contribute upstream | Undecided |
| Public repository and license | Open source publication requested; MIT adopted |
| Business model | Undecided |
| English content alongside Chinese | Requested; bilingual documentation added |

## 3. Basic flow discussed

Person A gives a request to Agent A. Agent A contacts Agent B through Bridge. Agent B responds according to B's preferences and permissions. The agents clarify or negotiate within bounded rounds, then return candidate outcomes to the people they represent.

Potential Bridge responsibilities include linking identities to people, contact discovery, adapting different agents, message delivery, permission checks, negotiation states, necessary event records, and human takeover. It need not store both people's full memories or have access to all their data.

In an early scheduling example, A wants a 30-minute conversation this week. B's agent shares only allowed time slots. Both people confirm the same resulting proposal before calendar execution. Previously authorized routine exchanges can happen without prompting for every message.

Other candidate scenarios include work coordination, client requests, research equipment bookings, meals with friends, family travel, and everyday services. They have not each been validated.

## 4. Distinctions to preserve

- An agent's technical identity and its authority from a person are different.
- Message receipt, willingness to negotiate, proposal confirmation, and successful external execution are separate states.
- Authorization can have a defined scope and expiration; an old confirmation cannot automatically apply to changed terms.
- Agents represent different people whose goals may conflict. Declining and ending negotiation must be possible.
- Incoming messages can request actions but cannot rewrite local permissions.
- Even sharing time slots reveals information. Minimal necessary disclosure is not zero disclosure.
- A self-hostable central service and end-to-end encryption are distinct capabilities.
- Real integrations depend on official interfaces offered by each agent product. None has yet been verified.

## 5. Related projects

The following reflects the September 9, 2026 metadata and documentation review, not a new review performed for this translation. No project was installed, run, or fully audited. Refresh and test candidates before selecting technology.

| Project | Relevance |
| --- | --- |
| [A2A](https://github.com/a2aproject/A2A) | Agent2Agent protocol, a communication foundation candidate |
| [ANP](https://github.com/agent-network-protocol/AgentNetworkProtocol) | Agent Network Protocol: identity, discovery, and encrypted communication |
| [EnvoyMesh](https://github.com/allenpeng0705/EnvoyMesh) | Closely related personal agent collaboration, including an Agent Bridge module described in its README |
| [Tacit](https://github.com/tacitprotocol/tacit) | Personal agent contacts and mutually agreed introductions, in an early draft |
| [Society Protocol](https://github.com/societycomputer/society-protocol) | Peer-to-peer networking across machines, teams, and agents |
| [MCP Gateway & Registry](https://github.com/agentic-community/mcp-gateway-registry) | Enterprise reference for registration, discovery, identity, and access control |

Communication protocols and personal agent collaboration are not empty fields. Do not claim novelty or superiority without evidence. EnvoyMesh's README displayed MIT, but GitHub did not detect a license and no root LICENSE file was found in the original review; verify before code reuse. Sources, version snapshots, and limitations are in [Related projects](RELATED_PROJECTS.md).

## 6. Repository status

- [jizw0704-source/agent-bridge](https://github.com/jizw0704-source/agent-bridge): public, main branch, MIT License.
- Maintainer's existing local checkout: `/Users/bertil/Documents/agent-bridge`. Other contributors should use their own checkout path.
- Initial documentation commit: `6a12a19`, pushed and checked at the time. Consult Git history for subsequent changes.
- Includes a README, product requirements, architecture draft, related-project research, roadmap, handoff, and AGENTS.md. English editions are now available for the README and all five documents.
- No application code, running service, dependency lockfiles, or real calendar/agent integrations.
- Documentation whitespace and local links have been checked. There is no application formatter, linter, type checker, test suite, or build.

Creating a repository is not completing the Bridge product. This handoff contains no unrelated conversation history or private chat transcripts.

## 7. Earlier exploration suggestions

The original sequence was to clarify what a personal agent means, reconstruct a real coordination problem, compare work and everyday scenarios, then examine existing projects before selecting a validation goal and implementation path. Subsequent discussion established the Scenario Card direction and the rental example; use the latest progress above rather than asking settled questions again.

Possible evaluation measures include human exchanges, completion time, human corrections, incorrect commitments, model cost, and willingness to use the product again.

Questions to explore progressively:

- How to invite someone who has no agent, or fall back to ordinary communication?
- Which agent communicates externally when a person has multiple agents?
- How to stop or hand over when goals conflict, information is missing, or an agent misunderstands?
- Which actions can be authorized in advance, which need confirmation, and how is permission revoked?
- Where does personal memory remain, and what does Bridge retain?
- Do integration costs and privacy expectations favor a central service, personal nodes, or a hybrid?

Present concrete proposals and discuss one issue at a time; do not ask for answers to the entire list at once.

## 8. Reusable continuation prompt

> Continue exploring Agent Bridge at https://github.com/jizw0704-source/agent-bridge. Read AGENTS.md and docs/en/HANDOFF.md first, then the other documents as needed. The core idea is for different people's personal agents to communicate on their behalf across work and everyday life. We selected automatic context organization with a Scenario Card. Renting is our current discussion example, not a selected first release. Continue one topic at a time, presenting concrete options, tradeoffs, and a recommendation before asking for a choice. Clarify real needs and the product experience before technical implementation. Scheduling, A2A, and a single service remain candidates. There is no runnable service yet.

If a future conversation cannot access the repository, this document can be attached on its own to provide context.
