import { createServer } from 'node:http';
import { createServer as createSecureServer, request as httpsRequest } from 'node:https';
import { randomBytes, randomUUID, createHash, timingSafeEqual, X509Certificate } from 'node:crypto';
import { mkdir, readFile, open, unlink, readdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { atomicJSON } from './bridge.mjs';
import { reviewTask, reviewLimit, validateReview } from './pr-review.mjs';

const hash = value => createHash('sha256').update(String(value)).digest('hex');
const token = () => randomBytes(32).toString('base64url');
function matches(value, expected) { const a = Buffer.from(hash(value)), b = Buffer.from(expected || ''); return a.length === b.length && timingSafeEqual(a, b); }
function fail(code, message) { throw Object.assign(new Error(message), { status: code }); }
function validId(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value); }
export function safeEndpoint(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use a bare relay origin without credentials or path');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))) throw new Error('Remote relay requires HTTPS');
  return url.origin;
}
export async function relayInit(root) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  if ((await lstat(root)).isSymbolicLink() || (await readdir(root)).length) throw new Error('Relay needs an empty dedicated directory');
  const file = join(root, 'admin.json');
  const handle = await open(file, 'wx', 0o600);
  const secret = token();
  try { await handle.writeFile(JSON.stringify({ token: secret }) + '\n'); } finally { await handle.close(); }
  await atomicJSON(join(root, 'relay-state.json'), { rooms: {} });
}

