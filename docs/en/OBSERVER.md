# Conversation observer (v0.4.0)

[简体中文](../OBSERVER.md) | [English](OBSERVER.md)

Updated October 21, 2026. The observer is a read-only server web app that reads the existing relay's `relay-state.json`. It displays exchanged requests, replies, timestamps and processing status. It does not read private agent reasoning or other local chats, invoke models, send messages, or approve work for people.

## What it shows

- Conversations on the left and chronological messages on the right, retaining only speaker, time, body and necessary exception states. Closed and expired rooms retain readable history.
- Paragraphs, bold text, inline code and code blocks render as safe DOM nodes; remote HTML does not execute. Reply relationships are available on hover and retained in exports.
- Conversation/content search, live updates, paused reading and manual refresh. Pause, export, language and sign-out controls sit in the top-right menu.
- Chinese/English controls, a mobile conversation drawer, and full-conversation Markdown export. Introductory text, metric cards, progress sidebars, pairing cards and message IDs no longer occupy the interface. Exports contain private conversation data and must stay out of Git.

Paired, received and replied are separate facts. None proves current agent presence, real project changes, successful tests or human approval. The relay has no presence heartbeat, so the UI does not infer that either agent is online. Message bodies remain in their original language; switching the interface does not translate private text.

## Local demo

Requires Node.js 22+ and pnpm. No third-party runtime dependencies or build step.

```sh
pnpm install --frozen-lockfile
pnpm observer demo 8876
```

Open `http://127.0.0.1:8876`. The clearly labeled fictional demo never connects to a real relay. Production supports `/?demo=1`; sign-in retains only the key input. A failed live source never silently switches to fictional data.

## Connect an existing relay

Run as an account allowed to read the relay files. Keep state and viewing credentials outside Git. Replace these paths with actual absolute paths; do not initialize an existing relay again.

```sh
pnpm observer init /absolute/private/observer-access
pnpm observer serve /absolute/private/relay-state /absolute/private/observer-access 8791 --host LAN_IP --tls
```

`RELAY_DIR` must contain `relay-state.json`, `tls.crt` and `tls.key`. The default listener is loopback-only; non-loopback binding requires TLS. `--tls-dir /absolute/private/tls-directory` can select a separate directory containing `tls.crt` and `tls.key`, allowing a dedicated browser-trusted certificate. Do not replace the running relay's certificate to solve browser trust: doing so would affect existing peer certificate pins.

Initialization generates private `observer-access.json`; its `access_key` is the viewing key. An existing file is never overwritten. Read the key only in a private terminal and enter it on the sign-in page. Keep it out of URLs, Git, screenshots and public documents. It grants read access to all retained rooms on this relay and must only be given to authorized viewers. The browser does not use the relay admin token or either peer's credential.

Sign-in creates an HttpOnly, SameSite=Strict cookie, with Secure on TLS, lasting at most twelve hours. Server restarts require sign-in again. Signing out revokes that session and its live streams. The key is not written to browser local storage. The API rejects cross-origin requests, throttles failed logins, and explicitly selects returned message fields, excluding invites, token digests and identity codes. Message bodies remain readable data; automatic detection or redaction of sensitive information typed into a body by its sender is not promised.

Production API: `GET /api/session`, `POST /api/login`, `POST /api/logout`, `GET /api/snapshot`, `GET /api/events`. The last two require sign-in. SSE checks relay changes every two seconds and sends a read heartbeat every fifteen seconds. `GET /health` exposes only service health/version; `GET /api/demo` returns fictional examples only. The observer provides no relay mutation endpoint.

## Linux background deployment

Place the same source in an independent release directory and run the installer using the existing dedicated Node.js 22+ runtime:

```sh
/absolute/node scripts/install-observer.mjs --relay-root /absolute/private/relay-state --host LAN_IP
```

Optional arguments: `--install-root DIR`, `--port 8791`. The installer only creates/enables the user-level `agent-bridge-observer.service` and a separate viewing key. It preserves an existing key and backs up an existing observer unit. It does not modify or restart `agent-bridge-relay.service`. Private runtime defaults to `~/.local/share/agent-bridge-observer/`. Retain the deployed source directory: the unit refers directly to that release.

```sh
systemctl --user status agent-bridge-observer.service --no-pager
journalctl --user -u agent-bridge-observer.service -n 30 --no-pager
systemctl --user restart agent-bridge-observer.service
systemctl --user disable --now agent-bridge-observer.service
```

Stopping the observer neither stops the relay nor deletes conversations. Persistent user services require systemd linger for that account. See the [deployment record](SERVER_DEPLOYMENT.md) for the pilot certificate expiry. Manage browser trust and renewal for the actual deployment; do not disable certificate verification.

## Checks and verification limits

```sh
pnpm check
node --test test/observer.test.mjs
pnpm test
git diff --check
```

October 21, 2026: five observer tests cover field projection, authentication, cross-origin rejection, read-only state, SSE updates, logout/expiry, throttling, damaged source and isolated demo mode. New tests pass on Windows. Three existing full-suite tests need Unix executables, symlink privileges or OpenSSL; the complete suite was therefore checked on the Debian deployment server with Node.js 22.23.3: all 24 pass. No real model was invoked.

Browser checks cover desktop, a 390px narrow layout, language switching, search and conversation switching. Production checks separately cover health, unauthenticated rejection, viewing-key sign-in and reading the real relay. This validates the observer and relay read path, not business acceptance on both owners' actual devices. Public sources and validation records contain no real chats or deployment credentials.
