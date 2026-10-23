import { resolve, join } from 'node:path';
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { atomicJSON } from './bridge.mjs';
import { relayRequest, safeEndpoint } from './relay.mjs';
import { initPeer, peerConfig, PeerWorker } from './peer.mjs';
import { encodeHandoff } from './handoff.mjs';
const [command, directory, ...args] = process.argv.slice(2);
const json = async path => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
async function empty(root) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  if ((await readdir(root)).length) throw new Error('Use a new empty dedicated contact directory');
}
try {
  if (!directory) throw new Error('Usage: node src/contact-cli.mjs <create|join|status|invite|confirm|tasks|task-create|task-history|task-archive|send|send-structured|run|stop|disconnect> contact-directory ...');
  const root = resolve(directory);
  if (command === 'create') {
    if (!args[0] || !args[1]) throw new Error('create requires private admin-directory and relay origin [TLS fingerprint]');
    await empty(root);
    const admin = await json(join(resolve(args[0]), 'admin.json'));
    const base = { url: safeEndpoint(args[1]), ...(args[2] ? { fingerprint: args[2] } : {}) };
    const pair = await relayRequest({ ...base, token: admin.token }, 'create', { mode: 'contact' });
    if (pair.mode !== 'contact') throw new Error('Relay does not support contacts; inspect created room before retrying');
    await initPeer(root, { ...base, room_id: pair.room_id, token: pair.token, role: 'mac', mode: 'contact' });
    await atomicJSON(join(root, 'invite.json'), { ...base, room_id: pair.room_id, invite: pair.invite, expires_at: pair.invite_expires_at, mode: 'contact' });
    console.log('Contact created. Privately share invite.json only when both people are ready; it expires in ten minutes.');
  } else if (command === 'join') {
    if (!args[0]) throw new Error('join requires private invitation path');
    await empty(root);
    const invite = await json(resolve(args[0]));
    if (invite.mode !== 'contact') throw new Error('A contact invitation is required; legacy rooms stay unchanged');
    const pair = await relayRequest(invite, 'join', { invite: invite.invite });
    if (pair.mode !== 'contact' || pair.task_id !== 'demo-export') throw new Error('Unexpected scope; inspect join result before any retry');
    await initPeer(root, { url: invite.url, fingerprint: invite.fingerprint, room_id: pair.room_id, token: pair.token, role: pair.role, mode: 'contact' });
    console.log('Joined contact. Both owners must compare identities through their known channel and confirm.');
  } else {
    const config = await peerConfig(root);
    if (config.mode !== 'contact') throw new Error('Not a contact directory; legacy rooms require the original peer CLI');
    if (command === 'status' || command === 'tasks') console.log(JSON.stringify(await relayRequest(config, command), null, 2));
    else if (command === 'task-create') {
      if (!args[0] || !args[1]) throw new Error('task-create requires stable ID and quoted title');
      console.log(JSON.stringify(await relayRequest(config, 'tasks', { id: args[0], title: args[1], scope: 'demo-export' }), null, 2));
    } else if (command === 'task-history') {
      if (!args[0]) throw new Error('task-history requires task ID');
      console.log(JSON.stringify(await relayRequest(config, 'task-history?id=' + encodeURIComponent(args[0])), null, 2));
    } else if (command === 'task-archive') {
      if (!args[0]) throw new Error('task-archive requires task ID');
      console.log(JSON.stringify(await relayRequest(config, 'archive-task', { id: args[0] }), null, 2));
    } else if (command === 'confirm') {
      if (!args[0]) throw new Error('confirm requires the identity verified by the local owner');
      console.log(JSON.stringify(await relayRequest(config, 'confirm', { peer_identity: args[0] })));
    } else if (command === 'invite') {
      const pair = await relayRequest(config, 'invite', {});
      await atomicJSON(join(root, 'invite.json'), { url: config.url, fingerprint: config.fingerprint, room_id: config.room_id, invite: pair.invite, expires_at: pair.invite_expires_at, mode: 'contact' });
      console.log('Fresh invitation saved privately; the previous invitation is invalid.');
    } else if (command === 'disconnect') console.log(JSON.stringify(await relayRequest(config, 'close', {})));
    else if (command === 'stop') { await writeFile(join(root, 'STOP'), 'stop after current turn\n', { mode: 0o600 }); console.log('Stop requested.'); }
    else if (['send', 'send-structured'].includes(command)) {
      if (!args[0] || !args[1]) throw new Error('send requires task ID and message file');
      const tasks = await relayRequest(config, 'tasks');
      if (!tasks.tasks.some(t => t.id === args[0] && t.status === 'active' && t.scope === 'demo-export')) throw new Error('Choose an active task');
      const raw = (await readFile(resolve(args[1]), 'utf8')).replace(/^\uFEFF/, '');
      const body = command === 'send-structured' ? encodeHandoff(JSON.parse(raw)) : raw;
      if (!body.trim() || body.length > 8000) throw new Error('Message must contain 1..8000 characters');
      await writeFile(join(root, 'draft.json'), JSON.stringify({ body, collaboration_id: args[0] }) + '\n', { flag: 'wx', mode: 0o600 });
      console.log('Task draft queued locally; the running connector performs delivery.');
    } else if (command === 'run') {
      await unlink(join(root, 'STOP')).catch(e => { if (e.code !== 'ENOENT') throw e; });
      const worker = new PeerWorker({ root });
      process.on('SIGINT', () => { worker.stopping = true; }); process.on('SIGTERM', () => { worker.stopping = true; });
      await worker.run();
    } else throw new Error('Unknown contact command');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
