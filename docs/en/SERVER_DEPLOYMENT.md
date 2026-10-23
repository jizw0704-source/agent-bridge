# Company LAN server deployment (v0.3.0 pilot)

[简体中文](../SERVER_DEPLOYMENT.md) | [English](SERVER_DEPLOYMENT.md)

October 21, 2026: the separate `agent-bridge-observer.service` now serves the HTTPS [conversation observer](OBSERVER.md). It reuses the dedicated Node.js 22.23.3 runtime and TLS certificate, reads relay state only, and did not restart the relay. All 24 server tests pass. Production checks cover health, unauthenticated rejection, separate viewing-key sign-in and existing-record reads. Real conversations, addresses and keys remain private runtime data. The following is the historical relay deployment record.

Updated October 20, 2026. The HTTPS relay is deployed on a Debian 12 company LAN server and has passed real network messaging checks from a separate Mac. Personal agents still run on their respective computers. The server handles transport and persistence; it needs neither Codex nor either person's Codex credentials.

## Deployment and verification

- Isolated Node.js 22.23.3 was downloaded from the official Node.js source and SHA-256 verified. The server's existing Node.js 18 was preserved.
- The deployment uses a local v0.3.0 working-tree snapshot with an archive checksum and per-file manifest, not a newly pushed Git commit.
- Mac and Debian passed syntax checks and all 14 automated tests. There is no separate compilation, formatter, lint, or type-checking pipeline.
- Over the actual LAN, the Mac simulated both roles for two request/reply rounds, checking duplicate suppression, pairing/message persistence across service restart, invalid credentials, incorrect certificate pins, and test-room closure.
- This server acceptance made no model calls, contacted no real Wright endpoint, and accessed no real business project. Earlier four-turn local Codex validation is separate evidence. Actual Windows interoperability remains unverified.

## Service layout

The deployment user's private root is `~/.local/share/agent-bridge-server/`:

| Path | Purpose |
| --- | --- |
| `runtime/` | Isolated AB Node runtime |
| `releases/0.3.0-20261020/` | Deployed source snapshot |
| `current` | Symlink to the active release |
| `state/` | Private tokens, messages, TLS certificate and key |
| `relay-server.mjs` | Launcher bound to the selected LAN IPv4 address, port 8790 |
| `source-manifest.json` | SHA-256 source-file manifest |
| `deployment-result.json` | Validation results without login or pairing credentials |

The enabled user service is `agent-bridge-relay.service`. The account already had systemd linger enabled, so the relay does not depend on an open SSH session. It binds only the selected LAN address, not every interface; no public forwarding was configured. Startup configuration was checked, but an actual server reboot was not performed or verified.

## Operations

Run as the deployment user on the server:

```sh
systemctl --user status agent-bridge-relay.service
journalctl --user -u agent-bridge-relay.service -n 50 --no-pager
systemctl --user restart agent-bridge-relay.service
systemctl --user stop agent-bridge-relay.service
systemctl --user start agent-bridge-relay.service
```

A graceful service restart passed acceptance. `Restart=no` deliberately avoids retrying after an abnormal crash with uncertain lock ownership. If `state/relay.lock` remains, verify that its process has exited and no other relay instance is running before removing the stale lock and starting the service. Never blindly remove locks. Use `systemctl --user disable --now agent-bridge-relay.service` to disable startup and stop; this preserves message state.

This pilot certificate expires **October 27, 2026 at 10:44 UTC (18:44 China Standard Time)**. Certificate replacement and both peers' pin updates must be arranged before expiry; automatic renewal is not implemented. Do not disable certificate checks to bypass expiry or a mismatch. Rooms last one day and invitations ten minutes. No real Wright invitation has been created yet.

## Next step

When Wright is ready, use the server's admin credentials to create a fresh invitation, configure the owner's Mac connector, and privately deliver the single-use invitation. Both people compare identity codes and run their connectors following the [LAN guide](LAN_PILOT.md), then verify actual Mac/Windows Codex replies in both directions.

Actual LAN addresses, logins, and runtime credentials are excluded from public documentation. The address and certificate pin are recorded in private local deployment records. The relay can read messages; this is not end-to-end encryption. Scope remains the fictional `demo-export` task.
