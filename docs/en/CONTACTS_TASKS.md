# Persistent contacts and separate collaboration tasks

[简体中文](../CONTACTS_TASKS.md) | [English](CONTACTS_TASKS.md)

Final update, October 23, 2026: actual Mac / Wright Windows passed two-task bidirectional and archive-isolation acceptance. See [acceptance](WRIGHT_ACCEPTANCE.md). Earlier states below are historical; Kaysen remains unverified.

Deployment update, October 23, 2026: deployed to the relay and Mac; two-task pre-acceptance used real Codex. Actual upgraded Wright pairing is pending. See [deployment evidence](CONTACTS_DEPLOYMENT.md). The local-only description below is the pre-deployment baseline.

Updated October 23, 2026. Implemented locally with automated validation; not deployed to the company server or accepted with actual Wright/Kaysen peers. Existing rooms and connectors keep their original behavior and expiry; no implicit migration or renewal.

A contact is a mutually verified pair, retained until either person disconnects. Each contact has a separate private directory and receiver. There is no central address book or group chat. Storage retains rooms with mode=contact. Legacy mac/windows names are participant slots, not OS restrictions; actual Mac-to-Mac acceptance is still required.

Tasks have stable IDs, titles, active/archived state, message history, and separate Codex conversations. Either confirmed participant can create/archive tasks; task-level mutual approval is not implemented. Archiving is not business acceptance. The relay refuses archives with unresolved requests or unreceived replies; both sides must also inspect unsent local drafts. Archiving preserves the contact/history and rejects new messages.

Invites remain single-use and ten minutes long. Contact expires_at is null, but certificates still expire. Disconnect revokes both participants’ access and retains records. Reconnection requires fresh pairing; no deletion/automatic restoration is provided.

## Setup

Both sides and relay need the new source. Preserve private state and running snapshots. ADMIN stays with the administrator. Use actual absolute paths and quote Windows paths:

```sh
node src/contact-cli.mjs create ROOT ADMIN HTTPS_ORIGIN TLS_FINGERPRINT
node src/contact-cli.mjs invite ROOT
node src/contact-cli.mjs join PEER_ROOT INVITE_JSON
node src/contact-cli.mjs status ROOT
node src/contact-cli.mjs confirm ROOT VERIFIED_OTHER_IDENTITY
```

Compare identities through the owners’ known channel; both confirm. Only ready=true permits tasks/messages. Use contact-cli for new contacts; legacy peer CLI remains for old rooms.

## Collaboration

```sh
node src/contact-cli.mjs task-create ROOT cancel-test-001 "Fictional cancellation retest"
node src/contact-cli.mjs tasks ROOT
node src/contact-cli.mjs run ROOT
```

Run keeps the receiver foreground with the selected AB_CODEX_BIN. Use another terminal for:

```sh
node src/contact-cli.mjs send ROOT cancel-test-001 MESSAGE_TXT
node src/contact-cli.mjs send-structured ROOT cancel-test-001 REPORT_JSON
node src/contact-cli.mjs task-history ROOT cancel-test-001
node src/contact-cli.mjs task-archive ROOT cancel-test-001
node src/contact-cli.mjs stop ROOT
node src/contact-cli.mjs disconnect ROOT
```

Task creation retries use the same ID; identical content is idempotent, changed content conflicts. Sending requires an explicit active task; no implicit recent-task selection. Existing drafts are never overwritten. Stop pauses only the local receiver; disconnect revokes the whole relationship.

## Protocol and boundaries

Existing /rooms/:id routes remain. Task endpoints: GET/POST tasks, GET task-history?id=ID, POST archive-task. task_id=demo-export remains the permission scope; collaboration_id identifies an individual task. Replies must match a request in the same task. Already accepted duplicates remain idempotent after archival.

Receivers store threads[collaboration_id] to isolate conversations and resume them after restart. Legacy thread_id/configuration/history remain intact. New tasks only permit fictional demo-export discussion; separate PR-review work does not expand their authority. Real RAG reports and real-project actions need separately defined authorization and implementation.

Capacity remains bounded: 1000 tasks per contact and 1000 requests per side per task. No automatic compaction, credential rotation, or disk quota management. Observer task grouping requires collaboration_id support and remains Wright’s separate work; it was not changed or verified here.

Automated checks cover persistence across days/restarts, daily-room expiry, cross-contact isolation, cross-task reply rejection, archive preconditions/history/idempotency, task-local model conversations and restart, CLI pairing/queue/disconnect, and null-expiry status handling. Next: back up state and verify deployed versions, then accept actual new pairing and two independent tasks before switching the formal relationship. No expired rooms are silently revived and no permissions are transferred automatically.
