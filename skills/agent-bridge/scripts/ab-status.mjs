import { readFile, access } from 'node:fs/promises';
import { join, isAbsolute, resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const json = async path => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
export function defaultBinding() {
  return process.platform === 'win32'
    ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'AgentBridge', 'skill-binding.json')
    : join(homedir(), '.local/share/agent-bridge/skill-binding.json');
}
function failureKind(value) {
  return String(value).match(/\b(?:401|403|409|410|ENOENT|EPERM|ECONNREFUSED|ENETUNREACH|ETIMEDOUT)\b|fingerprint mismatch|timed out/i)?.[0] || 'status-command-failed';
}
export async function inspectStatus(bindingPath = defaultBinding(), { offline = false } = {}) {
  let binding;
  try { binding = await json(bindingPath); }
  catch (error) { return { status: error.code === 'ENOENT' ? 'setup-required' : 'invalid-binding', binding_path: bindingPath }; }
  if (!binding || !['app_dir', 'peer_dir'].every(key => typeof binding[key] === 'string' && isAbsolute(binding[key]))) {
    return { status: 'invalid-binding', binding_path: bindingPath };
  }
  const cli = join(binding.app_dir, 'src/peer-cli.mjs');
  const report = { status: 'inspected', app_dir: binding.app_dir, peer_dir: binding.peer_dir, cli };
  try { await access(cli); }
  catch { return { ...report, status: 'application-missing' }; }
  let worker, state;
  try { worker = await json(join(binding.peer_dir, 'peer-status.json')); } catch { /* Not yet started or unreadable. */ }
  try { state = await json(join(binding.peer_dir, 'peer-state.json')); } catch { /* Not yet initialized or unreadable. */ }
  if (worker) {
    let processAlive = null;
    if (Number.isInteger(worker.pid) && worker.pid > 0) {
      try { process.kill(worker.pid, 0); processAlive = true; }
      catch (error) { processAlive = error.code === 'ESRCH' ? false : null; }
    }
    const updated = Date.parse(worker.updated_at);
    const age = Number.isFinite(updated) ? Math.max(0, Date.now() - updated) : null;
    const phases = ['waiting-for-pairing', 'waiting', 'processing', 'blocked', 'waiting-or-blocked', 'stopped'];
    report.worker = { phase: phases.includes(worker.phase) ? worker.phase : 'unknown',
      pid: Number.isInteger(worker.pid) ? worker.pid : null, process_alive: processAlive,
      status_age_ms: age, status_fresh: age === null ? false : age < (worker.phase === 'processing' ? 200000 : 10000) };
  } else report.worker = { phase: 'not-observed', process_alive: null, status_fresh: false };
  report.local = { state_present: !!state, has_codex_session: typeof state?.thread_id === 'string',
    inbound_count: Object.keys(state?.inbound || {}).length, outbound_count: Object.keys(state?.outbound || {}).length,
    blocked_count: Object.values(state?.inbound || {}).filter(item => ['failed', 'processing'].includes(item?.status)).length };
  if (offline) { report.relay = { checked: false }; return report; }
  const child = spawnSync(process.execPath, [cli, 'status', binding.peer_dir], { encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true });
  if (child.error || child.status !== 0) {
    report.status = 'attention-required';
    report.relay = { checked: true, reachable: null, error: failureKind(child.error?.code || child.stderr) };
    return report;
  }
  try {
    const remote = JSON.parse(child.stdout);
    if (typeof remote.ready !== 'boolean' || !['mac', 'windows'].includes(remote.role) || !Number.isFinite(remote.expires_at)) throw new Error('Invalid status');
    report.relay = { checked: true, reachable: true, role: remote.role, ready: remote.ready,
      expires_at: new Date(remote.expires_at).toISOString(), expired: remote.expires_at <= Date.now(),
      identities: Object.fromEntries(['mac', 'windows'].filter(role => /^[a-f0-9]{16}$/.test(remote.identities?.[role] || '')).map(role => [role, remote.identities[role]])),
      message_count: Array.isArray(remote.messages) ? remote.messages.length : null };
  } catch { report.status = 'attention-required'; report.relay = { checked: true, reachable: null, error: 'invalid-status-response' }; }
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let binding = defaultBinding(), offline = false;
  try {
    for (let i = 2; i < process.argv.length; i++) {
      if (process.argv[i] === '--offline') offline = true;
      else if (process.argv[i] === '--binding' && process.argv[i + 1]) binding = resolve(process.argv[++i]);
      else throw new Error('Usage: node ab-status.mjs [--binding PATH] [--offline]');
    }
    const report = await inspectStatus(binding, { offline });
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== 'inspected') process.exitCode = 1;
  } catch { console.error('AB status inspection failed; check the binding path and Node.js runtime.'); process.exitCode = 1; }
}
