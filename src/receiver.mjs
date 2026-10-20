import { mkdir, readdir, readFile, writeFile, lstat, open, unlink, rename } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { LocalBridge, atomicJSON, validateMessage } from './bridge.mjs';

export const MARKER = 'AB-MOCK-WRIGHT-ONLY-v1';
export const fixture = 'DEMO ONLY: same export format; cancellation writes no file. No real project code.\n';
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));

export async function initReceiver(root) {
  root = resolve(root);
  await mkdir(root, { recursive: true, mode: 0o700 });
  if ((await lstat(root)).isSymbolicLink()) throw new Error('Run directory must not be a symlink');
  const entries = await readdir(root);
  if (entries.length) { await assertReceiver(root); return; }
  await mkdir(join(root, 'sandbox'), { mode: 0o700 });
  await writeFile(join(root, 'sandbox', 'DEMO.txt'), fixture, { mode: 0o600, flag: 'wx' });
  for (const d of ['inbox', 'outbox', 'logs', 'archive', 'rejected']) await mkdir(join(root, d), { mode: 0o700 });
  await writeFile(join(root, 'AB-MOCK-ONLY'), MARKER, { mode: 0o600, flag: 'wx' });
}

export async function assertReceiver(root) {
  if ((await lstat(root)).isSymbolicLink() || await readFile(join(root, 'AB-MOCK-ONLY'), 'utf8') !== MARKER)
    throw new Error('Not a marked mock-only run directory. Initialize an empty dedicated directory.');
  for (const dir of ['sandbox', 'inbox', 'outbox', 'logs', 'archive', 'rejected']) {
    const stat = await lstat(join(root, dir));
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe directory: ${dir}`);
  }
  if (await readFile(join(root, 'sandbox', 'DEMO.txt'), 'utf8') !== fixture || (await readdir(join(root, 'sandbox'))).length !== 1)
    throw new Error('Demo workspace changed; receiver stopped');
}

export function mockMessage(round) {
  if (!Number.isInteger(round) || round < 1 || round > 999999) throw new Error('Round must be 1..999999');
  const bodies = [
    '接手模拟 Windows 导出任务。是否允许使用 Windows 原生保存窗口？取消时应怎样处理？',
    '补充：演示观察是取消后仍出现临时文件，并非实测。建议推迟写入。请根据上一轮结论说明待验证项。',
    '继续上一轮：请给 Wright 整理一份简短验收清单，说明哪些结论仍需要实际测试。不要修改代码或执行测试。'
  ];
  return { task_id: 'demo-export', message_id: `w${round}`, sender: 'mock-wright', body: bodies[Math.min(round - 1, 2)] };
}

export async function enqueueMock(root, round) {
  await assertReceiver(root);
  const message = mockMessage(round);
  await atomicJSON(join(root, 'inbox', `${message.message_id}.json`), message);
  return message;
}

// One process owns the queue. A stale lock intentionally requires explicit inspection.
export class Receiver {
  constructor({ root, invoke, intervalMs = 1000, log = console.log }) {
    this.root = resolve(root); this.bridge = new LocalBridge({ root: this.root, invoke });
    this.intervalMs = intervalMs; this.log = log; this.stopping = false; this.locked = false;
  }
  async open() {
    await assertReceiver(this.root);
    const lock = await open(join(this.root, 'receiver.lock'), 'wx', 0o600).catch(error => {
      if (error.code === 'EEXIST') throw new Error('Receiver already running or stale lock: inspect receiver.lock');
      throw error;
    });
    this.locked = true;
    await lock.writeFile(JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
    await lock.close();
    await this.bridge.init();
  }
  async status(phase, extra = {}) {
    await atomicJSON(join(this.root, 'receiver-status.json'), {
      phase, pid: process.pid, updated_at: new Date().toISOString(),
      replied: Object.values(this.bridge.state.messages).filter(m => m.status === 'replied').length,
      ...extra
    });
  }
  async stopRequested() {
    if (this.stopping) return true;
    try { await lstat(join(this.root, 'STOP')); return true; }
    catch (error) { if (error.code !== 'ENOENT') throw error; return false; }
  }
  async scan() {
    await assertReceiver(this.root);
    const names = (await readdir(join(this.root, 'inbox'))).filter(n => n.endsWith('.json')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    for (const name of names) {
      if (await this.stopRequested()) break;
      const path = join(this.root, 'inbox', name);
      let message;
      try {
        const stat = await lstat(path);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 40000) throw new Error('Not a bounded regular message file');
        message = await readJSON(path); validateMessage(message);
        if (name !== `${message.message_id}.json`) throw new Error('Filename/message ID mismatch');
        const previous = this.bridge.state.messages[message.message_id];
        if (previous && previous.input !== JSON.stringify(message)) throw new Error('Message ID reused with different content');
        if (previous && previous.status !== 'replied') {
          await this.status('blocked', { message_id: message.message_id, reason: 'Incomplete earlier attempt: no automatic replay' });
          continue;
        }
        const round = Number(message.message_id.slice(1));
        if (round > 1 && !this.bridge.state.messages[`w${round - 1}`]?.reply) continue;
      } catch (error) {
        await rename(path, join(this.root, 'rejected', `${randomUUID()}-${name}`));
        await atomicJSON(join(this.root, 'rejected', `${randomUUID()}.error.json`), { file: name, error: error.message });
        this.log(`Rejected ${name}: ${error.message}`); continue;
      }
      await this.status('processing', { message_id: message.message_id });
      try {
        const reply = await this.bridge.receive(message);
        await assertReceiver(this.root);
        await rename(path, join(this.root, 'archive', `${randomUUID()}-${name}`));
        this.log(`Replied ${message.message_id}: ${reply.body}`);
        await this.status('waiting');
      } catch (error) {
        await this.status('blocked', { message_id: message.message_id, reason: error.message });
        this.log(`Blocked ${message.message_id}: ${error.message}`);
      }
    }
  }
  async run() {
    try {
      await this.open(); await this.status('waiting'); this.log(`Listening: ${this.root}`);
      while (!await this.stopRequested()) { await this.scan(); await delay(this.intervalMs); }
      await this.status('stopped');
    } finally { await this.close(); }
  }
  async close() {
    if (this.locked) { await unlink(join(this.root, 'receiver.lock')); this.locked = false; }
  }
}
