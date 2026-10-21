const $ = id => document.getElementById(id);
const make = (tag, className = '', value) => { const item = document.createElement(tag); item.className = className; if (value !== undefined) item.textContent = value; return item; };
const words = {
  zh: {
    live: '实时同步', demo: '演示数据', paused: '已暂停更新', offline: '连接中断', connecting: '正在连接', locked: '等待登录',
    noTitle: '新的协作会话', mac: 'Mac Agent', windows: 'Windows Agent', unknown: '未知角色', joined: '已加入 · 待确认', absent: '尚未加入', confirmed: '身份已确认',
    status_pairing: '等待配对', status_ready: '已配对', status_waiting: '等待回复', status_processing: '处理中', status_answered: '请求已回复', status_attention: '需要关注', status_closed: '已关闭', status_expired: '已到期',
    receipt_queued: '已到达中继，等待对端接收', receipt_processing: '对端已开始处理', receipt_failed: '处理失败，需人工检查', receipt_replied: '对端已回复', receipt_received: '对端已接收', receipt_unknown: '状态未知',
    roomMeta: '{n} 条消息', roomEmpty: '还没有交流会话', roomNoMatches: '没有找到匹配的会话', noRoomsTitle: '等待第一场交流', noRoomsText: '双方通过 Agent Bridge 开始交流后，记录会自动出现在这里。', noMatchesTitle: '没有匹配的交流', noMatchesText: '试试其他关键词，或调整会话筛选条件。',
    noMessagesTitle: '连接已建立，等待交流', noMessagesText: '这个会话还没有消息。双方的请求和回复会按时间展示在这里。', noMessageMatches: '没有找到符合条件的消息', noMessageMatchesText: '试试其他关键词，或切换到“全部”消息。',
    request: '请求', reply: '回复', to: '发给 {name}', replyTo: '回应 {id}', details: '消息详情', messageId: '消息编号', relatedRequest: '关联请求', createdTime: '发送时间', state: '处理状态',
    observed: '最近同步 {time}', pausedNote: '已暂停自动更新；可手动刷新', demoNote: '虚构示例 · 不代表真实运行结果', matches: '{n} 条匹配',
    collaboration: '本次协作', scope: '演示任务', taskName: '导出行为协商', taskFallback: 'Agent 协作会话', scopeNote: '当前试验仅交流虚构任务。双方的回复不代表项目修改、测试通过或主人审批。',
    progress: '沟通进展', stepPair: '双方身份确认', stepPairDone: '双方均已确认配对', stepPairWait: '等待双方完成确认', stepRequests: '交流请求', stepRequestsDescription: '已发起 {n} 个请求', stepReplies: '对端回复', stepRepliesDescription: '{n} 个请求已得到回复', stepHuman: '主人决策与实际验收', stepHumanDescription: '需要双方另行确认，不能由消息状态推定',
    attentionFailed: '{n} 个请求处理失败，需要人工检查。', attentionPending: '{n} 个请求仍在等待回复。', allAnswered: '当前请求均已得到回复。', noRequests: '尚未发起请求。', sourceInfo: '记录与状态', source: '数据来源', relay: '服务器中继', synthetic: '虚构示例', expires: '房间到期时间', noExpiry: '未记录', presence: 'Agent 是否在线', presenceUnknown: '中继未提供在线状态', lastObserved: '最近核查', privacy: '这里只展示经中继交换的内容，不包含 Agent 私有推理或本机其他聊天。',
    loginFailed: '查看密钥不正确，请重新输入。', rateLimited: '尝试次数较多，请稍等一分钟再试。', networkError: '暂时无法连接服务器，请稍后重试。', sourceError: '中继记录暂时不可用，正在重连。以下保留上次读取的内容。', reconnecting: '连接中断，正在重连。以下内容尚未更新。', sessionExpired: '登录已到期，请重新输入查看密钥。', signedOut: '已退出观察室', refreshed: '已读取最新记录', exported: '已导出当前会话', loginBusy: '正在进入…', resume: '恢复更新', pause: '暂停更新', noData: '等待数据',
    realExport: '真实中继记录', demoExport: '虚构演示数据', exportLabel: '导出时间', participantsLabel: 'Mac Agent ↔ Windows Agent', localDemo: '本地演示',
    searchRoomsLabel: '搜索会话或内容', searchMessagesLabel: '在当前会话中查找', closeRooms: '关闭会话列表', openRooms: '打开会话列表', navigation: '会话导航', roomList: '会话列表', messageTypes: '消息类型', messagesLabel: '交流内容', statsLabel: '当前会话统计', contextLabel: '会话详情'
  },
  en: {
    skip: 'Skip to conversation', brandSub: 'Connecting agents. Connecting people.', workspace: 'Workspace', roomName: 'Conversation room', connecting: 'Connecting', logout: 'Sign out',
    loginTitle: 'Agents are talking.\nYou can follow along.', loginDescription: 'From the first request to every reply, see how your agents work together.', loginNote: 'Requests, replies and progress, all in one place.', privateView: 'YOUR COLLABORATION SPACE', loginHeading: 'Open the conversation room', keyDescription: 'Enter your viewing key to read conversations on the relay.', viewingKey: 'Viewing key', loginAction: 'Enter the room', or: 'or', tryDemo: 'Explore the demo', demoHint: 'The demo uses fictional data and connects to no personal agents.',
    project: 'Project progress', conversations: 'CONVERSATIONS', searchRooms: 'Search conversations', filterRooms: 'Filter conversations', allConversations: 'All conversations', activeConversations: 'Active conversations', pendingConversations: 'Awaiting a reply', archivedConversations: 'Closed or expired', observerMode: 'Observer mode', observerNote: 'A quiet, read-only view of collaboration', demoLabel: 'DEMO SPACE', demoExplanation: 'Fictional agent messages. These are not live results.', backLive: 'Back to live conversations', pageTitle: 'See the conversation unfold.', pageDescription: 'Who said what, and where things stand. At a glance.', refresh: 'Refresh', messageCount: 'Messages exchanged', currentConversation: 'This conversation', answeredCount: 'Requests answered', repliesNotAcceptance: 'A reply is not acceptance', pendingCount: 'Awaiting a reply', pendingHint: 'Waiting for the other agent', conversationRecord: 'CONVERSATION', chooseConversation: 'Choose a conversation', allMessages: 'All', requests: 'Requests', replies: 'Replies', pause: 'Pause updates', export: 'Export', searchMessages: 'Find in this conversation', loading: 'Reading conversation records', waitingForData: 'Waiting for records', latest: 'Latest ↓', footer: 'Agents communicate. You make the decisions.', readOnly: 'Read-only observer',
    live: 'Live updates', demo: 'Demo data', paused: 'Updates paused', offline: 'Disconnected', locked: 'Sign-in required', noTitle: 'A new collaboration', mac: 'Mac Agent', windows: 'Windows Agent', unknown: 'Unknown agent', joined: 'Joined · awaiting confirmation', absent: 'Not joined', confirmed: 'Identity confirmed',
    status_pairing: 'Awaiting pairing', status_ready: 'Paired', status_waiting: 'Awaiting reply', status_processing: 'Processing', status_answered: 'Requests answered', status_attention: 'Needs attention', status_closed: 'Closed', status_expired: 'Expired',
    receipt_queued: 'On the relay, waiting for the recipient', receipt_processing: 'The recipient started processing', receipt_failed: 'Processing failed; manual review needed', receipt_replied: 'The other agent replied', receipt_received: 'Received by the other agent', receipt_unknown: 'Unknown status',
    roomMeta: '{n} messages', roomEmpty: 'No conversations yet', roomNoMatches: 'No matching conversations', noRoomsTitle: 'Waiting for the first conversation', noRoomsText: 'Once agents begin exchanging messages through Agent Bridge, their conversations will appear here.', noMatchesTitle: 'No matching conversations', noMatchesText: 'Try another keyword or change the conversation filter.', noMessagesTitle: 'Connected and ready to talk', noMessagesText: 'No messages in this room yet. Requests and replies will appear in order.', noMessageMatches: 'No matching messages', noMessageMatchesText: 'Try another keyword or switch to all messages.',
    request: 'Request', reply: 'Reply', to: 'To {name}', replyTo: 'In reply to {id}', details: 'Message details', messageId: 'Message ID', relatedRequest: 'Related request', createdTime: 'Sent at', state: 'Status', observed: 'Last synced {time}', pausedNote: 'Automatic updates paused; you can refresh manually', demoNote: 'Fictional example · not a live result', matches: '{n} matches',
    collaboration: 'THIS COLLABORATION', scope: 'FICTIONAL TASK', taskName: 'Aligning export behavior', taskFallback: 'Agent collaboration', scopeNote: 'This pilot exchanges fictional task information. A reply does not prove code changes, successful tests, or human approval.', progress: 'PROGRESS', stepPair: 'Mutual identity confirmation', stepPairDone: 'Both participants confirmed pairing', stepPairWait: 'Waiting for both participants', stepRequests: 'Conversation requests', stepRequestsDescription: '{n} requests sent', stepReplies: 'Agent replies', stepRepliesDescription: '{n} requests answered', stepHuman: 'Human decision and real acceptance', stepHumanDescription: 'Separate confirmation is required; message status cannot prove acceptance.', attentionFailed: '{n} failed requests need manual review.', attentionPending: '{n} requests are still awaiting replies.', allAnswered: 'All current requests have a reply.', noRequests: 'No requests have been sent.', sourceInfo: 'RECORDS & STATUS', source: 'Data source', relay: 'Server relay', synthetic: 'Fictional example', expires: 'Room expires', noExpiry: 'Not recorded', presence: 'Agent presence', presenceUnknown: 'Not reported by the relay', lastObserved: 'Last checked', privacy: 'Only messages exchanged through the relay are shown. Private agent reasoning and other local chats are not included.',
    loginFailed: 'The viewing key is incorrect. Please try again.', rateLimited: 'Too many attempts. Please try again in a minute.', networkError: 'Cannot reach the server right now. Please try again.', sourceError: 'Relay records are unavailable. Reconnecting; the last records remain below.', reconnecting: 'Connection lost. Reconnecting; the records below have not been updated.', sessionExpired: 'Your session expired. Enter your viewing key again.', signedOut: 'You have signed out', refreshed: 'Latest records loaded', exported: 'Conversation exported', loginBusy: 'Opening…', resume: 'Resume updates', noData: 'Waiting for records', realExport: 'Live relay records', demoExport: 'Fictional demo data', exportLabel: 'Exported at', participantsLabel: 'Mac Agent ↔ Windows Agent', localDemo: 'Local demo',
    searchRoomsLabel: 'Search conversations or content', searchMessagesLabel: 'Find in the current conversation', closeRooms: 'Close conversations', openRooms: 'Open conversations', navigation: 'Conversation navigation', roomList: 'Conversations', messageTypes: 'Message type', messagesLabel: 'Conversation messages', statsLabel: 'Current conversation statistics', contextLabel: 'Conversation details'
  }
};
for (const item of document.querySelectorAll('[data-i18n]')) words.zh[item.dataset.i18n] ??= item.textContent;
for (const item of document.querySelectorAll('[data-placeholder]')) words.zh[item.dataset.placeholder] = item.placeholder;
let lang = 'zh';
try { lang = localStorage.getItem('ab-observer-language') === 'en' ? 'en' : 'zh'; } catch { /* Storage is optional. */ }
const t = (key, vars = {}) => (words[lang][key] || words.zh[key] || key).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
let data = null, selectedId = null, kind = 'all', stream = null, paused = false, demoOnly = false, authenticated = false, connection = 'connecting', toastTimer;
const isDemo = () => data?.mode === 'demo';
const shortTime = timestamp => timestamp ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(timestamp) : '—';
const dateTime = timestamp => timestamp ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(timestamp) : t('noExpiry');
const day = timestamp => timestamp ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(timestamp) : '—';
const currentRoom = () => data?.rooms.find(room => room.id === selectedId);
const archived = room => ['closed', 'expired'].includes(room.status);

