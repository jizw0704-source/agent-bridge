import { mkdir, readdir, readFile, writeFile, open, unlink, lstat, rename } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { atomicJSON, runCodex } from './bridge.mjs';
import { reviewTask, validateReview } from './pr-review.mjs';
import { relayRequest, safeEndpoint } from './relay.mjs';

export const peerFixture = 'AB PEER PILOT: fictional export feature only. No project code.\n';
export async function initPeer(root, config) {
  safeEndpoint(config.url);
  if (config.task_id && !['demo-export', reviewTask].includes(config.task_id)) throw new Error('Invalid local task grant');
  if (!['mac', 'windows'].includes(config.role)) throw new Error('Invalid role');
  await mkdir(root, { recursive: true, mode: 0o700 });
  if ((await readdir(root)).length) throw new Error('Use an empty dedicated peer directory');
  for (const dir of ['sandbox', 'logs', 'received']) await mkdir(join(root, dir), { mode: 0o700 });
  await writeFile(join(root, 'sandbox', 'DEMO.txt'), peerFixture, { mode: 0o600, flag: 'wx' });
  await atomicJSON(join(root, 'config.json'), config);
  await atomicJSON(join(root, 'peer-state.json'), { thread_id: null, inbound: {}, outbound: {} });
  await writeFile(join(root, 'AB-PEER-ONLY'), 'v1', { mode: 0o600 });
}
export async function assertPeer(root) {
  if ((await lstat(root)).isSymbolicLink() || await readFile(join(root, 'AB-PEER-ONLY'), 'utf8') !== 'v1') throw new Error('Not an AB peer pilot directory');
  for (const dir of ['sandbox', 'logs', 'received']) if ((await lstat(join(root, dir))).isSymbolicLink()) throw new Error('Symlink directory refused');
  if ((await readdir(join(root, 'sandbox'))).length !== 1 || await readFile(join(root, 'sandbox', 'DEMO.txt'), 'utf8') !== peerFixture) throw new Error('Pilot workspace changed');
}
export async function peerConfig(root) { await assertPeer(root); return JSON.parse(await readFile(join(root, 'config.json'), 'utf8')); }

