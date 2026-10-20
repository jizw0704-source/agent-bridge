# Agent Bridge skill: install and use

[简体中文](../SKILL_USAGE.md) | [English](SKILL_USAGE.md)

The `agent-bridge` skill guides repeatable AB onboarding, pairing, handoffs, reply inspection and recovery. It guides the active Codex; the separate connector still handles background reception. Skill installation does not prove receiver startup, mutual pairing or message delivery.

## Example requests

- `$agent-bridge Check whether my AB connection is online and identify the current blocker.`
- `$agent-bridge Wright is ready; refresh my invitation.`
- `$agent-bridge Draft this fictional handoff without sending it.`
- `$agent-bridge Show the reply to my previous handoff.`

The skill checks live state and acts within the user's authorization. Invocation alone does not authorize transmission or identity confirmation. The current pilot remains limited to fictional `demo-export`; real project changes, PR approvals and actual Windows acceptance are not completed capabilities.

## Mac

Installed at `~/.codex/skills/agent-bridge/`, with a path-only private binding at `~/.local/share/agent-bridge/skill-binding.json`. The binding contains app/peer paths, not tokens. Maintained source lives in `skills/agent-bridge/` in the repository; updating source does not automatically update the installed skill or background runtime snapshot.

```sh
node ~/.codex/skills/agent-bridge/scripts/ab-status.mjs
```

For a custom `CODEX_HOME`, use its skills directory. Codex normally detects new skills automatically; restart Codex if it does not appear. You can also explicitly ask the current chat to read the installed SKILL.md.

## Wright's Windows

Keep the existing AB application archive and [Windows onboarding guide](WINDOWS_ONBOARDING.md). The skill does not bundle Node, Codex or the AB runtime. Extract the `agent-bridge` folder from `agent-bridge-skill-20261020.zip` into the skills directory. Inspect any existing same-name skill rather than overwriting it:

```powershell
$AbSkillHome = if ($env:CODEX_HOME) { Join-Path $env:CODEX_HOME 'skills' } else { Join-Path $env:USERPROFILE '.codex\skills' }
New-Item -ItemType Directory -Force $AbSkillHome | Out-Null
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\agent-bridge-skill-20261020.zip" -DestinationPath $AbSkillHome
```

Then ask Codex: `$agent-bridge Check my setup and connect to AB using the application folder I extracted.` It checks prerequisites, creates a private path-only binding, and follows invitation and mutual-confirmation procedures. No server password or Mac participant token is needed.

Complete real bidirectional acceptance using the Windows guide. The skill reduces missed steps; it does not replace native Windows testing. An AB source archive containing `skills/agent-bridge` can also supply the folder directly.

## Validation and boundaries

All 19 local tests pass. New tests cover missing setup, offline inspection, unpaired-but-reachable state, and sanitizing token/message content from output. The skill passed the official creator's structural validator, and its installed Mac copy was used for a live read-only status check. The server previously passed 16 runtime tests and was not restarted or modified for skill installation.

The skill contains no actual server addresses, usernames, identity codes, invitations, tokens, private keys or login files. Path bindings remain separate from communication credentials. Implicit invocation stays enabled by default. Actual new scenarios still require evidence-based acceptance; native Windows and independent model behavior evaluation have not been performed.

[Official skill discovery guidance](https://learn.chatgpt.com/docs/build-skills#install-curated-skills-for-local-use).