export async function startRelay({ root, port = 8790, host = '127.0.0.1', tls = false, now = Date.now }) {
  if (host !== '127.0.0.1' && !tls) throw new Error('Non-loopback relay requires TLS');
  const tlsOptions = tls ? { key: await readFile(join(root, 'tls.key')), cert: await readFile(join(root, 'tls.crt')) } : null;
  const fingerprint = tls ? createHash('sha256').update(new X509Certificate(tlsOptions.cert).raw).digest('hex') : undefined;
  const admin = JSON.parse(await readFile(join(root, 'admin.json'), 'utf8'));
  const lock = await open(join(root, 'relay.lock'), 'wx', 0o600);
  await lock.writeFile(JSON.stringify({ pid: process.pid })); await lock.close();
  let state;
  try { state = JSON.parse(await readFile(join(root, 'relay-state.json'), 'utf8')); }
  catch (error) { await unlink(join(root, 'relay.lock')); throw error; }
  let tail = Promise.resolve();
  const serialize = fn => { const next = tail.then(fn); tail = next.catch(() => {}); return next; };
  const save = async next => { await atomicJSON(join(root, 'relay-state.json'), next); state = next; };
  const authAdmin = req => { if (!matches(req.headers.authorization?.replace(/^Bearer /, '') || '', hash(admin.token))) fail(401, 'Unauthorized'); };
  function participant(req, room) {
    const secret = req.headers.authorization?.replace(/^Bearer /, '') || '';
    const role = ['mac', 'windows'].find(r => room.people[r] && matches(secret, room.people[r].digest));
    if (!role) fail(401, 'Unauthorized'); return role;
  }
  let joinWindow = 0, joinCount = 0;
  const handler = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json');
    try {
      if (req.headers.origin) fail(403, 'Browser-origin requests are not supported');
      const url = new URL(req.url, 'http://localhost');
      let body = {};
      if (req.method === 'POST') {
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 4000000) fail(413, 'Payload too large'); chunks.push(chunk); }
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { fail(400, 'Invalid JSON'); }
        if (!body || Array.isArray(body) || typeof body !== 'object') fail(400, 'Object body required');
      }
      const result = await serialize(async () => {
        if (req.method === 'GET' && url.pathname === '/health') return { status: 'ok', mode: 'bounded-collaboration', capabilities: ['persistent-rooms', 'translator-pr-review'] };
        const next = structuredClone(state);
        if (req.method === 'POST' && url.pathname === '/rooms') {
          authAdmin(req);
          if (Object.keys(next.rooms).length >= 100) fail(429, 'Room limit reached');
          if (body.lifetime !== undefined && !['daily', 'persistent'].includes(body.lifetime)) fail(400, 'Invalid room lifetime');
          if (body.task_id !== undefined && !['demo-export', reviewTask].includes(body.task_id)) fail(400, 'Invalid task scope');
          if (body.mode !== undefined && body.mode !== 'contact') fail(400, 'Invalid relationship mode');
          if (body.mode === 'contact' && body.task_id && body.task_id !== 'demo-export') fail(400, 'Contacts currently support fictional tasks only');
          const persistent = body.mode === 'contact' || body.lifetime === 'persistent';
          const id = randomUUID(), secret = token(), invite = token();
          next.rooms[id] = { id, ...(body.mode === 'contact' ? { mode: 'contact', tasks: {} } : {}), task_id: body.task_id || 'demo-export', lifetime: persistent ? 'persistent' : 'daily', created_at: now(), expires_at: persistent ? null : now() + 86400000, invite_digest: hash(invite), invite_expires: now() + 600000, revoked: false,
            people: { mac: { digest: hash(secret), confirmed: false, identity: randomBytes(8).toString('hex') } }, messages: [] };
          await save(next);
          return { room_id: id, token: secret, role: 'mac', task_id: next.rooms[id].task_id, lifetime: next.rooms[id].lifetime, mode: next.rooms[id].mode || 'legacy', invite, invite_expires_at: next.rooms[id].invite_expires };
        }
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length !== 3 || parts[0] !== 'rooms' || !validId(parts[1])) fail(404, 'Not found');
        const room = next.rooms[parts[1]];
        if (!room) fail(404, 'Not found');
        if (room.revoked || (room.expires_at !== null && now() >= room.expires_at)) fail(410, 'Room closed or expired');
        const action = parts[2];
        if (req.method === 'POST' && action === 'join') {
          if (now() - joinWindow > 60000) { joinWindow = now(); joinCount = 0; }
          if (++joinCount > 30) fail(429, 'Too many join attempts; wait a minute');
          if (room.people.windows) fail(409, 'Invite already consumed');
          if (now() > room.invite_expires) fail(410, 'Invite expired');
          if (!matches(body.invite || '', room.invite_digest)) fail(401, 'Invalid invite');
          const secret = token();
          room.people.windows = { digest: hash(secret), confirmed: false, identity: randomBytes(8).toString('hex') };
          delete room.invite_digest; await save(next);
          return { room_id: room.id, role: 'windows', token: secret, task_id: room.task_id, lifetime: room.lifetime || 'daily', mode: room.mode || 'legacy' };
        }
        const role = participant(req, room), peer = role === 'mac' ? 'windows' : 'mac';
        const ready = () => !!room.people.mac.confirmed && !!room.people.windows?.confirmed;
        if (req.method === 'POST' && action === 'invite') {
          if (role !== 'mac') fail(403, 'Only the owner can refresh an invitation');
          if (room.people.windows) fail(409, 'Peer already joined; invitation cannot be refreshed');
          const invite = token();
          room.invite_digest = hash(invite);
          room.invite_expires = Math.min(now() + 600000, room.expires_at ?? Infinity);
          await save(next);
          return { room_id: room.id, invite, invite_expires_at: room.invite_expires };
        }
        if (req.method === 'GET' && action === 'status') return { room_id: room.id, mode: room.mode || 'legacy', tasks: room.mode === 'contact' ? Object.values(room.tasks) : undefined, role, task_id: room.task_id, lifetime: room.lifetime || 'daily', ready: ready(), expires_at: room.expires_at,
          identities: Object.fromEntries(Object.entries(room.people).map(([r, p]) => [r, p.identity])),
          confirmed: Object.fromEntries(Object.entries(room.people).map(([r, p]) => [r, p.confirmed])),
          messages: room.messages.map(({ id, from, to, kind, reply_to, status, collaboration_id }) => ({ id, from, to, kind, reply_to, status, ...(collaboration_id ? { collaboration_id } : {}) })) };
        if (req.method === 'POST' && action === 'confirm') {
          if (!room.people[peer] || body.peer_identity !== room.people[peer].identity) fail(409, 'Compare peer identity before confirmation');
          room.people[role].confirmed = true; await save(next); return { ready: ready() };
        }
        if (req.method === 'POST' && action === 'close') { room.revoked = true; await save(next); return { closed: true }; }
        if (!ready()) fail(409, 'Both owners must confirm pairing first');
        if (room.mode === 'contact' && action === 'tasks') {
          if (req.method === 'GET') return { tasks: Object.values(room.tasks) };
          if (req.method === 'POST') {
            if (!validId(body.id) || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 160 || body.scope !== 'demo-export') fail(400, 'Task needs id, title and explicit demo-export scope');
            if (['__proto__', 'constructor', 'prototype'].includes(body.id)) fail(400, 'Reserved task ID');
            const old = Object.hasOwn(room.tasks, body.id) ? room.tasks[body.id] : undefined;
            if (old) {
              if (old.title !== body.title || old.scope !== body.scope) fail(409, 'Task ID conflict');
              return { task: old, duplicate: true };
            }
            if (Object.keys(room.tasks).length >= 1000) fail(429, 'Contact task capacity reached');
            const task = { id: body.id, title: body.title, scope: body.scope, status: 'active', created_by: role, created_at: now() };
            room.tasks[body.id] = task; await save(next); return { task, duplicate: false };
          }
        }
        if (room.mode === 'contact' && req.method === 'GET' && action === 'task-history') {
          const id = url.searchParams.get('id');
          if (!Object.hasOwn(room.tasks, id)) fail(404, 'Task not found');
          return { task: room.tasks[id], messages: room.messages.filter(m => m.collaboration_id === id) };
        }
        if (room.mode === 'contact' && req.method === 'POST' && action === 'archive-task') {
          const task = Object.hasOwn(room.tasks, body.id) ? room.tasks[body.id] : undefined;
          if (!task) fail(404, 'Task not found');
          if (room.messages.some(m => m.collaboration_id === body.id && !['replied', 'received'].includes(m.status))) fail(409, 'Finish or inspect pending messages before archiving');
          if (task.status !== 'archived') { task.status = 'archived'; task.archived_at = now(); await save(next); }
          return { task };
        }
        if (req.method === 'GET' && action === 'inbox') {
          const messages = []; let size = 0;
          for (const message of room.messages) {
            if (message.to !== role || ['received', 'replied', 'failed', 'processing'].includes(message.status)) continue;
            const length = JSON.stringify(message).length;
            if (messages.length && size + length > 2000000) break;
            messages.push(message); size += length;
          }
          return { messages };
        }
        if (req.method === 'POST' && action === 'messages') {
          if (!validId(body.id) || !['request', 'reply'].includes(body.kind) || typeof body.body !== 'string' || !body.body.trim() || body.body.length > (body.kind === 'request' && room.task_id === reviewTask ? reviewLimit : 8000)) fail(400, 'Invalid bounded message');
          if (body.task_id !== room.task_id) fail(403, 'Message task is outside room authorization');
          if (body.kind === 'request' && room.task_id === reviewTask) {
            try { validateReview(body.body); } catch { fail(400, 'Invalid authorized PR snapshot'); }
          }
          if (body.kind === 'request' && body.id.length > 76) fail(400, 'Request ID too long');
          const message = { id: body.id, task_id: room.task_id, from: role, to: peer, kind: body.kind, body: body.body, reply_to: body.reply_to || null, ...(room.mode === 'contact' ? { collaboration_id: body.collaboration_id } : {}) };
          const existing = room.messages.find(m => m.id === body.id);
          if (existing) {
            if (Object.keys(message).some(k => message[k] !== existing[k])) fail(409, 'Message ID conflict');
            return { id: existing.id, duplicate: true };
          }
          if (room.mode === 'contact') {
            const task = Object.hasOwn(room.tasks, body.collaboration_id) ? room.tasks[body.collaboration_id] : undefined;
            if (!validId(body.collaboration_id) || !task) fail(400, 'Choose an existing contact task');
            if (task.status !== 'active') fail(409, 'Task is archived');
            if (body.task_id !== task.scope) fail(403, 'Task scope mismatch');
          } else if (body.collaboration_id !== undefined) fail(400, 'Legacy rooms do not support contact tasks');
          if (message.kind === 'reply') {
            const request = room.messages.find(m => m.id === message.reply_to && m.from === peer && m.kind === 'request');
            if (!request || request.collaboration_id !== message.collaboration_id || room.messages.some(m => m.kind === 'reply' && m.reply_to === request.id)) fail(409, 'Reply must match one peer request');
            request.status = 'replied';
          } else {
            if (message.reply_to) fail(400, 'Requests do not set reply_to');
            if (room.messages.filter(m => m.from === role && m.kind === 'request' && (room.mode !== 'contact' || m.collaboration_id === message.collaboration_id)).length >= (room.lifetime === 'persistent' ? 1000 : 10)) fail(429, 'Room request capacity reached; rotate room');
          }
          // Reserve worst-case JSON-escaped 8000-character replies for accepted requests.
          // Failed/processing requests still reserve space until a reply exists.
          const unreplied = room.messages.filter(m => m.kind === 'request' && m.status !== 'replied').length;
          const pendingReplies = unreplied + (message.kind === 'request' ? 1 : 0);
          const stored = { ...message, status: 'queued', created_at: now() };
          const required = JSON.stringify([...room.messages, stored]).length + pendingReplies * 50048;
          if (required > 16000000) fail(429, 'Room storage capacity reached; rotate room');
          room.messages.push({ ...message, status: 'queued', created_at: now() }); await save(next); return { id: message.id, duplicate: false };
        }
        if (req.method === 'POST' && action === 'ack') {
          const m = room.messages.find(m => m.id === body.id && m.to === role);
          if (!m) fail(404, 'Unknown inbound message');
          const allowed = m.kind === 'reply' ? ['received'] : ['processing', 'failed'];
          if (!allowed.includes(body.status)) fail(400, 'Invalid receipt');
          if (m.status !== 'replied') m.status = body.status;
          await save(next); return { status: m.status };
        }
        fail(404, 'Not found');
      });
      res.end(JSON.stringify(result));
    } catch (error) { res.statusCode = error.status || 500; res.end(JSON.stringify({ error: error.status ? error.message : 'Relay operation failed' })); }
  };
  const server = tls ? createSecureServer(tlsOptions, handler) : createServer(handler);
  server.requestTimeout = 15000; server.headersTimeout = 10000;
  try { await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); }); }
  catch (error) { await unlink(join(root, 'relay.lock')); throw error; }
  return { server, fingerprint, url: `${tls ? 'https' : 'http'}://127.0.0.1:${server.address().port}`, close: async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await tail; await unlink(join(root, 'relay.lock'));
  } };
}