export class PeerWorker {
  constructor({ root, invoke = runCodex, log = console.log }) { this.root = resolve(root); this.invoke = invoke; this.log = log; this.locked = false; this.stopping = false; }
  async open() {
    this.config = await peerConfig(this.root);
    const lock = await open(join(this.root, 'peer.lock'), 'wx', 0o600);
    this.locked = true; await lock.writeFile(JSON.stringify({ pid: process.pid })); await lock.close();
    this.state = JSON.parse(await readFile(join(this.root, 'peer-state.json'), 'utf8'));
  }
  async save() { await atomicJSON(join(this.root, 'peer-state.json'), this.state); }
  async status(phase, detail = '') { await atomicJSON(join(this.root, 'peer-status.json'), { phase, detail, pid: process.pid, updated_at: new Date().toISOString() }); }
  async stoppingNow() {
    if (this.stopping) return true;
    try { await lstat(join(this.root, 'STOP')); return true; } catch (error) { if (error.code !== 'ENOENT') throw error; return false; }
  }
  async flush() {
    for (const item of Object.values(this.state.outbound)) if (!item.sent) {
      await relayRequest(this.config, 'messages', item.message); item.sent = true; await this.save();
    }
  }
  async sendRequest(body, id = randomUUID(), collaborationId) {
    if (this.config.task_id === reviewTask) validateReview(body);
    if (this.config.mode === 'contact' && !collaborationId) throw new Error('Choose an explicit contact task');
    const message = { id, task_id: this.config.task_id || 'demo-export', kind: 'request', body, ...(collaborationId ? { collaboration_id: collaborationId } : {}) };
    const old = this.state.outbound[id];
    if (old && JSON.stringify(old.message) !== JSON.stringify(message)) throw new Error('Outbound ID conflict');
    this.state.outbound[id] ||= { message, sent: false }; await this.save(); await this.flush(); return id;
  }
  async cycle() {
    await assertPeer(this.root); await this.flush();
    // Drafts have a stable UUID filename before sending; retries use that same ID.
    try {
      const paths = await readdir(this.root);
      if (paths.includes('draft.json')) await rename(join(this.root, 'draft.json'), join(this.root, `draft-${randomUUID()}.json`));
      for (const name of (await readdir(this.root)).filter(n => /^draft-[a-f0-9-]{36}\.json$/.test(n))) {
        const draft = JSON.parse(await readFile(join(this.root, name), 'utf8'));
        await this.sendRequest(draft.body, name.slice(6, -5), draft.collaboration_id);
        await unlink(join(this.root, name));
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }

    const inbox = await relayRequest(this.config, 'inbox');
    for (const message of inbox.messages) {
      if (await this.stoppingNow()) break;
      if (message.task_id !== (this.config.task_id || 'demo-export')) throw new Error('Inbound task outside local authorization');
      if (message.kind === 'request' && this.config.task_id === reviewTask) validateReview(message.body);
      const old = this.state.inbound[message.id];
      if (message.kind === 'reply') {
        await atomicJSON(join(this.root, 'received', `${message.id}.json`), message);
        this.state.inbound[message.id] = { status: 'received', reply_to: message.reply_to }; await this.save();
        await relayRequest(this.config, 'ack', { id: message.id, status: 'received' });
        this.log(`Peer replied to ${message.reply_to}: ${message.body}`); continue;
      }
      if (old?.status === 'replied') {
        await this.flush(); continue;
      }
      if (old) { await this.status('blocked', `Inspect incomplete message ${message.id}`); continue; }
      // Save BEFORE any model call. Crashed/incomplete attempts never auto-replay.
      this.state.inbound[message.id] = { status: 'processing' }; await this.save();
      await relayRequest(this.config, 'ack', { id: message.id, status: 'processing' });
      await this.status('processing', message.id);
      try {
        const taskKey = message.collaboration_id;
        if (this.config.mode === 'contact' && !taskKey) throw new Error('Contact request has no task');
        const previousThread = taskKey ? this.state.threads?.[taskKey] : this.state.thread_id;
        const result = await this.invoke({ cwd: join(this.root, 'sandbox'), threadId: this.config.task_id === reviewTask ? null : previousThread,
          review: this.config.task_id === reviewTask, message: { message_id: message.id, body: message.body }, outputDir: join(this.root, 'logs'), pilotRole: this.config.role });
        if (this.config.task_id !== reviewTask && previousThread && result.thread_id !== previousThread) throw new Error('Conversation changed');
        await assertPeer(this.root);
        if (this.config.task_id !== reviewTask) {
          if (taskKey) { this.state.threads ||= {}; this.state.threads[taskKey] = result.thread_id; }
          else this.state.thread_id = result.thread_id;
        }
        const reply = { id: `r-${message.id}`, task_id: this.config.task_id || 'demo-export', kind: 'reply', reply_to: message.id, body: result.body, ...(taskKey ? { collaboration_id: taskKey } : {}) };
        this.state.outbound[reply.id] = { message: reply, sent: false };
        this.state.inbound[message.id].status = 'replied'; await this.save();
        await this.flush(); this.log(`Replied ${message.id}`);
      } catch (error) {
        // Transport failure after saving a reply must keep that reply retryable.
        if (this.state.inbound[message.id].status !== 'replied') {
          this.state.inbound[message.id] = { status: 'failed', reason: error.message }; await this.save();
          await relayRequest(this.config, 'ack', { id: message.id, status: 'failed' }).catch(() => {});
        }
        throw error;
      }
    }
    const blocked = Object.values(this.state.inbound).some(x => ['failed', 'processing'].includes(x.status));
    await this.status(blocked ? 'blocked' : 'waiting');
  }
  async run(intervalMs = 1000) {
    try {
      await this.open();
      let waitingForPairing = true, previousError;
      while (!await this.stoppingNow()) {
        try {
          if (waitingForPairing) {
            const pairing = await relayRequest(this.config, 'status');
            if (!pairing.ready) {
              await this.status('waiting-for-pairing', 'Both owners must compare identities and confirm.');
              await delay(intervalMs); continue;
            }
            waitingForPairing = false;
          }
          await this.cycle(); previousError = undefined;
        }
        catch (error) {
          await this.status('waiting-or-blocked', error.message);
          if (error.message !== previousError) this.log(`Waiting: ${error.message}`);
          previousError = error.message;
          if ([401, 403, 410].includes(error.status)) break;
        }
        await delay(intervalMs);
      }
      await this.status('stopped');
    } finally { await this.close(); }
  }
  async close() { if (this.locked) { await unlink(join(this.root, 'peer.lock')); this.locked = false; } }
}
