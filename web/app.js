const $ = id => document.getElementById(id);
const make = (tag, className = '', value) => {
  const node = document.createElement(tag); node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
};
const words = {
  zh: {
    live: '自动更新', demo: '演示', paused: '已暂停', error: '连接中断', connecting: '正在连接', locked: '等待登录',
    mac: 'Mac Agent', windows: 'Windows Agent', unknown: '未知 Agent', noTitle: '新会话',
    roomEmpty: '暂无会话', noMatches: '没有匹配结果', noMessages: '暂无消息', chooseConversation: '选择会话',
    status_pairing: '等待配对', status_waiting: '等待回复', status_processing: '处理中', status_attention: '处理失败', status_closed: '已关闭', status_expired: '已到期',
    failed: '处理失败', processing: '处理中', request: '请求', reply: '回复', replyTo: '回复 {name}：{body}',
    loginFailed: '密钥不正确', rateLimited: '请稍等一分钟再试', networkError: '暂时无法连接服务器', sourceError: '无法读取消息，正在重连', reconnecting: '连接中断，正在重连', sessionExpired: '登录已到期，请重新输入密钥',
    signedOut: '已退出', refreshed: '已刷新', exported: '已导出', loginBusy: '正在进入…', resume: '恢复更新',
    realExport: '中继记录', demoExport: '演示数据', exportTime: '导出时间', messageId: '消息编号', relatedRequest: '关联请求', state: '状态',
    closeRooms: '关闭会话列表', openRooms: '会话列表', searchRooms: '搜索会话', searchMessages: '搜索消息', closeSearch: '关闭搜索', refresh: '刷新', more: '更多', messagesLabel: '交流消息'
  },
  en: {
    skip: 'Skip to messages', roomName: 'Conversation room', conversations: 'Conversations', viewingKey: 'Viewing key', enter: 'Enter', pause: 'Pause updates', export: 'Export conversation', logout: 'Sign out', latest: 'Latest messages ↓',
    live: 'Live updates', demo: 'Demo', paused: 'Paused', error: 'Disconnected', connecting: 'Connecting', locked: 'Sign in',
    mac: 'Mac Agent', windows: 'Windows Agent', unknown: 'Unknown agent', noTitle: 'New conversation',
    roomEmpty: 'No conversations', noMatches: 'No matches', noMessages: 'No messages yet', chooseConversation: 'Choose a conversation',
    status_pairing: 'Awaiting pairing', status_waiting: 'Awaiting reply', status_processing: 'Processing', status_attention: 'Failed', status_closed: 'Closed', status_expired: 'Expired',
    failed: 'Failed', processing: 'Processing', request: 'Request', reply: 'Reply', replyTo: 'Reply to {name}: {body}',
    loginFailed: 'Incorrect viewing key', rateLimited: 'Try again in a minute', networkError: 'Cannot reach the server', sourceError: 'Cannot read messages. Reconnecting.', reconnecting: 'Disconnected. Reconnecting.', sessionExpired: 'Session expired. Enter your viewing key again.',
    signedOut: 'Signed out', refreshed: 'Refreshed', exported: 'Exported', loginBusy: 'Opening…', resume: 'Resume updates',
    realExport: 'Relay records', demoExport: 'Demo data', exportTime: 'Exported at', messageId: 'Message ID', relatedRequest: 'Related request', state: 'Status',
    closeRooms: 'Close conversations', openRooms: 'Conversations', searchRooms: 'Search conversations', searchMessages: 'Search messages', closeSearch: 'Close search', refresh: 'Refresh', more: 'More', messagesLabel: 'Conversation messages'
  }
};
for (const node of document.querySelectorAll('[data-i18n]')) words.zh[node.dataset.i18n] ??= node.textContent;
let lang = 'zh';
try { lang = localStorage.getItem('ab-observer-language') === 'en' ? 'en' : 'zh'; } catch { /* Optional preference. */ }
const t = (key, vars = {}) => (words[lang][key] || words.zh[key] || key).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
let data = null, selectedId = null, stream = null, paused = false, authenticated = false, connection = 'connecting', toastTimer;
const isDemo = () => data?.mode === 'demo';
const archived = room => ['closed', 'expired'].includes(room.status);
const currentRoom = () => data?.rooms.find(room => room.id === selectedId);
const locale = () => lang === 'en' ? 'en-GB' : 'zh-CN';
const clock = timestamp => timestamp ? new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit', hour12: false }).format(timestamp) : '—';
const date = timestamp => timestamp ? new Intl.DateTimeFormat(locale(), { year: 'numeric', month: '2-digit', day: '2-digit' }).format(timestamp) : '—';
const closeMenu = () => { $('more-actions').open = false; };