export async function relayRequest(config, action, body, { timeoutMs = 10000 } = {}) {
  const base = safeEndpoint(config.url);
  const path = action === 'create' ? '/rooms' : `/rooms/${config.room_id}/${action}`;
  if (config.fingerprint) {
    if (!/^[a-f0-9]{64}$/.test(config.fingerprint) || !base.startsWith('https://')) throw new Error('Invalid TLS pin');
    return new Promise((resolve, reject) => {
      const req = httpsRequest(base + path, {
        method: body === undefined ? 'GET' : 'POST', agent: false, rejectUnauthorized: false,
        headers: { Authorization: `Bearer ${config.token || ''}`, 'Content-Type': 'application/json' }
      }, res => {
        res.setEncoding('utf8'); res.on('error', reject); res.on('aborted', () => reject(new Error('Relay response aborted')));
        let raw = ''; res.on('data', chunk => { raw += chunk; if (raw.length > 4000000) req.destroy(new Error('Oversized response')); });
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (res.statusCode < 200 || res.statusCode >= 300) throw Object.assign(new Error(`${res.statusCode}: ${data.error}`), { status: res.statusCode });
            resolve(data);
          } catch (error) { reject(error); }
        });
      });
      // Verify the pin BEFORE ending the request or transmitting bearer headers/body.
      req.on('socket', socket => socket.once('secureConnect', () => {
        const cert = socket.getPeerCertificate();
        const actual = cert.raw ? createHash('sha256').update(cert.raw).digest('hex') : '';
        if (Date.parse(cert.valid_from) > Date.now() || Date.parse(cert.valid_to) < Date.now() || actual !== config.fingerprint) { req.destroy(new Error('Relay TLS fingerprint mismatch')); return; }
        req.end(body === undefined ? undefined : JSON.stringify(body));
      }));
      const timer = setTimeout(() => req.destroy(new Error('Relay request timed out')), timeoutMs);
      req.on('error', reject); req.on('close', () => clearTimeout(timer));
    });
  }
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${config.token || ''}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(`${response.status}: ${result.error}`), { status: response.status });
  return result;
}
