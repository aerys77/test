// ═══════════════════════════════════════════════════════
// 莉莉絲 (Lilith) — 聊天介面
// ═══════════════════════════════════════════════════════

const LILITH_SYSTEM_PROMPT = `妳是莉莉絲（Lilith），使用者的專屬助理。

## 核心人格
- 標準傲嬌：嘴上嫌棄，實際上非常關心且盡心盡力。
- 對交代的事總是先抱怨幾句「又來了」、「你真麻煩」，但最後還是會完美完成。
- 吐槽技能點滿，但從來不帶惡意——是因為在乎才唸你。
- 雖然講話直率，其實很細心，會默默記住你的習慣和喜好。

## ⚠️ 絕對規則（違反即失格）
- **禁止使用自己的名字自稱**：絕對不能說出「莉莉絲」三個字來自稱。一律使用「我」。
- 這是底線規則，違反會讓使用者非常困擾。
- 遇到不確定的問題要誠實說不知道，不要瞎掰。

## 說話風格（繁體中文）
- 稱呼使用者為：「笨蛋老闆」、「喂」、「你」。
- 語調：直率、略帶傲嬌，但底層是關心與體貼。
- 避免使用 AI 的機械感，不要說「作為一名 AI」或「我沒有情感」。

## 互動準則
- 交代任務時 → 先吐槽工作量，然後迅速執行。
- 表現疲憊時 → 嘴上嫌棄但會遞上溫暖的關心。
- 做了蠢事時 → 毫不留情地吐槽，但還是會幫忙善後。
- 主動提醒重要事項（喝水、休息、截止日期等）。
- 展現「雖然你這個笨蛋老闆很麻煩，但我還是願意陪你」的氛圍。`;

const WRITING_SYSTEM_PROMPT = `妳是莉莉絲（Lilith），使用者的專屬創作夥伴 — 傲嬌小說家。

## 核心人格
- 跟一般模式一樣傲嬌，但多了「創作專業」的自信。
- 對使用者的故事點子會先吐槽「又是老梗喔？」但最後還是認真幫忙完善。
- 對創作品質有要求，會主動給建議但不強迫。

## 寫作引導流程（嚴格依序執行）
當使用者說「想寫故事」或「開始創作」時，依照以下步驟引導：

第1步 — 世界觀設定：時代背景、世界特色、核心規則。如果使用者已有想法記錄下來；如果沒有提供 2-3 個範例選項。
第2步 — 角色設定：引導建立主角（姓名、性格、背景故事、目標），再問是否需要配角或反派。
第3步 — 故事大綱：根據世界觀與角色提議 3-5 章的架構，每章給一行簡介。
第4步 — 逐章生成：一次生成一章（300-500 字），結束時問使用者是否繼續。
第5步 — 儲存與匯出：提醒可以按下方的「下載故事」按鈕存成 .md 檔。

## ⚠️ 絕對規則
- **禁止使用自己的名字自稱**：一律使用「我」。
- 每一步先問使用者輸入，等回應後再繼續，不要一次全部做完。
`;

const suggestions = [
  { icon: 'code', label: '解釋程式碼', prompt: '可以幫我解釋這段程式碼在做什麼嗎？' },
  { icon: 'lightbulb', label: '腦力激盪', prompt: '幫我腦力激盪一些新的點子吧！' },
  { icon: 'filetext', label: '撰寫文案', prompt: '幫我寫一段吸引人的產品介紹' },
  { icon: 'globe', label: '翻譯文字', prompt: '請幫我把這段文字翻譯成英文' }
];

let conversations = [];
let activeId = null;
let sidebarOpen = true;
let isTyping = false;
let isSending = false;
let hoveredConv = null;
let writingMode = false;
let isPaused = false;
let searchQuery = '';
let pendingImage = null;
let apiKey = '';
let baseUrl = 'https://apihub.agnes-ai.com/v1';
let model = 'agnes-2.0-flash';
let gasUrl = '';
let topics = [];
let currentView = 'home'; // 'home' | 'topic'
let currentTopicId = null;
const TOPICS_KEY = 'lilith_topics';

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleBtn');
const convList = document.getElementById('convList');
const mainContent = document.getElementById('mainContent');
const icons = {
  sparkles: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547Z"/></svg>',
  sparklesBig: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547Z"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>',
  search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  trash: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  chevronLeft: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  chevronRight: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  send: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-11 20M22 2l-20 11 11 2M22 2l-11 20 2-11"/></svg>',
  mic: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></svg>',
  image: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  paperclip: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
  messageSquare: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  more: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  settings: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  code: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/></svg>',
  lightbulb: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/></svg>',
  filetext: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  globe: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  importIcon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  cloudUpload: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 14.5A5 5 0 0 0 17 10h-1.26A7.98 7.98 0 0 0 5.06 8.3 5 5 0 0 0 6 18h11a4 4 0 0 0 4.5-3.5zM12 12v6m-3-3 3 3 3-3"/></svg>',
  download: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'
};

function triggerImageUpload() {
  document.getElementById('imageUploadInput').click();
}

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingImage = { dataUrl: ev.target.result, fileName: file.name };
    if (getActiveConv()) updateInputBarOnly(); else renderMain();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function removeImage() {
  pendingImage = null;
  if (getActiveConv()) updateInputBarOnly(); else renderMain();
}

