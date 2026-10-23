import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DevelopmentEngine, validateDevelopment, pushDevelopmentBranch } from '../src/development.mjs';
import { initializeDevelopment, DevelopmentPeer } from '../src/development-peer.mjs';
import { relayInit, startRelay, relayRequest as call } from '../src/relay.mjs';
import { initPeer, PeerWorker } from '../src/peer.mjs';
const exec = promisify(execFile);
async function fixture(invoke) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'ab-dev-'))), repo = join(root, 'repo'), dir = join(root, 'private');
  await mkdir(repo); await mkdir(dir);
  const git = async (...args) => (await exec('git', args, { cwd: repo })).stdout.trim();
  await git('init'); await git('config', 'user.name', 'Test'); await git('config', 'user.email', 'test@localhost');
  await git('remote', 'add', 'origin', 'https://github.com/example/ab-test.git');
  await writeFile(join(repo, 'sample.json'), '{"platform":"mac"}\n'); await git('add', '.'); await git('commit', '-m', 'base');
  const base = await git('rev-parse', 'HEAD'), contact = { room_id: 'room-one', identity: 'verified-peer' };
  const policy = { contacts: [{ ...contact, repositories: ['example/ab-test'] }], repositories: { 'example/ab-test': { path: repo, origin: 'https://github.com/example/ab-test.git', edit: true, commit: true, files: ['sample.json'], checks: { valid: { type: 'json', file: 'sample.json' } } } } };
  const savePolicy = () => writeFile(join(dir, 'policy.json'), JSON.stringify(policy)); await savePolicy();
  const engine = new DevelopmentEngine({ root: dir, invoke });
  const task = id => ({ type: 'handoff', id, repository: 'example/ab-test', base, goal: 'add reversible Windows label', files: ['sample.json'], acceptance: ['valid JSON with Windows label'], references: [], checks: ['valid'] });
  return { root, repo, dir, git, contact, policy, savePolicy, engine, task, key: id => ({ ...contact, id }), close: () => rm(root, { recursive: true, force: true }) };
}
const changes = (thread = 'thread-one') => ({ thread_id: thread, body: JSON.stringify({ kind: 'changes', files: [{ path: 'sample.json', content: '{"platform":"windows"}\n' }], remaining: [], decisions: [] }) });
test('real Git worktree edit/check/commit is owner-gated, isolated and idempotent', async () => {
  let calls = 0;
  const f = await fixture(async () => { calls++; return changes(); });
  try {
    assert.equal((await f.engine.submit(f.contact, f.task('one'))).status, 'awaiting-authorization'); assert.equal(calls, 0);
    const result = await f.engine.execute(f.key('one')); assert.equal(result.status, 'awaiting-review'); assert.match(result.commit, /^[a-f0-9]{40}$/); assert.deepEqual(result.checks, [{ name: 'valid', passed: true }]);
    assert.equal((await f.engine.submit(f.contact, f.task('one'))).commit, result.commit);
    await f.engine.execute(f.key('one')); assert.equal(calls, 1);
    assert.equal(await readFile(join(f.repo, 'sample.json'), 'utf8'), '{"platform":"mac"}\n'); assert.equal(await f.git('status', '--porcelain'), '');
    await assert.rejects(f.engine.submit(f.contact, { ...f.task('one'), goal: 'different' }), /conflict/);
  } finally { await f.close(); }
});
test('unauthorized contact, repo, push, file, check and dirty workspaces fail closed', async () => {
  let calls = 0; const f = await fixture(async () => { calls++; return changes(); });
  try {
    assert.equal((await f.engine.submit({ ...f.contact, identity: 'stranger' }, f.task('one'))).status, 'rejected');
    for (const [id, patch] of [['repo', { repository: 'other/repo' }], ['push', { push: true }], ['file', { files: ['secret.json'] }], ['check', { checks: ['shell'] }]]) {
      assert.equal((await f.engine.submit(f.contact, { ...f.task(id), ...patch })).status, 'rejected');
    }
    await f.engine.submit(f.contact, f.task('dirty')); await writeFile(join(f.repo, 'sample.json'), 'user edits');
    assert.equal((await f.engine.execute(f.key('dirty'))).status, 'failed'); assert.equal(calls, 0);
    assert.equal(await readFile(join(f.repo, 'sample.json'), 'utf8'), 'user edits');
    assert.throws(() => validateDevelopment({ ...f.task('path'), files: ['../secret'] }), /Unsafe/);
    assert.throws(() => validateDevelopment({ ...f.task('extra'), local_path: '/etc' }), /Unknown/);
  } finally { await f.close(); }
});
test('clarification resumes same task thread, other task remains independent', async () => {
  const seen = []; const f = await fixture(async ({ threadId, message }) => {
    const input = JSON.parse(message.body); seen.push([input.handoff.id, threadId]);
    if (input.handoff.id === 'one' && !threadId) return { thread_id: 'thread-A', body: JSON.stringify({ kind: 'clarify', question: 'Which platform label?' }) };
    return changes(threadId || 'thread-B');
  });
  try {
    await f.engine.submit(f.contact, f.task('one'));
    const first = await f.engine.execute(f.key('one')); assert.equal(first.status, 'awaiting-clarification');
    await assert.rejects(f.engine.answer(f.key('one'), 'wrong', 'Windows'), /match/);
    await f.engine.submit(f.contact, f.task('two')); assert.equal((await f.engine.execute(f.key('two'))).status, 'awaiting-review');
    await f.engine.answer(f.key('one'), first.question_id, 'Windows'); assert.equal((await f.engine.execute(f.key('one'))).status, 'awaiting-review');
    assert.deepEqual(seen, [['one', undefined], ['two', undefined], ['one', 'thread-A']]);
    assert.notEqual((await f.engine.load(f.key('one'))).worktree, (await f.engine.load(f.key('two'))).worktree);
  } finally { await f.close(); }
});
test('cancellation during model call prevents writes and reports prior effects; no automatic replay', async () => {
  let f; f = await fixture(async () => { await f.engine.cancel(f.key('one')); return changes(); });
  try {
    await f.engine.submit(f.contact, f.task('one')); const result = await f.engine.execute(f.key('one'));
    assert.equal(result.status, 'cancelled'); assert.deepEqual(result.changes, []); assert.equal(result.commit, undefined);
    assert.equal((await f.engine.execute(f.key('one'))).status, 'cancelled');
  } finally { await f.close(); }
});
test('invalid model paths and failed checks cannot produce commits; local grant revocation stops execution', async () => {
  const f = await fixture(async () => ({ thread_id: 'x', body: JSON.stringify({ kind: 'changes', files: [{ path: '../escape', content: 'bad' }] }) }));
  try {
    await f.engine.submit(f.contact, f.task('bad')); assert.equal((await f.engine.execute(f.key('bad'))).status, 'failed');
    f.engine.invoke = async () => ({ thread_id: 'x', body: JSON.stringify({ kind: 'changes', files: [{ path: 'sample.json', content: 'invalid json' }] }) });
    await f.engine.submit(f.contact, f.task('check')); const result = await f.engine.execute(f.key('check')); assert.equal(result.status, 'failed'); assert.equal(result.commit, undefined); assert.equal(result.checks[0].passed, false); assert.deepEqual(result.changes, ['sample.json']);
    f.engine.invoke = async () => { f.policy.contacts = []; await f.savePolicy(); return changes(); };
    await f.engine.submit(f.contact, f.task('revoke')); assert.equal((await f.engine.execute(f.key('revoke'))).status, 'failed');
  } finally { await f.close(); }
});
test('existing symlink source file is refused before invoking the model', async () => {
  let calls = 0; const f = await fixture(async () => { calls++; return changes(); });
  try {
    await rm(join(f.repo, 'sample.json')); await symlink('outside.json', join(f.repo, 'sample.json')); await f.git('add', '.'); await f.git('commit', '-m', 'symlink');
    const handoff = { ...f.task('link'), base: await f.git('rev-parse', 'HEAD') }; await f.engine.submit(f.contact, handoff);
    assert.equal((await f.engine.execute(f.key('link'))).status, 'failed'); assert.equal(calls, 0);
  } finally { await f.close(); }
});
test('local relay development handoff, owner approval, reporting and duplicate delivery; demo worker stays bounded', async () => {
  const f = await fixture(async () => changes()); let relay, demo;
  try {
    const relayRoot = join(f.root, 'relay'); await relayInit(relayRoot); relay = await startRelay({ root: relayRoot, port: 0 });
    const admin = JSON.parse(await readFile(join(relayRoot, 'admin.json')));
    const made = await call({ url: relay.url, token: admin.token }, 'create', { mode: 'contact' });
    const a = { url: relay.url, token: made.token, room_id: made.room_id, role: 'mac', mode: 'contact' };
    const joined = await call(a, 'join', { invite: made.invite }); const b = { ...a, token: joined.token, role: 'windows' };
    const status = await call(a, 'status'); await call(a, 'confirm', { peer_identity: status.identities.windows }); await call(b, 'confirm', { peer_identity: status.identities.mac });
    const pa = join(f.root, 'pa'), pb = join(f.root, 'pb'); await initPeer(pa, a); await initPeer(pb, b);
    const da = join(f.root, 'da'), db = join(f.root, 'db'); await initializeDevelopment(da, pa); await initializeDevelopment(db, pb);
    f.policy.contacts = [{ room_id: a.room_id, identity: status.identities.mac, repositories: ['example/ab-test'] }]; await writeFile(join(db, 'policy.json'), JSON.stringify(f.policy));
    let calls = 0; const sender = new DevelopmentPeer({ root: da }), receiver = new DevelopmentPeer({ root: db, invoke: async () => { calls++; return changes(); } });
    await sender.send('one', f.task('one'));
    demo = new PeerWorker({ root: pb, invoke: async () => { throw new Error('Demo must not execute development'); }, log: () => {} }); await demo.open(); await demo.cycle();
    await receiver.poll(); assert.equal(calls, 0); await sender.poll();
    const report = await receiver.approve('one'); assert.equal(report.status, 'awaiting-review'); assert.equal(calls, 1);
    await sender.poll(); await receiver.poll();
    await sender.send('one', f.task('one')); await receiver.poll(); assert.equal(calls, 1);
    const history = await call(a, 'task-history?id=one'); assert.equal(history.task.scope, 'development-v1');
    await assert.rejects(call(a, 'messages', { id: 'bad-scope', task_id: 'demo-export', collaboration_id: 'one', kind: 'request', body: 'wrong scope' }), /403/);
    f.policy.contacts[0].automatic = true; await writeFile(join(db, 'policy.json'), JSON.stringify(f.policy));
    let entered; const modelStarted = new Promise(resolve => { entered = resolve; });
    receiver.engine.invoke = async () => { calls++; entered(); await new Promise(resolve => setTimeout(resolve, 1100)); return changes(); };
    await sender.send('remote-cancel', f.task('remote-cancel'));
    const processing = receiver.poll(); await modelStarted;
    await sender.send('remote-cancel', { type: 'cancel', id: 'remote-cancel' });
    await processing; await sender.poll(); await receiver.poll(); await sender.poll();
    const cancelled = await receiver.engine.load({ room_id: a.room_id, identity: status.identities.mac, id: 'remote-cancel' });
    assert.equal(cancelled.status, 'cancelled'); assert.deepEqual(cancelled.changes, []); assert.equal(cancelled.commit, undefined);

  } finally { if (demo) await demo.close(); if (relay) await relay.close(); await f.close(); }
});
test('automatic execution requires explicit local opt-in and stops after cancelled or crashed task', async () => {
  let calls = 0; const f = await fixture(async () => { calls++; return changes(); });
  try {
    f.policy.contacts[0].automatic = true; await f.savePolicy();
    assert.equal((await f.engine.submit(f.contact, f.task('auto'))).status, 'awaiting-review'); assert.equal(calls, 1);
    f.policy.contacts[0].automatic = false; await f.savePolicy();
    await f.engine.submit(f.contact, f.task('cancel')); await f.engine.cancel(f.key('cancel'));
    assert.equal((await f.engine.execute(f.key('cancel'))).status, 'cancelled'); assert.equal(calls, 1);
    await f.engine.submit(f.contact, f.task('crash')); const s = await f.engine.load(f.key('crash')); s.status = 'executing'; await f.engine.save(f.key('crash'), s);
    assert.equal((await f.engine.execute(f.key('crash'))).status, 'executing'); assert.equal(calls, 1);
  } finally { await f.close(); }
});
test('model clarification is bounded and no arbitrary local command definition is accepted', async () => {
  let calls = 0; const f = await fixture(async () => { calls++; return { thread_id: 'one', body: '{"kind":"clarify","question":"Need a detail"}' }; });
  try {
    await f.engine.submit(f.contact, f.task('one'));
    for (let i = 0; i < 3; i++) { const r = await f.engine.execute(f.key('one')); assert.equal(r.status, 'awaiting-clarification'); await f.engine.answer(f.key('one'), r.question_id, 'detail'); }
    assert.equal((await f.engine.execute(f.key('one'))).status, 'failed'); assert.equal(calls, 3);
    f.policy.repositories['example/ab-test'].checks.valid = { type: 'shell', command: 'touch outside' }; await f.savePolicy();
    assert.equal((await f.engine.submit(f.contact, f.task('shell'))).status, 'rejected');
  } finally { await f.close(); }
});
test('cancel between file writes retains and reports first change without starting the next write', async () => {
  const f = await fixture(async () => ({ thread_id: 'one', body: JSON.stringify({ kind: 'changes', files: [{ path: 'sample.json', content: '{"first":true}' }, { path: 'second.json', content: '{"second":true}' }] }) }));
  try {
    await writeFile(join(f.repo, 'second.json'), '{}'); await f.git('add', '.'); await f.git('commit', '-m', 'second file');
    f.policy.repositories['example/ab-test'].files.push('second.json'); await f.savePolicy();
    const task = { ...f.task('one'), base: await f.git('rev-parse', 'HEAD'), files: ['sample.json', 'second.json'] };
    const checkpoint = f.engine.checkpoint.bind(f.engine);
    f.engine.checkpoint = async state => { if (state.changes.length === 1) await f.engine.cancel(f.key('one')); return checkpoint(state); };
    await f.engine.submit(f.contact, task); const r = await f.engine.execute(f.key('one'));
    assert.equal(r.status, 'cancelled'); assert.deepEqual(r.changes, ['sample.json']); assert.equal(r.commit, undefined); assert.match(r.produced_diff, /sample.json/);
    const s = await f.engine.load(f.key('one')); assert.equal(await readFile(join(s.worktree, 'second.json'), 'utf8'), '{}');
  } finally { await f.close(); }
});
test('human edits during model processing are preserved and never committed', async () => {
  let f; f = await fixture(async () => {
    const state = await f.engine.load(f.key('one'));
    await writeFile(join(state.worktree, 'sample.json'), '{"human":true}');
    return changes();
  });
  try {
    await f.engine.submit(f.contact, f.task('one')); const result = await f.engine.execute(f.key('one'));
    assert.equal(result.status, 'failed'); assert.match(result.error, /changed outside AB/); assert.equal(result.commit, undefined);
    const state = await f.engine.load(f.key('one')); assert.equal(await readFile(join(state.worktree, 'sample.json'), 'utf8'), '{"human":true}');
  } finally { await f.close(); }
});
test('push routing overrides are refused before invoking model or network operations', async () => {
  let calls = 0; const f = await fixture(async () => { calls++; return changes(); });
  try {
    await f.git('config', 'remote.origin.pushurl', 'https://github.com/other/repo.git');
    await f.engine.submit(f.contact, f.task('one')); const result = await f.engine.execute(f.key('one'));
    assert.equal(result.status, 'failed'); assert.match(result.error, /push routing/); assert.equal(calls, 0);
  } finally { await f.close(); }
});
test('local status and cancellation work without a reachable relay or binding', async () => {
  const f = await fixture(async () => changes());
  try {
    await f.engine.submit(f.contact, f.task('offline'));
    const cli = new URL('../src/development-cli.mjs', import.meta.url).pathname;
    const status = await exec(process.execPath, [cli, 'status', f.dir, 'offline']);
    assert.equal(JSON.parse(status.stdout).status, 'awaiting-authorization');
    await exec(process.execPath, [cli, 'cancel', f.dir, 'offline']);
    assert.equal((await f.engine.load(f.key('offline'))).status, 'cancelled');
  } finally { await f.close(); }
});
test('a repository grant changed during model processing stops pending writes', async () => {
  let f; f = await fixture(async () => { f.policy.repositories['example/ab-test'].checks.valid = { type: 'contains', file: 'sample.json', text: 'different' }; await f.savePolicy(); return changes(); });
  try {
    await f.engine.submit(f.contact, f.task('one')); const result = await f.engine.execute(f.key('one'));
    assert.equal(result.status, 'failed'); assert.match(result.error, /grant changed/); assert.deepEqual(result.changes, []);
  } finally { await f.close(); }
});

test('GitHub push uses a scoped ephemeral credential, exact branch and TLS without exposing token in arguments', async () => {
  const calls = [];
  await pushDevelopmentBranch({ worktree: '/local', origin: 'https://github.com/example/ab-test.git', branch: 'ab/dev-' + 'a'.repeat(24) }, async (file, args, cwd, options) => {
    calls.push({ file, args, cwd, options }); return { stdout: file === 'gh' ? 'fake-secret-token' : '' };
  });
  assert.equal(calls.length, 2); assert.equal(calls[0].file, 'gh'); assert.equal(calls[1].file, 'git');
  assert(!calls[1].args.join(' ').includes('fake-secret-token'));
  assert(calls[1].args.includes('http.sslVerify=true')); assert(calls[1].args.includes('http.followRedirects=false'));
  assert.equal(calls[1].args.at(-2), 'https://github.com/example/ab-test.git');
  assert.equal(calls[1].options.env.GIT_CONFIG_KEY_0, 'http.https://github.com/example/ab-test.git.extraHeader');
  await assert.rejects(pushDevelopmentBranch({ worktree: '/local', origin: 'https://other.example/repo', branch: 'main' }), /Invalid/);
});
