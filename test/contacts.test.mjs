import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { relayInit, startRelay, relayRequest as call } from '../src/relay.mjs';
import { initPeer, PeerWorker } from '../src/peer.mjs';
async function environment() {
  const root = await mkdtemp(join(tmpdir(), 'ab-contact-'));
  await relayInit(root);
  let clock = Date.now();
  let relay = await startRelay({ root, port: 0, now: () => clock });
  const admin = JSON.parse(await readFile(join(root, 'admin.json'), 'utf8'));
  const peers = [];
  async function pair(mode = 'contact') {
    const made = await call({ url: relay.url, token: admin.token }, 'create', mode === 'contact' ? { mode } : {});
    const a = { url: relay.url, token: made.token, room_id: made.room_id, role: 'mac', ...(mode === 'contact' ? { mode } : {}) };
    const joined = await call(a, 'join', { invite: made.invite });
    const b = { ...a, token: joined.token, role: 'windows' };
    const status = await call(a, 'status');
    await call(a, 'confirm', { peer_identity: status.identities.windows });
    await call(b, 'confirm', { peer_identity: status.identities.mac });
    peers.push(a, b); return { a, b };
  }
  return { root, pair, get url() { return relay.url; }, advance: ms => { clock += ms; },
    restart: async () => { await relay.close(); relay = await startRelay({ root, port: 0, now: () => clock }); peers.forEach(p => { p.url = relay.url; }); },
    close: async () => { await relay.close(); await rm(root, { recursive: true, force: true }); } };
}
const task = id => ({ id, title: `Fictional ${id}`, scope: 'demo-export' });
const request = (id, collaboration_id) => ({ id, collaboration_id, task_id: 'demo-export', kind: 'request', body: 'fictional question' });
test('contacts survive days and relay restart; tasks are isolated from other contacts; daily rooms still expire', async () => {
  const e = await environment();
  try {
    const { a, b } = await e.pair(), other = await e.pair(), legacy = await e.pair('legacy');
    await call(a, 'tasks', task('one'));
    await assert.rejects(call(b, 'tasks', { ...task('bad'), scope: 'real-project' }), /400/);
    await assert.rejects(call(b, 'tasks', task('__proto__')), /400/);
    assert.equal((await call(b, 'tasks', task('one'))).duplicate, true);
    await assert.rejects(call(b, 'tasks', { ...task('one'), title: 'different' }), /409/);
    await assert.rejects(call(other.a, 'messages', request('foreign', 'one')), /400/);
    e.advance(3 * 86400000); await e.restart();
    assert.equal((await call(a, 'status')).expires_at, null);
    assert.equal((await call(b, 'tasks')).tasks[0].id, 'one');
    assert.equal((await call(other.a, 'tasks')).tasks.length, 0);
    await assert.rejects(call(legacy.a, 'status'), /410/);
    await call(a, 'close', {});
    await assert.rejects(call(b, 'tasks'), /410/);
  } finally { await e.close(); }
});
test('task archive requires settled messages, preserves idempotency, and rejects cross-task replies', async () => {
  const e = await environment();
  try {
    const { a, b } = await e.pair();
    await call(a, 'tasks', task('one')); await call(b, 'tasks', task('two'));
    await assert.rejects(call(a, 'messages', { ...request('missing', undefined) }), /400/);
    await call(a, 'messages', request('q1', 'one'));
    await assert.rejects(call(b, 'archive-task', { id: 'one' }), /409/);
    const reply = { id: 'r-q1', task_id: 'demo-export', collaboration_id: 'one', kind: 'reply', reply_to: 'q1', body: 'fictional answer' };
    await assert.rejects(call(b, 'messages', { ...reply, collaboration_id: 'two' }), /409/);
    await call(b, 'messages', reply);
    await assert.rejects(call(b, 'archive-task', { id: 'one' }), /409/);
    await call(a, 'ack', { id: reply.id, status: 'received' });
    assert.equal((await call(b, 'archive-task', { id: 'one' })).task.status, 'archived');
    const history = await call(a, 'task-history?id=one');
    assert.equal(history.task.status, 'archived'); assert.equal(history.messages.length, 2);
    assert(history.messages.every(m => m.collaboration_id === 'one'));
    await assert.rejects(call(a, 'task-history?id=missing'), /404/);
    assert.equal((await call(a, 'messages', request('q1', 'one'))).duplicate, true);
    await assert.rejects(call(a, 'messages', request('q2', 'one')), /409/);
    await call(b, 'messages', request('q3', 'two'));
    assert.equal((await call(a, 'status')).messages.filter(m => m.collaboration_id === 'one').length, 2);
  } finally { await e.close(); }
});
test('connector keeps task model sessions separate and resumes the right task after restart', async () => {
  const e = await environment(); let worker;
  try {
    const { a, b } = await e.pair();
    for (const id of ['one', 'two']) await call(a, 'tasks', task(id));
    const root = join(e.root, 'peer'); await initPeer(root, b);
    const seen = [];
    const invoke = async ({ threadId }) => { seen.push(threadId || null); return { thread_id: threadId || `thread-${seen.length}`, body: 'fictional answer' }; };
    worker = new PeerWorker({ root, invoke, log: () => {} }); await worker.open();
    await call(a, 'messages', request('q1', 'one')); await worker.cycle();
    await call(a, 'messages', request('q2', 'two')); await worker.cycle();
    await worker.close(); worker = new PeerWorker({ root, invoke, log: () => {} }); await worker.open();
    await call(a, 'messages', request('q3', 'one')); await worker.cycle();
    assert.deepEqual(seen, [null, null, 'thread-1']);
    const state = JSON.parse(await readFile(join(root, 'peer-state.json'), 'utf8'));
    assert.equal(state.thread_id, null);
    assert.deepEqual(state.threads, { one: 'thread-1', two: 'thread-2' });
    const status = await call(a, 'status');
    assert.equal(status.messages.find(m => m.id === 'r-q3').collaboration_id, 'one');
  } finally { if (worker) await worker.close(); await e.close(); }
});

test('contact CLI creates and joins an explicit persistent relationship and queues an explicit task', async () => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const { resolve } = await import('node:path');
  const { writeFile, access } = await import('node:fs/promises');
  const exec = promisify(execFile), e = await environment();
  const cli = resolve('src/contact-cli.mjs');
  const run = (...args) => exec(process.execPath, [cli, ...args]);
  try {
    const a = join(e.root, 'a'), b = join(e.root, 'b');
    await run('create', a, e.root, e.url);
    await run('join', b, join(a, 'invite.json'));
    const sa = JSON.parse((await run('status', a)).stdout);
    assert.equal(sa.mode, 'contact'); assert.equal(sa.expires_at, null);
    await run('confirm', a, sa.identities.windows); await run('confirm', b, sa.identities.mac);
    await run('task-create', a, 'cli-task', 'Fictional CLI task');
    const input = join(e.root, 'message.txt'); await writeFile(input, 'Fictional question');
    await assert.rejects(run('send', a, 'missing', input));
    await assert.rejects(access(join(a, 'draft.json')));
    await run('send', a, 'cli-task', input);
    const draft = JSON.parse(await readFile(join(a, 'draft.json'), 'utf8'));
    assert.equal(draft.collaboration_id, 'cli-task');
    assert.equal(JSON.parse((await run('tasks', b)).stdout).tasks.length, 1);
    assert.equal(JSON.parse((await run('task-history', b, 'cli-task')).stdout).messages.length, 0);
    await run('disconnect', b);
    await assert.rejects(run('status', a));
  } finally { await e.close(); }
});