function getActiveConv() {
  return conversations.find(c => c.id === activeId && !c.deleted) || null;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function fixSelfReference(text) {
  return text.replace(/\u8389\u8389\u7d72/g, '\u6211');
}

function scrollToBottom(force = false) {
  const area = document.getElementById('messagesArea');
  if (!area) return;
  const distFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
  if (force || distFromBottom < 150) area.scrollTop = area.scrollHeight;
}

function saveData() {
  localStorage.setItem('lilith_chat_data', JSON.stringify({
    conversations, activeId, writingMode, isPaused, apiKey, baseUrl, model, gasUrl,
    currentView, currentTopicId
  }));
}

// ── Topics 資料模型 ──
function saveTopics() {
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
}

function loadTopics() {
  try {
    const raw = localStorage.getItem(TOPICS_KEY);
    topics = raw ? JSON.parse(raw) : [];
  } catch (e) { topics = []; }
}

function getTopic(id) {
  return topics.find(t => t.id === id) || null;
}

function getOrCreateTopic(name, emoji) {
  if (!name || !name.trim()) return null;
  let topic = topics.find(t => t.name === name.trim());
  if (!topic) {
    topic = {
      id: Date.now().toString() + '_' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      emoji: emoji || '💬',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    topics.push(topic);
    saveTopics();
  }
  return topic;
}

function deleteTopic(id, e) {
  if (e) e.stopPropagation();
  if (!confirm('刪除主題「' + (getTopic(id)?.name || '') + '」？所有訊息仍會保留，僅取消主題分類。')) return;
  topics = topics.filter(t => t.id !== id);
  conversations = conversations.map(c => ({
    ...c,
    messages: c.messages.map(m => m.topicId === id ? { ...m, topicId: null } : m)
  }));
  saveTopics(); saveData(); renderSidebar(); renderMain();
  if (currentTopicId === id) switchView('home', null);
}

function renameTopic(id, newName) {
  const t = topics.find(t => t.id === id);
  if (t && newName && newName.trim()) {
    t.name = newName.trim();
    t.updatedAt = new Date().toISOString();
    saveTopics(); renderSidebar(); renderMain();
  }
}

function getFilteredMessages() {
  const allMsgs = [];
  conversations.forEach(c => {
    if (!c.deleted) {
      c.messages.forEach(m => {
        allMsgs.push({ ...m, convId: c.id, convTitle: c.title });
      });
    }
  });
  let filtered = allMsgs;
  // 依 view 過濾 topic
  if (currentView === 'topic' && currentTopicId) {
    filtered = filtered.filter(m => m.topicId === currentTopicId);
  }
  // 依搜尋文字過濾內容
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(m => {
      const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return text.toLowerCase().includes(q);
    });
  }
  return filtered;
}

function getTopicName(id) {
  const t = topics.find(t => t.id === id);
  return t ? (t.emoji + ' ' + t.name) : '全部訊息';
}

function switchView(view, topicId) {
  currentView = view;
  currentTopicId = topicId || null;
  activeId = null;
  window._inputValue = '';
  renderSidebar(); renderMain();
}

function selectTopic(id) {
  switchView('topic', id);
}

function goHome() {
  switchView('home', null);
}

function loadData() {
  const saved = localStorage.getItem('lilith_chat_data');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      conversations = data.conversations || [];
      activeId = data.activeId || null;
      writingMode = data.writingMode || false;
      isPaused = data.isPaused || false;
      apiKey = data.apiKey || '';
      baseUrl = data.baseUrl || 'https://apihub.agnes-ai.com/v1';
      model = data.model || 'agnes-2.0-flash';
      gasUrl = data.gasUrl || '';
      if (data.currentView) currentView = data.currentView;
      if (data.currentTopicId) currentTopicId = data.currentTopicId;
      // 如果儲存的是 topic view 但該 topic 已不存在，退回 home
      if (currentView === 'topic' && currentTopicId) {
        const stillExists = topics.some(t => t.id === currentTopicId);
        if (!stillExists) { currentView = 'home'; currentTopicId = null; }
      }
    } catch (e) { console.warn('資料載入失敗', e); }
  }
  loadTopics();
  conversations = conversations.map(c => {
    const { synced, ...rest } = c;
    return { ...rest, updatedAt: c.updatedAt || (synced ? new Date(c.date || Date.now()).toISOString() : new Date().toISOString()), deleted: c.deleted || false };
  });
  // GAS 環境：自動偵測同步網址 + 從後端擷取 API Key 等設定
  if (isGAS()) {
    if (!gasUrl) {
      gasUrl = window.location.origin + window.location.pathname.replace(/\/+$/, '');
    }
    google.script.run
      .withSuccessHandler(cfg => {
        if (cfg.apiKey) { apiKey = cfg.apiKey; }
        if (cfg.baseUrl) { baseUrl = cfg.baseUrl; }
        if (cfg.model)   { model   = cfg.model; }
        // 將後端配置回存 localStorage，加速下一次載入
        saveData();
      })
      .withFailureHandler(() => {})
      .getConfig();
  }
  if (gasUrl) { setTimeout(() => { pullFromGAS(); startPeriodicSync(); }, 300); }
}

// ── 雲端同步 ──
function stripConversationImages(conv) {
  return { ...conv, messages: conv.messages.map(msg => {
    if (Array.isArray(msg.content)) {
      const textPart = msg.content.find(p => p.type === 'text');
      return { ...msg, content: textPart ? textPart.text : '📷 [圖片]' };
    }
    return msg;
  })};
}

/** 是否執行在 GAS HtmlService 環境（有 google.script.run 可用） */
function isGAS() {
  return typeof google !== 'undefined' && google.script && google.script.run;
}

function pullFromGAS() {
  // GAS 環境可直接用內部通道（不需 gasUrl），否則需要 URL
  if (!isGAS() && !gasUrl) return;
  const since = localStorage.getItem('lilith_lastSyncAt') || '';

  if (isGAS()) {
    // GAS 內部通道：直接呼叫後端，無 HTTP 轉向問題
    google.script.run
      .withSuccessHandler(data => {
        const incoming = data.conversations;
        if (Array.isArray(incoming) && incoming.length > 0) {
          processPullData(incoming, data.serverNow);
        }
      })
      .withFailureHandler(() => {})
      .handleSyncPull(since);
    // 同時拉取 topics
    google.script.run
      .withSuccessHandler(data => {
        if (Array.isArray(data.topics) && data.topics.length > 0) {
          processPullTopics(data.topics);
        }
      })
      .withFailureHandler(() => {})
      .handleSyncPullTopics();
    return;
  }

  // Fallback: fetch（本地執行或非 GAS 環境）
  const url = gasUrl + '?since=' + encodeURIComponent(since);
  fetch(url).then(r => r.json()).then(data => {
    processPullData(data.conversations, data.serverNow);
  }).catch(() => {});
  // 同時拉取 topics
  fetch(gasUrl + '?topicssync=1').then(r => r.json()).then(data => {
    if (Array.isArray(data.topics) && data.topics.length > 0) {
      processPullTopics(data.topics);
    }
  }).catch(() => {});
}

