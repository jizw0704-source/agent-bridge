import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Receiver, initReceiver, enqueueMock, mockMessage } from '../src/receiver.mjs';
import { atomicJSON } from '../src/bridge.mjs';
async function root() { const path = await mkdtemp(join(tmpdir(), 'ab-receiver-test-')); await initReceiver(path); return path; }
async function waitFor(fn) { for (let i = 0; i < 100; i++) { if (await fn()) return; await delay(10); } throw new Error('Timed out'); }
const readState = async path => {
  try { return JSON.parse(await readFile(join(path, 'state.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { messages: {} }; throw error; }
};

test('continuous loop waits, receives delayed messages, resumes and gracefully stops', async () => {
  const path = await root(); const calls = [];
  const worker = new Receiver({ root: path, intervalMs: 10, log() {}, invoke: async args => {
    calls.push(args.threadId); return { thread_id: 'test-thread', body: 'reply' };
  } });
  const running = worker.run();
  try {
    await waitFor(async () => (await readdir(path)).includes('receiver.lock'));
    await delay(30); assert.equal(calls.length, 0);
    await enqueueMock(path, 1);
    await waitFor(async () => (await readState(path)).messages.w1?.status === 'replied');
    await delay(30); await enqueueMock(path, 2);
    await waitFor(async () => (await readState(path)).messages.w2?.status === 'replied');
    assert.deepEqual(calls, [null, 'test-thread']);
    await writeFile(join(path, 'STOP'), 'stop');
    await running;
    assert.equal((await readdir(path)).includes('receiver.lock'), false);
  } finally { worker.stopping = true; await running; }
});

test('exclusive worker, restart deduplication, third round and out-of-order queue', async () => {
  const path = await root(); const calls = [];
  const invoke = async args => { calls.push(args.message.message_id); return { thread_id: 'thread', body: 'reply' }; };
  const first = new Receiver({ root: path, invoke, log() {} }); await first.open();
  try {
    const other = new Receiver({ root: path, invoke, log() {} });
    await assert.rejects(other.open(), /already running/);
    await enqueueMock(path, 2); await first.scan(); assert.deepEqual(calls, []);
    await enqueueMock(path, 1); await first.scan(); assert.deepEqual(calls, ['w1', 'w2']);
  } finally { await first.close(); }
  const next = new Receiver({ root: path, invoke, log() {} }); await next.open();
  try {
    await enqueueMock(path, 2); await enqueueMock(path, 3); await next.scan();
    assert.deepEqual(calls, ['w1', 'w2', 'w3']);
    await atomicJSON(join(path, 'inbox/w3.json'), { ...mockMessage(3), body: 'changed' });
    await next.scan(); assert.equal(calls.length, 3);
    assert.ok((await readdir(join(path, 'rejected'))).length > 0);
  } finally { await next.close(); }
});

test('bad JSON, foreign sender and symlinks are quarantined; failures never replay', async () => {
  const path = await root(); let calls = 0;
  const worker = new Receiver({ root: path, log() {}, invoke: async () => { calls++; throw new Error('offline'); } });
  await worker.open();
  try {
    await writeFile(join(path, 'inbox/bad.json'), '{');
    await atomicJSON(join(path, 'inbox/w9.json'), { ...mockMessage(9), sender: 'stranger' });
    await symlink(join(path, 'sandbox/DEMO.txt'), join(path, 'inbox/link.json'));
    await enqueueMock(path, 1); await worker.scan(); await worker.scan();
    assert.equal(calls, 1);
    assert.equal((await readState(path)).messages.w1.status, 'failed');
    assert.equal((await readdir(join(path, 'rejected'))).length, 6);
    assert.equal((await readdir(join(path, 'sandbox'))).length, 1);
  } finally { await worker.close(); }
});

test('stop during a turn finishes current reply without accepting next work', async () => {
  const path = await root(); let calls = 0;
  const worker = new Receiver({ root: path, intervalMs: 5, log() {}, invoke: async () => {
    calls++; await writeFile(join(path, 'STOP'), 'stop');
    return { thread_id: 'thread', body: 'reply' };
  } });
  await enqueueMock(path, 1); await enqueueMock(path, 2); await worker.run();
  assert.equal(calls, 1); assert.ok((await readdir(join(path, 'inbox'))).includes('w2.json'));
});

test('initialization refuses existing non-demo material', async () => {
  const path = await mkdtemp(join(tmpdir(), 'ab-real-fixture-'));
  await writeFile(join(path, 'real.txt'), 'preserve');
  await assert.rejects(initReceiver(path));
  assert.deepEqual(await readdir(path), ['real.txt']);
});
