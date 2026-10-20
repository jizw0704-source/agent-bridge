import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalBridge } from '../src/bridge.mjs';
const msg = (id, extra = {}) => ({ task_id: 'demo-export', sender: 'mock-wright', message_id: id, body: 'fixture', ...extra });
async function make(invoke) { const root = await mkdtemp(join(tmpdir(), 'ab-test-')); const b = new LocalBridge({ root, invoke }); await b.init(); return b; }
test('two rounds retain context and deduplicate after restart', async () => {
  const calls = [];
  const b = await make(async x => { calls.push(x.threadId); return { thread_id: 'test-thread', body: 'reply' }; });
  await b.receive(msg('w1')); await b.receive(msg('w2'));
  const again = new LocalBridge({ root: b.root, invoke: () => { throw new Error('must not run twice'); } });
  await again.init(); await again.receive(msg('w2'));
  assert.deepEqual(calls, [null, 'test-thread']);
  assert.equal(JSON.parse(await readFile(join(b.root, 'outbox/reply-w2.json'))).in_reply_to, 'w2');
  await assert.rejects(again.receive(msg('w2', { body: 'changed' })), /reused/);
});
test('invalid sender and out-of-order round cannot invoke Codex', async () => {
  const b = await make(() => { throw new Error('must not run'); });
  await assert.rejects(b.receive(msg('w1', { sender: 'stranger' })), /scope/);
  await assert.rejects(b.receive(msg('w2')), /First round/);
});
test('failure persists and is not automatically replayed', async () => {
  let calls = 0; const b = await make(async () => { calls++; throw new Error('offline'); });
  await assert.rejects(b.receive(msg('w1')), /offline/);
  await assert.rejects(b.receive(msg('w1')), /incomplete/);
  assert.equal(calls, 1); assert.equal(b.state.messages.w1.status, 'failed');
});