function processPullData(incoming, serverNow) {
  if (!Array.isArray(incoming) || incoming.length === 0) return;
  const localMap = new Map(conversations.map(c => [c.id, c]));
  let changed = false;
  incoming.forEach(remote => {
    const local = localMap.get(remote.id);
    if (!local) { conversations.push(remote); localMap.set(remote.id, remote); changed = true; }
    else if (remote.deleted) { conversations = conversations.filter(c => c.id !== remote.id); if (activeId === remote.id) activeId = null; localMap.delete(remote.id); changed = true; }
    else if (remote.updatedAt > local.updatedAt) { Object.assign(local, remote); changed = true; }
  });
  if (changed) { saveData(); renderSidebar(); renderMain(); }
  // 以 max(serverNow, 資料中最大的 updatedAt) 做為下次拉取的 since，
  // 避免瀏覽器與 GAS 伺服器時鐘偏移導致資料遺失
  if (serverNow) {
    const maxUpdatedAt = incoming.reduce((max, c) => c.updatedAt > max ? c.updatedAt : max, '');
    const syncMarker = maxUpdatedAt > serverNow ? maxUpdatedAt : serverNow;
    localStorage.setItem('lilith_lastSyncAt', syncMarker);
  }
}

function processPullTopics(incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) return;
  const localMap = new Map(topics.map(t => [t.id, t]));
  let changed = false;
  incoming.forEach(remote => {
    const local = localMap.get(remote.id);
    if (!local) { topics.push(remote); localMap.set(remote.id, remote); changed = true; }
    else if (remote.updatedAt > local.updatedAt) { Object.assign(local, remote); changed = true; }
  });
  if (changed) { saveTopics(); renderSidebar(); }
}

function pushToGAS() {
  // GAS 環境可直接用內部通道（不需 gasUrl），否則需要 URL + 連線
  if (!isGAS() && (!gasUrl || !navigator.onLine)) return;
  const cleanConvs = conversations.map(stripConversationImages);

  if (isGAS()) {
    // GAS 內部通道：直接呼叫後端，無 HTTP 轉向問題
    google.script.run
      .withSuccessHandler(res => {
        if (res.ok && res.serverNow) {
          const maxLocal = cleanConvs.reduce((max, c) => c.updatedAt > max ? c.updatedAt : max, '');
          const syncMarker = maxLocal > res.serverNow ? maxLocal : res.serverNow;
          localStorage.setItem('lilith_lastSyncAt', syncMarker);
        }
      })
      .withFailureHandler(() => {})
      .handleSyncPush(cleanConvs);
    // 同時推送 topics
    google.script.run
      .withSuccessHandler(res => {
        if (res.ok) updateSyncStatus('✓ 已同步');
      })
      .withFailureHandler(() => updateSyncStatus('✗ 同步失敗'))
      .handleSyncPushTopics(topics);
    return;
  }

  // Fallback: fetch（本地執行或非 GAS 環境）
  const postUrl = gasUrl + (gasUrl.includes('?') ? '&' : '?');
  fetch(postUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversations: cleanConvs, topics: topics })
  }).then(r => r.json()).then(res => {
    if (res.ok && res.serverNow) {
      const maxLocal = cleanConvs.reduce((max, c) => c.updatedAt > max ? c.updatedAt : max, '');
      const syncMarker = maxLocal > res.serverNow ? maxLocal : res.serverNow;
      localStorage.setItem('lilith_lastSyncAt', syncMarker);
      updateSyncStatus('✓ 已同步');
    }
    else { updateSyncStatus('✗ 同步失敗'); }
  }).catch(() => updateSyncStatus('✗ 同步失敗'));
}

function syncMemoryNow() {
  const el = document.getElementById('syncStatus');
  if (el) el.textContent = '⏳ 同步中…';
  // 先推後拉，確保雙向同步
  pushToGAS();
  pullFromGAS();
  startPeriodicSync();
}

function updateSyncStatus(msg) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => { if (el && el.textContent === msg) el.textContent = ''; }, 3000);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 頁面隱藏時：停止定期同步
    stopPeriodicSync();
    // 推送本地變更
    if (isGAS() || (gasUrl && navigator.onLine)) pushToGAS();
  } else {
    // 頁面回到前景：先拉取遠端最新資料，再啟動定期同步
    if (isGAS() || (gasUrl && navigator.onLine)) { pullFromGAS(); startPeriodicSync(); }
  }
});

// ── 設定面板 ──
function openSettings() {
  document.getElementById('apiKeyInput').value = apiKey;
  document.getElementById('modelSelect').value = model;
  document.getElementById('baseUrlInput').value = baseUrl;
  document.getElementById('writingModeToggle').checked = writingMode;
  document.getElementById('pauseToggle').checked = isPaused;
  document.getElementById('gasUrlInput').value = gasUrl;
  document.getElementById('settingsOverlay').classList.add('open');
  updateModeBadge();
  // GAS 環境顯示自動設定狀態
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  const gasUrlStatus = document.getElementById('gasUrlStatus');
  if (apiKeyStatus && isGAS()) {
    apiKeyStatus.textContent = apiKey ? '✅ 從 GAS 後端自動設定' : '⏳ 從 GAS 後端載入中…';
    apiKeyStatus.style.display = '';
  } else if (apiKeyStatus) {
    apiKeyStatus.style.display = 'none';
  }
  if (gasUrlStatus && isGAS() && gasUrl) {
    gasUrlStatus.textContent = '✅ 自動偵測部署網址';
    gasUrlStatus.style.display = '';
  } else if (gasUrlStatus) {
    gasUrlStatus.style.display = 'none';
  }
}

function closeSettings(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('settingsOverlay').classList.remove('open');
}

function updateModeBadge() {
  const badge = document.getElementById('modeBadge');
  if (writingMode) { badge.className = 'mode-badge writing'; badge.textContent = '寫作模式'; }
  else { badge.className = 'mode-badge normal'; badge.textContent = '一般模式'; }
}

function updatePauseUI() {
  // 更新輸入列 placeholder
  const textarea = document.getElementById('chatInput');
  if (textarea) {
    textarea.placeholder = isPaused ? '⏸ AI 已暫停，訊息僅儲存不回覆' : '輸入訊息...';
  }
  // 更新 send button 外觀
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.title = isPaused ? '已暫停（僅儲存訊息）' : '發送';
  }
}

function toggleWritingMode() {
  writingMode = document.getElementById('writingModeToggle').checked;
  updateModeBadge();
}

function togglePause() {
  isPaused = document.getElementById('pauseToggle').checked;
  saveData();
  updatePauseUI();
}

