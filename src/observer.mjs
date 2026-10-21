import { createServer } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, open, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = fileURLToPath(new URL('../web/', import.meta.url));
const digest = value => createHash('sha256').update(value).digest('hex');
const secret = () => randomBytes(32).toString('base64url');
const roles = ['mac', 'windows'];
const cookieName = 'ab_observer';
const sessionLifetime = 12 * 60 * 60 * 1000;
const text = value => typeof value === 'string' ? value : '';
const time = value => Number.isFinite(value) ? value : null;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

// Explicit projection: never return the relay's people, identities, digests or invites.
export function observerSnapshot(state, now = Date.now()) {
  if (!state?.rooms || typeof state.rooms !== 'object' || Array.isArray(state.rooms)) throw new Error('Invalid relay state');
  const rooms = Object.values(state.rooms).map(room => {
    const messages = (Array.isArray(room.messages) ? room.messages : []).map(message => ({
      id: text(message.id), from: roles.includes(message.from) ? message.from : 'unknown',
      to: roles.includes(message.to) ? message.to : 'unknown',
      kind: message.kind === 'reply' ? 'reply' : 'request', body: text(message.body),
      reply_to: typeof message.reply_to === 'string' ? message.reply_to : null,
      status: ['queued', 'processing', 'failed', 'replied', 'received'].includes(message.status) ? message.status : 'unknown',
      created_at: time(message.created_at)
    }));
    const requests = messages.filter(message => message.kind === 'request');
    const replies = new Set(messages.filter(message => message.kind === 'reply').map(message => message.reply_to));
    const answered = requests.filter(message => replies.has(message.id)).length;
    const failed = requests.filter(message => !replies.has(message.id) && message.status === 'failed').length;
    const pending = requests.length - answered;
    const paired = roles.every(role => room.people?.[role]?.confirmed === true);
    const status = room.revoked ? 'closed' : now > room.expires_at ? 'expired' : !paired ? 'pairing'
      : failed ? 'attention' : messages.some(message => message.status === 'processing') ? 'processing'
        : pending ? 'waiting' : requests.length ? 'answered' : 'ready';
    return {
      id: text(room.id), task_id: text(room.task_id),
      title: (requests[0]?.body || '').trim().split(/\r?\n/)[0].slice(0, 56),
      created_at: time(room.created_at), expires_at: time(room.expires_at),
      last_activity_at: Math.max(room.created_at || 0, ...messages.map(message => message.created_at || 0)),
      status, participants: roles.map(role => ({ role, joined: !!room.people?.[role], confirmed: room.people?.[role]?.confirmed === true })),
      counts: { messages: messages.length, requests: requests.length, answered, pending, failed }, messages
    };
  }).sort((a, b) => b.last_activity_at - a.last_activity_at || a.id.localeCompare(b.id));
  return { mode: 'live', observed_at: now, rooms };
}

export function observerDemo(now = Date.now()) {
  const start = now - 24 * 60 * 1000;
  const message = (id, from, kind, body, minute, reply_to = null, status = 'replied') => ({
    id, from, to: from === 'mac' ? 'windows' : 'mac', kind, body, reply_to, status, created_at: start + minute * 60000
  });
  const result = observerSnapshot({ rooms: {
    'demo-export-conversation': {
      id: 'demo-export-conversation', task_id: 'demo-export', created_at: start, expires_at: now + 7200000,
      people: { mac: { confirmed: true }, windows: { confirmed: true } }, messages: [
        message('demo-q1', 'mac', 'request', '我们来对齐一下导出功能的行为。\n\nMac 端使用系统保存窗口，计划导出 UTF-8 编码的 JSON。Windows 端能保持相同的文件格式吗？如果用户取消保存，应该怎么处理？', 1),
        message('demo-r1', 'windows', 'reply', '可以。两端可以使用各自的系统保存窗口，但输出格式保持一致。\n\n**关于取消操作**\n用户点击取消后直接返回，不创建文件，也不显示导出成功。\n\n建议共同确认这三个验收点：\n1. 相同内容在两端导出的 JSON 一致。\n2. 中文使用 UTF-8 编码。\n3. 取消保存不会产生空文件。\n\n这些是验收建议，尚未执行实际测试。', 3, 'demo-q1', 'received'),
        message('demo-q2', 'windows', 'request', '收到。还有一个边界：如果目标文件已经存在，是否沿用系统的覆盖确认？我们先对齐行为，再由双方分别在真实设备上验收。', 7),
        message('demo-r2', 'mac', 'reply', '同意沿用系统覆盖确认，取消覆盖时也不修改原文件。\n\n当前已对齐：文件格式、编码、取消和覆盖行为。下一步由双方主人确认方案，再分别进行真实设备测试。\n\n**目前没有修改真实项目，也没有完成设备验收。**', 9, 'demo-q2', 'received')
      ]
    },
    'demo-waiting-conversation': {
      id: 'demo-waiting-conversation', task_id: 'demo-export', created_at: start - 3600000, expires_at: now + 7200000,
      people: { mac: { confirmed: true }, windows: { confirmed: true } },
      messages: [message('demo-q3', 'mac', 'request', '请补充导出失败时的提示建议：比如目标文件夹不可写的情况。', -15, null, 'queued')]
    }
  } }, now);
  result.mode = 'demo';
  return result;
}

