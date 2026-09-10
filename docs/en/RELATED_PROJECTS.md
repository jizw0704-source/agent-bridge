# Related projects: preliminary review

[简体中文](../RELATED_PROJECTS.md) | [English](RELATED_PROJECTS.md) · [Project home](../../README.en.md)

**Research snapshot: September 9, 2026. Translation: September 10, 2026.** This translation does not refresh the research. The original review used search to identify candidates, GitHub API metadata, READMEs, and official documentation. It was a representative initial screen, not an exhaustive search, source-code security audit, or runtime test.

## Initial assessment

Agent communication already has protocols and implementations. Products for agents coordinating on behalf of individuals also exist. A proposed position for Bridge is personal agent coordination across work and everyday life, with an emphasis on accessible integration, fewer interruptions, explicit authorization, and dependable outcomes. Any claimed difference still needs comparative trials.

| Project and direct source | Direction described by the project | Relevance and limitations for Bridge |
| --- | --- | --- |
| [A2A](https://github.com/a2aproject/A2A) | Capability discovery, task communication, and result exchange between independent agent implementations | Communication foundation candidate; personal contacts and both parties' confirmation still need application design |
| [Agent Network Protocol](https://github.com/agent-network-protocol/AgentNetworkProtocol) | Agent identity, discovery, encrypted communication, and open-network collaboration | Relevant to cross-platform identity and open networks; its full scope may be unnecessary for an initial version |
| [EnvoyMesh](https://github.com/allenpeng0705/EnvoyMesh) | A peer-to-peer network of personal devices, agents acting under policies, and an external Agent Bridge | Close to this concept; compare usability and integration boundaries. Documentation claims are not verified capabilities in this review |
| [Tacit](https://github.com/tacitprotocol/tacit) | Agents discovering people, building trust, and making introductions with mutual consent | Relevant to interpersonal coordination; an early v0.1 draft, with identity-protection claims not verified here |
| [Society Protocol](https://github.com/societycomputer/society-protocol) | A peer-to-peer network across machines, teams, and agents | Useful for integration and cross-device communication; suitability for agents representing independent people remains to be evaluated |
| [MCP Gateway & Registry](https://github.com/agentic-community/mcp-gateway-registry/blob/main/docs/a2a.md) | Agent registration, discovery, access control, and invocation through a gateway | Reference for identity and routing; enterprise governance may be too heavy for personal use |

## Activity and license snapshot

Push dates use GitHub API timestamps in UTC. Stars indicate attention, not quality. None of the six repositories was archived at the time of the original review. These figures are historical, not live statistics.

| Project | Stars | Last push date (UTC) | License detected by GitHub |
| --- | ---: | --- | --- |
| A2A | 25,696 | 2026-09-04 | Apache-2.0 |
| Agent Network Protocol | 1,421 | 2026-09-06 | Apache-2.0 |
| EnvoyMesh | 825 | 2026-09-08 | Not detected; further verification needed |
| Tacit | 3 | 2026-03-03 | MIT |
| Society Protocol | 8 | 2026-07-11 | MIT |
| MCP Gateway & Registry | 902 | 2026-09-09 | Apache-2.0 |

EnvoyMesh's README displayed MIT, but the original GitHub API response had an empty license field and the root listing showed no LICENSE file. A badge alone was insufficient to establish the terms for code reuse. Check specific file licenses and dependency terms before reusing any project's code.

## Topics worth examining further

EnvoyMesh's README already described a module named Agent Bridge: its network layer handles signatures and policies, agents receive requests over HTTP, and agents do not directly hold identity keys. This is close to our proposed adapter boundary. “Agent Bridge” is a descriptive name; the review did not establish trademark availability or uniqueness.

A2A is a candidate for an interoperability test between two independent agents. Its specification covers task collaboration, but authorization from the people represented, confirmation expiration, and successful external execution need application-level modeling.

Tacit offers a reference for progressive disclosure following mutual consent. Anti-fraud and non-clonability claims should not be treated as established from its README alone.

Agent Network Protocol (ANP) documentation distinguishes formal specifications from unpublished drafts. Pin an adopted version and do not assume draft capabilities are implemented in an SDK.

## Versions referenced in the original review

- [A2A](https://github.com/a2aproject/A2A/tree/98853be376c88df25e1704771cd3ea9ef8823a96)
- [ANP](https://github.com/agent-network-protocol/AgentNetworkProtocol/tree/77caaaf746a6c23cd8368e68a4ae23793b270dd6)
- [EnvoyMesh](https://github.com/allenpeng0705/EnvoyMesh/tree/b979b0f65d6cc801a8d7d115a2ac25f4f88dda62)
- [Tacit](https://github.com/tacitprotocol/tacit/tree/e03773e62ba786baa797cc5cf98f08da093b7bbd)

## Early suggested route, not selected

The original suggestion was to study EnvoyMesh and Tacit, test A2A as a communication foundation, and use scheduling to measure reductions in human back-and-forth. Models, calendar integration, discovery of strangers, end-to-end encryption, and federation would be selected based on evidence from trials. The current [product direction](PRODUCT.md) takes precedence: the first scenario and technical choices remain open.

None of these projects was installed, executed, or copied during the original review. Performance, cross-platform behavior, security, and full compatibility were not verified.
