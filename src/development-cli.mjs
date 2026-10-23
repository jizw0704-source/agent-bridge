import { resolve, join } from 'node:path';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { initializeDevelopment, DevelopmentPeer, developmentContext } from './development-peer.mjs';
const [command, directory, ...args] = process.argv.slice(2);
try {
  if (!directory) throw new Error('Usage: node src/development-cli.mjs init|send|poll|run|stop|approve|report|cancel|status ROOT ...');
  const root = resolve(directory), peer = new DevelopmentPeer({ root });
  if (command === 'init') { if (!args[0]) throw new Error('init requires existing paired contact directory'); await initializeDevelopment(root, args[0]); }
  else if (command === 'send') console.log(JSON.stringify(await peer.send(args[0], JSON.parse((await readFile(resolve(args[1]), 'utf8')).replace(/^\uFEFF/, '')))));
  else if (command === 'poll') console.log(JSON.stringify(await peer.poll(), null, 2));
  else if (command === 'report') {
    const { contact } = await developmentContext(root); const result = peer.engine.public(await peer.engine.load({ ...contact, id: args[0] })); console.log(JSON.stringify(await peer.send(args[0], result)));
  }
  else if (command === 'approve') console.log(JSON.stringify(await peer.approve(args[0]), null, 2));
  else if (command === 'cancel') {
    const key = await peer.engine.localKey(args[0]);
    await peer.engine.load(key); await peer.engine.cancel(key); console.log('Cancellation requested; no new execution step will start after the current step.');
  } else if (command === 'status') {
    const key = await peer.engine.localKey(args[0]); console.log(JSON.stringify(peer.engine.public(await peer.engine.load(key)), null, 2));
  } else if (command === 'stop') await writeFile(join(root, 'STOP'), 'stop\n', { mode: 0o600 });
  else if (command === 'run') {
    await unlink(join(root, 'STOP')).catch(e => { if (e.code !== 'ENOENT') throw e; });
    let stop = false; process.on('SIGINT', () => { stop = true; }); process.on('SIGTERM', () => { stop = true; });
    while (!stop) {
      try { await readFile(join(root, 'STOP')); break; } catch (e) { if (e.code !== 'ENOENT') throw e; }
      await peer.poll(); await delay(1000);
    }
  } else throw new Error('Unknown development command');
} catch (e) { console.error(e.message); process.exitCode = 1; }
