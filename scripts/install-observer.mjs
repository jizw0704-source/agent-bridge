import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, access, writeFile, copyFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { observerInit } from '../src/observer.mjs';

// Installs only the separate read-only observer; never changes the relay's service or state.
const exec = promisify(execFile);
const args = process.argv.slice(2), options = {};
try {
  if (process.platform !== 'linux') throw new Error('This installer requires Linux with a user systemd manager');
  for (let index = 0; index < args.length; index += 2) {
    if (!['--relay-root', '--install-root', '--host', '--port'].includes(args[index]) || !args[index + 1]) throw new Error('Usage: node scripts/install-observer.mjs --relay-root DIR --host LAN_IP [--install-root DIR] [--port 8791]');
    options[args[index].slice(2)] = args[index + 1];
  }
  if (!options['relay-root'] || !options.host || !/^[a-zA-Z0-9.:-]+$/.test(options.host)) throw new Error('An existing relay root and explicit host are required');
  const port = options.port || '8791';
  if (!/^\d+$/.test(port) || +port < 1 || +port > 65535) throw new Error('Invalid port');
  const relayRoot = resolve(options['relay-root']);
  for (const file of ['relay-state.json', 'tls.key', 'tls.crt']) await access(join(relayRoot, file));
  const root = resolve(options['install-root'] || join(homedir(), '.local/share/agent-bridge-observer'));
  const authRoot = join(root, 'access');
  await mkdir(root, { recursive: true, mode: 0o700 });
  try { await access(join(authRoot, 'observer-access.json')); } catch { await observerInit(authRoot); }
  const unitDir = join(homedir(), '.config/systemd/user'); await mkdir(unitDir, { recursive: true });
  const unit = join(unitDir, 'agent-bridge-observer.service');
  try { await access(unit); await copyFile(unit, `${unit}.before-${Date.now()}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const quote = value => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/%/g, '%%')}"`;
  const cli = fileURLToPath(new URL('../src/observer-cli.mjs', import.meta.url));
  const command = [process.execPath, cli, 'serve', relayRoot, authRoot, port, '--host', options.host, '--tls'].map(quote).join(' ');
  await writeFile(unit, `[Unit]\nDescription=Agent Bridge read-only conversation observer\nAfter=network.target\n\n[Service]\nType=simple\nExecStart=${command}\nRestart=on-failure\nRestartSec=5\nUMask=0077\nNoNewPrivileges=true\n\n[Install]\nWantedBy=default.target\n`, { mode: 0o600 });
  await exec('systemctl', ['--user', 'daemon-reload']);
  await exec('systemctl', ['--user', 'enable', 'agent-bridge-observer.service']);
  await exec('systemctl', ['--user', 'restart', 'agent-bridge-observer.service']);
  console.log(`Observer installed: https://${options.host}:${port}`);
  console.log(`Private viewing key file: ${join(authRoot, 'observer-access.json')}`);
  console.log('Relay configuration and message state were not changed.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
