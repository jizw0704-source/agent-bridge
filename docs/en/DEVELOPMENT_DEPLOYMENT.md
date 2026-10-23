# Development runtime: relay and Mac deployment

[简体中文](../DEVELOPMENT_DEPLOYMENT.md) | [English](DEVELOPMENT_DEPLOYMENT.md)

Deployed October 23, 2026. Runtime pinned to `d9d18eefa865c0cdd132dbcedb194d57f5c7c205`; this and later documentation commits do not imply another runtime upgrade.

## Completed

- Company HTTPS relay switched to a separate release snapshot, preserving state, certificate and contacts. Previous code and stopped-service state were backed up privately. All 54 server tests passed before switching.
- Mac communication receiver uses the same release. Installed Skill files match that snapshot. Previous Skill, launch configuration and contact state were backed up. All 54 Mac tests passed after installation.
- A separate Mac development receiver is bound to the existing Wright contact with an empty execution policy: no peer code execution is granted on the Mac; it is ready to receive reports.
- Formal contact remains ready=true with all 20 original messages, A archived and B active; no re-pairing.
- A separate synthetic contact on the actual relay verified development-v1 task creation, request/reply/receipt and scope-filtered inboxes. Its task was archived and contact closed. This is not actual Windows development acceptance.
- Observer health returned 200 and anonymous snapshot access 401. Its service and code were not restarted/upgraded; independent observer UI edits were not deployed.

## First task preparation

Dedicated public test repository: [ab-development-sandbox](https://github.com/jizw0704-source/ab-development-sandbox). Only fixture code and a description, no business or personal data.

- Task: dev-windows-label-001, development-v1.
- Repository ID: jizw0704-source/ab-development-sandbox.
- Pinned base: `e4abd7a85855dc11b64e1b023d5517cdea9226d5`, matching local and GitHub main.
- Modify only platform-label.mjs: add win32→Windows, preserving darwin→Mac and other→Other.
- Initial permission: edit, registered syntax/text checks and local commit only; automatic=false, push=false, draft_pr=false. No business repository actions.
- A private Mac handoff JSON is prepared but **not sent**. Wait for Wright to confirm the repository, local authority and upgraded receivers before AB delivery.

Follow [Wright onboarding](WRIGHT_DEVELOPMENT_ONBOARDING.md) at the pinned release. Wright must grant authority on his own computer. Bertil's deployment and the persistent contact do not substitute for that. After the task arrives awaiting authorization, Wright approves locally, then verifies actual changes, dedicated branch, checks and report delivery.

## Evidence and limits

Private deployment directories retain test output, summaries, backups and rollback references. Public Git excludes configuration, tokens, full logs and private host addresses. Roll back code/launch configuration only; never overwrite newly received messages with old state.

Deployment and basic communication checks passed. Actual Windows development execution, cross-machine clarification/cancellation/duplicates/isolation, automatic execution and actual GitHub push/draft PR remain pending. Syntax/text assertions are not functional tests. The existing TLS certificate was retained; automatic renewal was not implemented.
