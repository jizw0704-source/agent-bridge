import { resolve, join } from 'node:path';
import { startObserver, observerInit } from './observer.mjs';

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'init' && args.length === 1) {
    const root = resolve(args[0]);
    await observerInit(root);
    console.log(`Viewing key file: ${join(root, 'observer-access.json')} (private; do not commit or share publicly)`);
  } else if (command === 'serve' || command === 'demo') {
    const positional = [], options = {};
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === '--tls') options.tls = true;
      else if (['--host', '--tls-dir'].includes(arg)) {
        if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
        options[arg === '--host' ? 'host' : 'tlsRoot'] = args[++index];
      } else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
      else positional.push(arg);
    }
    const demo = command === 'demo';
    if ((!demo && (positional.length < 2 || positional.length > 3)) || (demo && positional.length > 1)) throw new Error('Invalid observer arguments');
    const rawPort = positional[demo ? 0 : 2] || '8791';
    if (!/^\d+$/.test(rawPort) || Number(rawPort) > 65535) throw new Error('Invalid port');
    const observer = await startObserver({
      ...options, ...(options.tlsRoot ? { tlsRoot: resolve(options.tlsRoot) } : {}), demo,
      ...(!demo ? { relayRoot: resolve(positional[0]), authRoot: resolve(positional[1]) } : {}), port: Number(rawPort)
    });
    console.log(`Agent Bridge observer: ${observer.url}${demo ? ' (fictional demo data only)' : ' (sign-in required)'}`);
    let stopping = false;
    const stop = () => {
      if (stopping) return;
      stopping = true;
      observer.close().catch(error => { console.error(error.message); process.exitCode = 1; });
    };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  } else throw new Error('Usage: pnpm observer init AUTH_DIR | serve RELAY_DIR AUTH_DIR [port] [--host ADDRESS] [--tls] [--tls-dir DIR] | demo [port]');
} catch (error) { console.error(error.message); process.exitCode = 1; }