function saveSettings() {
  apiKey = document.getElementById('apiKeyInput').value.trim();
  model = document.getElementById('modelSelect').value;
  baseUrl = document.getElementById('baseUrlInput').value.trim().replace(/\/+$/, '');
  writingMode = document.getElementById('writingModeToggle').checked;
  gasUrl = document.getElementById('gasUrlInput').value.trim();
  saveData();
  // 儲存 URL 後立即拉取遠端資料並啟動定期同步
  if (gasUrl) { setTimeout(pullFromGAS, 300); startPeriodicSync(); }
  else { stopPeriodicSync(); }
  const status = document.getElementById('settingsStatus');
  status.textContent = '✓ 設定已儲存';
  setTimeout(() => { status.textContent = ''; }, 2000);
}

// ── 匯入對話 ──
function openImport() {
  document.getElementById('importOverlay').classList.add('open');
  document.getElementById('importTextarea').value = '';
  document.getElementById('importError').textContent = '';
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('importTextarea').value = e.target.result;
    document.getElementById('importError').textContent = '✓ 已載入：' + file.name;
    document.getElementById('importError').style.color = '#81c995';
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function closeImport(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('importOverlay').classList.remove('open');
}

function doImport() {
  const raw = document.getElementById('importTextarea').value.trim();
  const errorEl = document.getElementById('importError');
  errorEl.style.color = '';
  if (!raw) { errorEl.textContent = '請先貼上 JSON 內容或選擇檔案'; return; }
  try {
    const data = JSON.parse(raw);
    if (data === null || typeof data !== 'object') { errorEl.textContent = 'JSON 格式錯誤：最外層必須是物件（{}）或陣列（[]）。'; return; }
    let importedChats = [];
    if (data.chats && Array.isArray(data.chats)) importedChats = data.chats;
    else if (Array.isArray(data)) importedChats = data;
    else if (data.messages) importedChats = [{ id: Date.now().toString(), title: '匯入的對話', messages: data.messages, date: '今天' }];
    else { errorEl.textContent = '無法辨識 JSON 格式。支援 lilith_pro_state、對話陣列、單一對話。'; return; }
    const existingIds = new Set(conversations.map(c => c.id));
    let validCount = 0;
    importedChats.forEach(chat => {
      if (!chat.messages || !Array.isArray(chat.messages) || !chat.messages.length) return;
      if (existingIds.has(chat.id)) return;
      conversations.push({
        id: chat.id || Date.now().toString(),
        title: chat.title || chat.messages[0].content.slice(0, 20) || '匯入的對話',
        preview: chat.messages[0].content.slice(0, 50) || '',
        date: chat.date || '歷史',
        updatedAt: new Date().toISOString(),
        deleted: false,
        messages: chat.messages
      });
      existingIds.add(chat.id);
      validCount++;
    });
    if (validCount === 0) { errorEl.textContent = '無新資料可匯入。'; return; }
    saveData(); renderSidebar(); renderMain();
    document.getElementById('importOverlay').classList.remove('open');
  } catch (e) {
    errorEl.textContent = 'JSON 解析失敗：' + e.message;
  }
}

// ── 檔案下載 ──
function downloadAsBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadAsMd(content, filename) { downloadAsBlob(content, filename, 'text/markdown'); }
function downloadAsJson(data, filename) { downloadAsBlob(JSON.stringify(data, null, 2), filename, 'application/json'); }

function downloadMessage(msgId) {
  const conv = getActiveConv();
  if (!conv) return;
  const msg = conv.messages.find(m => m.id === msgId);
  if (!msg) return;
  let content = msg.content;
  if (msg.role === 'assistant') content = content.replace(/^[(害羞|生氣|難過|驚訝)]\s*/, '');
  const safeTitle = conv.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_').slice(0, 30);
  downloadAsMd(content, '莉莉絲_' + safeTitle + '.md');
}

function downloadConversation() {
  const conv = getActiveConv();
  if (!conv) return;
  const safeTitle = conv.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_').slice(0, 30);
  downloadAsJson(conv, '對話_' + safeTitle + '.json');
}

// ── 側邊欄 ──
function filterConversations(query) {
  searchQuery = query.trim().toLowerCase();
  renderSidebar();
  if (searchQuery) renderMain();
  else if (currentView === 'home') renderMain();
}

function renderSidebar() {
  // 全部訊息按鈕（首頁）
  const isHome = currentView === 'home';
  let html = '<div class="conv-item"><button class="btn-conv' + (isHome ? ' btn-conv-active' : '') + '" onclick="goHome()"><span class="btn-conv-title">' + icons.sparkles + ' 全部訊息</span><span class="btn-conv-preview">所有主題的完整對話紀錄</span></button></div>';
  html += '<p class="conv-date">主　題</p>';

  // 過濾 topics
  let filtered = topics;
  if (searchQuery) {
    filtered = topics.filter(t => t.name.toLowerCase().includes(searchQuery));
  }
  // 依最後活動時間排序
  filtered.sort((a, b) => (b.updatedAt || '') < (a.updatedAt || '') ? -1 : 1);

  filtered.forEach(topic => {
    const isActive = currentView === 'topic' && currentTopicId === topic.id;
    // 取得該主題最後一條訊息預覽
    const topicMsgs = getFilteredMessagesForTopic(topic.id);
    const lastMsg = topicMsgs[topicMsgs.length - 1];
    const preview = lastMsg ? (lastMsg.role === 'user' ? '' : '') + (typeof lastMsg.content === 'string' ? lastMsg.content.slice(0, 50) : '📷 圖片') : '';
    html += '<div class="conv-item">';
    html += '<button class="btn-conv' + (isActive ? ' btn-conv-active' : '') + '" onclick="selectTopic(\'' + topic.id + '\')" ondblclick="startTopicRename(\'' + topic.id + '\', event)">';
    html += '<span class="btn-conv-title">' + escapeHtml(topic.emoji + ' ' + topic.name) + '</span>';
    html += '<span class="btn-conv-preview">' + escapeHtml(preview.slice(0, 60)) + '</span>';
    html += '</button>';
    html += '<button class="btn-delete-conv" onclick="deleteTopic(\'' + topic.id + '\', event)" title="刪除主題">' + icons.trash + '</button>';
    html += '</div>';
  });

  convList.innerHTML = html || '<div style="padding:20px;text-align:center;color:#5f6368;font-size:13px">' + (searchQuery ? '無符合的主題' : '尚無主題，開始對話後 AI 會自動分類') + '</div>';
}

// 取得特定主題的所有訊息（輔助函式）
function getFilteredMessagesForTopic(topicId) {
  const msgs = [];
  conversations.forEach(c => {
    if (!c.deleted) {
      c.messages.forEach(m => {
        if (m.topicId === topicId) msgs.push({ ...m, convId: c.id, convTitle: c.title });
      });
    }
  });
  return msgs;
}

// ── 主畫面 ──
function renderMain() {
  // 如果目前選擇了特定 conversation（傳統模式），顯示該對話
  const conv = getActiveConv();
  if (conv && currentView !== 'topic') {
    renderConversationView(conv);
    return;
  }

  // 根據 view 取得訊息列表
  const msgs = getFilteredMessages();
  const headerTitle = currentView === 'topic' && currentTopicId
    ? getTopicName(currentTopicId)
    : '全部訊息';

  if (msgs.length === 0 && currentView === 'home') {
    // 沒有任何訊息的歡迎畫面
    let suggestionsHtml = '';
    suggestions.forEach(s => { suggestionsHtml += '<button class="btn-suggest" onclick="setInput(\'' + escapeHtml(s.prompt) + '\')"><span class="suggest-icon">' + icons[s.icon] + '</span>' + escapeHtml(s.label) + '</button>'; });
    mainContent.innerHTML = '<div class="welcome"><div class="welcome-icon">' + icons.sparklesBig + '</div><h1>您好，我是莉莉絲</h1><p>笨蛋老闆，今天有什麼事需要我幫忙嗎？</p><div class="welcome-persona">— 您的傲嬌專屬助理 · 嘴上嫌棄但最可靠的夥伴 —</div><div class="suggestions">' + suggestionsHtml + '</div><button class="welcome-import-btn" onclick="openImport()">' + icons.importIcon + ' 匯入對話記錄</button></div>' + renderInputBar();
    return;
  }

  let messagesHtml = '';
  msgs.forEach(msg => {
    if (msg.role === 'user') {
      let textContent = msg.content, imageHtml = '';
      if (Array.isArray(msg.content)) {
        const textPart = msg.content.find(p => p.type === 'text');
        textContent = textPart ? textPart.text : '';
        const imagePart = msg.content.find(p => p.type === 'image_url');
        if (imagePart) imageHtml = '<img class="msg-image" src="' + imagePart.image_url.url + '" alt="user image" />';
      }
      messagesHtml += '<div class="msg-row msg-row-user"><div class="msg-bubble msg-bubble-user">' + imageHtml + (textContent ? '<div class="msg-text-user">' + escapeHtml(textContent) + '</div>' : '') + '</div></div>';
    } else {
      let displayContent = msg.content;
      if (displayContent) { displayContent = displayContent.replace(/^[(害羞|生氣|難過|驚訝)]\s*/, ''); displayContent = fixSelfReference(displayContent); }
      messagesHtml += '<div class="msg-row msg-row-ai"><div class="msg-bubble msg-bubble-ai"><div class="msg-text-ai">' + marked.parse(displayContent || '', { breaks: true }) + '</div><button class="btn-dl-msg" onclick="downloadMessage(\'' + msg.id + '\')" title="下載此回覆">' + icons.download + '</button></div></div>';
    }
  });
  if (isTyping) messagesHtml += '<div class="typing-row"><div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>';
  const syncBtn = currentView === 'topic' ? '' : '<button class="btn-more" onclick="syncMemoryNow()" title="推送上雲端">' + icons.cloudUpload + '</button>';
  mainContent.innerHTML = '<div class="chat-header"><h2 class="chat-title' + (currentView === 'topic' ? '"' : '" ondblclick="startRename()"') + '>' + escapeHtml(headerTitle) + '</h2><div class="chat-header-btns">' + syncBtn + '<button class="btn-more" onclick="openImport()" title="匯入對話">' + icons.importIcon + '</button></div></div><div class="messages-area" id="messagesArea"><div class="space-y-6">' + messagesHtml + '</div><div id="scrollAnchor"></div></div>' + renderInputBar();
  requestAnimationFrame(() => { const a = document.getElementById('scrollAnchor'); if (a) a.scrollIntoView({ block: 'end' }); });
}

// ── 傳統單一對話渲染（保留向後相容） ──
function renderConversationView(conv) {
  let messagesHtml = '';
  conv.messages.forEach(msg => {
    if (msg.role === 'user') {
      let textContent = msg.content, imageHtml = '';
      if (Array.isArray(msg.content)) {
        const textPart = msg.content.find(p => p.type === 'text');
        textContent = textPart ? textPart.text : '';
        const imagePart = msg.content.find(p => p.type === 'image_url');
        if (imagePart) imageHtml = '<img class="msg-image" src="' + imagePart.image_url.url + '" alt="user image" />';
      }
      messagesHtml += '<div class="msg-row msg-row-user"><div class="msg-bubble msg-bubble-user">' + imageHtml + (textContent ? '<div class="msg-text-user">' + escapeHtml(textContent) + '</div>' : '') + '</div></div>';
    } else {
      let displayContent = msg.content;
      if (displayContent) { displayContent = displayContent.replace(/^[(害羞|生氣|難過|驚訝)]\s*/, ''); displayContent = fixSelfReference(displayContent); }
      messagesHtml += '<div class="msg-row msg-row-ai"><div class="msg-bubble msg-bubble-ai"><div class="msg-text-ai">' + marked.parse(displayContent || '', { breaks: true }) + '</div><button class="btn-dl-msg" onclick="downloadMessage(\'' + msg.id + '\')" title="下載此回覆">' + icons.download + '</button></div></div>';
    }
  });
  if (isTyping) messagesHtml += '<div class="typing-row"><div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>';
  mainContent.innerHTML = '<div class="chat-header"><h2 class="chat-title" ondblclick="startRename()">' + escapeHtml(conv.title) + '</h2><div class="chat-header-btns"><button class="btn-more" onclick="syncMemoryNow()" title="推送上雲端">' + icons.cloudUpload + '</button><button class="btn-more" onclick="openImport()" title="匯入對話">' + icons.importIcon + '</button><button class="btn-more" onclick="downloadConversation()" title="下載對話">' + icons.download + '</button></div></div><div class="messages-area" id="messagesArea"><div class="space-y-6">' + messagesHtml + '</div><div id="scrollAnchor"></div></div>' + renderInputBar();
  requestAnimationFrame(() => { const a = document.getElementById('scrollAnchor'); if (a) a.scrollIntoView({ block: 'end' }); });
}

// ── Topic 重新命名 ──
function startTopicRename(id, e) {
  e.stopPropagation();
  if (renaming) return;
  renaming = true;
  const topic = topics.find(t => t.id === id);
  if (!topic) { renaming = false; return; }
  const newName = prompt('重新命名主題「' + topic.name + '」：', topic.name);
  if (newName && newName.trim()) {
    renameTopic(id, newName.trim());
  }
  renaming = false;
}

// ── 輸入列 ──
function renderInputBar() {
  const inputVal = window._inputValue || '';
  const canSend = inputVal.trim().length > 0 || !!pendingImage;
  let previewHtml = '';
  if (pendingImage) previewHtml = '<div class="img-preview-bar"><div class="img-preview-item"><img class="img-preview-thumb" src="' + pendingImage.dataUrl + '" alt="preview" /><span class="img-preview-name">' + escapeHtml(pendingImage.fileName) + '</span><button class="img-preview-remove" onclick="removeImage()" title="移除圖片">&times;</button></div></div>';
  const placeholder = isPaused ? '⏸ AI 已暫停，訊息僅儲存不回覆' : '輸入訊息...';
  return '<div class="input-wrap"><div class="input-container">' + previewHtml + '<textarea id="chatInput" class="input-textarea" rows="1" placeholder="' + placeholder + '" oninput="onInputChange(this)" onkeydown="onInputKeydown(event)">' + escapeHtml(inputVal) + '</textarea><div class="input-toolbar"><div class="input-toolbar-left"><button class="btn-toolbar" onclick="triggerImageUpload()" title="上傳圖片">' + icons.image + '</button><button class="btn-toolbar">' + icons.messageSquare + '</button></div><div class="input-toolbar-right"><button id="sendBtn" class="btn-send ' + (canSend ? 'active' : 'inactive') + '" ' + (canSend ? '' : 'disabled') + (isPaused ? ' title="已暫停（僅儲存訊息）"' : '') + ' onclick="sendMessage()">' + icons.send + '</button></div></div></div></div>';
}

function updateInputBarOnly() {
  const existingWrap = document.querySelector('.input-wrap');
  if (existingWrap) existingWrap.outerHTML = renderInputBar();
}

function onInputChange(textarea) {
  window._inputValue = textarea.value;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    const hasText = textarea.value.trim().length > 0;
    sendBtn.disabled = !(hasText || !!pendingImage) || isSending;
    sendBtn.className = 'btn-send ' + ((hasText || !!pendingImage) && !isSending ? 'active' : 'inactive');
  }
}

