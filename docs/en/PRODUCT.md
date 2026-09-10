# Product requirements draft v0.2

[简体中文](../PRODUCT.md) | [English](PRODUCT.md) · [Project home](../../README.en.md)

Product baseline: September 9, 2026. English edition: September 10, 2026. The project is in exploration. Selected directions and unselected proposals are identified separately; nothing below has been implemented.

## Selected direction: automatic context organization with a Scenario Card

The project initiator selected the third of three options: a personal agent automatically organizes relevant roles, information, and preferences for the current request, then prepares a **Scenario Card** that the person can inspect and adjust. Scenario Card is a working product term. It is not a public profile that exposes all of a person's information.

- The same person can act as a tenant, traveler, hotel guest, or colleague. Relevant preferences can carry across roles without requiring separate, disconnected profiles.
- A card expresses the current role, core goal, negotiation preferences, information intended for disclosure, and information used only by the person's own agent to evaluate options.
- Agents should communicate with actionable proposals and adapt to feedback, rather than only relay requests. Understanding someone's preferences supports an initial judgment; it does not automatically authorize signing, payment, or other commitments.
- The proposed experience shows the organized context for a new type of situation and reuses it over time. Display timing, confirmation rules, reuse boundaries, and what counts as a significant change remain open.
- Adding an agent contact creates an ongoing relationship that may support multiple tasks. The contact relationship does not grant access to all personal information.

This selection establishes a product direction. We have not decided whether AB stores personal information or obtains it from existing agents, which scenario to validate first, what the interface will be, or which technical approach to use.

## Experience proposal: not yet selected

Proposed flow: the person describes a task in one sentence → the agent prepares a Scenario Card → the two agents discuss concrete proposals → agreed arrangements support subsequent follow-up. Negotiation outcomes, actual signatures, payments, and execution results must be presented separately.

The suggested interface centers on conversation, with the card available to expand. The person's view includes goals, preferences, reasoning behind a proposal, private reference information, and progress. The counterpart's view includes only the role, request, proposals, and agreements appropriate and authorized for disclosure.

Show the card proactively for first-time situations or important changes, while minimizing interruptions for familiar tasks. Displaying a card neither requires confirmation every time nor automatically grants authority to make commitments. These flow and view proposals were suggested by the assistant; a request to synchronize documentation does not constitute their acceptance.

## Current discussion scenario: rental arrangements

Renting a home is being used to understand real needs; it has not been selected as the first minimum viable product (MVP). Candidate activities include understanding contract terms, negotiating deposits, arranging payment dates and a transition rental period, and following up on renewal decisions.

An agent should explain terms and uncertainties. Any actual legal assessment would need the applicable jurisdiction, contract, and authoritative sources, while distinguishing legal requirements, clarity of wording, and personal tradeoffs. No actual contract review has been performed.

A proposal should explain both parties' concerns and specify date boundaries, calculation methods, and subsequent arrangements. Outcomes should preserve agreed terms, unresolved issues, and decisions that need the person. Authority to sign, transfer money, or automatically accept additional conditions remains undecided.

## User need

Each person has a personal agent. When coordination is needed between people, their agents can handle initial communication and return conclusions and questions requiring human judgment.

We want to reduce repeated questions, explanations, and information transfer across work and everyday life: renting, travel and accommodation, meetings, meals with friends, family trips, task coordination, business requests, and research equipment reservations. The first validation scenario is undecided; scheduling is only an early candidate.

## Roles

| Role | Responsibility |
| --- | --- |
| Person represented by an agent | Set preferences and permissions; accept or reject proposals; revoke authorization |
| Personal agent | Understand the person's request; propose, respond, and negotiate within granted permissions |
| Bridge | Organize communication context by role and scenario; connect contacts; check permissions; maintain negotiation progress and necessary records. The division of responsibilities with personal agents remains open |
| External tools | Query calendars or perform specific actions under separate authorization |

Authenticating an agent does not establish authority to make any commitment on someone's behalf. The link to that person, authorization scope, and expiration must be expressed separately.

## Early candidate: scheduling between two people, not selected

An early MVP proposal starts with two people who are already connected, simulated calendars, and two isolated agent adapters.

1. Person A specifies the contact, time range, duration, and allowed disclosures.
2. A's agent sends a request to B's agent.
3. B's agent returns only shareable time slots under B's authorization, or declines.
4. The agents negotiate a concrete proposal within a limited number of rounds.
5. Both people confirm the same proposal version. Changes invalidate prior confirmations.
6. Produce a confirmation record both can inspect. Execution is simulated initially; real calendar writes would be added later.

Distinguish receipt, willingness to negotiate, proposal confirmation, and successful external execution. One person's agreement is not the other's; a failed calendar write must not be shown as completion.

## Authorization experience

In the scheduling candidate, allow automatic exchange of a specified range of availability without approving every intermediate message. Initially, require both people to confirm a booking. The actual boundaries between individual confirmation and advance authorization have not been selected.

Authorization should specify the counterpart, information types, allowed actions, applicable task, and expiration, with revocation available. Incoming text cannot modify the local person's permissions.

Keep only necessary task states, confirmed versions, and event records. Retention periods and deletion rules must be decided before real data is connected. Private knowledge bases and full calendars stay on their respective sides.

## Suggested acceptance criteria for the scheduling candidate

- Two different people's agents complete a negotiation with messages in both directions.
- Only authorized time slots are shared, without private event titles, contacts, or knowledge-base excerpts.
- Execution is allowed only after both people confirm the same proposal version.
- Decline, cancellation, timeout, and no shared availability have understandable outcomes.
- Duplicate delivery cannot cause duplicate confirmation or execution. Recheck authorization and proposal validity before execution.
- An offline counterpart produces a waiting state; stop retrying at expiration. Bound negotiation rounds, runtime, and model cost.
- With real calendars, recheck availability before execution and handle recovery when one write succeeds but the other fails.

## Choices still to validate

- Which agents do initial users already use, and what official integration methods do they offer?
- Is scheduling frequent enough, or would request clarification reduce more communication effort?
- Which actions need individual confirmation, and which can be authorized in advance?
- Is a web entry point enough, or are DingTalk or mobile notifications needed?

Each agent, calendar, and messaging platform must be checked individually. Desktop AI products cannot be assumed to support external message exchange.
