import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { atomicJSON } from '../src/bridge.mjs';
import { observerInit, observerSnapshot, observerDemo, startObserver } from '../src/observer.mjs';

const fixture = (clock = Date.now()) => ({ rooms: { synthetic: {
  id: 'synthetic', task_id: 'demo-export', created_at: clock - 1000, expires_at: clock + 60000,
  invite_digest: 'private-invite-digest', token: 'private-room-token',
  people: { mac: { confirmed: true, digest: 'private-mac-digest', identity: 'private-mac-identity' }, windows: { confirmed: true, digest: 'private-windows-digest', identity: 'private-windows-identity' } },
  messages: [{ id: 'q1', from: 'mac', to: 'windows', kind: 'request', status: 'queued', body: '<img src=x onerror=alert(1)>\n**Synthetic task**', created_at: clock, extra_secret: 'private-message-field' }]
} } });

async function setup(options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'ab-observer-test-'));
  const state = fixture(options.now?.());
  await atomicJSON(join(root, 'relay-state.json'), state);
  await observerInit(root);
  const { access_key } = JSON.parse(await readFile(join(root, 'observer-access.json'), 'utf8'));
  const observer = await startObserver({ relayRoot: root, authRoot: root, port: 0, pollMs: 25, ...options });
  const call = (path, settings) => fetch(observer.url + path, settings);
  const login = async () => {
    const response = await call('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: access_key }) });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  return { root, state, observer, call, login, access_key };
}

test('observer projection excludes credentials and identities, and distinguishes replies, failures and archived rooms', () => {
  const clock = 1800000000000;
  const state = fixture(clock), room = state.rooms.synthetic;
  let result = observerSnapshot(state, clock);
  assert.equal(result.rooms[0].status, 'waiting');
  assert.equal(result.rooms[0].counts.pending, 1);
  assert.equal(result.rooms[0].messages[0].body, room.messages[0].body);
  assert.ok(!JSON.stringify(result).includes('private-'));
  room.messages[0].status = 'failed';
  assert.equal(observerSnapshot(state, clock).rooms[0].status, 'attention');
  room.messages.push({ id: 'r1', from: 'windows', to: 'mac', kind: 'reply', reply_to: 'q1', status: 'received', body: 'Synthetic answer', created_at: clock + 1 });
  result = observerSnapshot(state, clock);
  assert.equal(result.rooms[0].status, 'answered');
  assert.deepEqual(result.rooms[0].counts, { messages: 2, requests: 1, answered: 1, pending: 0, failed: 0 });
  assert.equal(observerSnapshot(state, clock + 60001).rooms[0].status, 'expired');
  room.revoked = true;
  assert.equal(observerSnapshot(state, clock).rooms[0].status, 'closed');
  assert.equal(observerDemo(clock).mode, 'demo');
});

test('viewing key is separate from relay credentials; sessions protect records and never write relay state', async () => {
  const env = await setup();
  try {
    const original = await readFile(join(env.root, 'relay-state.json'), 'utf8');
    assert.equal((await env.call('/health')).status, 200);
    assert.deepEqual(await (await env.call('/api/session')).json(), { authenticated: false, demo_only: false });
    assert.equal((await env.call('/api/snapshot')).status, 401);
    assert.equal((await env.call('/api/events')).status, 401);
    assert.equal((await env.call('/api/login', { method: 'POST', body: JSON.stringify({ key: 'incorrect' }) })).status, 401);
    assert.equal((await env.call('/api/login', { method: 'POST', headers: { Origin: 'https://untrusted.invalid' }, body: JSON.stringify({ key: env.access_key }) })).status, 403);
    const cookie = await env.login();
    const response = await env.call('/api/snapshot', { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control'), /no-store/);
    const records = await response.text();
    assert.ok(!records.includes(env.access_key));
    assert.ok(!records.includes('private-'));
    assert.equal((await env.call('/rooms', { method: 'POST', headers: { Cookie: cookie }, body: '{}' })).status, 404);
    assert.equal((await env.call('/src/observer.mjs')).status, 404);
    assert.equal(await readFile(join(env.root, 'relay-state.json'), 'utf8'), original);
    assert.equal((await env.call('/api/logout', { method: 'POST', headers: { Cookie: cookie } })).status, 200);
    assert.equal((await env.call('/api/snapshot', { headers: { Cookie: cookie } })).status, 401);
    await assert.rejects(observerInit(env.root), /EEXIST/);
  } finally { await env.observer.close(); }
});

test('SSE follows atomic relay updates; logout ends the stream and revokes its session', async () => {
  const env = await setup(); const abort = new AbortController();
  try {
    const cookie = await env.login();
    const response = await env.call('/api/events', { headers: { Cookie: cookie }, signal: abort.signal });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);
    const reader = response.body.getReader();
    const first = new TextDecoder().decode((await reader.read()).value);
    assert.match(first, /event: snapshot/); assert.ok(!first.includes('private-'));
    env.state.rooms.synthetic.messages[0].status = 'processing';
    await atomicJSON(join(env.root, 'relay-state.json'), env.state);
    const next = await Promise.race([reader.read(), new Promise((_, reject) => setTimeout(() => reject(new Error('SSE did not update')), 2000).unref())]);
    assert.match(new TextDecoder().decode(next.value), /"status":"processing"/);
    await env.call('/api/logout', { method: 'POST', headers: { Cookie: cookie } });
    const ended = new TextDecoder().decode((await reader.read()).value);
    assert.match(ended, /event: auth-ended/);
  } finally { abort.abort(); await env.observer.close(); }
});

test('expired sessions, malformed source, login throttling and non-loopback TLS guard fail closed', async () => {
  let clock = Date.now(); const env = await setup({ now: () => clock, sessionMs: 1000 });
  try {
    const cookie = await env.login(); clock += 1001;
    assert.equal((await env.call('/api/snapshot', { headers: { Cookie: cookie } })).status, 401);
    const current = await env.login();
    await writeFile(join(env.root, 'relay-state.json'), '{invalid-source');
    const response = await env.call('/api/snapshot', { headers: { Cookie: current } });
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes(env.root));
    for (let attempt = 0; attempt < 8; attempt++) assert.equal((await env.call('/api/login', { method: 'POST', body: '{}' })).status, 401);
    assert.equal((await env.call('/api/login', { method: 'POST', body: '{}' })).status, 429);
    await assert.rejects(startObserver({ host: '0.0.0.0' }), /requires TLS/);
    await assert.rejects(startObserver({ host: '192.168.1.2', tls: true, demo: true }), /loopback/);
  } finally { await env.observer.close(); }
});

test('public demo is explicitly synthetic and never exposes a live snapshot', async () => {
  const observer = await startObserver({ demo: true, port: 0 });
  try {
    const call = path => fetch(observer.url + path);
    assert.equal((await (await call('/api/demo')).json()).mode, 'demo');
    assert.equal((await call('/api/snapshot')).status, 404);
    const page = await call('/'); assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
    assert.equal((await call('/app.js')).status, 200);
  } finally { await observer.close(); }
});
