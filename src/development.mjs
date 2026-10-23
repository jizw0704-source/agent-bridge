import { mkdir, readFile, writeFile, lstat, realpath, open, unlink, readdir } from 'node:fs/promises';
import { resolve, join, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { atomicJSON, runCodex } from './bridge.mjs';

export const developmentScope = 'development-v1';
const exec = promisify(execFile);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const id = x => typeof x === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(x) && !['__proto__', 'constructor', 'prototype'].includes(x);
const text = x => typeof x === 'string' && x.trim() && x.length <= 4000;
const list = x => Array.isArray(x) && x.length > 0 && x.length <= 20;
export function relativeFile(path) {
  if (typeof path !== 'string' || !/^[a-zA-Z0-9_.\/-]{1,180}$/.test(path) || isAbsolute(path) || path.split('/').some(p => !p || p === '.' || p === '..' || p.toLowerCase() === '.git')) throw new Error('Unsafe repository-relative file');
  return path;
}
export function validateDevelopment(value) {
  if (!value || value.type !== 'handoff' || !id(value.id) || !/^[\w.-]+\/[\w.-]+$/.test(value.repository) || !/^[a-f0-9]{40}$/.test(value.base) || !text(value.goal) || !list(value.files) || !list(value.acceptance) || !value.acceptance.every(text) || !Array.isArray(value.references) || value.references.length > 20 || !value.references.every(text) || !Array.isArray(value.checks) || value.checks.length > 20 || !value.checks.every(id)) throw new Error('Invalid development handoff');
  if (Object.keys(value).some(k => !['type', 'id', 'repository', 'base', 'goal', 'files', 'acceptance', 'references', 'checks', 'push', 'draft_pr'].includes(k))) throw new Error('Unknown handoff field');
  value.files.forEach(relativeFile);
  if (new Set(value.files).size !== value.files.length || (value.push !== undefined && typeof value.push !== 'boolean') || (value.draft_pr !== undefined && typeof value.draft_pr !== 'boolean') || (value.draft_pr && !value.push)) throw new Error('Invalid operations');
  return value;
}
const cleanEnv = () => ({ PATH: process.env.PATH, HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' });
async function command(file, args, cwd, { env = {} } = {}) {
  return exec(file, args, { cwd, env: { ...cleanEnv(), ...env }, timeout: 60000, maxBuffer: 1000000, windowsHide: true });
}
export async function pushDevelopmentBranch({ worktree, origin, branch }, run = command) {
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(origin) || !/^ab\/dev-[a-f0-9]{24}$/.test(branch)) throw new Error('Invalid dedicated GitHub push target');
  const token = (await run('gh', ['auth', 'token', '--hostname', 'github.com'], worktree)).stdout.trim();
  if (!token || /[\r\n]/.test(token)) throw new Error('GitHub authentication unavailable');
  const header = 'Authorization: Basic ' + Buffer.from('x-access-token:' + token).toString('base64');
  try {
    await run('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'protocol.allow=never', '-c', 'protocol.https.allow=always', '-c', 'credential.helper=', '-c', 'http.sslVerify=true', '-c', 'http.followRedirects=false', '-c', 'http.extraHeader=', 'push', origin, 'HEAD:refs/heads/' + branch], worktree,
      { env: { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.' + origin + '.extraHeader', GIT_CONFIG_VALUE_0: header } });
  } catch { throw new Error('GitHub push failed; inspect the dedicated branch before retrying'); }
}
async function git(cwd, ...args) {
  return (await command('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'commit.gpgSign=false', ...args], cwd)).stdout.trim();
}
async function plain(path) { if ((await lstat(path)).isSymbolicLink()) throw new Error('Symlinks are not authorized'); return path; }
async function safeFile(root, path) {
  relativeFile(path);
  let current = root;
  for (const part of path.split('/')) {
    current = join(current, part);
    await plain(current);
  }
  if (!(await lstat(current)).isFile()) throw new Error('Only existing regular text files are supported');
  return current;
}
export class DevelopmentEngine {
  constructor({ root, invoke = runCodex }) { this.root = resolve(root); this.invoke = invoke; }
  async init() { await mkdir(this.root, { recursive: true, mode: 0o700 }); await plain(this.root); }
  taskPath(key) { return join(this.root, digest(key) + '.json'); }
  async localKey(task) {
    if (!id(task)) throw new Error('Valid local task ID required');
    const matches = [];
    for (const name of await readdir(this.root)) {
      if (!/^[a-f0-9]{64}\.json$/.test(name)) continue;
      const state = JSON.parse(await readFile(join(this.root, name), 'utf8'));
      if (state.handoff?.id === task) matches.push(state.key);
    }
    if (matches.length !== 1) throw new Error('Local task missing or ambiguous; inspect private state');
    return matches[0];
  }
  async load(key) { return JSON.parse(await readFile(this.taskPath(key), 'utf8')); }
  save(key, state) { return atomicJSON(this.taskPath(key), state); }
  async policy() { await plain(join(this.root, 'policy.json')); return JSON.parse(await readFile(join(this.root, 'policy.json'), 'utf8')); }
  async allowed(contact, handoff) {
    const policy = await this.policy();
    const grant = policy.contacts?.find(c => c.room_id === contact.room_id && c.identity === contact.identity);
    if (!grant || !grant.repositories?.includes(handoff.repository)) throw new Error('Contact or repository not authorized locally');
    const repo = policy.repositories?.[handoff.repository];
    if (!repo || !isAbsolute(repo.path) || repo.edit !== true || repo.commit !== true || !handoff.files.every(f => repo.files?.includes(f)) || !handoff.checks.every(c => Object.hasOwn(repo.checks || {}, c)) || (handoff.push && repo.push !== true) || (handoff.draft_pr && repo.draft_pr !== true)) throw new Error('Operation not authorized locally');
    for (const key of handoff.checks) {
      const check = repo.checks[key];
      if (!['node-syntax', 'json', 'contains'].includes(check.type) || !handoff.files.includes(check.file) || (check.type === 'contains' && typeof check.text !== 'string')) throw new Error('Only registered bounded checks are supported');
    }
    await plain(repo.path);
    if (await realpath(repo.path) !== resolve(repo.path)) throw new Error('Repository path must be canonical');
    return { repo, automatic: grant.automatic === true };
  }
  async locked(fn) {
    const lock = await open(join(this.root, 'engine.lock'), 'wx', 0o600);
    try { await lock.writeFile(JSON.stringify({ pid: process.pid })); return await fn(); }
    finally { await lock.close(); await unlink(join(this.root, 'engine.lock')); }
  }
  async submit(contact, handoff) {
    const result = await this.locked(() => this.stage(contact, handoff));
    const key = { room_id: contact.room_id, identity: contact.identity, id: handoff.id };
    const state = await this.load(key);
    if (state.automatic && state.status === 'awaiting-authorization') return this.execute(key, { automatic: true });
    return result;
  }
  async stage(contact, handoff) {
    validateDevelopment(handoff);
    const key = { room_id: contact.room_id, identity: contact.identity, id: handoff.id };
    let state;
    try { state = await this.load(key); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (state) { if (state.digest !== digest(handoff)) throw new Error('Task ID conflict'); return this.public(state); }
    state = { key, handoff, digest: digest(handoff), status: 'awaiting-authorization', rounds: 0, checks: [], changes: [], decisions: [], remaining: [], created_at: new Date().toISOString() };
    try { const grant = await this.allowed(contact, handoff); state.automatic = grant.automatic; }
    catch (e) { state.status = 'rejected'; state.error = e.message; }
    await this.save(key, state);
    return this.public(state);
  }
  public(state) {
    const trim = values => values?.slice(0, 10).map(v => String(v).slice(0, 200));
    const result = { type: 'report', id: state.handoff.id, status: state.status, question_id: state.question_id, question: state.question?.slice(0, 1200), changes: [...state.changes], produced_diff: state.produced_diff?.slice(0, 600), checks: [...state.checks], commit: state.commit, branch: state.branch, pr: state.pr, remaining: trim(state.remaining), decisions: trim(state.decisions), error: state.error?.slice(0, 500) };
    // Full evidence stays in the private task file; bound network reports independently.
    for (const field of ['decisions', 'remaining', 'checks', 'changes']) {
      while (JSON.stringify(result).length > 7500 && result[field]?.length) {
        result[field].pop(); result.report_truncated = true;
      }
    }
    return result;
  }
  async cancel(key) {
    // A separate marker is writable while execution holds its lock; checked before every side effect.
    await writeFile(this.taskPath(key) + '.cancel', 'cancel\n', { mode: 0o600 });
    const state = await this.load(key);
    if (state.status !== 'executing') { state.status = 'cancelled'; await this.save(key, state); }
  }
  async checkpoint(state) {
    try { await lstat(this.taskPath(state.key) + '.cancel'); throw new Error('Cancelled: no further steps will start'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    const grant = await this.allowed(state.key, state.handoff); // Re-read local authorization before every step.
    if (state.grant_digest && state.grant_digest !== digest(grant.repo)) throw new Error('Local repository grant changed during execution');
    if (state.execution_mode === 'automatic' && !grant.automatic) throw new Error('Automatic execution permission revoked');
    if (state.expected_files) {
      if (state.git_config_digest !== digest(await git(state.worktree, 'config', '--local', '--list'))) throw new Error('Repository Git configuration changed during execution');
      if (await git(state.worktree, 'rev-parse', 'HEAD') !== (state.commit || state.handoff.base)) throw new Error('Task HEAD changed outside AB');
      for (const [name, expected] of Object.entries(state.expected_files)) {
        const path = await safeFile(state.worktree, name);
        if (createHash('sha256').update(await readFile(path)).digest('hex') !== expected) throw new Error('Task file changed outside AB; preserve and inspect');
      }
      for (const args of [['diff', '--no-ext-diff', '--no-textconv', '--name-only'], ['diff', '--cached', '--no-ext-diff', '--no-textconv', '--name-only'], ['ls-files', '--others', '--exclude-standard']]) {
        const changed = (await git(state.worktree, ...args)).split('\n').filter(Boolean);
        if (changed.some(name => !state.changes.includes(name))) throw new Error('Unexpected task workspace changes; preserve and inspect');
      }
    }
  }
  async answer(key, questionId, answer) {
    if (!text(answer)) throw new Error('Bounded clarification answer required');
    const s = await this.load(key);
    if (s.status !== 'awaiting-clarification' || s.question_id !== questionId) throw new Error('Clarification does not match this task');
    s.answer = answer; s.status = 'awaiting-authorization'; await this.save(key, s);
    return this.public(s); // Local approve/run required again, unless receiver explicitly uses automatic mode.
  }
  async execute(key, { automatic = false } = {}) {
    return this.locked(async () => {
      const s = await this.load(key);
      if (!['awaiting-authorization'].includes(s.status)) return this.public(s);
      try {
        s.execution_mode = automatic ? 'automatic' : 'local-approval';
        s.approved_at = new Date().toISOString();
        const { repo } = await this.allowed(key, s.handoff);
        if (s.worktree_repository && s.worktree_repository !== repo.path) throw new Error('Task repository mapping changed');
        s.grant_digest = digest(repo);
        await this.checkpoint(s);
        const origin = await git(repo.path, 'remote', 'get-url', 'origin');
        if (origin !== repo.origin) throw new Error('Repository origin does not match local mapping');
        const localGitConfig = await git(repo.path, 'config', '--local', '--list');
        s.git_config_digest = digest(localGitConfig);
        if (localGitConfig.split('\n').some(x => /^(filter\.|url\.|http\.|remote\..*\.(pushurl|receivepack|mirror)=|extensions\.worktreeconfig=|core\.sshcommand=|core\.gitproxy=|include)/i.test(x))) throw new Error('Custom Git filters/commands/includes/push routing are unsupported');
        if (resolve(await git(repo.path, 'rev-parse', '--show-toplevel')) !== resolve(repo.path)) throw new Error('Repository root mismatch');
        if (await git(repo.path, 'status', '--porcelain')) throw new Error('Source workspace is dirty; preserve changes and use a clean owner-prepared clone');
        if (s.worktree) {
          await plain(s.worktree);
          if (await git(s.worktree, 'rev-parse', 'HEAD') !== s.handoff.base || await git(s.worktree, 'status', '--porcelain')) throw new Error('Task worktree changed outside AB; preserve and inspect');
        }
        if (await git(repo.path, 'rev-parse', '--verify', s.handoff.base + '^{commit}') !== s.handoff.base) throw new Error('Missing pinned base commit');
        if (!s.worktree) {
          s.branch = 'ab/dev-' + digest(key).slice(0, 24);
          s.worktree = join(this.root, 'work-' + digest(key).slice(0, 24));
          s.worktree_repository = repo.path;
          s.status = 'executing'; await this.save(key, s); // Crash never silently repeats a side effect.
          await this.checkpoint(s);
          await git(repo.path, 'worktree', 'add', '-b', s.branch, s.worktree, s.handoff.base);
        }
        s.status = 'executing'; await this.save(key, s);
        if (++s.rounds > 3) throw new Error('Clarification/model round limit reached');
        const files = [];
        for (const name of s.handoff.files) {
          await safeFile(s.worktree, name);
          const stat = await lstat(join(s.worktree, name)); if (stat.size > 24000) throw new Error('File snapshot exceeds MVP limit');
          const content = new TextDecoder('utf-8', { fatal: true }).decode(await readFile(join(s.worktree, name)));
          if (content.includes('\u0000')) throw new Error('Binary files unsupported');
          files.push({ path: name, content });
        }
        s.expected_files = Object.fromEntries(files.map(f => [f.path, createHash('sha256').update(f.content).digest('hex')]));
        await this.save(key, s);
        await this.checkpoint(s);
        const modelDir = join(this.root, 'model-' + digest(key).slice(0, 24)); await mkdir(modelDir, { recursive: true, mode: 0o700 });
        const output = await this.invoke({ cwd: modelDir, outputDir: modelDir, threadId: s.thread_id, development: true, message: { message_id: 'turn-' + s.rounds, body: JSON.stringify({ handoff: s.handoff, files, question: s.question, answer: s.answer }) } });
        if (s.thread_id && output.thread_id !== s.thread_id) throw new Error('Development conversation changed');
        s.thread_id = output.thread_id;
        await this.checkpoint(s);
        const plan = JSON.parse(output.body);
        if (plan.kind === 'clarify') {
          if (!text(plan.question)) throw new Error('Invalid clarification');
          s.question_id = 'q' + s.rounds; s.question = plan.question; s.status = 'awaiting-clarification'; await this.save(key, s); return this.public(s);
        }
        if (plan.kind !== 'changes' || !list(plan.files) || !plan.files.every(f => s.handoff.files.includes(f.path) && typeof f.content === 'string' && !f.content.includes('\u0000') && Buffer.byteLength(f.content, 'utf8') <= 24000) || new Set(plan.files.map(f => f.path)).size !== plan.files.length) throw new Error('Model proposed unauthorized file operations');
        s.remaining = Array.isArray(plan.remaining) ? plan.remaining.filter(text).slice(0, 10) : [];
        s.decisions = Array.isArray(plan.decisions) ? plan.decisions.filter(text).slice(0, 10) : [];
        for (const file of plan.files) {
          await this.checkpoint(s); const path = await safeFile(s.worktree, file.path);
          await writeFile(path, file.content, 'utf8'); s.expected_files[file.path] = createHash('sha256').update(file.content).digest('hex'); s.changes.push(file.path); await this.save(key, s);
        }
        for (const name of s.handoff.checks) {
          await this.checkpoint(s);
          const check = repo.checks[name]; const path = await safeFile(s.worktree, check.file);
          try {
            if (check.type === 'node-syntax') await command(process.execPath, ['--check', path], s.worktree);
            else if (check.type === 'json') JSON.parse(await readFile(path, 'utf8'));
            else if (!(await readFile(path, 'utf8')).includes(check.text)) throw new Error('Required text absent');
            s.checks.push({ name, passed: true });
          } catch { s.checks.push({ name, passed: false }); throw new Error('Registered check failed: ' + name); }
          await this.save(key, s);
        }
        await this.checkpoint(s);
        if (!await git(s.worktree, 'diff', '--no-ext-diff', '--no-textconv', '--numstat')) throw new Error('No reviewable changes produced');
        await git(s.worktree, 'add', '--', ...s.changes);
        await this.checkpoint(s);
        await git(s.worktree, '-c', 'user.name=Agent Bridge', '-c', 'user.email=agent-bridge@localhost', 'commit', '--only', '-m', 'AB development task ' + s.handoff.id, '--', ...s.changes);
        s.commit = await git(s.worktree, 'rev-parse', 'HEAD'); await this.save(key, s);
        if (s.handoff.push) {
          await this.checkpoint(s);
          if (repo.origin.replace(/\.git$/, '') !== 'https://github.com/' + s.handoff.repository) throw new Error('GitHub repository mapping mismatch');
          if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(repo.origin)) throw new Error('Push supports configured HTTPS GitHub origin only');
          await pushDevelopmentBranch({ worktree: s.worktree, origin: repo.origin, branch: s.branch }); s.pushed = true; await this.save(key, s);
        }
        if (s.handoff.draft_pr) {
          if (!id(repo.base_branch)) throw new Error('Explicit local PR base branch required');
          await this.checkpoint(s);
          // Exact local repository mapping; model cannot choose CLI arguments or PR state.
          const result = await command('gh', ['api', '--method', 'POST', 'repos/' + s.handoff.repository + '/pulls', '-f', 'head=' + s.branch, '-f', 'base=' + repo.base_branch, '-f', 'title=AB task ' + s.handoff.id, '-f', 'body=Review required. Commit: ' + s.commit, '-F', 'draft=true'], s.worktree);
          s.pr = JSON.parse(result.stdout).html_url; await this.save(key, s);
        }
        s.status = 'awaiting-review';
      } catch (e) {
        s.status = e.message.startsWith('Cancelled:') ? 'cancelled' : 'failed'; s.error = e.message;
        if (s.worktree) {
          try { s.produced_diff = await git(s.worktree, 'diff', '--no-ext-diff', '--no-textconv', '--stat'); } catch { /* Keep prior evidence. */ }
        }
      }
      await this.save(key, s); return this.public(s);
    });
  }
}