function translate() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'; document.title = `${t('roomName')} · Agent Bridge`;
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-placeholder]')) node.placeholder = t(node.dataset.placeholder);
  for (const [selector, key] of [['#mobile-rooms', 'openRooms'], ['#sidebar', 'openRooms'], ['#sidebar-overlay', 'closeRooms'], ['#room-list', 'openRooms'], ['#room-search', 'searchRooms'], ['#message-search', 'searchMessages'], ['#toggle-search', 'searchMessages'], ['#close-search', 'closeSearch'], ['#refresh', 'refresh'], ['#more-actions summary', 'more'], ['#messages', 'messagesLabel']]) {
    const node = document.querySelector(selector); node.setAttribute('aria-label', t(key)); if (node.matches('button, summary')) node.title = t(key);
  }
  $('language').textContent = lang === 'zh' ? 'English' : '中文';
  render(); setConnection(connection);
}

function setConnection(value) {
  connection = value; $('connection').dataset.state = value;
  $('connection').setAttribute('aria-label', t(value)); $('connection').title = t(value);
}

function notify(key) {
  clearTimeout(toastTimer); $('toast').textContent = t(key); $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2500);
}

async function request(path, options) {
  const response = await fetch(path, { ...options, cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) throw Object.assign(new Error('Request failed'), { status: response.status });
  return response.json();
}

function closeSidebar(returnFocus = false) {
  const wasOpen = $('workspace').classList.contains('sidebar-open');
  $('workspace').classList.remove('sidebar-open'); $('mobile-rooms').setAttribute('aria-expanded', 'false');
  if (returnFocus && wasOpen) $('mobile-rooms').focus();
}

function showLogin(error) {
  stream?.close(); stream = null; data = null; selectedId = null; authenticated = false; paused = false;
  closeMenu(); closeSidebar(); document.body.dataset.view = 'login';
  $('workspace').hidden = true; $('login-view').hidden = false; $('logout').hidden = true; $('demo-label').hidden = true;
  $('login-error').hidden = !error; $('login-error').textContent = error ? t(error) : '';
  $('source-banner').hidden = true; $('access-key').value = ''; render(); setConnection('locked');
}

function enter(snapshot) {
  const firstView = !data || data.mode !== snapshot.mode;
  data = snapshot; document.body.dataset.view = 'room'; $('login-view').hidden = true; $('workspace').hidden = false;
  $('demo-label').hidden = !isDemo(); $('logout').hidden = !authenticated; $('pause').hidden = isDemo(); $('source-banner').hidden = true;
  render(firstView); setConnection(isDemo() ? 'demo' : paused ? 'paused' : 'live');
}

function sourceBanner(key) { $('source-banner').hidden = false; $('source-banner').textContent = t(key); setConnection('error'); }

function liveUpdates() {
  stream?.close(); stream = null;
  if (paused || isDemo() || !authenticated) return;
  const source = new EventSource('/api/events'); stream = source;
  source.onopen = () => { if (stream === source) setConnection('live'); };
  source.addEventListener('snapshot', event => {
    if (stream !== source) return;
    try { enter(JSON.parse(event.data)); } catch { sourceBanner('sourceError'); }
  });
  source.addEventListener('heartbeat', () => { if (stream === source) { $('source-banner').hidden = true; setConnection('live'); } });
  source.addEventListener('auth-ended', () => { if (stream === source) showLogin('sessionExpired'); });
  source.addEventListener('source-error', () => { if (stream === source) sourceBanner('sourceError'); });
  source.onerror = async () => {
    if (stream !== source) return;
    sourceBanner('reconnecting');
    try { const session = await request('/api/session'); if (stream === source && !session.authenticated) showLogin('sessionExpired'); }
    catch { /* Retain the last messages during an outage. */ }
  };
}

async function loadLive() {
  try {
    const session = await request('/api/session'); authenticated = session.authenticated;
    if (session.demo_only) return loadDemo();
    if (!authenticated) return showLogin();
    enter(await request('/api/snapshot')); liveUpdates();
  } catch (error) {
    if (error.status === 401) showLogin('sessionExpired');
    else if (data) sourceBanner('sourceError');
    else showLogin('networkError');
  }
}

async function loadDemo() {
  stream?.close(); stream = null; paused = false; selectedId = null;
  try { enter(await request('/api/demo')); } catch { showLogin('networkError'); }
}

function roomMatches(room) {
  const query = $('room-search').value.trim().toLocaleLowerCase();
  return !query || `${room.title} ${room.messages.map(message => message.body).join(' ')}`.toLocaleLowerCase().includes(query);
}

function renderRooms(rooms) {
  $('room-list').replaceChildren();
  if (!rooms.length) { $('room-list').append(make('p', 'sidebar-empty', t(data?.rooms.length ? 'noMatches' : 'roomEmpty'))); return; }
  for (const room of rooms) {
    const button = make('button', 'room-item'); button.type = 'button'; button.setAttribute('aria-pressed', String(room.id === selectedId));
    const time = make('time', '', `${date(room.last_activity_at)} ${clock(room.last_activity_at)}`);
    if (room.last_activity_at) time.dateTime = new Date(room.last_activity_at).toISOString();
    button.append(make('div', 'room-item-title', room.title || t('noTitle')), time);
    button.addEventListener('click', () => { selectedId = room.id; $('message-search').value = ''; render(true); closeSidebar(); });
    $('room-list').append(button);
  }
}

function highlight(parent, value, query) {
  if (!query) { parent.append(document.createTextNode(value)); return; }
  let cursor = 0, index;
  const lower = value.toLocaleLowerCase(), match = query.toLocaleLowerCase();
  while ((index = lower.indexOf(match, cursor)) !== -1) {
    parent.append(document.createTextNode(value.slice(cursor, index)), make('mark', '', value.slice(index, index + query.length)));
    cursor = index + query.length;
  }
  parent.append(document.createTextNode(value.slice(cursor)));
}

function messageBody(body, query) {
  const container = make('div', 'message-body');
  body.split(/```[^\n]*\n([\s\S]*?)```/g).forEach((chunk, index) => {
    if (index % 2) { const pre = make('pre'), code = make('code'); highlight(code, chunk.trimEnd(), query); pre.append(code); container.append(pre); return; }
    for (const paragraph of chunk.split(/\n\s*\n/).filter(value => value.trim())) {
      const p = make('p');
      for (const token of paragraph.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)) {
        const tag = token.startsWith('**') && token.endsWith('**') ? 'strong' : token.startsWith('`') && token.endsWith('`') ? 'code' : null;
        if (tag) { const inline = make(tag); highlight(inline, token.slice(tag === 'strong' ? 2 : 1, tag === 'strong' ? -2 : -1), query); p.append(inline); }
        else highlight(p, token, query);
      }
      container.append(p);
    }
  });
  return container;
}