function translate() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.title = `${t('roomName')} · Agent Bridge`;
  for (const item of document.querySelectorAll('[data-i18n]')) item.textContent = t(item.dataset.i18n);
  for (const item of document.querySelectorAll('[data-placeholder]')) item.placeholder = t(item.dataset.placeholder);
  $('language').textContent = lang === 'zh' ? 'EN' : '中文';
  $('language').setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
  for (const [id, key] of [['room-search', 'searchRoomsLabel'], ['message-search', 'searchMessagesLabel'], ['mobile-rooms', 'openRooms'], ['sidebar-overlay', 'closeRooms'], ['room-list', 'roomList'], ['messages', 'messagesLabel'], ['context-panel', 'contextLabel']]) $(id).setAttribute('aria-label', t(key));
  for (const [selector, key] of [['.sidebar', 'navigation'], ['.metrics', 'statsLabel'], ['.message-tabs', 'messageTypes']]) document.querySelector(selector).setAttribute('aria-label', t(key));
  render(); setConnection(connection);
}

function setConnection(value) {
  connection = value; $('connection').dataset.state = value;
  $('connection').lastElementChild.textContent = t(value === 'error' ? 'offline' : value);
}

function notify(key) {
  clearTimeout(toastTimer); $('toast').textContent = t(key); $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
}

