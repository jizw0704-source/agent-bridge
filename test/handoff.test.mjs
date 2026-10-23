import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { encodeHandoff, handoffFields } from '../src/handoff.mjs';
const sample = JSON.parse(await readFile(new URL('../examples/fictional-test-report.json', import.meta.url), 'utf8'));
test('structured handoff retains Unicode and rejects missing evidence fields', () => {
  assert.deepEqual(JSON.parse(encodeHandoff(sample)), sample);
  const missing = structuredClone(sample); delete missing.details.actual;
  assert.throws(() => encodeHandoff(missing), /actual/);
  assert.throws(() => encodeHandoff({ ...sample, scope: 'real' }), /fictional/);
  assert.throws(() => encodeHandoff({ ...sample, permissions: 'approve PR' }), /Unknown/);
  assert.throws(() => encodeHandoff({ ...sample, summary: 'x'.repeat(8000) }), /limit/);
});
test('all five handoff types have strict schemas; references are data only', () => {
  for (const [type, fields] of Object.entries(handoffFields)) {
    const details = Object.fromEntries(fields.map(f => [f, ['steps', 'questions', 'open_questions', 'changes', 'verification', 'observations'].includes(f) ? ['fictional'] : f === 'result' ? 'inconclusive' : 'fictional']));
    assert.equal(JSON.parse(encodeHandoff({ ...sample, type, details, references: ['prior-message-id'] })).type, type);
  }
  assert.throws(() => encodeHandoff({ ...sample, type: '__proto__' }), /Unsupported/);
  assert.throws(() => encodeHandoff({ ...sample, revision: 1.5 }), /integer/);
});

test('send-structured queues a compatible body and rejects invalid input before queuing', async () => {
  const { mkdtemp, writeFile, rm, access } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { initPeer } = await import('../src/peer.mjs');
  const root = await mkdtemp(join(tmpdir(), 'ab-handoff-'));
  try {
    const peer = join(root, 'peer'), file = join(root, 'input.json');
    await initPeer(peer, { url: 'https://127.0.0.1:8790', role: 'mac' });
    await writeFile(file, JSON.stringify({ ...sample, scope: 'real' }));
    const cli = resolve('src/peer-cli.mjs');
    const rejected = spawnSync(process.execPath, [cli, 'send-structured', peer, file], { encoding: 'utf8' });
    assert.equal(rejected.status, 1);
    await assert.rejects(access(join(peer, 'draft.json')));
    await writeFile(file, '\uFEFF' + JSON.stringify(sample));
    const queued = spawnSync(process.execPath, [cli, 'send-structured', peer, file], { encoding: 'utf8' });
    assert.equal(queued.status, 0, queued.stderr);
    const draft = JSON.parse(await readFile(join(peer, 'draft.json'), 'utf8'));
    assert.deepEqual(JSON.parse(draft.body), sample);
    const duplicate = spawnSync(process.execPath, [cli, 'send-structured', peer, file], { encoding: 'utf8' });
    assert.equal(duplicate.status, 1);
    assert.equal((await readFile(join(peer, 'draft.json'), 'utf8')), JSON.stringify(draft)+'\n');
  } finally { await rm(root, { recursive: true, force: true }); }
});