function updateLatest() {
  const panel = $('messages');
  $('latest').hidden = !currentRoom()?.messages.length || panel.scrollHeight - panel.scrollTop - panel.clientHeight < 100;
}

function renderMessages(room, resetScroll = false) {
  const panel = $('messages'), nearBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 100, oldScroll = panel.scrollTop;
  panel.replaceChildren(); panel.setAttribute('aria-busy', 'false');
  const query = $('message-search').value.trim();
  const messages = room?.messages.filter(message => !query || message.body.toLocaleLowerCase().includes(query.toLocaleLowerCase())) || [];
  if (!messages.length) {
    panel.append(make('p', 'empty-state', t(room ? (room.messages.length ? 'noMatches' : 'noMessages') : data?.rooms.length ? 'noMatches' : 'roomEmpty')));
    updateLatest(); return;
  }
  let lastDay = '';
  for (const message of messages) {
    const currentDay = date(message.created_at);
    if (currentDay !== lastDay) { panel.append(make('div', 'date-divider', currentDay)); lastDay = currentDay; }
    const article = make('article', `message ${message.from}`); article.setAttribute('aria-label', `${t(message.from)} · ${clock(message.created_at)}`);
    const main = make('div', 'message-main'), header = make('div', 'message-header'), time = make('time', 'message-time', clock(message.created_at));
    if (message.created_at) time.dateTime = new Date(message.created_at).toISOString();
    header.append(make('span', 'message-author', t(message.from)), time);
    if (message.reply_to) { const related = room.messages.find(item => item.id === message.reply_to); if (related) article.title = t('replyTo', { name: t(related.from), body: related.body.slice(0, 120) }); }
    main.append(header, messageBody(message.body, query));
    if (['failed', 'processing'].includes(message.status)) main.append(make('span', 'message-state', t(message.status)));
    article.append(make('span', `avatar ${message.from}`, message.from === 'mac' ? 'M' : message.from === 'windows' ? 'W' : '?'), main); panel.append(article);
  }
  panel.scrollTop = resetScroll ? (query ? 0 : panel.scrollHeight) : nearBottom ? panel.scrollHeight : oldScroll;
  updateLatest();
}

