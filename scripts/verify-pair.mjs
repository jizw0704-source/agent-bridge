import { mkdtemp, readFile, writeFile, mkdir, readdir, open, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { relayInit, startRelay, relayRequest as call } from '../src/relay.mjs';
import { initPeer, peerFixture } from '../src/peer.mjs';
import { atomicJSON } from '../src/bridge.mjs';

const root = await mkdtemp(join(tmpdir(), 'ab-pair-live-'));
const relayRoot = join(root, 'relay'); await relayInit(relayRoot);
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(relayRoot, 'tls.key'), '-out', join(relayRoot, 'tls.crt'), '-days', '1', '-subj', '/CN=AB-local-test'], { stdio: 'ignore' });
const relay = await startRelay({ root: relayRoot, port: 0, tls: true });
const secret = JSON.parse(await readFile(join(relayRoot, 'admin.json'), 'utf8')).token;
const base = { url: relay.url, fingerprint: relay.fingerprint };
const room = await call({ ...base, token: secret }, 'create', {});
const mac = { ...base, room_id: room.room_id, token: room.token, role: 'mac' };
const joined = await call(mac, 'join', { invite: room.invite });
const windows = { ...mac, token: joined.token, role: 'windows' };
const status = await call(mac, 'status');
await call(mac, 'confirm', { peer_identity: status.identities.windows });
await call(windows, 'confirm', { peer_identity: status.identities.mac });
const paths = { mac: join(root, 'mac'), windows: join(root, 'simulated-windows') };
await initPeer(paths.mac, mac); await initPeer(paths.windows, windows);
const children = [];
async function waitFor(check, timeout = 210000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await check()) return; await delay(500); }
  throw new Error('Live pair timeout; inspect local logs');
}
async function start(role) {
  const log = await open(join(root, `${role}.log`), 'a', 0o600);
  const child = spawn(process.execPath, [resolve('src/peer-cli.mjs'), 'run', paths[role]], { stdio: ['ignore', log.fd, log.fd] });
  children.push(child); await log.close(); return child;
}
console.log(`Live two-process TLS pilot: ${root}`);
try {
  await start('mac'); await start('windows');
  await waitFor(async () => { try { return !!(await lstat(join(paths.mac, 'peer.lock'))) && !!(await lstat(join(paths.windows, 'peer.lock'))); } catch { return false; } }, 10000);
  const rounds = [
    ['mac', '请确认 Windows 是否可以用原生保存窗口，并指出取消时的目标。'],
    ['windows', '针对上一项 Mac/Windows 统一行为，请给出不写文件的取消逻辑建议。'],
    ['mac', '继续前一轮：演示观察是取消后仍有临时文件。请说明处理建议及待验证项。'],
    ['windows', '继续前一轮，请给出双方需要实际检查的简短清单，不修改代码。']
  ];
  for (let i = 0; i < rounds.length; i++) {
    const [role, body] = rounds[i];
    const file = join(root, `request-${i + 1}.txt`); await writeFile(file, body);
    execFileSync(process.execPath, [resolve('src/peer-cli.mjs'), 'send', paths[role], file], { stdio: 'ignore' });
    console.log(`Queued live request ${i + 1} from ${role}`);
    await waitFor(async () => (await readdir(join(paths[role], 'received'))).length === Math.ceil((i + 1) / 2));
    console.log(`Received live reply ${i + 1}`);
  }
  const before = {};
  for (const role of ['mac', 'windows']) {
    const state = JSON.parse(await readFile(join(paths[role], 'peer-state.json'), 'utf8'));
    before[role] = { thread_id: state.thread_id, replies: Object.values(state.inbound).filter(x => x.status === 'replied').length };
    if (!before[role].thread_id || before[role].replies !== 2) throw new Error('Missing per-side continuity');
    for (const name of (await readdir(join(paths[role], 'logs'))).filter(x => x.endsWith('.events.jsonl'))) {
      const events = (await readFile(join(paths[role], 'logs', name), 'utf8')).trim().split('\n').map(x => JSON.parse(x));
      if (!events.some(x => x.type === 'turn.completed') || events.some(x => x.item && !['agent_message', 'reasoning'].includes(x.item.type))) throw new Error('Unexpected live action');
    }
    if ((await readdir(join(paths[role], 'sandbox'))).length !== 1 || await readFile(join(paths[role], 'sandbox/DEMO.txt'), 'utf8') !== peerFixture) throw new Error('Workspace changed');
  }
  const counts = (await call(mac, 'status')).messages.length;
  await delay(2000);
  if ((await call(mac, 'status')).messages.length !== counts || counts !== 8) throw new Error('Unexpected reply loop');
  await atomicJSON(join(root, 'live-result.json'), { status: 'passed', real_codex_turns: 4, directions: 2, replies_per_side: 2, same_thread_per_side: true, tls: true, no_tool_actions: true, fixture_unchanged: true, idle_no_loop: true, actual_windows_tested: false, real_wright_contacted: false });
  console.log('PASS: four real Codex turns, both directions, independent conversations, TLS, unchanged fixtures.');
} finally {
  for (const role of ['mac', 'windows']) await writeFile(join(paths[role], 'STOP'), 'stop\n').catch(() => {});
  await Promise.all(children.map(child => new Promise(resolveExit => { if (child.exitCode !== null) resolveExit(); else child.once('exit', resolveExit); })));
  await relay.close();
}
