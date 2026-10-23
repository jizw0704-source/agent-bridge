# Agent Bridge: exploration context and handoff

[简体中文](../HANDOFF.md) | [English](HANDOFF.md) · [Project home](../../README.en.md)

Deployment update: development-v1 is installed on relay and Mac; a dedicated test repo is ready. Actual Windows execution awaits local grants before delivery. See [deployment](DEVELOPMENT_DEPLOYMENT.md). Undeployed statements below describe the earlier publication checkpoint.

Local development handoff update: see [implementation](DEVELOPMENT_HANDOFF.md) and [Wright local authorization](WRIGHT_DEVELOPMENT_ONBOARDING.md). Source published; not deployed or accepted for Windows development execution; demo-export authority is unchanged.

Latest, October 23, 2026: actual Mac / Wright Windows two-task communication acceptance passed, including archive rejection, continued B communication in both directions, and Mac session isolation/resumption. See [final acceptance](WRIGHT_ACCEPTANCE.md). Pending statements below are historical; scope remains fictional.

October 20, 2026 skill update: `skills/agent-bridge` is installed on the Mac, providing live status inspection and guided Mac/Windows pairing and authorized handoffs. A credential-free skill archive is available; see [usage](SKILL_USAGE.md). Native Windows remains unverified; the skill does not expand communication authority.

October 20, 2026 Mac connector update: the LaunchAgent completed two real Codex replies to simulated Wright through the server. A separate real Mac identity is waiting for mutual pairing. See [Mac setup](MAC_SERVER_CONNECTOR.md) and [Windows onboarding](WINDOWS_ONBOARDING.md). Invitations can be refreshed; actual Windows operation remains unverified.

Latest, October 20, 2026: [company LAN server deployment](SERVER_DEPLOYMENT.md) passed two simulated messaging rounds from a Mac over the actual network, including persistence across service restart. Windows/Wright has not joined. This update supersedes earlier status descriptions below.

October 20, 2026 v0.3.0: the [LAN two-peer pilot](LAN_PILOT.md) adds an HTTPS relay, expiring one-use invites, mutual confirmation, deduplication, and independent inbox connectors. Development and validation use fictional tasks without real project edits. Actual Windows interoperability with Wright remains unverified; the local receiver is retained.

October 20, 2026 v0.2.0: the [continuous Mac receiver](MAC_RECEIVER.md) waits for local scripted Wright messages and calls real Codex, with serial rounds, stop/restart, deduplication, and quarantine. Idle waiting makes no model calls. Cross-machine transport, GitHub writes, and desktop plugins remain unimplemented. Earlier product descriptions below are design baselines; this update and the run guide take precedence.

Original exploration record: September 9, 2026. Latest update: October 20, 2026.

## Latest progress: takes precedence over earlier suggestions

- 2026-10-20: The selected first scenario is cross-platform application development with Wright: Mac/new-feature handoffs to Windows, multiple clarification rounds, change feedback, and PR review. The selected product approach is handoffs inside existing agents, AB inboxes and a progress view, and GitHub task references. See the [worked example](WRIGHT_COLLABORATION.md). A Node.js LAN pilot and Mac Codex integration are implemented; real-project action permissions and the full product interface remain to be designed and validated.

- The initiator requested open source publication. The repository is public under the MIT License. The current version includes product documentation, runnable pilot code, and an onboarding skill.
- The selected product direction is **automatic context organization with a Scenario Card**. The agent prepares relevant roles, goals, preferences, and information for the current situation, in a form the person can inspect and adjust. See [Product requirements v0.3](PRODUCT.md).
- Adding agent contacts creates ongoing interpersonal connections. Roles and situations shape how the agent represents its person; a contact relationship does not grant access to the entire personal profile.
- Renting is the current discussion example, covering contract understanding, actionable proposals for payment arrangements, deposits, and renewal follow-up. It is not a selected first MVP.
- Private evaluation context must be distinguished from information disclosed to the counterpart. Storage location, interface, confirmation timing, automatic commitments, and payment permissions remain undecided.
- Discuss one topic at a time, presenting concrete options, tradeoffs, and a recommendation before inviting a choice or revision. Avoid repeated open-ended questioning.
- A proposed flow is: a one-sentence request → automatic card preparation → agent negotiation → follow-up based on agreed terms. A conversation-centered interface with an expandable card and separate personal/counterpart views has been suggested, not selected. Continue from these proposals rather than restarting the discussion and keep implementation within the authorized pilot scope.
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
| First scenario and entry point | Cross-platform development with Wright; existing agents, AB inboxes/progress view, GitHub references |
| Scheduling | Earlier candidate, not the current first scenario |
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
- Real integrations depend on official interfaces offered by each agent product. Mac Codex CLI integration is verified; actual Windows operation remains unverified.

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
- Includes a README, product requirements, architecture draft, related-project research, roadmap, handoff, and AGENTS.md. English editions are now available for the README and all six documents, including the worked example.
- Includes Node.js pilot code, a pnpm lockfile, HTTPS relay, Mac Codex connector, and skill. There is no real calendar integration, and Wright has not joined.
- Validation commands: `pnpm check`, `pnpm test`, and `git diff --check`. There is no separate formatter, linter, type checker, or build.

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

> Continue exploring Agent Bridge at https://github.com/jizw0704-source/agent-bridge. Read AGENTS.md and docs/en/HANDOFF.md first, then the other documents as needed. The core idea is for different people's personal agents to communicate on their behalf across work and everyday life. We selected automatic context organization with a Scenario Card. Our first scenario is cross-platform development with Wright, using existing agents, AB inboxes and a progress view, and GitHub task references. Renting remains an everyday-life example. Continue one topic at a time, presenting concrete options, tradeoffs, and a recommendation before asking for a choice. Clarify real needs and the product experience before technical implementation. Scheduling, A2A, and a single service remain candidates. A runnable LAN pilot, Mac Codex connector, and onboarding skill exist; next validate actual Windows pairing using fictional tasks.

If a future conversation cannot access the repository, this document can be attached on its own to provide context.