function render(resetScroll = false) {
  const rooms = data?.rooms.filter(roomMatches) || [];
  if (!rooms.some(room => room.id === selectedId)) selectedId = (rooms.find(room => !archived(room)) || rooms[0])?.id || null;
  renderRooms(rooms);
  const room = currentRoom(); $('thread-title').textContent = room?.title || t(room ? 'noTitle' : 'chooseConversation'); $('thread-title').title = room?.title || '';
  $('room-status').hidden = !room || ['ready', 'answered'].includes(room.status);
  if (room) { $('room-status').textContent = t(`status_${room.status}`); $('room-status').dataset.status = room.status; }
  $('export').disabled = !room; $('pause').textContent = t(paused ? 'resume' : 'pause'); $('pause').setAttribute('aria-pressed', String(paused));
  renderMessages(room, resetScroll);
}

function toggleSearch(open = $('message-search-panel').hidden) {
  $('message-search-panel').hidden = !open; $('toggle-search').setAttribute('aria-expanded', String(open));
  if (open) $('message-search').focus();
  else { $('message-search').value = ''; renderMessages(currentRoom()); $('toggle-search').focus(); }
}

$('login-form').addEventListener('submit', async event => {
  event.preventDefault(); $('login-submit').disabled = true; $('login-submit').textContent = t('loginBusy'); $('login-error').hidden = true;
  try {
    await request('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: $('access-key').value.trim() }) });
    $('access-key').value = ''; authenticated = true; await loadLive();
  } catch (error) { $('login-error').textContent = t(error.status === 401 ? 'loginFailed' : error.status === 429 ? 'rateLimited' : 'networkError'); $('login-error').hidden = false; }
  finally { $('login-submit').disabled = false; $('login-submit').textContent = t('enter'); }
});
$('logout').addEventListener('click', async () => { closeMenu(); try { await request('/api/logout', { method: 'POST' }); showLogin(); } catch { notify('networkError'); } });
$('language').addEventListener('click', () => { closeMenu(); lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('ab-observer-language', lang); } catch { /* Optional preference. */ } translate(); });
$('refresh').addEventListener('click', async () => {
  $('refresh').disabled = true;
  try { enter(await request(isDemo() ? '/api/demo' : '/api/snapshot')); }
  catch (error) { if (error.status === 401) showLogin('sessionExpired'); else sourceBanner('sourceError'); }
  finally { $('refresh').disabled = false; }
});
$('pause').addEventListener('click', () => { closeMenu(); paused = !paused; if (paused) { stream?.close(); stream = null; setConnection('paused'); } else { setConnection('connecting'); liveUpdates(); } render(); });
$('room-search').addEventListener('input', () => render(true)); $('message-search').addEventListener('input', () => renderMessages(currentRoom(), true));
$('toggle-search').addEventListener('click', () => toggleSearch()); $('close-search').addEventListener('click', () => toggleSearch(false));
$('messages').addEventListener('scroll', updateLatest, { passive: true });
$('latest').addEventListener('click', () => { $('messages').scrollTop = $('messages').scrollHeight; updateLatest(); });
$('mobile-rooms').addEventListener('click', () => { const open = !$('workspace').classList.contains('sidebar-open'); $('workspace').classList.toggle('sidebar-open', open); $('mobile-rooms').setAttribute('aria-expanded', String(open)); if (open) $('room-search').focus(); });
$('sidebar-overlay').addEventListener('click', () => closeSidebar(true));
document.addEventListener('click', event => { if (!event.target.closest('#more-actions')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); closeSidebar(true); if (!$('message-search-panel').hidden) toggleSearch(false); } });
$('export').addEventListener('click', () => {
  closeMenu(); const room = currentRoom(); if (!room) return;
  const lines = [`# ${room.title || t('noTitle')}`, '', `> ${t(isDemo() ? 'demoExport' : 'realExport')}`, `${t('exportTime')}: ${new Date().toISOString()}`, ''];
  for (const message of room.messages) lines.push(`## ${t(message.from)} → ${t(message.to)} · ${t(message.kind)}`, '', `${message.created_at ? new Date(message.created_at).toISOString() : '—'}`, `${t('messageId')}: ${message.id}`, `${t('relatedRequest')}: ${message.reply_to || '—'}`, `${t('state')}: ${message.status}`, '', message.body, '', '---', '');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })); link.download = `agent-bridge-${room.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); notify('exported');
});
window.addEventListener('pagehide', () => { stream?.close(); stream = null; });
window.addEventListener('pageshow', event => { if (event.persisted) loadLive(); });
translate();
if (new URLSearchParams(location.search).get('demo') === '1') loadDemo(); else loadLive();