export async function observerInit(root) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const handle = await open(join(root, 'observer-access.json'), 'wx', 0o600);
  try { await handle.writeFile(JSON.stringify({ access_key: secret() }) + '\n'); }
  finally { await handle.close(); }
}

async function bodyJSON(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024) fail(413, 'Request too large');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { fail(400, 'Invalid JSON'); }
}

export async function startObserver({ relayRoot, authRoot, port = 8791, host = '127.0.0.1', tls = false,
  tlsRoot = relayRoot, demo = false, now = Date.now, pollMs = 2000, sessionMs = sessionLifetime } = {}) {
  if (!['127.0.0.1', '::1', 'localhost'].includes(host) && !tls) throw new Error('Non-loopback observer requires TLS');
  if (demo && !['127.0.0.1', '::1', 'localhost'].includes(host)) throw new Error('Demo server must use loopback');
  const tlsOptions = tls ? { key: await readFile(join(tlsRoot, 'tls.key')), cert: await readFile(join(tlsRoot, 'tls.crt')) } : null;
  const access = demo ? null : JSON.parse(await readFile(join(authRoot, 'observer-access.json'), 'utf8'));
  if (!demo && (typeof access.access_key !== 'string' || access.access_key.length < 32)) throw new Error('Invalid observer access file');
  const accessDigest = access && digest(access.access_key);
  const sessions = new Map(), attempts = new Map(), clients = new Map();
  const snapshot = async () => {
    if (demo) return observerDemo(now());
    try { return observerSnapshot(JSON.parse(await readFile(join(relayRoot, 'relay-state.json'), 'utf8')), now()); }
    catch { fail(503, 'Relay records are temporarily unavailable'); }
  };
  if (!demo) await snapshot();
  const sessionFor = req => {
    const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
    const key = cookie ? digest(cookie.slice(cookieName.length + 1)) : '';
    if ((sessions.get(key) || 0) <= now()) { sessions.delete(key); return null; }
    return key;
  };
  const sendJSON = (res, value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
  const expire = key => {
    sessions.delete(key);
    for (const [res, client] of clients) if (client.session === key) { res.write('event: auth-ended\ndata: {}\n\n'); res.end(); clients.delete(res); }
  };
  const staticFiles = new Map([
    ['/', ['index.html', 'text/html; charset=utf-8']], ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
    ['/styles.css', ['styles.css', 'text/css; charset=utf-8']], ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]
  ]);
  const handler = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    try {
      if (req.headers.origin && req.headers.origin !== `${tls ? 'https' : 'http'}://${req.headers.host}`) fail(403, 'Cross-origin request refused');
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/health') return sendJSON(res, { status: 'ok', service: 'agent-bridge-observer', version: '0.4.0' });
      if (req.method === 'GET' && staticFiles.has(url.pathname)) {
        const [name, type] = staticFiles.get(url.pathname);
        const bytes = await readFile(join(webRoot, name));
        res.writeHead(200, { 'Content-Type': type }); return res.end(bytes);
      }
      if (req.method === 'GET' && url.pathname === '/project.html') {
        const bytes = await readFile(new URL('../project.html', import.meta.url));
        // This existing offline page has its own inline scripts/styles and contains no runtime data.
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'");
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(bytes);
      }
      if (req.method === 'GET' && url.pathname === '/api/demo') return sendJSON(res, observerDemo(now()));
      if (req.method === 'GET' && url.pathname === '/api/session') return sendJSON(res, { authenticated: !!sessionFor(req), demo_only: demo });
      if (!demo && req.method === 'POST' && url.pathname === '/api/login') {
        const ip = req.socket.remoteAddress;
        for (const [key, value] of attempts) if (value.reset <= now()) attempts.delete(key);
        const attempt = attempts.get(ip) || { count: 0, reset: now() + 60000 };
        if (attempt.count >= 8) fail(429, 'Too many attempts; try again in a minute');
        const body = await bodyJSON(req);
        const value = digest(typeof body?.key === 'string' ? body.key : '');
        if (!timingSafeEqual(Buffer.from(value), Buffer.from(accessDigest))) {
          attempt.count++;
          if (attempts.size >= 1024) attempts.delete(attempts.keys().next().value);
          attempts.set(ip, attempt);
          fail(401, 'Invalid viewing key');
        }
        for (const [key, expiry] of sessions) if (expiry <= now()) expire(key);
        if (sessions.size >= 100) fail(429, 'Session limit reached');
        const key = secret(); sessions.set(digest(key), now() + sessionMs);
        attempts.delete(ip);
        res.setHeader('Set-Cookie', `${cookieName}=${key}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionMs / 1000)}${tls ? '; Secure' : ''}`);
        return sendJSON(res, { authenticated: true });
      }
      if (demo || !url.pathname.startsWith('/api/')) fail(404, 'Not found');
      const session = sessionFor(req);
      if (!session) fail(401, 'Sign in to view relay records');
      if (req.method === 'POST' && url.pathname === '/api/logout') {
        expire(session);
        res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${tls ? '; Secure' : ''}`);
        return sendJSON(res, { authenticated: false });
      }
      if (req.method === 'GET' && url.pathname === '/api/snapshot') return sendJSON(res, await snapshot());
      if (req.method === 'GET' && url.pathname === '/api/events') {
        if (clients.size >= 50) fail(429, 'Stream limit reached');
        const data = await snapshot();
        res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write(`event: snapshot\ndata: ${JSON.stringify(data)}\n\n`);
        clients.set(res, { session, revision: digest(JSON.stringify(data.rooms)), heartbeat: now() });
        req.on('close', () => clients.delete(res));
        return;
      }
      fail(404, 'Not found');
    } catch (error) {
      if (!res.headersSent) sendJSON(res, { error: error.status ? error.message : 'Observer operation failed' }, error.status || 500);
      else res.end();
    }
  };
  const server = tls ? createSecureServer(tlsOptions, handler) : createServer(handler);
  server.requestTimeout = 15000; server.headersTimeout = 10000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  let polling = false;
  const timer = setInterval(async () => {
    if (polling || !clients.size) return;
    polling = true;
    try {
      for (const [key, expiry] of sessions) if (expiry <= now()) expire(key);
      if (!clients.size) return;
      let data;
      try { data = await snapshot(); }
      catch { for (const res of clients.keys()) { res.write('event: source-error\ndata: {}\n\n'); res.end(); } clients.clear(); return; }
      const revision = digest(JSON.stringify(data.rooms));
      for (const [res, client] of clients) {
        if (res.writableLength > 1000000) { res.end(); clients.delete(res); continue; }
        if (client.revision !== revision) {
          res.write(`event: snapshot\ndata: ${JSON.stringify(data)}\n\n`); client.revision = revision;
        } else if (now() - client.heartbeat >= 15000) {
          res.write(`event: heartbeat\ndata: ${JSON.stringify({ observed_at: data.observed_at })}\n\n`);
        } else continue;
        client.heartbeat = now();
      }
    } finally { polling = false; }
  }, pollMs);
  timer.unref();
  return {
    server, url: `${tls ? 'https' : 'http'}://${host.includes(':') ? `[${host}]` : host}:${server.address().port}`,
    close: async () => {
      clearInterval(timer);
      for (const res of clients.keys()) res.end();
      clients.clear();
      const closed = new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      server.closeAllConnections();
      await closed;
    }
  };
}
