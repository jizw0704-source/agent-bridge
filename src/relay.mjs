import { createServer } from 'node:http';
import { createServer as createSecureServer, request as httpsRequest } from 'node:https';
import { randomBytes, randomUUID, createHash, timingSafeEqual, X509Certificate } from 'node:crypto';
import { mkdir, readFile, open, unlink, readdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { atomicJSON } from './bridge.mjs';

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
        for await (const chunk of req) { size += chunk.length; if (size > 16000) fail(413, 'Payload too large'); chunks.push(chunk); }
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { fail(400, 'Invalid JSON'); }
        if (!body || Array.isArray(body) || typeof body !== 'object') fail(400, 'Object body required');
      }
      const result = await serialize(async () => {
        if (req.method === 'GET' && url.pathname === '/health') return { status: 'ok', mode: 'read-only-demo' };
        const next = structuredClone(state);
        if (req.method === 'POST' && url.pathname === '/rooms') {
          authAdmin(req);
          if (Object.keys(next.rooms).length >= 100) fail(429, 'Room limit reached');
          const id = randomUUID(), secret = token(), invite = token();
          next.rooms[id] = { id, task_id: 'demo-export', created_at: now(), expires_at: now() + 86400000, invite_digest: hash(invite), invite_expires: now() + 600000, revoked: false,
            people: { mac: { digest: hash(secret), confirmed: false, identity: randomBytes(8).toString('hex') } }, messages: [] };
          await save(next);
          return { room_id: id, token: secret, role: 'mac', invite, invite_expires_at: next.rooms[id].invite_expires };
        }
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length !== 3 || parts[0] !== 'rooms' || !validId(parts[1])) fail(404, 'Not found');
        const room = next.rooms[parts[1]];
        if (!room) fail(404, 'Not found');
        if (room.revoked || now() > room.expires_at) fail(410, 'Room closed or expired');
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
          return { room_id: room.id, role: 'windows', token: secret };
        }
        const role = participant(req, room), peer = role === 'mac' ? 'windows' : 'mac';
        const ready = () => !!room.people.mac.confirmed && !!room.people.windows?.confirmed;
        if (req.method === 'POST' && action === 'invite') {
          if (role !== 'mac') fail(403, 'Only the owner can refresh an invitation');
          if (room.people.windows) fail(409, 'Peer already joined; invitation cannot be refreshed');
          const invite = token();
          room.invite_digest = hash(invite);
          room.invite_expires = Math.min(now() + 600000, room.expires_at);
          await save(next);
          return { room_id: room.id, invite, invite_expires_at: room.invite_expires };
        }
        if (req.method === 'GET' && action === 'status') return { room_id: room.id, role, ready: ready(), expires_at: room.expires_at,
          identities: Object.fromEntries(Object.entries(room.people).map(([r, p]) => [r, p.identity])),
          confirmed: Object.fromEntries(Object.entries(room.people).map(([r, p]) => [r, p.confirmed])),
          messages: room.messages.map(({ id, from, to, kind, reply_to, status }) => ({ id, from, to, kind, reply_to, status })) };
        if (req.method === 'POST' && action === 'confirm') {
          if (!room.people[peer] || body.peer_identity !== room.people[peer].identity) fail(409, 'Compare peer identity before confirmation');
          room.people[role].confirmed = true; await save(next); return { ready: ready() };
        }
        if (req.method === 'POST' && action === 'close') { room.revoked = true; await save(next); return { closed: true }; }
        if (!ready()) fail(409, 'Both owners must confirm pairing first');
        if (req.method === 'GET' && action === 'inbox') return { messages: room.messages.filter(m => m.to === role && m.status !== 'received' && m.status !== 'replied') };
        if (req.method === 'POST' && action === 'messages') {
          if (!validId(body.id) || !['request', 'reply'].includes(body.kind) || typeof body.body !== 'string' || !body.body.trim() || body.body.length > 8000) fail(400, 'Invalid bounded message');
          if (body.task_id !== room.task_id) fail(403, 'Only demo-export is authorized');
          if (body.kind === 'request' && body.id.length > 76) fail(400, 'Request ID too long');
          const message = { id: body.id, task_id: room.task_id, from: role, to: peer, kind: body.kind, body: body.body, reply_to: body.reply_to || null };
          const existing = room.messages.find(m => m.id === body.id);
          if (existing) {
            if (Object.keys(message).some(k => message[k] !== existing[k])) fail(409, 'Message ID conflict');
            return { id: existing.id, duplicate: true };
          }
          if (message.kind === 'reply') {
            const request = room.messages.find(m => m.id === message.reply_to && m.from === peer && m.kind === 'request');
            if (!request || room.messages.some(m => m.kind === 'reply' && m.reply_to === request.id)) fail(409, 'Reply must match one peer request');
            request.status = 'replied';
          } else {
            if (message.reply_to) fail(400, 'Requests do not set reply_to');
            if (room.messages.filter(m => m.from === role && m.kind === 'request').length >= 10) fail(429, 'Pilot limit: ten requests per side');
          }
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
        let raw = ''; res.on('data', chunk => { raw += chunk; if (raw.length > 1000000) req.destroy(new Error('Oversized response')); });
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
