# Recovery

Use the status helper first. Preserve existing state and credentials. Read only the relevant error or trace. Do not weaken TLS checks, the Codex sandbox, enterprise policy or network security to make a test pass.

| Observation | Next action |
| --- | --- |
| Missing binding | Locate the intended app/peer paths and create the private path-only binding |
| Relay reachable, ready false | Wait for the missing identity/owner confirmation; no model call is needed |
| Local status stale or worker PID absent | Inspect the registered receiver; start it if requested/previously authorized, without creating a second worker |
| 401/403 | Check the selected room/role and config provenance; do not print tokens or keep retrying credentials |
| 410 / expired | Explain the current expiry; new room and pairing are needed, invite refresh cannot extend it |
| Invite expired, room still valid, no peer joined | Owner can refresh when requested; old invitation is invalidated |
| Fingerprint mismatch | Compare actual server certificate with the trusted deployment record; never disable verification |
| Codex executable/login error | Check the exact executable in the receiver's environment and the local person's login |
| Failed/incomplete model task | Inspect the saved state and corresponding trace; do not replay automatically or delete its dedupe record |
| Existing process lock | Identify the recorded PID and running command; never remove a lock just because startup failed |
| Transport failure after a saved reply | Let the running worker resend that cached reply; do not generate another answer |
| Socket EPERM or tool permission denial | Distinguish tool sandbox restrictions from network failure; use the normal authorized escalation mechanism |
| Network timeout | Check the actual destination, current route and targeted port; do not infer VPN failure from timeout alone |

Normal `stop` is graceful. On the configured Mac use the private `ab stop` / `ab start` helpers. A foreground Windows receiver can use Ctrl+C or `stop PEER_DIRECTORY`, then `run PEER_DIRECTORY`. Stopping one receiver is not revoking the room. `close` revokes both peers and requires an instruction to end the shared room.

A bounded status/recovery attempt should end with evidence and the exact remaining blocker. Do not install a recurring monitor, keep retrying forever, or create a new automation unless the user asks for it.

For mode=contact, expires_at=null is expected and does not remove TLS certificate expiry. A 410 may mean the relationship was explicitly revoked; inspect its provenance before proposing a new pairing. Archiving one task is not a disconnected contact. Use contact-cli stop/run for a contact directory; never revive or overwrite a legacy room to bypass expiry.