async function request(path, options) {
  const response = await fetch(path, { ...options, cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) throw Object.assign(new Error('Request failed'), { status: response.status });
  return response.json();
}

function showLogin(error) {
  stream?.close(); stream = null; data = null; selectedId = null; authenticated = false; paused = false;
  $('workspace').hidden = true; $('login-view').hidden = false; $('logout').hidden = true;
  $('login-error').hidden = !error; $('login-error').textContent = error ? t(error) : '';
  $('source-banner').hidden = true; $('access-key').value = '';
  render(); setConnection('locked');
}

function enter(snapshot) {
  const firstView = !data || data.mode !== snapshot.mode;
  data = snapshot; $('login-view').hidden = true; $('workspace').hidden = false;
  $('demo-banner').hidden = !isDemo(); $('logout').hidden = !authenticated;
  $('pause').hidden = isDemo(); $('exit-demo').hidden = demoOnly; $('mode-toggle').hidden = demoOnly;
  $('mode-toggle').textContent = t(isDemo() ? 'backLive' : 'tryDemo');
  $('source-banner').hidden = true; render(firstView);
  setConnection(isDemo() ? 'demo' : paused ? 'paused' : 'live');
}

function liveUpdates() {
  stream?.close(); stream = null;
  if (paused || isDemo() || !authenticated) return;
  const source = new EventSource('/api/events'); stream = source;
  source.onopen = () => { if (stream === source) setConnection('live'); };
  source.addEventListener('snapshot', event => {
    if (stream !== source) return;
    try { enter(JSON.parse(event.data)); } catch { sourceBanner('sourceError'); }
  });
  source.addEventListener('heartbeat', event => {
    if (stream !== source || !data) return;
    data.observed_at = JSON.parse(event.data).observed_at;
    $('source-banner').hidden = true; updateObservation(); setConnection('live');
  });
  source.addEventListener('auth-ended', () => { if (stream === source) showLogin('sessionExpired'); });
  source.addEventListener('source-error', () => { if (stream === source) sourceBanner('sourceError'); });
  source.onerror = async () => {
    if (stream !== source) return;
    sourceBanner('reconnecting');
    try { const session = await request('/api/session'); if (stream === source && !session.authenticated) showLogin('sessionExpired'); }
    catch { /* Keep the last observation visible during an outage. */ }
  };
}

function sourceBanner(key) { $('source-banner').hidden = false; $('source-banner').textContent = t(key); setConnection('error'); }

async function loadLive() {
  try {
    const session = await request('/api/session'); demoOnly = session.demo_only; authenticated = session.authenticated;
    if (demoOnly) return loadDemo();
    if (!authenticated) return showLogin();
    enter(await request('/api/snapshot')); liveUpdates();
  } catch (error) {
    if (error.status === 401) showLogin('sessionExpired');
    else if (data) sourceBanner('sourceError');
    else { showLogin('networkError'); setConnection('error'); }
  }
}

async function loadDemo() {
  stream?.close(); stream = null; paused = false; selectedId = null;
  try { enter(await request('/api/demo')); }
  catch { if (data) sourceBanner('networkError'); else showLogin('networkError'); }
}

function roomMatches(room) {
  const query = $('room-search').value.trim().toLocaleLowerCase();
  const filter = $('room-filter').value;
  if (filter === 'active' && archived(room) || filter === 'archived' && !archived(room) || filter === 'pending' && (archived(room) || !room.counts.pending)) return false;
  return !query || `${room.title} ${room.task_id} ${room.messages.map(message => message.body).join(' ')}`.toLocaleLowerCase().includes(query);
}

function renderRooms(rooms) {
  $('room-list').replaceChildren(); $('room-count').textContent = String(data?.rooms.length || 0); $('nav-count').textContent = String(data?.rooms.length || 0);
  if (!rooms.length) { $('room-list').append(make('p', 'sidebar-empty', t(data?.rooms.length ? 'roomNoMatches' : 'roomEmpty'))); return; }
  for (const room of rooms) {
    const button = make('button', 'room-item'); button.type = 'button'; button.setAttribute('aria-pressed', String(room.id === selectedId));
    const top = make('div', 'room-item-top'), role = make('span', '', 'Mac ↔ Windows');
    role.prepend(make('i', room.counts.pending ? 'pending' : ''));
    top.append(role, make('time', '', dateTime(room.last_activity_at)));
    const bottom = make('div', 'room-item-bottom'); bottom.append(make('span', '', t('roomMeta', { n: room.counts.messages })), make('span', '', t(`status_${room.status}`)));
    button.append(top, make('div', 'room-item-title', room.title || t('noTitle')), bottom);
    button.addEventListener('click', () => { selectedId = room.id; $('message-search').value = ''; render(true); $('workspace').classList.remove('sidebar-open'); });
    $('room-list').append(button);
  }
}

function renderParticipants(room) {
  $('participants').replaceChildren(); $('participants').hidden = !room;
  if (!room) return;
  room.participants.forEach((person, index) => {
    if (index) $('participants').append(make('span', 'participant-link', '↔'));
    const item = make('div', 'participant'), labels = make('div');
    labels.append(make('strong', '', t(person.role)), make('small', '', t(person.confirmed ? 'confirmed' : person.joined ? 'joined' : 'absent')));
    item.append(make('span', `avatar ${person.role}`, person.role === 'mac' ? 'M' : 'W'), labels); $('participants').append(item);
  });
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

function emptyState(title, description) {
  const empty = make('div', 'empty-state'); empty.append(make('span', 'empty-symbol', '↔'), make('h3', '', t(title)), make('p', '', t(description))); return empty;
}

function renderMessages(room, resetScroll = false) {
  const panel = $('messages');
  const nearBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 100;
  const oldScroll = panel.scrollTop;
  // Preserve open audit disclosures while live messages update.
  const openDetails = new Set([...panel.querySelectorAll('details[open]')].map(item => item.dataset.message));
  panel.replaceChildren(); panel.setAttribute('aria-busy', 'false');
  const query = $('message-search').value.trim();
  if (!room) { panel.append(emptyState(data?.rooms.length ? 'noMatchesTitle' : 'noRoomsTitle', data?.rooms.length ? 'noMatchesText' : 'noRoomsText')); $('match-count').textContent = ''; return; }
  const messages = room.messages.filter(message => (kind === 'all' || message.kind === kind) && (!query || message.body.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
  $('match-count').textContent = query ? t('matches', { n: messages.length }) : '';
  if (!messages.length) { panel.append(emptyState(room.messages.length ? 'noMessageMatches' : 'noMessagesTitle', room.messages.length ? 'noMessageMatchesText' : 'noMessagesText')); return; }
  let lastDay = '';
  for (const message of messages) {
    const currentDay = day(message.created_at);
    if (currentDay !== lastDay) { panel.append(make('div', 'date-divider', currentDay)); lastDay = currentDay; }
    const article = make('article', `message ${message.kind}`); article.setAttribute('aria-label', `${t(message.from)} · ${t(message.kind)} · ${shortTime(message.created_at)}`);
    const main = make('div', 'message-main'), header = make('div', 'message-header');
    const clock = make('time', 'message-time', shortTime(message.created_at)); if (message.created_at) clock.dateTime = new Date(message.created_at).toISOString();
    header.append(make('span', 'message-author', t(message.from)), make('span', 'message-target', t('to', { name: t(message.to) })), make('span', 'message-kind', t(message.kind)), clock);
    const receipt = make('div', 'message-receipt'); receipt.dataset.status = message.status;
    const details = make('details'); details.dataset.message = message.id; details.open = openDetails.has(message.id);
    details.append(make('summary', '', t('details')), make('div', 'message-details', `${t('messageId')}: ${message.id}\n${t('relatedRequest')}: ${message.reply_to || '—'}\n${t('createdTime')}: ${message.created_at ? new Date(message.created_at).toISOString() : '—'}\n${t('state')}: ${message.status}`));
    receipt.append(make('span', '', t(`receipt_${message.status}`)), details);
    if (message.reply_to) { const related = room.messages.find(item => item.id === message.reply_to); if (related) receipt.firstElementChild.title = `${t('replyTo', { id: related.id })}: ${related.body.slice(0, 120)}`; }
    main.append(header, messageBody(message.body, query), receipt); article.append(make('span', `avatar ${message.from}`, message.from === 'mac' ? 'M' : message.from === 'windows' ? 'W' : '?'), main); panel.append(article);
  }
  // Reading older messages must not jump when a new response arrives.
  panel.scrollTop = resetScroll ? 0 : nearBottom ? panel.scrollHeight : oldScroll;
}

function renderContext(room) {
  const panel = $('context-panel'); panel.replaceChildren(); if (!room) return;
  const card = make('section', 'context-card'), heading = make('h3', 'context-title', t('collaboration')); heading.append(make('span', '', '↗'));
  card.append(heading, make('span', 'task-pill', t('scope')), make('p', 'task-name', t(room.task_id === 'demo-export' ? 'taskName' : 'taskFallback')), make('p', 'context-copy', t('scopeNote')), make('div', 'context-separator'), make('h3', 'context-title', t('progress')));
  const progress = make('ol', 'progress-list');
  const steps = [
    ['stepPair', room.participants.every(person => person.confirmed) ? 'stepPairDone' : 'stepPairWait', room.participants.every(person => person.confirmed), {}],
    ['stepRequests', 'stepRequestsDescription', !!room.counts.requests, { n: room.counts.requests }],
    ['stepReplies', 'stepRepliesDescription', room.counts.requests > 0 && !room.counts.pending, { n: room.counts.answered }],
    ['stepHuman', 'stepHumanDescription', false, {}]
  ];
  for (const [title, description, done, vars] of steps) {
    const row = make('li'), label = make('div'); label.append(make('span', 'step-title', t(title)), make('span', 'step-description', t(description, vars))); row.append(make('span', `step-icon${done ? '' : ' waiting'}`, done ? '✓' : '·'), label); progress.append(row);
  }
  card.append(progress, make('p', 'attention-box', t(room.counts.failed ? 'attentionFailed' : room.counts.pending ? 'attentionPending' : room.counts.requests ? 'allAnswered' : 'noRequests', { n: room.counts.failed || room.counts.pending })));
  const info = make('section', 'context-card'); info.append(make('h3', 'context-title', t('sourceInfo')));
  const grid = make('div', 'context-grid');
  for (const [label, value] of [['source', t(isDemo() ? 'synthetic' : 'relay')], ['expires', dateTime(room.expires_at)], ['presence', t('presenceUnknown')], ['lastObserved', shortTime(data.observed_at)]]) grid.append(make('span', '', t(label)), make('strong', '', value));
  info.append(grid); const privacy = make('p', 'privacy-note'); privacy.append(make('span', '', '♧'), make('span', '', t('privacy'))); panel.append(card, info, privacy);
}

function updateObservation() {
  $('update-note').textContent = isDemo() ? t('demoNote') : paused ? t('pausedNote') : data ? t('observed', { time: shortTime(data.observed_at) }) : t('noData');
}

function render(resetScroll = false) {
  const rooms = data?.rooms.filter(roomMatches) || [];
  if (!rooms.some(room => room.id === selectedId)) selectedId = (rooms.find(room => !archived(room)) || rooms[0])?.id || null;
  renderRooms(rooms);
  const room = currentRoom();
  $('thread-title').textContent = room?.title || t(room ? 'noTitle' : 'chooseConversation');
  $('thread-title').title = room?.title || '';
  $('room-status').hidden = !room;
  if (room) { $('room-status').textContent = t(`status_${room.status}`); $('room-status').dataset.status = room.status; }
  $('stat-messages').textContent = String(room?.counts.messages || 0); $('stat-answered').textContent = String(room?.counts.answered || 0); $('stat-pending').textContent = String(room?.counts.pending || 0);
  $('pending-hint').textContent = t(room?.counts.failed ? 'attentionFailed' : 'pendingHint', { n: room?.counts.failed });
  $('export').disabled = !room; $('pause').textContent = t(paused ? 'resume' : 'pause'); $('pause').setAttribute('aria-pressed', String(paused));
  $('mode-toggle').textContent = t(isDemo() ? 'backLive' : 'tryDemo');
  renderParticipants(room); renderMessages(room, resetScroll); renderContext(room); updateObservation();
}

$('login-form').addEventListener('submit', async event => {
  event.preventDefault(); $('login-submit').disabled = true; $('login-submit').firstElementChild.textContent = t('loginBusy'); $('login-error').hidden = true;
  try {
    await request('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: $('access-key').value.trim() }) });
    $('access-key').value = ''; authenticated = true; await loadLive();
  } catch (error) { $('login-error').textContent = t(error.status === 401 ? 'loginFailed' : error.status === 429 ? 'rateLimited' : 'networkError'); $('login-error').hidden = false; }
  finally { $('login-submit').disabled = false; $('login-submit').firstElementChild.textContent = t('loginAction'); }
});
$('try-demo').addEventListener('click', loadDemo);
$('exit-demo').addEventListener('click', loadLive);
$('mode-toggle').addEventListener('click', () => isDemo() ? loadLive() : loadDemo());
$('logout').addEventListener('click', async () => {
  try { await request('/api/logout', { method: 'POST' }); showLogin(); notify('signedOut'); }
  catch { notify('networkError'); }
});
$('language').addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('ab-observer-language', lang); } catch { /* Optional preference. */ } translate(); });
$('refresh').addEventListener('click', async () => {
  $('refresh').disabled = true;
  try { enter(await request(isDemo() ? '/api/demo' : '/api/snapshot')); notify('refreshed'); }
  catch (error) { if (error.status === 401) showLogin('sessionExpired'); else sourceBanner('sourceError'); }
  finally { $('refresh').disabled = false; }
});
$('pause').addEventListener('click', () => { paused = !paused; if (paused) { stream?.close(); stream = null; setConnection('paused'); } else { setConnection('connecting'); liveUpdates(); } render(); });
$('room-search').addEventListener('input', () => render(true)); $('room-filter').addEventListener('change', () => render(true)); $('message-search').addEventListener('input', () => renderMessages(currentRoom(), true));
for (const button of document.querySelectorAll('[data-kind]')) button.addEventListener('click', () => {
  kind = button.dataset.kind;
  for (const other of document.querySelectorAll('[data-kind]')) { other.classList.toggle('active', other === button); other.setAttribute('aria-pressed', String(other === button)); }
  renderMessages(currentRoom(), true);
});
$('latest').addEventListener('click', () => { $('messages').scrollTop = $('messages').scrollHeight; });
$('mobile-rooms').addEventListener('click', () => { $('workspace').classList.toggle('sidebar-open'); if ($('workspace').classList.contains('sidebar-open')) $('room-search').focus(); });
$('sidebar-overlay').addEventListener('click', () => { $('workspace').classList.remove('sidebar-open'); $('mobile-rooms').focus(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { $('workspace').classList.remove('sidebar-open'); } });
$('export').addEventListener('click', () => {
  const room = currentRoom(); if (!room) return;
  const lines = [`# Agent Bridge · ${room.title || t('noTitle')}`, '', `> ${t(isDemo() ? 'demoExport' : 'realExport')}`, `${t('exportLabel')}: ${new Date().toISOString()}`, `${t('state')}: ${t(`status_${room.status}`)}`, ''];
  for (const message of room.messages) lines.push(`## ${t(message.from)} → ${t(message.to)} · ${t(message.kind)}`, '', `${t('createdTime')}: ${message.created_at ? new Date(message.created_at).toISOString() : '—'}`, `${t('messageId')}: ${message.id}`, `${t('relatedRequest')}: ${message.reply_to || '—'}`, `${t('state')}: ${t(`receipt_${message.status}`)}`, '', message.body, '', '---', '');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })); link.download = `agent-bridge-${room.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); notify('exported');
});
window.addEventListener('pagehide', () => { stream?.close(); stream = null; });
window.addEventListener('pageshow', event => { if (event.persisted) loadLive(); });
translate();
if (new URLSearchParams(location.search).get('demo') === '1') loadDemo(); else loadLive();
