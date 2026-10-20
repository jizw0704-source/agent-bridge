import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { LocalBridge, atomicJSON } from './bridge.mjs';

const root = process.argv[2] ? resolve(process.argv[2]) : await mkdtemp(join(tmpdir(), 'ab-codex-demo-'));
const bridge = new LocalBridge({ root });
await bridge.init();
// A fixed fixture is the only project material exposed by this demo.
const fixture = 'DEMO ONLY: export format identical; cancellation writes no file. No implementation exists.\n';
await writeFile(join(root, 'sandbox', 'DEMO.txt'), fixture);
console.log(`AB local demo: ${root}\nMock peer: Wright (scripted, not a remote agent)`);
const messages = [
  { task_id: 'demo-export', message_id: 'w1', sender: 'mock-wright', body: '接手 Windows 导出适配。Windows 使用自己的保存窗口可以吗？取消操作应怎样处理？' },
  { task_id: 'demo-export', message_id: 'w2', sender: 'mock-wright', body: '补充上一轮问题：演示观察是取消保存窗口后仍生成临时文件；这不是实测结果。建议用户侧推迟写入。请给出处理建议和待验证项。' }
];
for (const message of messages) {
  await atomicJSON(join(root, 'inbox', `${message.message_id}.json`), message);
  console.log(`Mock Wright queued ${message.message_id}`);
  // Poll the durable inbox automatically; no human copies the next message.
  for (const name of (await readdir(join(root, 'inbox'))).sort()) {
    if (!name.endsWith('.json')) continue;
    const incoming = JSON.parse(await readFile(join(root, 'inbox', name), 'utf8'));
    const reply = await bridge.receive(incoming);
    if (incoming.message_id === message.message_id) console.log(`Mac Codex → mock Wright:\n${reply.body}\n`);
  }
}
const before = bridge.state.thread_id;
const restored = new LocalBridge({ root });
await restored.init();
await restored.receive(messages[1]);
if (restored.state.thread_id !== before) throw new Error('Resume/deduplication failed');
if (await readFile(join(root, 'sandbox', 'DEMO.txt'), 'utf8') !== fixture || (await readdir(join(root, 'sandbox'))).length !== 1)
  throw new Error('Demo workspace changed');
await atomicJSON(join(root, 'result.json'), { status: 'passed', rounds: 2, thread_id: before, duplicate_suppressed: true, fixture_unchanged: true, mock_peer: true, real_project_modified: false });
console.log('PASS: two real Codex turns, same conversation, persisted deduplication, demo workspace unchanged.');