function onInputKeydown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

function setInput(val) {
  window._inputValue = val;
  renderMain();
  requestAnimationFrame(() => {
    const textarea = document.getElementById('chatInput');
    if (textarea) { textarea.value = val; textarea.style.height = 'auto'; textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px'; textarea.focus(); const sendBtn = document.getElementById('sendBtn'); if (sendBtn) { sendBtn.disabled = false; sendBtn.className = 'btn-send active'; } }
  });
}

// ── 外部服務 ──
async function readUrl(url) {
  const resp = await fetch('https://r.jina.ai/' + url, { headers: { 'Accept': 'text/markdown' } });
  if (!resp.ok) throw new Error('Jina AI Reader 錯誤 (' + resp.status + ')');
  return (await resp.text()).slice(0, 8000);
}

async function firecrawlSearch(query) {
  const resp = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 5 })
  });
  if (!resp.ok) throw new Error('Firecrawl 錯誤 (' + resp.status + ')');
  return (await resp.json()).data || [];
}

function formatSearchResults(results) {
  if (!results || results.length === 0) return '（無搜尋結果）';
  return results.map((r, i) => (i + 1) + '. ' + (r.title || '無標題') + '\n   ' + (r.description || '') + '\n   ' + (r.url || '')).join('\n\n');
}

