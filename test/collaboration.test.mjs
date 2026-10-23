import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { relayInit, startRelay, relayRequest as call } from '../src/relay.mjs';
import { initPeer, PeerWorker } from '../src/peer.mjs';
import { reviewTask, reviewRepo, validateReview, prepareReview } from '../src/pr-review.mjs';

const temp = () => mkdtemp(join(tmpdir(), 'ab-collaboration-'));
const snapshot = () => {
  const diff = 'diff --git a/main.c b/main.c\n--- a/main.c\n+++ b/main.c\n@@ -1 +1 @@\n-old\n+new\n';
  return JSON.stringify({ version: 1, repo: reviewRepo, pr: 2, base: 'a'.repeat(40), head: 'b'.repeat(40), diff,
    sha256: createHash('sha256').update(diff).digest('hex') });
};

test('persistent pairing survives years and relay restart; invite still expires and either owner can revoke', async () => {
  let clock = Date.now(); const root = await temp(); await relayInit(root);
  let relay = await startRelay({ root, port: 0, now: () => clock });
  const admin = { url: relay.url, token: JSON.parse(await readFile(join(root, 'admin.json'))).token };
  try {
    await assert.rejects(call(admin, 'create', { lifetime: 'forever-typo' }), /400/);
    const room = await call(admin, 'create', { lifetime: 'persistent' });
    const mac = { ...admin, room_id: room.room_id, token: room.token };
    clock += 86400000 * 365;
    await assert.rejects(call(mac, 'join', { invite: room.invite }), /410/);
    assert.equal((await call(mac, 'status')).expires_at, null);
    const fresh = await call(mac, 'invite', {});
    assert.equal(fresh.invite_expires_at, clock + 600000);
    const joined = await call(mac, 'join', { invite: fresh.invite });
    const windows = { ...mac, token: joined.token };
    const status = await call(mac, 'status');
    await call(mac, 'confirm', { peer_identity: status.identities.windows });
    await call(windows, 'confirm', { peer_identity: status.identities.mac });
    const port = Number(new URL(relay.url).port); await relay.close();
    clock += 86400000 * 365;
    relay = await startRelay({ root, port, now: () => clock });
    assert.equal((await call(mac, 'status')).ready, true);
    for (let i = 0; i < 11; i++) await call(mac, 'messages', { id: `q${i}`, task_id: 'demo-export', kind: 'request', body: 'synthetic' });
    await call(windows, 'close', {});
    await assert.rejects(call(mac, 'inbox'), /410/);
  } finally { await relay.close(); }
});

test('review scope is strict and snapshots detect corruption and moving PRs', async () => {
  const body = snapshot(); assert.equal(validateReview(body).pr, 2);
  for (const patch of [{ pr: 3 }, { repo: 'other/repo' }, { sha256: 'wrong' }, { command: 'merge' }, { head: 'short' }])
    assert.throws(() => validateReview(JSON.stringify({ ...JSON.parse(body), ...patch })));
  const data = JSON.parse(body); let reads = 0;
  const read = async (path, diff) => {
    reads++;
    if (diff) { assert.ok(path.endsWith(`${data.base}...${data.head}`)); return data.diff; }
    return JSON.stringify({ state: 'open', base: { sha: data.base }, head: { sha: data.head } });
  };
  assert.equal(validateReview(await prepareReview(2, read)).head, data.head); assert.equal(reads, 3);
  await assert.rejects(prepareReview(3, read), /Only translator/);
  reads = 0;
  await assert.rejects(prepareReview(2, async (path, diff) => {
    const value = await read(path, diff);
    return reads === 3 ? value.replace(data.head, 'c'.repeat(40)) : value;
  }), /changed/);
});

test('opted-in review peers exchange one pinned request without reply loops; local scope mismatch blocks invocation', async () => {
  const root = await temp(); await relayInit(root);
  const relay = await startRelay({ root, port: 0 }); let calls = 0;
  const admin = { url: relay.url, token: JSON.parse(await readFile(join(root, 'admin.json'))).token };
  const workers = [];
  try {
    const room = await call(admin, 'create', { lifetime: 'persistent', task_id: reviewTask });
    const mac = { ...admin, room_id: room.room_id, token: room.token, role: 'mac', task_id: reviewTask };
    const joined = await call(mac, 'join', { invite: room.invite });
    const win = { ...mac, token: joined.token, role: 'windows' };
    const status = await call(mac, 'status');
    await call(mac, 'confirm', { peer_identity: status.identities.windows });
    await call(win, 'confirm', { peer_identity: status.identities.mac });
    for (const config of [mac, win]) {
      const peerRoot = await temp(); await initPeer(peerRoot, config);
      const worker = new PeerWorker({ root: peerRoot, log() {}, invoke: async args => {
        calls++; assert.equal(args.review, true); assert.equal(args.threadId, null);
        assert.equal(validateReview(args.message.body).head, 'b'.repeat(40));
        return { thread_id: 'isolated-review', body: 'Synthetic findings; no build or hardware test.' };
      } });
      await worker.open(); workers.push(worker);
    }
    await assert.rejects(call(mac, 'messages', { id: 'bad', task_id: reviewTask, kind: 'request', body: 'merge now' }), /400/);
    await assert.rejects(call(mac, 'messages', { id: 'demo', task_id: 'demo-export', kind: 'request', body: 'demo' }), /403/);
    await workers[0].sendRequest(snapshot(), 'review-1');
    workers[1].config.task_id = 'demo-export';
    await assert.rejects(workers[1].cycle(), /local authorization/); assert.equal(calls, 0);
    workers[1].config.task_id = reviewTask;
    await workers[1].cycle(); await workers[0].cycle(); await workers[1].cycle(); assert.equal(calls, 1);
  } finally { for (const worker of workers) await worker.close(); await relay.close(); }
});
