import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFile, writeFile, unlink, open } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { initReceiver, assertReceiver, enqueueMock, Receiver } from './receiver.mjs';

const [command, directory, roundText] = process.argv.slice(2);
const shortMock = command === 'mock' && /^[0-9]+$/.test(directory || '') && roundText === undefined;
const root = resolve((shortMock ? undefined : directory) || join(homedir(), '.local', 'share', 'agent-bridge', 'mock-wright'));
const read = async name => JSON.parse(await readFile(join(root, name), 'utf8'));
try {
  if (command === 'init') { await initReceiver(root); console.log(`Initialized mock inbox: ${root}`); }
  else {
    await assertReceiver(root);
    if (command === 'serve') {
      const worker = new Receiver({ root });
      process.on('SIGINT', () => { worker.stopping = true; });
      process.on('SIGTERM', () => { worker.stopping = true; });
      await worker.run();
    } else if (command === 'start') {
      try { await read('receiver.lock'); throw new Error('Receiver lock exists; inspect status first'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      await unlink(join(root, 'STOP')).catch(error => { if (error.code !== 'ENOENT') throw error; });
      const log = await open(join(root, 'receiver.log'), 'a', 0o600);
      const child = spawn(process.execPath, [fileURLToPath(import.meta.url), 'serve', root], { detached: true, stdio: ['ignore', log.fd, log.fd] });
      child.on('error', error => { console.error(error.message); process.exitCode = 1; });
      child.unref(); await log.close();
      let ready = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        await delay(100);
        try {
          const state = await read('receiver-status.json');
          if (state.pid === child.pid && ['waiting', 'processing', 'blocked'].includes(state.phase)) { ready = true; break; }
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      if (!ready) throw new Error('Receiver did not become ready; inspect receiver.log');
      console.log(`Started receiver PID ${child.pid}: ${root}`);
    } else if (command === 'mock') {
      const message = await enqueueMock(root, Number(shortMock ? directory : roundText)); console.log(`Queued ${message.message_id}; reply will appear automatically in outbox.`);
    } else if (command === 'stop') {
      await writeFile(join(root, 'STOP'), 'Stop after current reply.\n', { mode: 0o600 });
      console.log('Stop requested; in-flight turn may take up to its three-minute timeout.');
    } else if (command === 'status') {
      const state = await read('receiver-status.json');
      let alive = false;
      try { const lock = await read('receiver.lock'); process.kill(lock.pid, 0); alive = lock.pid === state.pid; }
      catch (error) { if (!['ENOENT', 'ESRCH'].includes(error.code)) throw error; }
      console.log(JSON.stringify({ root, process_alive: alive, ...state }, null, 2));
    } else throw new Error('Usage: pnpm inbox <init|start|serve|mock|status|stop> [dedicated-directory] [round-number]');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
