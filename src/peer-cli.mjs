import { prepareReview, reviewTask, validateReview } from './pr-review.mjs';
import { encodeHandoff } from './handoff.mjs';
import { resolve, join } from 'node:path';
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { atomicJSON } from './bridge.mjs';
import { relayRequest, safeEndpoint } from './relay.mjs';
import { initPeer, peerConfig, PeerWorker } from './peer.mjs';

const [command, directory, ...args] = process.argv.slice(2);
const json = async path => JSON.parse(await readFile(path, 'utf8'));
async function empty(root) { await mkdir(root, { recursive: true, mode: 0o700 }); if ((await readdir(root)).length) throw new Error('Choose an empty dedicated peer directory'); }
try {
  if (!directory) throw new Error('Usage: pnpm peer <create|join|invite|status|confirm|send|send-structured|send-review|run|stop|close> dedicated-directory ...');
  const root = resolve(directory);
  if (command === 'create') {
    const [adminDir, origin, fingerprint] = args.filter(arg => !arg.startsWith('--'));
    if (!adminDir || !origin) throw new Error('create requires relay-admin-directory and relay-origin [TLS-fingerprint]');
    await empty(root);
    const admin = await json(join(resolve(adminDir), 'admin.json'));
    const base = { url: safeEndpoint(origin), fingerprint };
    const pair = await relayRequest({ ...base, token: admin.token }, 'create', {
      lifetime: args.includes('--persistent') ? 'persistent' : 'daily',
      task_id: args.includes('--translator-review') ? reviewTask : 'demo-export'
    });
    await initPeer(root, { ...base, room_id: pair.room_id, role: 'mac', token: pair.token, task_id: pair.task_id });
    await atomicJSON(join(root, 'invite.json'), { ...base, room_id: pair.room_id, invite: pair.invite, expires_at: pair.invite_expires_at, task_id: pair.task_id });
    console.log(`Created room. Privately share ${join(root, 'invite.json')} within ten minutes. Do not share config.json or admin.json.`);
  } else if (command === 'join') {
    if (!args[0]) throw new Error('join requires the invitation file path');
    await empty(root);
    const invite = await json(resolve(args[0]));
    if (invite.task_id === reviewTask && !args.includes('--accept-translator-review')) throw new Error('Joining this room requires --accept-translator-review (PRs 1/2 only; read-only review)');
    const pair = await relayRequest(invite, 'join', { invite: invite.invite });
    if ((pair.task_id || 'demo-export') !== (invite.task_id || 'demo-export')) throw new Error('Room scope changed; inspect pairing, do not automatically retry');
    await initPeer(root, { url: invite.url, fingerprint: invite.fingerprint, room_id: pair.room_id, role: pair.role, token: pair.token, task_id: pair.task_id });
    console.log('Joined. Compare identity codes with the other owner, then both confirm.');
  } else {
    const config = await peerConfig(root);
    if (command === 'status') console.log(JSON.stringify(await relayRequest(config, 'status'), null, 2));
    else if (command === 'tasks') console.log(JSON.stringify(await relayRequest(config, 'tasks'), null, 2));
    else if (command === 'task-create') {
      if (!args[0] || !args[1]) throw new Error('task-create requires stable task-id and quoted title');
      console.log(JSON.stringify(await relayRequest(config, 'tasks', { id: args[0], title: args[1], scope: 'demo-export' }), null, 2));
    } else if (command === 'task-archive') {
      if (!args[0]) throw new Error('task-archive requires task-id');
      console.log(JSON.stringify(await relayRequest(config, 'archive-task', { id: args[0] }), null, 2));
    } else if (command === 'invite') {
      const pair = await relayRequest(config, 'invite', {});
      await atomicJSON(join(root, 'invite.json'), { url: config.url, fingerprint: config.fingerprint,
        room_id: config.room_id, invite: pair.invite, expires_at: pair.invite_expires_at, task_id: pair.task_id || config.task_id });
      console.log(`Fresh invitation saved to ${join(root, 'invite.json')}. Previous invitations are invalid. Expires: ${new Date(pair.invite_expires_at).toISOString()}`);
    } else if (command === 'confirm') {
      if (!args[0]) throw new Error('confirm requires the peer identity code from the other owner');
      console.log(JSON.stringify(await relayRequest(config, 'confirm', { peer_identity: args[0] })));
    } else if (command === 'close') console.log(JSON.stringify(await relayRequest(config, 'close', {})));
    else if (command === 'stop') { await writeFile(join(root, 'STOP'), 'stop after current turn\n', { mode: 0o600 }); console.log('Stop requested.'); }
    else if (['send', 'send-structured', 'send-review'].includes(command)) {
      if (!args[0]) throw new Error('send requires a UTF-8 message file');
      if (command === 'send-review' && config.task_id !== reviewTask) throw new Error('This room does not authorize real PR review');
      if (command !== 'send-review' && config.task_id === reviewTask) throw new Error('Review rooms accept send-review only');
      const input = command === 'send-review' ? await prepareReview(Number(args[0])) : await readFile(resolve(args[0]), 'utf8');
      const body = command === 'send-structured' ? encodeHandoff(JSON.parse(input.replace(/^\uFEFF/, ''))) : input;
      if (command === 'send-review') validateReview(body);
      if (!body.trim() || (command !== 'send-review' && body.length > 8000)) throw new Error('Message must contain 1..8000 characters');
      // A running worker will pick up a durable draft; never edit its state concurrently.
      const file = join(root, 'draft.json');
      await writeFile(file, JSON.stringify({ body, ...(config.mode === 'contact' ? { collaboration_id: args[1] } : {}) }) + '\n', { flag: 'wx', mode: 0o600 });
      console.log('Draft queued. The running connector will send it; no other owner was messaged by this CLI yet.');
    } else if (command === 'run') {
      await unlink(join(root, 'STOP')).catch(error => { if (error.code !== 'ENOENT') throw error; });
      const worker = new PeerWorker({ root });
      process.on('SIGINT', () => { worker.stopping = true; }); process.on('SIGTERM', () => { worker.stopping = true; });
      console.log(`Starting ${config.role} ${config.task_id || 'demo-export'} connector. Ctrl+C to stop after the current turn.`);
      await worker.run();
    } else throw new Error('Unknown peer command');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
