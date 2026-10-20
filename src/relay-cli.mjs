import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, unlink } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { relayInit, startRelay } from './relay.mjs';

const [command, directory, portArg, ...flags] = process.argv.slice(2);
try {
  if (!directory) throw new Error('Usage: pnpm relay <init|tls|serve> dedicated-directory [port] [--lan|--tls]');
  const root = resolve(directory);
  if (command === 'init') { await relayInit(root); console.log(`Relay initialized: ${root} (keep admin.json private)`); }
  else if (command === 'tls') {
    await access(join(root, 'admin.json')); await access(join(root, 'relay-state.json'));
    const key = join(root, 'tls.key'), cert = join(root, 'tls.crt');
    try { await access(key); throw new Error('TLS key exists; refusing to overwrite active identity'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const previous = process.umask(0o077);
    try {
      await promisify(execFile)('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert,
        '-days', '7', '-subj', '/CN=AgentBridge-LAN']);
    } catch (error) { await unlink(key).catch(() => {}); await unlink(cert).catch(() => {}); throw error; }
    finally { process.umask(previous); }
    console.log('Created seven-day local TLS certificate. Share its fingerprint via the invitation file.');
  } else if (command === 'serve') {
    const args = [portArg, ...flags].filter(Boolean);
    const lan = args.includes('--lan'), tls = lan || args.includes('--tls');
    const port = args.find(x => !x.startsWith('--')) || '8790';
    if (!/^\d+$/.test(port) || Number(port) > 65535) throw new Error('Invalid port');
    const relay = await startRelay({ root, port: Number(port), host: lan ? '0.0.0.0' : '127.0.0.1', tls });
    console.log(`Relay listening: ${relay.url}`);
    if (relay.fingerprint) console.log(`TLS SHA-256 fingerprint: ${relay.fingerprint}`);
    if (lan) for (const entries of Object.values(networkInterfaces())) for (const item of entries || [])
      if (item.family === 'IPv4' && !item.internal) console.log(`LAN candidate: https://${item.address}:${relay.server.address().port}`);
    const stop = () => { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); relay.close().catch(error => { console.error(error.message); process.exitCode = 1; }); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  } else throw new Error('Unknown relay command');
} catch (error) { console.error(error.message); process.exitCode = 1; }
