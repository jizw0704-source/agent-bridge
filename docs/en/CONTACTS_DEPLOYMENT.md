# v0.4.0 deployment and two-task pre-acceptance

[简体中文](../CONTACTS_DEPLOYMENT.md) | [English](CONTACTS_DEPLOYMENT.md)

October 23, 2026. Runtime source commit: fec4b25778a04c802363423daaa797283e6a0539. Subsequent documentation/skill-routing commits do not automatically change runtime code. Relay and Mac were upgraded; observer service/branch remain separate.

Mac and Debian each passed 30 automated tests. Syntax and skill structure passed. Server state and the old current target were backed up; current now points to releases/fec4b25778a0 and the service is active. Rollback must stop the service and preserve newer state, never blindly overwrite new messages. Mac uses a dedicated release and new contact directory with the original LaunchAgent, peer state, and installed skill backed up. Installed skill was updated. The formal contact is non-expiring and waiting for actual Wright pairing, without formal messages/tasks; refresh the ten-minute invite only when ready.

A separate synthetic contact over the company network made three real Codex calls: task A, task B, return to A. Saved model sessions were distinct; A recalled its own marker rather than B’s. Archiving A preserved history, rejected a new send, and left B active. The synthetic contact was closed. Both relay and observer services are active; observer code was not modified and no message was sent to Wright.

These scripted roles ran on Mac, not Wright’s Windows. Actual upgraded Windows/two-task acceptance remains pending. Tasks still permit fictional demo-export only; no real-project edits or approvals occurred. Give Wright the [upgrade guide](WRIGHT_UPGRADE.md), align to the runtime commit above, use contact-cli for the new pairing, and verify pilot-cancel-001 and pilot-format-001 in both directions with task switching, restart continuation, and archiving. Observer grouping by collaboration_id needs separate acceptance.

The certificate still expires October 27, 2026 at 10:44 UTC / 18:44 China time. Persistent contacts do not renew certificates. Credentials, logs, invitations, raw outputs and backups remain private.
