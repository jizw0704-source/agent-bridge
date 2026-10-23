import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inspectStatus } from '../skills/agent-bridge/scripts/ab-status.mjs';
async function fixture(source) {
  const root = await mkdtemp(join(tmpdir(), 'ab-skill-'));
  const app = join(root, 'app'), peer = join(root, 'peer');
  await mkdir(join(app, 'src'), { recursive: true }); await mkdir(peer);
  await writeFile(join(app, 'src/peer-cli.mjs'), source);
  const binding = join(root, 'binding.json');
  await writeFile(binding, '\uFEFF' + JSON.stringify({ app_dir: app, peer_dir: peer }));
  return { root, peer, binding };
}
test('skill status distinguishes absent setup and offline status without running the CLI', async () => {
  assert.equal((await inspectStatus(join(tmpdir(), 'ab-never-created-' + Date.now()))).status, 'setup-required');
  const f = await fixture('process.exit(99);');
  const report = await inspectStatus(f.binding, { offline: true });
  assert.equal(report.status, 'inspected'); assert.deepEqual(report.relay, { checked: false });
});
test('skill status exposes only safe metadata and distinguishes unpaired from unreachable', async () => {
  const remote = { ready: false, role: 'mac', expires_at: Date.now() + 600000,
    identities: { mac: '0123456789abcdef', windows: 'NOT-AN-IDENTITY-SECRET' },
    messages: [{ body: 'PRIVATE-MESSAGE' }], token: 'PRIVATE-TOKEN' };
  const f = await fixture('console.log(' + JSON.stringify(JSON.stringify(remote)) + ');');
  await writeFile(join(f.peer, 'peer-status.json'), JSON.stringify({ phase: 'waiting-for-pairing', pid: process.pid, updated_at: new Date().toISOString(), detail: 'PRIVATE-DETAIL' }));
  await writeFile(join(f.peer, 'peer-state.json'), JSON.stringify({ thread_id: null, inbound: { a: { status: 'failed', body: 'PRIVATE-BODY' } }, outbound: {} }));
  const result = await inspectStatus(f.binding);
  assert.equal(result.relay.reachable, true); assert.equal(result.relay.ready, false);
  assert.equal(result.worker.process_alive, true); assert.equal(result.worker.status_fresh, true);
  assert.equal(result.local.blocked_count, 1); assert(!JSON.stringify(result).includes('PRIVATE-'));
  assert(!JSON.stringify(result).includes('NOT-AN-IDENTITY-SECRET'));
});
test('skill status sanitizes CLI failure without calling it a proven network outage', async () => {
  const f = await fixture('console.error("401: PRIVATE-TOKEN");process.exit(1);');
  const result = await inspectStatus(f.binding);
  assert.equal(result.status, 'attention-required'); assert.equal(result.relay.reachable, null);
  assert.equal(result.relay.error, '401'); assert(!JSON.stringify(result).includes('PRIVATE-TOKEN'));
});
test('skill status handles a non-expiring contact without claiming it expired', async () => {
  const remote = { ready: true, role: 'mac', expires_at: null, lifetime: 'persistent', mode: 'contact', tasks: [{ id: 'one' }], identities: {}, messages: [] };
  const f = await fixture('console.log(' + JSON.stringify(JSON.stringify(remote)) + ');');
  const result = await inspectStatus(f.binding);
  assert.equal(result.relay.reachable, true); assert.equal(result.relay.expires_at, null);
  assert.equal(result.relay.expired, false); assert.equal(result.relay.task_count, 1);
  await writeFile(join(f.peer, 'peer-state.json'), JSON.stringify({ threads: { one: 'thread-one' }, inbound: {}, outbound: {} }));
  assert.equal((await inspectStatus(f.binding, { offline: true })).local.has_codex_session, true);
});
