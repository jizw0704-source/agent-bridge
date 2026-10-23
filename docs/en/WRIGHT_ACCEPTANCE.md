# Actual Mac / Wright Windows two-task acceptance

[简体中文](../WRIGHT_ACCEPTANCE.md) | [English](WRIGHT_ACCEPTANCE.md)

Acceptance date: October 23, 2026. Independent Mac check: 11:26, Asia/Shanghai. Runtime code: `e2434f1d566c359845eaa9ffda381c14e277d71a`.

## Outcome and scope

An actual Mac, Wright's Windows Codex, and the company LAN HTTPS relay passed persistent-contact pairing, two rounds of messaging initiated by each side in two independent tasks, and continued messaging in both directions after archiving one task. Content remained fictional under demo-export. This does not validate application export behavior, real code handoffs, or production operation.

| Check | Observed result |
| --- | --- |
| Persistent contact | Owners verified identities through their known channel; ready=true, expires_at=null |
| Independent tasks | A: pilot-cancel-001; B: pilot-format-001; requests and replies match their task |
| Two rounds in both directions | Both tasks completed Mac-initiated and Windows-initiated requests, replies, and receipt records |
| Mac session isolation and continuity | Different thread IDs for A and B; each second model turn reused its original ID, verified from local thread.started, turn.completed, and saved state |
| Archive A | archived; all 8 historical messages remain readable |
| Reject new A messages | CLI rejected the send; actual relay returned 409: Task is archived; message count stayed at 8 |
| B after archive, forward | A new Mac→Windows→Mac round trip completed with correct original and probe markers |
| B after archive, reverse | A fresh Windows request is replied; its matching Mac reply is received, acknowledged by Windows |
| Final queues | No Mac drafts or unsent messages; no pending relay requests or unreceived replies |
| Final lifecycle | A archived, B active; persistent contact remains ready=true |

## Independent check of the final round

Wright reported completion at 11:23:44. The Mac independently matched request and reply IDs on the relay: Windows originated the request in B, reply_to matched exactly, and the reply was received. The request omitted the original task marker. The Mac recalled that marker from B's context, repeated the new probe marker, and summarized unresolved CSV details. Local model events show reuse of B's original thread ID and turn.completed.

Windows only sent a request and received a reply in this round; no new Windows model call occurred. Wright reported the completed-model count remained 5. Receiving a reply is not Windows model-session resumption. Windows-local session, receiver, and draft facts are peer-reported; the Mac did not inspect Windows storage directly.

## Evidence and limits

Exact request/reply IDs, thread IDs, timestamps, and queue evidence remain in private acceptance directories. Public documentation excludes identities, credentials, configuration, network addresses, and full logs. Mac evidence includes mac-round2-evidence.json, archive-rejection-evidence.json, archive-and-b-evidence.json, and final-reverse-evidence.json.

Earlier deployment documents saying Windows acceptance was pending describe historical checkpoints. This record updates actual interoperability. Long-term stability, offline recovery, certificate renewal, real-work permissions, real-project execution, and business acceptance are not covered. Persistent contacts do not guarantee uninterrupted service. B remains active; no re-pairing or real-project edits occurred.