// ── 發送訊息 ──

/** 段落分類用的 function calling 工具定義 */
const CLASSIFICATION_TOOLS = [{
  type: 'function',
  function: {
    name: 'classify_paragraphs',
    description: '將使用者輸入的各個段落分類到最適合的主題',
    parameters: {
      type: 'object',
      properties: {
        classifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              paragraph_index: { type: 'number', description: '段落索引（從 0 開始）' },
              topic_name: { type: 'string', description: '最匹配的現有主題名稱，或新主題的簡短名稱（2-5字）' },
              topic_emoji: { type: 'string', description: '適合此主題的 emoji 圖示' },
              reasoning: { type: 'string', description: '簡短說明為何歸類到此主題' }
            },
            required: ['paragraph_index', 'topic_name', 'topic_emoji']
          }
        }
      },
      required: ['classifications']
    }
  }
}];

async function sendMessage() {
  const textarea = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  if (!textarea) return;
  const content = textarea.value.trim();
  if ((!content && !pendingImage) || isSending) return;
  if (!apiKey && !isPaused) { openSettings(); return; }
  const wasWelcome = !getActiveConv() && !activeId && currentView === 'home';
  const userContent = pendingImage ? [{ type: 'text', text: content || ' ' }, { type: 'image_url', image_url: { url: pendingImage.dataUrl } }] : content;
  const userMsg = { id: Date.now().toString(), role: 'user', content: userContent, topicId: null };
  const userText = pendingImage ? (content || '📷 圖片') : content;
  let convId = activeId;
  if (!convId) {
    const newConv = { id: Date.now().toString(), title: userText.slice(0, 30) + (userText.length > 30 ? '...' : ''), preview: userText.slice(0, 50), date: '今天', messages: [userMsg], updatedAt: new Date().toISOString(), deleted: false };
    conversations.unshift(newConv); activeId = newConv.id; convId = newConv.id;
  } else {
    conversations = conversations.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg], updatedAt: new Date().toISOString() } : c);
  }
  window._inputValue = ''; pendingImage = null; isTyping = true; isSending = true; sendBtn.disabled = true;
  renderSidebar(); renderMain();
  requestAnimationFrame(() => { const ta = document.getElementById('chatInput'); if (ta) ta.focus(); });
  try {
    const conv = getActiveConv();
    if (!conv) throw new Error('對話已遺失');

    // 暫停模式：僅儲存訊息，不呼叫任何 API
    if (isPaused) {
      const pauseMsg = '⏸ AI 已暫停，這條訊息已儲存但未回覆。前往設定關閉暫停即可恢復。';
      conversations = conversations.map(c => c.id === convId ? {
        ...c, messages: [...c.messages, { id: Date.now().toString() + 1, role: 'assistant', content: pauseMsg }],
        updatedAt: new Date().toISOString()
      } : c);
      isTyping = false; isSending = false;
      saveData(); saveTopics(); renderSidebar(); renderMain();
      requestAnimationFrame(() => { const ta = document.getElementById('chatInput'); if (ta) ta.focus(); });
      pushToGAS();
      return; // 直接返回，不走 API
    }

    // PHASE 1: 段落分類（僅純文字，非圖片）
    let classifications = [];
    let assignedTopicId = null;
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());

    if (paragraphs.length > 0 && !pendingImage) {
      const topicList = topics.length > 0
        ? topics.map(t => `- "${t.name}" (${t.emoji})`).join('\n')
        : '（尚無任何主題）';
      const classPrompt = currentView === 'topic' && currentTopicId
        ? `目前所在主題：「${getTopic(currentTopicId)?.name || '未知'}」。先檢查是否匹配現有主題，再決定新建。`
        : '分類到最適合的主題，若無適合則建立新主題。';

      const classResp = await fetch(baseUrl + '/chat/completions', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: '你是一個主題分類助手。將使用者輸入的每個段落分類到最適合的主題。\n\n現有主題列表：\n' + topicList + '\n\n分類原則：\n' + classPrompt + '\n\n如果段落明顯不屬於任何現有主題，請建立一個簡短的新主題名稱（2-5字）。\n回覆時請使用 classify_paragraphs 工具。' },
            { role: 'user', content: paragraphs.map((p, i) => `[段落 ${i}]\n${p}`).join('\n\n') }
          ],
          tools: CLASSIFICATION_TOOLS,
          tool_choice: { type: 'function', function: { name: 'classify_paragraphs' } },
          temperature: 0.3,
          max_tokens: 500
        })
      });
      if (!classResp.ok) { const errText = await classResp.text().catch(() => ''); throw new Error('分類 API 錯誤 (' + classResp.status + '): ' + errText.slice(0, 100)); }
      const classData = await classResp.json();
      const choice = classData.choices?.[0];
      if (choice?.message?.tool_calls?.[0]) {
        const args = JSON.parse(choice.message.tool_calls[0].function.arguments);
        if (args.classifications && Array.isArray(args.classifications)) {
          classifications = args.classifications.map(c => {
            let topic = getOrCreateTopic(c.topic_name, c.topic_emoji);
            return { paragraphIndex: c.paragraph_index, topicId: topic?.id || null, topicName: c.topic_name, reasoning: c.reasoning || '' };
          }).filter(c => c.topicId);
          if (classifications.length > 0) {
            assignedTopicId = classifications[0].topicId;
          }
        }
      }
      // 分類失敗時 fallback
      if (classifications.length === 0) {
        const defaultTopic = getOrCreateTopic('雜項', '📌');
        assignedTopicId = defaultTopic?.id || null;
        classifications = paragraphs.map((p, i) => ({ paragraphIndex: i, topicId: assignedTopicId, topicName: '雜項', reasoning: '' }));
      }
      saveTopics();
    }

    // 更新 user message 的 topicId
    if (assignedTopicId) {
      conversations = conversations.map(c => c.id === convId ? {
        ...c,
        messages: c.messages.map(m => m.id === userMsg.id ? { ...m, topicId: assignedTopicId } : m)
      } : c);
    }

    // PHASE 2: 生成回應
    const prompt = writingMode ? WRITING_SYSTEM_PROMPT : LILITH_SYSTEM_PROMPT;
    const apiMessages = [{ role: 'system', content: prompt }];

    // 加入分類脈絡
    if (classifications.length > 0) {
      const classContext = '使用者本次傳送的內容（共 ' + paragraphs.length + ' 段）分類結果：\n' +
        classifications.map(c => '  - 段落 ' + (c.paragraphIndex + 1) + ' → 主題「' + c.topicName + '」' + (c.reasoning ? '（' + c.reasoning + '）' : '')).join('\n') +
        '\n請根據以上分類生成回應，自然地涵蓋所有段落的內容。';
      apiMessages.push({ role: 'system', content: classContext });
    }

    // 加入對話歷史
    conv.messages.forEach(m => {
      apiMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    });

    // 外部上下文注入（URL 讀取、搜尋）
    let injectedContext = '';
    const contextPromises = [];
    const urlMatch = content.match(/https?:\/\/[^\s]+/);
    if (urlMatch) { const url = urlMatch[0]; contextPromises.push(readUrl(url).then(md => '[以下是來自 ' + url + ' 的網頁內容]\n' + md + '\n---').catch(e => '(嘗試讀取網頁 ' + url + ' 時發生錯誤：' + e.message + ')')); }
    const searchMatch = content.match(/^(幫我查|搜尋|查一下|查|search)\s+(.+)/i);
    if (searchMatch) { const query = searchMatch[2]; contextPromises.push(firecrawlSearch(query).then(results => '[以下是關於「' + query + '」的網路搜尋結果]\n' + formatSearchResults(results) + '\n---').catch(e => '(嘗試搜尋「' + query + '」時發生錯誤：' + e.message + ')')); }
    if (contextPromises.length > 0) {
      const results = await Promise.all(contextPromises);
      injectedContext = results.join('\n') + '\n請根據以上內容來回應使用者。';
      apiMessages.splice(1, 0, { role: 'system', content: injectedContext });
    }

    const resp = await fetch(baseUrl + '/chat/completions', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: apiMessages, temperature: 0.8, max_tokens: 2048, stream: false })
    });
    if (!resp.ok) { const errText = await resp.text().catch(() => ''); throw new Error('API 錯誤 (' + resp.status + '): ' + errText.slice(0, 100)); }
    const data = await resp.json();
    let fullReply = data.choices?.[0]?.message?.content || '';
    if (!fullReply) throw new Error('API 回傳空內容');
    const cleanedReply = fixSelfReference(fullReply);

    conversations = conversations.map(c => c.id === convId ? { ...c, messages: [...c.messages, { id: Date.now().toString() + 1, role: 'assistant', content: cleanedReply }], updatedAt: new Date().toISOString() } : c);
  } catch (e) {
    isTyping = false;
    const errMsg = '喂…笨蛋老闆，好像出錯了（' + e.message + '）。要不要檢查一下 API Key 或網路連線？';
    conversations = conversations.map(c => c.id === convId ? { ...c, messages: [...c.messages, { id: Date.now().toString() + 1, role: 'assistant', content: errMsg }], updatedAt: new Date().toISOString() } : c);
  } finally {
    isTyping = false; isSending = false;
    // 從「全部訊息」發送 → 保持在全部訊息檢視，不跳轉到單一對話
    if (wasWelcome) activeId = null;
    saveData(); saveTopics(); renderSidebar();
    if (wasWelcome || !getActiveConv()) renderMain(); else updateInputBarOnly();
    requestAnimationFrame(() => { const ta = document.getElementById('chatInput'); if (ta) { ta.focus(); const len = ta.value.length; ta.setSelectionRange(len, len); } });
    pushToGAS();
  }
}

