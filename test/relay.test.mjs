import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { relayInit, startRelay, relayRequest as call, safeEndpoint } from '../src/relay.mjs';
import { initPeer, PeerWorker, peerFixture } from '../src/peer.mjs';
const temporary = () => mkdtemp(join(tmpdir(), 'ab-relay-test-'));
async function setup(options = {}) {
  const root = await temporary(); await relayInit(root);
  const relay = await startRelay({ root, port: 0, ...options });
  const admin = JSON.parse(await readFile(join(root, 'admin.json'), 'utf8'));
  return { root, relay, admin: { url: relay.url, token: admin.token }, close: () => relay.close() };
}
async function pair(env, options = {}) {
  const room = await call(env.admin, 'create', options);
  const mac = { url: env.relay.url, room_id: room.room_id, token: room.token, role: 'mac', task_id: room.task_id };
  const joined = await call({ ...mac, token: '' }, 'join', { invite: room.invite });
  const windows = { ...mac, role: 'windows', token: joined.token };
  const status = await call(mac, 'status');
  await call(mac, 'confirm', { peer_identity: status.identities.windows });
  await call(windows, 'confirm', { peer_identity: status.identities.mac });
  return { mac, windows, invite: room.invite };
}
const question = id => ({ id, task_id: 'demo-export', kind: 'request', body: '演示：取消时不应写文件，请说明验收要求。' });

test('pairing, authentication, consent, single-use/expired invites and revocation', async () => {
  let clock = Date.now(); const env = await setup({ now: () => clock });
  try {
    await assert.rejects(call({ ...env.admin, token: 'wrong' }, 'create', {}), /401/);
    const room = await call(env.admin, 'create', {});
    const owner = { ...env.admin, token: room.token, room_id: room.room_id };
    await assert.rejects(call(owner, 'messages', question('q1')), /409/);
    clock += 600001;
    await assert.rejects(call(owner, 'join', { invite: room.invite }), /410/);
    const { mac, windows, invite } = await pair(env);
    await assert.rejects(call(mac, 'join', { invite }), /409/);
    await assert.rejects(call({ ...windows, token: 'wrong' }, 'inbox'), /401/);
    await call(mac, 'close', {});
    await assert.rejects(call(windows, 'inbox'), /410/);
  } finally { await env.close(); }
});

test('deduplication, sender authority, matching replies and durable relay restart', async () => {
  const env = await setup(); let relay = env.relay;
  try {
    const { mac, windows } = await pair(env);
    await call(mac, 'messages', question('q1'));
    assert.equal((await call(mac, 'messages', question('q1'))).duplicate, true);
    await assert.rejects(call(mac, 'messages', { ...question('q1'), body: 'changed' }), /409/);
    await assert.rejects(call(mac, 'messages', { ...question('q2'), task_id: 'real-project' }), /403/);
    await assert.rejects(call(mac, 'ack', { id: 'q1', status: 'processing' }), /404/);
    await call(windows, 'ack', { id: 'q1', status: 'processing' });
    await assert.rejects(call(mac, 'messages', { ...question('fake'), kind: 'reply', reply_to: 'q1' }), /409/);
    const reply = { id: 'r-q1', task_id: 'demo-export', kind: 'reply', reply_to: 'q1', body: 'reply' };
    await call(windows, 'messages', reply);
    const port = new URL(relay.url).port; await relay.close();
    relay = await startRelay({ root: env.root, port: Number(port) });
    assert.equal((await call(mac, 'inbox')).messages[0].body, 'reply');
    await call(mac, 'ack', { id: 'r-q1', status: 'received' });
    assert.deepEqual((await call(mac, 'inbox')).messages, []);
    assert.equal((await call(windows, 'messages', reply)).duplicate, true);
    await assert.rejects(call(windows, 'messages', { ...reply, id: 'another-reply' }), /409/);
  } finally { await relay.close(); }
});

test('two peers handle two rounds and no automatic reply loop; cached model result survives relay outage', async () => {
  const env = await setup(); let relay = env.relay;
  const { mac, windows } = await pair(env); let calls = 0;
  const macRoot = await temporary(), winRoot = await temporary();
  await initPeer(macRoot, mac); await initPeer(winRoot, windows);
  const a = new PeerWorker({ root: macRoot, log() {} });
  const b = new PeerWorker({ root: winRoot, log() {}, invoke: async args => { calls++; return { thread_id: 'windows-thread', body: 'reply ' + calls }; } });
  await a.open(); await b.open();
  try {
    await a.sendRequest('round one', 'q1'); await b.cycle(); await a.cycle();
    await a.sendRequest('round two', 'q2'); await b.cycle(); await a.cycle();
    await a.cycle(); await b.cycle(); assert.equal(calls, 2);
    assert.equal((await readdir(join(macRoot, 'received'))).length, 2);
    await b.close(); await b.open(); await b.cycle(); assert.equal(calls, 2);
    await a.sendRequest('round three outage', 'q3');
    const port = Number(new URL(relay.url).port);
    b.invoke = async () => { calls++; await relay.close(); return { thread_id: 'windows-thread', body: 'cached during outage' }; };
    await assert.rejects(b.cycle());
    relay = await startRelay({ root: env.root, port });
    await b.cycle(); await a.cycle(); assert.equal(calls, 3);
    assert.equal(b.state.inbound.q3.status, 'replied');
    assert.equal(await readFile(join(winRoot, 'sandbox/DEMO.txt'), 'utf8'), peerFixture);
    assert.equal((await readdir(join(winRoot, 'sandbox'))).length, 1);
  } finally { await a.close(); await b.close(); await relay.close(); }
});

