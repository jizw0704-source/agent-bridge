import { resolve, join } from 'node:path';
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { atomicJSON } from './bridge.mjs';
import { relayRequest, safeEndpoint } from './relay.mjs';
import { initPeer, peerConfig, PeerWorker } from './peer.mjs';

const [command, directory, ...args] = process.argv.slice(2);
const json = async path => JSON.parse(await readFile(path, 'utf8'));
async function empty(root) { await mkdir(root, { recursive: true, mode: 0o700 }); if ((await readdir(root)).length) throw new Error('Choose an empty dedicated peer directory'); }
try {
  if (!directory) throw new Error('Usage: pnpm peer <create|join|invite|status|confirm|send|run|stop|close> dedicated-directory ...');
  const root = resolve(directory);
  if (command === 'create') {
    const [adminDir, origin, fingerprint] = args;
    if (!adminDir || !origin) throw new Error('create requires relay-admin-directory and relay-origin [TLS-fingerprint]');
    await empty(root);
    const admin = await json(join(resolve(adminDir), 'admin.json'));
    const base = { url: safeEndpoint(origin), fingerprint };
    const pair = await relayRequest({ ...base, token: admin.token }, 'create', {});
    await initPeer(root, { ...base, room_id: pair.room_id, role: 'mac', token: pair.token });
    await atomicJSON(join(root, 'invite.json'), { ...base, room_id: pair.room_id, invite: pair.invite, expires_at: pair.invite_expires_at });
    console.log(`Created room. Privately share ${join(root, 'invite.json')} within ten minutes. Do not share config.json or admin.json.`);
  } else if (command === 'join') {
    if (!args[0]) throw new Error('join requires the invitation file path');
    await empty(root);
    const invite = await json(resolve(args[0]));
    const pair = await relayRequest(invite, 'join', { invite: invite.invite });
    await initPeer(root, { url: invite.url, fingerprint: invite.fingerprint, room_id: pair.room_id, role: pair.role, token: pair.token });
    console.log('Joined. Compare identity codes with the other owner, then both confirm.');
  } else {
    const config = await peerConfig(root);
    if (command === 'status') console.log(JSON.stringify(await relayRequest(config, 'status'), null, 2));
    else if (command === 'invite') {
      const pair = await relayRequest(config, 'invite', {});
      await atomicJSON(join(root, 'invite.json'), { url: config.url, fingerprint: config.fingerprint,
        room_id: config.room_id, invite: pair.invite, expires_at: pair.invite_expires_at });
      console.log(`Fresh invitation saved to ${join(root, 'invite.json')}. Previous invitations are invalid. Expires: ${new Date(pair.invite_expires_at).toISOString()}`);
    } else if (command === 'confirm') {
      if (!args[0]) throw new Error('confirm requires the peer identity code from the other owner');
      console.log(JSON.stringify(await relayRequest(config, 'confirm', { peer_identity: args[0] })));
    } else if (command === 'close') console.log(JSON.stringify(await relayRequest(config, 'close', {})));
    else if (command === 'stop') { await writeFile(join(root, 'STOP'), 'stop after current turn\n', { mode: 0o600 }); console.log('Stop requested.'); }
    else if (command === 'send') {
      if (!args[0]) throw new Error('send requires a UTF-8 message file');
      const body = await readFile(resolve(args[0]), 'utf8');
      if (!body.trim() || body.length > 8000) throw new Error('Message must contain 1..8000 characters');
      // A running worker will pick up a durable draft; never edit its state concurrently.
      const file = join(root, 'draft.json');
      await writeFile(file, JSON.stringify({ body }) + '\n', { flag: 'wx', mode: 0o600 });
      console.log('Draft queued. The running connector will send it; no other owner was messaged by this CLI yet.');
    } else if (command === 'run') {
      await unlink(join(root, 'STOP')).catch(error => { if (error.code !== 'ENOENT') throw error; });
      const worker = new PeerWorker({ root });
      process.on('SIGINT', () => { worker.stopping = true; }); process.on('SIGTERM', () => { worker.stopping = true; });
      console.log(`Starting ${config.role} fictional-task connector. Ctrl+C to stop after the current turn.`);
      await worker.run();
    } else throw new Error('Unknown peer command');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