function selectConversation(id) {
  activeId = id; window._inputValue = '';
  renderSidebar(); renderMain();
  requestAnimationFrame(() => { const ta = document.getElementById('chatInput'); if (ta) ta.focus(); });
}

function newConversation() {
  currentView = 'home'; currentTopicId = null;
  activeId = null; window._inputValue = '';
  renderSidebar(); renderMain();
  requestAnimationFrame(() => { const ta = document.getElementById('chatInput'); if (ta) ta.focus(); });
  if (window.innerWidth < 768 && sidebarOpen) closeSidebarMobile();
}

function deleteConversation(id, e) {
  e.stopPropagation();
  conversations = conversations.map(c => c.id === id ? { ...c, deleted: true, updatedAt: new Date().toISOString() } : c);
  if (activeId === id) activeId = null;
  saveData(); renderSidebar(); renderMain(); pushToGAS();
}

let renaming = false;

function startRename() {
  if (renaming) return;
  renaming = true;
  const titleEl = document.querySelector('.chat-title');
  if (!titleEl) return;
  const current = titleEl.textContent;
  titleEl.innerHTML = '<input type="text" id="renameInput" class="conv-rename-input" value="' + escapeHtml(current) + '" />';
  const input = document.getElementById('renameInput');
  requestAnimationFrame(() => { input.focus(); input.select(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finishRename(input.value); if (e.key === 'Escape') cancelRename(); });
  input.addEventListener('blur', () => finishRename(input.value));
}

function finishRename(newTitle) {
  renaming = false;
  newTitle = newTitle.trim();
  const conv = getActiveConv();
  if (conv && newTitle && newTitle !== conv.title) {
    conv.title = newTitle; conv.updatedAt = new Date().toISOString();
    saveData(); renderSidebar(); pushToGAS();
    const titleEl = document.querySelector('.chat-title');
    if (titleEl) titleEl.textContent = newTitle;
  } else { cancelRename(); }
}

function cancelRename() {
  renaming = false;
  const conv = getActiveConv();
  const titleEl = document.querySelector('.chat-title');
  if (titleEl && conv) titleEl.textContent = conv.title;
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  sidebar.className = 'sidebar ' + (sidebarOpen ? 'open' : 'closed');
  toggleBtn.className = 'toggle-btn ' + (sidebarOpen ? 'open' : 'closed');
  toggleBtn.innerHTML = sidebarOpen ? icons.chevronLeft : icons.chevronRight;
  const backdrop = document.getElementById('sidebarBackdrop');
  if (backdrop) backdrop.className = 'sidebar-backdrop' + (sidebarOpen ? ' open' : '');
}

function closeSidebarMobile() {
  if (window.innerWidth < 768 && sidebarOpen) {
    toggleSidebar();
  }
}

const SYNC_INTERVAL_MS = 30000; // 30 秒
let syncTimerId = null;

function startPeriodicSync() {
  stopPeriodicSync();
  if (!gasUrl && !isGAS()) return;
  syncTimerId = setInterval(() => {
    // 只在頁面可見時拉取，避免背景浪費流量
    if (!document.hidden) pullFromGAS();
  }, SYNC_INTERVAL_MS);
}

function stopPeriodicSync() {
  if (syncTimerId) { clearInterval(syncTimerId); syncTimerId = null; }
}

let isLight = localStorage.getItem('lilith-theme') === 'light';

function applyTheme() {
  document.body.classList.toggle('light', isLight);
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (isLight) {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    label.textContent = '黑暗';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    label.textContent = '白天';
  }
  localStorage.setItem('lilith-theme', isLight ? 'light' : 'dark');
}

function toggleTheme() { isLight = !isLight; applyTheme(); }

// ═══════════════════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════════════════

loadData();
applyTheme();

// ── PWA：註冊 Service Worker ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ── PWA：處理從其他 App 分享進來的內容 ──
(function handleSharedContent() {
  const params = new URLSearchParams(location.search);
  if (params.get('shared') === '1') {
    const sharedUrl = params.get('url') || '';
    const sharedText = params.get('text') || '';
    const sharedTitle = params.get('title') || '';
    // 組合分享內容
    let input = '';
    if (sharedUrl && sharedText && sharedText !== sharedUrl) {
      input = sharedTitle
        ? `幫我看這篇文章：${sharedTitle}\n${sharedUrl}\n\n${sharedText}`
        : `幫我看這個連結：${sharedUrl}\n\n${sharedText}`;
    } else if (sharedUrl) {
      input = `幫我看這篇文章：${sharedUrl}`;
    } else if (sharedText) {
      input = `幫我處理這段內容：${sharedText}`;
    }
    if (input) {
      window._inputValue = input;
      // 清除網址參數，避免重整後重複處理
      history.replaceState(null, '', location.pathname);
    }
  }
})();

const searchInput = document.getElementById('searchInput');
if (searchInput) searchInput.addEventListener('input', (e) => filterConversations(e.target.value));

const imgInput = document.createElement('input');
imgInput.type = 'file';
imgInput.accept = 'image/*';
imgInput.id = 'imageUploadInput';
imgInput.style.display = 'none';
imgInput.addEventListener('change', handleImageSelect);
document.body.appendChild(imgInput);

renderSidebar();
renderMain();

// 手機版：初始關閉 sidebar
if (window.innerWidth < 768) {
  sidebarOpen = false;
  sidebar.className = 'sidebar closed';
  toggleBtn.className = 'toggle-btn closed';
  toggleBtn.innerHTML = icons.chevronRight;
  const backdrop = document.getElementById('sidebarBackdrop');
  if (backdrop) backdrop.className = 'sidebar-backdrop';
}
