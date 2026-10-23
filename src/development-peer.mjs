import { readFile, readdir, mkdir, open, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { atomicJSON } from './bridge.mjs';
import { peerConfig } from './peer.mjs';
import { relayRequest } from './relay.mjs';
import { DevelopmentEngine, developmentScope, validateDevelopment } from './development.mjs';
export async function developmentContext(root) {
  const binding = JSON.parse(await readFile(join(root, 'binding.json'), 'utf8'));
  const config = await peerConfig(resolve(binding.peer_dir));
  const status = await relayRequest(config, 'status');
  if (config.mode !== 'contact' || !status.ready) throw new Error('Mutually confirmed contact required');
  const peer = config.role === 'mac' ? 'windows' : 'mac';
  return { config, status, contact: { room_id: config.room_id, identity: status.identities[peer] } };
}
export async function initializeDevelopment(root, peerDir) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  if ((await readdir(root)).length) throw new Error('Use empty private development directory');
  await atomicJSON(join(root, 'binding.json'), { peer_dir: resolve(peerDir) });
  await atomicJSON(join(root, 'policy.json'), { contacts: [], repositories: {} });
  await atomicJSON(join(root, 'transport.json'), { inbound: {}, outbound: {}, reports: {} });
}
export class DevelopmentPeer {
  constructor({ root, invoke }) { this.root = resolve(root); this.engine = new DevelopmentEngine({ root: this.root, invoke }); }
  async state() { return JSON.parse(await readFile(join(this.root, 'transport.json'), 'utf8')); }
  save(s) { return atomicJSON(join(this.root, 'transport.json'), s); }
  async queue(config, s, message) {
    if (message.body.length > 8000) throw new Error('Development report exceeds transport limit; inspect locally');
    s.outbound[message.id] ||= { message, sent: false }; await this.save(s);
    await this.flush(config, s);
  }
  async flush(config, s) {
    for (const item of Object.values(s.outbound)) if (!item.sent) {
      await relayRequest(config, 'messages', item.message); item.sent = true; await this.save(s);
    }
  }
  async send(task, envelope) {
    const lock = await open(join(this.root, 'receiver.lock'), 'wx', 0o600);
    try { return await this.sendUnlocked(task, envelope); } finally { await lock.close(); await unlink(join(this.root, 'receiver.lock')); }
  }
  async sendUnlocked(task, envelope) {
    const { config, status } = await developmentContext(this.root);
    if (envelope.type === 'handoff') validateDevelopment(envelope);
    if (envelope.id !== task || !['handoff', 'answer', 'cancel', 'report'].includes(envelope.type)) throw new Error('Explicit task envelope required');
    if (!status.tasks.some(t => t.id === task)) {
      if (envelope.type !== 'handoff') throw new Error('Task must already exist');
      await relayRequest(config, 'tasks', { id: task, title: 'Development ' + task, scope: developmentScope });
    } else if (!status.tasks.some(t => t.id === task && t.scope === developmentScope && t.status === 'active')) throw new Error('Active development task required');
    const message = { id: 'dev-' + createHash('sha256').update(JSON.stringify(envelope)).digest('hex').slice(0, 48), task_id: developmentScope, collaboration_id: task, kind: 'request', body: JSON.stringify(envelope) };
    const s = await this.state(); await this.queue(config, s, message); return { id: message.id, sent: true };
  }
  async poll() {
    const lock = await open(join(this.root, 'receiver.lock'), 'wx', 0o600);
    try {
      const { config, contact } = await developmentContext(this.root), s = await this.state();
      await this.flush(config, s);
      for (const message of (await relayRequest(config, 'inbox?scope=' + developmentScope)).messages) {
        if (message.task_id !== developmentScope) continue;
        if (message.kind === 'reply') {
          const sent = s.outbound[message.reply_to]?.message;
          if (!sent || sent.collaboration_id !== message.collaboration_id) throw new Error('Unmatched development reply');
          s.reports[message.id] = { task: message.collaboration_id, body: message.body }; await this.save(s);
          await relayRequest(config, 'ack', { id: message.id, status: 'received' }); continue;
        }
        if (s.inbound[message.id]) continue; // A crashed processing attempt requires local inspection, never replay.
        s.inbound[message.id] = 'processing'; await this.save(s);
        await relayRequest(config, 'ack', { id: message.id, status: 'processing' });
        // Both local state and relay processing receipt prevent replay after interruption.
        let result;
        const stopWatching = this.watchCancellation(config, contact, message.collaboration_id);
        try {
          const envelope = JSON.parse(message.body);
          if (envelope.id !== message.collaboration_id) throw new Error('Task envelope mismatch');
          const key = { ...contact, id: envelope.id };
          if (envelope.type === 'handoff') result = await this.engine.submit(contact, envelope);
          else if (envelope.type === 'answer') {
            result = await this.engine.answer(key, envelope.question_id, envelope.answer);
            const grant = await this.engine.allowed(contact, (await this.engine.load(key)).handoff);
            if (grant.automatic) result = await this.engine.execute(key, { automatic: true });
          } else if (envelope.type === 'cancel') {
            await this.engine.load(key); await this.engine.cancel(key); result = await this.engine.execute(key);
          } else if (envelope.type === 'report') {
            s.reports[message.id] = { task: message.collaboration_id, body: message.body }; result = { type: 'receipt', id: envelope.id };
          } else throw new Error('Unsupported development event');
        } catch (e) { result = { type: 'report', id: message.collaboration_id, status: 'rejected', error: e.message }; }
        finally { await stopWatching(); }
        const reply = { id: 'r-' + message.id, task_id: developmentScope, collaboration_id: message.collaboration_id, kind: 'reply', reply_to: message.id, body: JSON.stringify(result) };
        s.inbound[message.id] = 'replied';
        await this.queue(config, s, reply);
      }
      return { reports: s.reports, inbound: s.inbound };
    } finally { await lock.close(); await unlink(join(this.root, 'receiver.lock')); }
  }
  watchCancellation(config, contact, task) {
    let pending;
    const timer = setInterval(() => {
      if (pending) return;
      pending = (async () => {
        try {
          for (const m of (await relayRequest(config, 'inbox?scope=' + developmentScope)).messages) {
            if (m.task_id !== developmentScope || m.kind !== 'request' || m.collaboration_id !== task) continue;
            let event; try { event = JSON.parse(m.body); } catch { continue; }
            if (event.type !== 'cancel' || event.id !== task) continue;
            const key = { ...contact, id: task };
            await this.engine.load(key); await this.engine.cancel(key);
          }
        } catch { /* Remote cancellation can be delayed by transport failure; local marker remains available. */ }
      })().finally(() => { pending = undefined; });
    }, 500);
    return async () => { clearInterval(timer); if (pending) await pending; };
  }
  async approve(task) {
    const { config, contact } = await developmentContext(this.root);
    const stopWatching = this.watchCancellation(config, contact, task);
    let result;
    try { result = await this.engine.execute({ ...contact, id: task }); } finally { await stopWatching(); }
    // Explicit local action, not a model/peer-generated authorization.
    await this.send(task, result); return result;
  }
}
