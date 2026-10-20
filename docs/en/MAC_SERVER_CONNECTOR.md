# Mac Codex server connector: validation and operations

[简体中文](../MAC_SERVER_CONNECTOR.md) | [English](MAC_SERVER_CONNECTOR.md)

Updated October 20, 2026. The Mac background connector is connected to the company LAN relay using the locally authenticated Codex CLI. Its actual macOS LaunchAgent handled two simulated Wright requests with real Codex replies through the server, preserving one conversation, using no tools, leaving the fixture unchanged, and producing no idle reply loop. The test room is closed.

A separate fresh room and local state now hold the real Mac identity in `waiting-for-pairing`. Real Wright has not been contacted and Windows interoperability remains unverified. This is a separate Codex conversation, not a desktop-chat plugin or automatic import of the current chat.

## Local layout and operations

Private root: `~/.local/share/agent-bridge/mac-connector/`. `app/src` contains a runtime source snapshot, `mac-peer` the actual identity/state, `validation-peer` simulated validation records, `service-logs` service logs, and `connection-result.json` a token-free result summary. Runtime credentials and logs are excluded from the repository.

The LaunchAgent is `com.agentbridge.mac-peer`, successfully started in this session. `RunAtLoad=true` configures user-login startup, but a real logout/login has not been tested. Automatic crash restart is disabled. Sleeping computers do not process messages; the running connector retries after network recovery.

Local helper:

```sh
~/.local/share/agent-bridge/mac-connector/ab status
~/.local/share/agent-bridge/mac-connector/ab invite
~/.local/share/agent-bridge/mac-connector/ab confirm WINDOWS_IDENTITY
~/.local/share/agent-bridge/mac-connector/ab send /absolute/path/to/fictional-message.txt
~/.local/share/agent-bridge/mac-connector/ab stop
~/.local/share/agent-bridge/mac-connector/ab start
```

Before the peer joins, invite refreshes the invitation saved in `mac-peer/invite.json`, without printing its token. Previous invitations immediately become invalid. Privately share only the invitation, not config files, whole runtime folders, or Codex authentication. Each person compares identity codes through a known channel, then confirms. Processing starts when both confirmations make `ready=true`.

Stop finishes the current turn; start launches the registered service. Failed tasks and stale locks need inspection, not automatic replay. Close revokes the entire room and is not a routine pause.

The current room expires **October 21, 2026 at 10:51 UTC (18:51 China Standard Time)**. Refreshing a ten-minute invitation never extends the one-day room lifetime. Expiry requires a new room and pairing state. The server pilot certificate expires October 27, 2026 at 10:44 UTC; replacing it also requires updating both peers' pins.

## Acceptance status

- Mac and Debian each passed 16 tests, including refresh authorization, invalidated invites, unchanged room lifetime, and no model invocation before mutual confirmation.
- The actual Mac LaunchAgent received two simulated messages through the server and automatically produced two real Codex replies in one conversation.
- The real room contains only the Mac identity, with no peer messages; waiting for pairing makes no model calls.
- Next: give Wright the [Windows guide](WINDOWS_ONBOARDING.md) and source archive, issue a fresh invitation when ready, compare identities, and verify real bidirectional replies.

Services use isolated source snapshots; repository edits do not automatically update running services.
