# Development handoff review and source publication

[简体中文](../DEVELOPMENT_REVIEW.md) | [English](DEVELOPMENT_REVIEW.md)

October 23, 2026. This publication includes source, the repository Skill and bilingual documentation. It does not deploy the company relay, installed Mac receiver or Wright's Windows runtime.

## Review fixes

1. **Preserve concurrent human edits:** verify file content, task HEAD and workspace changes after model processing and before execution steps. External edits stop execution without overwriting them. Commits explicitly include only task files, excluding unrelated staged content.
2. **Constrain push destinations:** refuse unsupported URL rewrites, pushurl, extra HTTP routing, receivepack and mirror settings. Push uses an exact HTTPS GitHub URL and dedicated branch, with redirects disabled and TLS verification enabled. Local gh login supplies ephemeral URL-scoped credentials outside command arguments and persisted configuration. Injected-runner tests cover this path; actual GitHub push/PR creation remains unverified.
3. **Offline cancellation:** local status/cancel resolves saved private task state without contacting the relay. Remote cancellation remains network-dependent; already-started steps may finish.
4. **Grant/configuration consistency:** revalidate local permissions between steps; repository grant or Git configuration changes stop execution. Revoking automatic execution blocks later steps. Clarification still requires local approval or valid automatic permission.

## Checks and evidence

- pnpm check, 54/54 automated tests and git diff --check passed.
- Skill structure and new documentation links passed validation; no production dependencies added.
- After the fixes, actual Mac Codex completed a small Windows-label edit, syntax/text checks and a dedicated-branch commit in an isolated temporary repository. Evidence stays private; no model logs or temporary artifacts are committed publicly.
- Existing [actual Mac/Wright Windows communication acceptance](WRIGHT_ACCEPTANCE.md) remains valid, but does not prove development-execution acceptance.
- Independent observer edits are excluded from this commit. No UI change or UI acceptance is included.

Pending: deployment, Wright's explicit local grants, an agreed test repository, actual Windows execution/clarification/duplicates/cancellation/two-task isolation and automatic-mode acceptance. Arbitrary third-party commands and full build scripts remain outside this MVP. See [implementation](DEVELOPMENT_HANDOFF.md) and [Wright onboarding](WRIGHT_DEVELOPMENT_ONBOARDING.md).