test('LAN TLS pinning accepts the correct certificate and refuses a changed pin', async () => {
  assert.throws(() => safeEndpoint('http://192.168.1.2:8790'), /HTTPS/);
  const root = await temporary(); await relayInit(root);
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(root, 'tls.key'), '-out', join(root, 'tls.crt'), '-days', '1', '-subj', '/CN=AB-test'], { stdio: 'ignore' });
  const relay = await startRelay({ root, port: 0, tls: true });
  try {
    const admin = JSON.parse(await readFile(join(root, 'admin.json'), 'utf8'));
    const config = { url: relay.url, token: admin.token, fingerprint: relay.fingerprint };
    const room = await call(config, 'create', {}); assert.ok(room.room_id);
    await assert.rejects(call({ ...config, fingerprint: '0'.repeat(64) }, 'create', {}), /fingerprint/);
    const state = JSON.parse(await readFile(join(root, 'relay-state.json'), 'utf8')); assert.equal(Object.keys(state.rooms).length, 1);
    assert.ok(!JSON.stringify(state).includes(room.token)); assert.ok(!JSON.stringify(state).includes(room.invite));
  } finally { await relay.close(); }
});

test('failed Codex work stays blocked across connector restart; relay init protects existing files', async () => {
  const protectedRoot = await temporary(); await writeFile(join(protectedRoot, 'keep.txt'), 'keep');
  await assert.rejects(relayInit(protectedRoot), /empty/);
  assert.deepEqual(await readdir(protectedRoot), ['keep.txt']);
  const env = await setup();
  const { mac, windows } = await pair(env);
  const root = await temporary(); await initPeer(root, windows); let calls = 0;
  const worker = new PeerWorker({ root, log() {}, invoke: async () => { calls++; throw new Error('model offline'); } });
  await worker.open();
  try {
    await call(mac, 'messages', question('failed-question'));
    await assert.rejects(worker.cycle(), /model offline/);
    await worker.close(); await worker.open(); await worker.cycle();
    assert.equal(calls, 1); assert.equal(worker.state.inbound['failed-question'].status, 'failed');
    const state = JSON.parse(await readFile(join(root, 'peer-status.json'), 'utf8'));
    assert.equal(state.phase, 'blocked');
  } finally { await worker.close(); await env.close(); }
});


test('owner refresh invalidates old invites without extending room lifetime', async () => {
  let clock = Date.now(); const env = await setup({ now: () => clock });
  try {
    const room = await call(env.admin, 'create', {});
    const mac = { ...env.admin, token: room.token, room_id: room.room_id };
    const deadline = (await call(mac, 'status')).expires_at;
    await assert.rejects(call({ ...mac, token: 'wrong' }, 'invite', {}), /401/);
    clock += 600001;
    const fresh = await call(mac, 'invite', {});
    await assert.rejects(call(mac, 'join', { invite: room.invite }), /401/);
    assert.equal((await call(mac, 'status')).expires_at, deadline);
    const joined = await call(mac, 'join', { invite: fresh.invite });
    await assert.rejects(call({ ...mac, token: joined.token }, 'invite', {}), /403/);
    await assert.rejects(call(mac, 'invite', {}), /409/);
    const near = await call(env.admin, 'create', {});
    const second = { ...mac, room_id: near.room_id, token: near.token };
    const end = (await call(second, 'status')).expires_at;
    clock = end - 1000;
    assert.equal((await call(second, 'invite', {})).invite_expires_at, end);
    clock = end + 1;
    await assert.rejects(call(second, 'invite', {}), /410/);
  } finally { await env.close(); }
});

test('unpaired worker waits without model calls and resumes after mutual confirmation', async () => {
  const env = await setup(); let calls = 0;
  const room = await call(env.admin, 'create', {});
  const mac = { ...env.admin, role: 'mac', token: room.token, room_id: room.room_id };
  const root = await temporary(); await initPeer(root, mac);
  const worker = new PeerWorker({ root, log() {}, invoke: async () => {
    calls++; return { thread_id: 'paired-thread', body: 'Only after both confirmations.' };
  } });
  const run = worker.run(10);
  const waitFor = async check => {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (await check()) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Pairing wait timed out');
  };
  try {
    await waitFor(async () => {
      try { return JSON.parse(await readFile(join(root, 'peer-status.json'), 'utf8')).phase === 'waiting-for-pairing'; }
      catch { return false; }
    });
    assert.equal(calls, 0);
    const joined = await call(mac, 'join', { invite: room.invite });
    const windows = { ...mac, token: joined.token };
    const status = await call(mac, 'status');
    await call(mac, 'confirm', { peer_identity: status.identities.windows });
    await assert.rejects(call(windows, 'messages', question('before-confirmation')), /409/);
    assert.equal(calls, 0);
    await call(windows, 'confirm', { peer_identity: status.identities.mac });
    await call(windows, 'messages', question('after-confirmation'));
    await waitFor(async () => (await call(windows, 'inbox')).messages.some(m => m.kind === 'reply'));
    assert.equal(calls, 1);
  } finally { worker.stopping = true; await run; await env.close(); }
});
