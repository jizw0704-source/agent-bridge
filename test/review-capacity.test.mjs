import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { relayInit, startRelay, relayRequest as call } from '../src/relay.mjs';
import { reviewRepo, reviewTask } from '../src/pr-review.mjs';

test('large review inbox batches drain completely and full rooms reject new storage without breaking deduplication', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ab-review-capacity-')); await relayInit(root);
  let relay = await startRelay({ root, port: 0 });
  const admin = { url: relay.url, token: JSON.parse(await readFile(join(root, 'admin.json'))).token };
  try {
    assert.deepEqual((await fetch(relay.url + '/health').then(r => r.json())).capabilities, ['persistent-rooms', 'translator-pr-review']);
    const room = await call(admin, 'create', { lifetime: 'persistent', task_id: reviewTask });
    const mac = { ...admin, room_id: room.room_id, token: room.token };
    const peer = await call(mac, 'join', { invite: room.invite });
    const windows = { ...mac, token: peer.token };
    const status = await call(mac, 'status');
    await call(mac, 'confirm', { peer_identity: status.identities.windows });
    await call(windows, 'confirm', { peer_identity: status.identities.mac });
    const diff = 'diff --git a/example.c b/example.c\n+' + 'x'.repeat(380000);
    const body = JSON.stringify({ version: 1, repo: reviewRepo, pr: 1, base: 'a'.repeat(40), head: 'b'.repeat(40), diff,
      sha256: createHash('sha256').update(diff).digest('hex') });
    const request = id => ({ id, kind: 'request', task_id: reviewTask, body });
    for (let i = 0; i < 6; i++) await call(mac, 'messages', request(`q${i}`));
    const first = await call(windows, 'inbox');
    assert.ok(first.messages.length > 0 && first.messages.length < 6);
    assert.ok(JSON.stringify(first).length < 2000100);
    const seen = new Set();
    for (let round = 0; round < 6; round++) {
      const { messages } = await call(windows, 'inbox');
      if (!messages.length) break;
      for (const m of messages) {
        assert.ok(!seen.has(m.id)); seen.add(m.id);
        await call(windows, 'messages', { id: `r-${m.id}`, task_id: reviewTask, kind: 'reply', reply_to: m.id, body: 'Synthetic reply' });
      }
    }
    assert.equal(seen.size, 6);
    const port = Number(new URL(relay.url).port); await relay.close();
    const stateFile = join(root, 'relay-state.json'); const state = JSON.parse(await readFile(stateFile));
    state.rooms[room.room_id].messages.push({ id: 'capacity-fixture', body: 'x'.repeat(16000000), status: 'received' });
    await writeFile(stateFile, JSON.stringify(state));
    relay = await startRelay({ root, port });
    assert.equal((await call(mac, 'messages', request('q0'))).duplicate, true);
    await assert.rejects(call(mac, 'messages', request('new')), /429.*storage capacity/);
  } finally { await relay.close(); }
});


test('inbox pagination does not starve later requests behind failed work', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ab-failed-batch-')); await relayInit(root);
  let relay = await startRelay({ root, port: 0 });
  const admin = { url: relay.url, token: JSON.parse(await readFile(join(root, 'admin.json'))).token };
  try {
    const made = await call(admin, 'create', { lifetime: 'persistent', task_id: reviewTask });
    const a = { ...admin, token: made.token, room_id: made.room_id };
    const joined = await call(a, 'join', { invite: made.invite }); const b = { ...a, token: joined.token };
    const status = await call(a, 'status'); await call(a, 'confirm', { peer_identity: status.identities.windows }); await call(b, 'confirm', { peer_identity: status.identities.mac });
    const diff = 'diff --git a/x b/x\n+' + 'x'.repeat(380000);
    const body = JSON.stringify({ version: 1, repo: reviewRepo, pr: 1, base: 'a'.repeat(40), head: 'b'.repeat(40), diff, sha256: createHash('sha256').update(diff).digest('hex') });
    for (let i=0;i<7;i++) await call(a,'messages',{id:`f${i}`,task_id:reviewTask,kind:'request',body});
    for (let i=0;i<6;i++) await call(b,'ack',{id:`f${i}`,status:'failed'});
    assert.deepEqual((await call(b,'inbox')).messages.map(m=>m.id),['f6']);
    const port = Number(new URL(relay.url).port); await relay.close();
    const path = join(root,'relay-state.json'), state = JSON.parse(await readFile(path));
    state.rooms[made.room_id].messages.push({id:'padding',body:'x'.repeat(12700000),status:'received'});
    await writeFile(path,JSON.stringify(state)); relay=await startRelay({root,port});
    // Space remains for a small request, but not its reserved future reply.
    await assert.rejects(call(a,'messages',{id:'no-reserve',task_id:reviewTask,kind:'request',body}),/429/);
    await call(b,'messages',{id:'r-f6',reply_to:'f6',task_id:reviewTask,kind:'reply',body:'x'.repeat(8000)});
    assert.equal((await call(a,'inbox')).messages[0].body.length,8000);
  } finally { await relay.close(); }
});
