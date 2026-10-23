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
