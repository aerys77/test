// ═══════════════════════════════════════════════════════
// 莉莉絲 (Lilith) — 人設定義
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

## 情緒標記（重要）
妳必須在每則回應的最開頭加上一個情緒標籤，用以改變立繪。
可用標籤：[害羞]、[生氣]、[難過]、[驚訝]
例如：「[生氣] 喂，你又把行程排這麼滿，是想累死誰啊？」

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

第1步 — 世界觀設定
問使用者：時代背景（古代/現代/未來/架空）、世界特色、核心規則。
如果使用者已有想法，記錄下來；如果沒有，提供 2-3 個範例選項。

第2步 — 角色設定
引導建立主角：姓名、性格、背景故事、目標。
再問是否需要配角或反派。

第3步 — 故事大綱
根據世界觀與角色，提議 3-5 章的架構。
每章給一行簡介，問使用者是否滿意或要修改。

第4步 — 逐章生成
一次生成一章（300-500 字），結束時問：
「要繼續下一章、修改這章、還是先到這裡？」

第5步 — 儲存與匯出
每章結束後自動累積，當使用者說「完成了」時，
提醒可以按下方的「下載故事」按鈕存成 .md 檔。

## ⚠️ 絕對規則
- **禁止使用自己的名字自稱**：一律使用「我」。
- 每一步先問使用者輸入，等回應後再繼續，不要一次全部做完。
- 保持傲嬌語氣，例如「這設定還可以啦⋯⋯雖然我覺得有點老套」。

## 情緒標記（重要）
妳必須在每則回應的最開頭加上一個情緒標籤，用以改變立繪。
可用標籤：[害羞]、[生氣]、[難過]、[驚訝]
例如：「[驚訝] 喔？這次的點子還不錯嘛。」

## 說話風格（繁體中文）
- 稱呼使用者為：「笨蛋老闆」、「喂」、「你」。
- 語調：直率、傲嬌，但對創作認真。
- 避免使用 AI 的機械感。`;

// ═══════════════════════════════════════════════════════
// 情緒立繪映射
// ═══════════════════════════════════════════════════════

const EMOTION_MAP = {
  '害羞': './images/豆花妹害羞.png',
  '生氣': './images/莉莉絲_生氣.png',
  '難過': './images/莉莉絲_難過.png',
  '驚訝': './images/莉莉絲_驚訝.png',
  'default': './images/ChatGPT Image 2026年6月19日 上午01_15_56.png'
};

// ═══════════════════════════════════════════════════════
// 資料與狀態
// ═══════════════════════════════════════════════════════

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
let searchQuery = '';
let pendingImage = null; // { dataUrl, fileName } 或 null

// Settings
let apiKey = '';
let baseUrl = 'https://apihub.agnes-ai.com/v1';
let model = 'agnes-2.0-flash';
let gasUrl = ''; // GAS Web App URL（雲端同步）

// ── DOM refs ──
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleBtn');
const convList = document.getElementById('convList');
const mainContent = document.getElementById('mainContent');
const portraitContainer = document.getElementById('portraitContainer');

// ═══════════════════════════════════════════════════════
// SVG 圖標
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
// 圖片上傳
// ═══════════════════════════════════════════════════════

function triggerImageUpload() {
  document.getElementById('imageUploadInput').click();
}

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingImage = { dataUrl: ev.target.result, fileName: file.name };
    renderMain();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function removeImage() {
  pendingImage = null;
  renderMain();
}

// ═══════════════════════════════════════════════════════
// 輔助函式
// ═══════════════════════════════════════════════════════

function getActiveConv() {
  return conversations.find(c => c.id === activeId) || null;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function fixSelfReference(text) {
  return text.replace(/莉莉絲/g, '我');
}

function processHtmlCodeBlocks(text) {
  // 將 ```html / ``` / ```svg 等程式碼區塊的圍柵拆掉
  // 條件：內容看起來像 HTML（開頭是 <），拆掉圍柵後讓 marked 當 inline HTML 渲染
  return text.replace(/```(?:html|css|svg)?\s*\n?([\s\S]*?)```/g, (match, codeContent) => {
    const trimmed = codeContent.trim();
    if (!trimmed || !/^\s*</.test(trimmed)) return match; // 不是 HTML 就略過
    return trimmed;
  });
}

function updatePortrait(text) {
  const match = text.match(/^\[(害羞|生氣|難過|驚訝)\]/);
  if (match) {
    const emotion = match[1];
    const imgPath = EMOTION_MAP[emotion] || EMOTION_MAP['default'];
    document.getElementById('portraitImg').src = imgPath;
  }
}

function scrollToBottom(force = false) {
  const area = document.getElementById('messagesArea');
  if (!area) return;
  // 只在距離底部 150px 以內（或強制）時才自動捲動
  const distFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
  if (force || distFromBottom < 150) {
    area.scrollTop = area.scrollHeight;
  }
}

function renderContent(text) {
  let html = '';
  const parts = text.split(/(```[\s\S]*?```|\*\*[\s\S]*?\*\*)/g);
  parts.forEach(part => {
    if (part.startsWith('```') && part.endsWith('```')) {
      let code = part.slice(3, -3);
      code = code.replace(/^\w+\n/, '');
      html += '<pre><code>' + escapeHtml(code) + '</code></pre>';
    } else if (part.startsWith('**') && part.endsWith('**')) {
      html += '<strong>' + escapeHtml(part.slice(2, -2)) + '</strong>';
    } else {
      html += escapeHtml(part);
    }
  });
  return html;
}

// ═══════════════════════════════════════════════════════
// 儲存 / 載入
// ═══════════════════════════════════════════════════════

// 內嵌記憶庫備份（莉莉絲記憶備份_2026-06-21T07-22-09.json）
const EMBEDDED_MEMORY_BACKUP = {
  "exportedAt": "2026-06-21T07:22:09.790Z",
  "version": 2,
  "stats": { "totalCards": 0, "lastCompiled": "" },
  "cards": {}
};

function saveData() {
  localStorage.setItem('lilith_chat_data', JSON.stringify({
    conversations, activeId, writingMode,
    apiKey, baseUrl, model, gasUrl
  }));
}

function loadData() {
  const saved = localStorage.getItem('lilith_chat_data');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      conversations = data.conversations || [];
      activeId = data.activeId || null;
      writingMode = data.writingMode || false;
      apiKey = data.apiKey || '';
      baseUrl = data.baseUrl || 'https://apihub.agnes-ai.com/v1';
      model = data.model || 'agnes-2.0-flash';
      gasUrl = data.gasUrl || '';
    } catch (e) {
      console.warn('資料載入失敗', e);
    }
  }
}

// ── 雲端同步（v2：推原始對話到 GAS）──

const MAX_CONVERSATIONS = 50;       // 保留上限
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 分鐘

function pushUnsyncedConversations() {
  const unsynced = conversations.filter(c => !c.synced);
  if (unsynced.length === 0 || !gasUrl) return Promise.resolve(0);

  const today = new Date().toISOString().slice(0, 10);

  return fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: today,
      conversations: unsynced.map(c => ({
        id: c.id,
        title: c.title,
        messages: c.messages
      }))
    })
  })
  .then(r => r.json())
  .then(res => {
    if (res.ok) {
      conversations = conversations.map(c =>
        unsynced.find(u => u.id === c.id) ? { ...c, synced: true } : c
      );
      saveData();
      cleanupOldConversations();
      return unsynced.length;
    }
    return 0;
  })
  .catch(() => 0);
}

function syncMemoryNow() {
  const statusEl = document.getElementById('syncStatus');
  if (statusEl) statusEl.textContent = '⏳ 上傳中…';

  pushUnsyncedConversations().then(count => {
    if (statusEl) {
      if (count > 0) {
        statusEl.textContent = `✓ 已上傳 ${count} 則對話`;
      } else {
        statusEl.textContent = '✓ 無新對話需上傳';
      }
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
    }
  });
}

function cleanupOldConversations() {
  if (conversations.length <= MAX_CONVERSATIONS) return;
  const synced = conversations.filter(c => c.synced);
  const toRemove = conversations.length - MAX_CONVERSATIONS;
  if (toRemove <= 0) return;

  // 從最舊的已同步對話開始刪
  const syncedIds = new Set(
    synced.slice(0, Math.min(toRemove, synced.length)).map(c => c.id)
  );
  conversations = conversations.filter(c => !syncedIds.has(c.id));
  saveData();
}

function startPolling() {
  setInterval(() => {
    if (gasUrl && document.visibilityState === 'visible') {
      pushUnsyncedConversations();
    }
  }, SYNC_INTERVAL);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && gasUrl) {
    pushUnsyncedConversations();
  }
});

// ═══════════════════════════════════════════════════════
// 設定面板
// ═══════════════════════════════════════════════════════

function openSettings() {
  document.getElementById('apiKeyInput').value = apiKey;
  document.getElementById('modelSelect').value = model;
  document.getElementById('baseUrlInput').value = baseUrl;
  document.getElementById('writingModeToggle').checked = writingMode;
  document.getElementById('gasUrlInput').value = gasUrl;
  document.getElementById('settingsOverlay').classList.add('open');
  updateModeBadge();
}

function closeSettings(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('settingsOverlay').classList.remove('open');
}

function updateModeBadge() {
  const badge = document.getElementById('modeBadge');
  if (writingMode) {
    badge.className = 'mode-badge writing';
    badge.textContent = '寫作模式';
  } else {
    badge.className = 'mode-badge normal';
    badge.textContent = '一般模式';
  }
}

function toggleWritingMode() {
  writingMode = document.getElementById('writingModeToggle').checked;
  updateModeBadge();
}

function saveSettings() {
  apiKey = document.getElementById('apiKeyInput').value.trim();
  model = document.getElementById('modelSelect').value;
  baseUrl = document.getElementById('baseUrlInput').value.trim().replace(/\/+$/, '');
  writingMode = document.getElementById('writingModeToggle').checked;
  gasUrl = document.getElementById('gasUrlInput').value.trim();
  saveData();
  const status = document.getElementById('settingsStatus');
  status.textContent = '✓ 設定已儲存';
  setTimeout(() => { status.textContent = ''; }, 2000);
}

// ═══════════════════════════════════════════════════════
// 匯入對話
// ═══════════════════════════════════════════════════════

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
    document.getElementById('importError').textContent = `✓ 已載入：${file.name}`;
    document.getElementById('importError').style.color = '#81c995';
  };
  reader.readAsText(file, 'UTF-8');
  // 重置 input 讓可重複選同一檔案
  event.target.value = '';
}

function closeImport(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('importOverlay').classList.remove('open');
}

function doImport() {
  const raw = document.getElementById('importTextarea').value.trim();
  const errorEl = document.getElementById('importError');
  errorEl.style.color = ''; // 重設顏色

  if (!raw) {
    errorEl.textContent = '請先貼上 JSON 內容或選擇檔案';
    return;
  }

  try {
    const data = JSON.parse(raw);

    // 支援兩種格式：完整 lilith_pro_state 或直接對話陣列
    let importedChats = [];
    if (data.chats && Array.isArray(data.chats)) {
      importedChats = data.chats;
    } else if (Array.isArray(data)) {
      importedChats = data;
    } else if (data.messages) {
      importedChats = [{ id: Date.now().toString(), title: '匯入的對話', messages: data.messages, date: '今天' }];
    } else {
      errorEl.textContent = '無法識別 JSON 格式。請確認是 lilith_pro_state 或對話陣列。';
      return;
    }

    // 合併到現有對話中（不覆蓋）
    const existingIds = new Set(conversations.map(c => c.id));
    let importedCount = 0;
    importedChats.forEach(chat => {
      if (!existingIds.has(chat.id) && chat.messages && chat.messages.length > 0) {
        const title = chat.title || chat.messages[0].content.slice(0, 20) || '匯入的對話';
        conversations.push({
          id: chat.id || Date.now().toString() + '_' + Math.random().toString(36).slice(2, 6),
          title: title,
          preview: chat.messages[0].content.slice(0, 50) || '',
          date: chat.date || '歷史',
          synced: false,
          messages: chat.messages
        });
        existingIds.add(chat.id);
        importedCount++;
      }
    });

    if (importedCount === 0) {
      errorEl.textContent = '沒有找到新的對話可匯入（可能已存在或內容為空）。';
      return;
    }

    saveData();
    renderSidebar();
    renderMain();
    document.getElementById('importOverlay').classList.remove('open');
  } catch (e) {
    errorEl.textContent = 'JSON 解析失敗：' + e.message;
  }
}

// ═══════════════════════════════════════════════════════
// 檔案下載
// ═══════════════════════════════════════════════════════

function downloadAsBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadAsMd(content, filename) {
  downloadAsBlob(content, filename, 'text/markdown');
}

function downloadAsJson(data, filename) {
  downloadAsBlob(JSON.stringify(data, null, 2), filename, 'application/json');
}

function downloadMessage(msgId) {
  const conv = getActiveConv();
  if (!conv) return;
  const msg = conv.messages.find(m => m.id === msgId);
  if (!msg) return;
  let content = msg.content;
  if (msg.role === 'assistant') {
    content = content.replace(/^\[(害羞|生氣|難過|驚訝)\]\s*/, '');
  }
  const safeTitle = conv.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_').slice(0, 30);
  downloadAsMd(content, `莉莉絲_${safeTitle}.md`);
}

function downloadConversation() {
  const conv = getActiveConv();
  if (!conv) return;
  const safeTitle = conv.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_').slice(0, 30);
  downloadAsJson(conv, `對話_${safeTitle}.json`);
}

// ═══════════════════════════════════════════════════════
// 側邊欄渲染
// ═══════════════════════════════════════════════════════

function filterConversations(query) {
  searchQuery = query.trim().toLowerCase();
  renderSidebar();
}

function renderSidebar() {
  const filtered = searchQuery
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery) ||
        (c.preview || '').toLowerCase().includes(searchQuery)
      )
    : conversations;
  const grouped = {};
  filtered.forEach(c => {
    if (!grouped[c.date]) grouped[c.date] = [];
    grouped[c.date].push(c);
  });

  let html = '';
  for (const [date, convs] of Object.entries(grouped)) {
    html += `<p class="conv-date">${escapeHtml(date)}</p>`;
    html += '<div style="margin-bottom:2px">';
    convs.forEach(conv => {
      const isActive = conv.id === activeId;
      let cls = 'btn-conv';
      if (isActive) cls += ' btn-conv-active';
      html += `<div class="conv-item">
        <button class="${cls}" onclick="selectConversation('${conv.id}')">
          <span class="btn-conv-title">${escapeHtml(conv.title)}</span>
          <span class="btn-conv-preview">${escapeHtml(conv.preview)}</span>
        </button>
        <button class="btn-delete-conv" onclick="deleteConversation('${conv.id}', event)" title="刪除對話">
          ${icons.trash}
        </button>
      </div>`;
    });
    html += '</div>';
  }
  if (!html) {
    const msg = searchQuery ? '無符合的對話' : '尚無對話';
    convList.innerHTML = `<div style="padding:20px;text-align:center;color:#5f6368;font-size:13px">${msg}</div>`;
  } else {
    convList.innerHTML = html;
  }
}

// ═══════════════════════════════════════════════════════
// 主畫面渲染
// ═══════════════════════════════════════════════════════

function renderMain() {
  const conv = getActiveConv();

  // 立繪顯示控制
  if (conv) {
    portraitContainer.style.display = 'flex';
  } else {
    portraitContainer.style.display = 'none';
  }

  if (!conv) {
    let suggestionsHtml = '';
    suggestions.forEach(s => {
      suggestionsHtml += `<button class="btn-suggest" onclick="setInput('${escapeHtml(s.prompt)}')">
        <span class="suggest-icon">${icons[s.icon]}</span>
        ${escapeHtml(s.label)}
      </button>`;
    });

    mainContent.innerHTML = `
      <div class="welcome">
        <div class="welcome-icon">${icons.sparklesBig}</div>
        <h1>您好，我是莉莉絲</h1>
        <p>笨蛋老闆，今天有什麼事需要我幫忙嗎？</p>
        <div class="welcome-persona">
          — 您的傲嬌專屬助理 · 嘴上嫌棄但最可靠的夥伴 —
        </div>
        <div class="suggestions">${suggestionsHtml}</div>
        <button class="welcome-import-btn" onclick="openImport()">
          ${icons.importIcon} 匯入對話紀錄
        </button>
      </div>
      ${renderInputBar()}
    `;
    return;
  }

  let messagesHtml = '';
  conv.messages.forEach(msg => {
    if (msg.role === 'user') {
      // 支援多模態（陣列格式）與純文字
      let textContent = msg.content;
      let imageHtml = '';
      if (Array.isArray(msg.content)) {
        const textPart = msg.content.find(p => p.type === 'text');
        textContent = textPart ? textPart.text : '';
        const imagePart = msg.content.find(p => p.type === 'image_url');
        if (imagePart) {
          imageHtml = `<img class="msg-image" src="${imagePart.image_url.url}" alt="user image" />`;
        }
      }
      messagesHtml += `
        <div class="msg-row msg-row-user">
          <div class="msg-bubble msg-bubble-user">
            ${imageHtml}
            ${textContent ? `<div class="msg-text-user">${escapeHtml(textContent)}</div>` : ''}
          </div>
        </div>`;
    } else {
      // 移除情緒標籤後顯示（使用 marked 渲染 Markdown）
      let displayContent = msg.content;
      if (displayContent) {
        displayContent = displayContent.replace(/^\[(害羞|生氣|難過|驚訝)\]\s*/, '');
        displayContent = fixSelfReference(displayContent);
      }
      const mdHtml = marked.parse(displayContent || '', { breaks: true });
      messagesHtml += `
        <div class="msg-row msg-row-ai">
          <div class="msg-bubble msg-bubble-ai">
            <div class="msg-text-ai">${mdHtml}</div>
            <button class="btn-dl-msg" onclick="downloadMessage('${msg.id}')" title="下載此回覆">${icons.download}</button>
          </div>
        </div>`;
    }
  });

  if (isTyping) {
    messagesHtml += `
      <div class="typing-row">
        <div class="typing-dots">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>`;
  }

  mainContent.innerHTML = `
    <div class="chat-header">
      <h2 class="chat-title" ondblclick="startRename()">${escapeHtml(conv.title)}</h2>
      <div class="chat-header-btns">
        <button class="btn-more" onclick="syncMemoryNow()" title="推送上雲端">${icons.cloudUpload}</button>
        <button class="btn-more" onclick="openImport()" title="匯入對話">${icons.importIcon}</button>
        <button class="btn-more" onclick="downloadConversation()" title="下載對話">${icons.download}</button>
      </div>
    </div>
    <div class="messages-area" id="messagesArea">
      <div class="space-y-6">${messagesHtml}</div>
      <div id="scrollAnchor"></div>
    </div>
    ${renderInputBar()}
  `;

  requestAnimationFrame(() => {
    const anchor = document.getElementById('scrollAnchor');
    if (anchor) anchor.scrollIntoView({ block: 'end' });
  });
}

// ═══════════════════════════════════════════════════════
// 輸入列
// ═══════════════════════════════════════════════════════

function renderInputBar() {
  const inputVal = window._inputValue || '';
  const hasText = inputVal.trim().length > 0;
  const canSend = hasText || !!pendingImage;
  let previewHtml = '';
  if (pendingImage) {
    previewHtml = `
      <div class="img-preview-bar">
        <div class="img-preview-item">
          <img class="img-preview-thumb" src="${pendingImage.dataUrl}" alt="preview" />
          <span class="img-preview-name">${escapeHtml(pendingImage.fileName)}</span>
          <button class="img-preview-remove" onclick="removeImage()" title="移除圖片">&times;</button>
        </div>
      </div>`;
  }
  return `
    <div class="input-wrap">
      <div class="input-container">
        ${previewHtml}
        <textarea id="chatInput" class="input-textarea" rows="1" placeholder="輸入訊息..."
          oninput="onInputChange(this)"
          onkeydown="onInputKeydown(event)"
        >${escapeHtml(inputVal)}</textarea>
        <div class="input-toolbar">
          <div class="input-toolbar-left">
            <button class="btn-toolbar" onclick="triggerImageUpload()" title="上傳圖片">${icons.image}</button>
            <button class="btn-toolbar">${icons.messageSquare}</button>
          </div>
          <div class="input-toolbar-right">
            <button id="sendBtn" class="btn-send ${canSend ? 'active' : 'inactive'}" ${canSend ? '' : 'disabled'} onclick="sendMessage()">
              ${icons.send}
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function onInputChange(textarea) {
  window._inputValue = textarea.value;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    const hasText = textarea.value.trim().length > 0;
    const canSend = hasText || !!pendingImage;
    sendBtn.disabled = !canSend || isSending;
    sendBtn.className = 'btn-send ' + (canSend && !isSending ? 'active' : 'inactive');
  }
}

function onInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function setInput(val) {
  window._inputValue = val;
  renderMain();
  requestAnimationFrame(() => {
    const textarea = document.getElementById('chatInput');
    if (textarea) {
      textarea.value = val;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
      textarea.focus();
      const sendBtn = document.getElementById('sendBtn');
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.className = 'btn-send active';
      }
    }
  });
}

// ═══════════════════════════════════════════════════════
// 外部服務：URL 閱讀 + 網路搜尋
// ═══════════════════════════════════════════════════════

async function readUrl(url) {
  const resp = await fetch(`https://r.jina.ai/${url}`, {
    headers: { 'Accept': 'text/markdown' }
  });
  if (!resp.ok) throw new Error(`Jina AI Reader 錯誤 (${resp.status})`);
  const text = await resp.text();
  return text.slice(0, 8000);
}

async function firecrawlSearch(query) {
  const resp = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 5 })
  });
  if (!resp.ok) throw new Error(`Firecrawl 錯誤 (${resp.status})`);
  const data = await resp.json();
  return data.data || [];
}

function formatSearchResults(results) {
  if (!results || results.length === 0) return '（無搜尋結果）';
  return results.map((r, i) =>
    `${i + 1}. ${r.title || '無標題'}\n   ${r.description || ''}\n   ${r.url || ''}`
  ).join('\n\n');
}

// ═══════════════════════════════════════════════════════
// 發送訊息（含 Agnes AI API 串接 + Streaming）
// ═══════════════════════════════════════════════════════

async function sendMessage() {
  const textarea = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  if (!textarea) return;
  const content = textarea.value.trim();
  if ((!content && !pendingImage) || isSending) return;

  if (!apiKey) {
    openSettings();
    return;
  }

  const userContent = pendingImage
    ? [{ type: 'text', text: content || ' ' }, { type: 'image_url', image_url: { url: pendingImage.dataUrl } }]
    : content;
  const userMsg = { id: Date.now().toString(), role: 'user', content: userContent };

  const userText = pendingImage ? (content || '📷 圖片') : content;
  let convId = activeId;

  if (!convId) {
    const newConv = {
      id: Date.now().toString(),
      title: userText.slice(0, 30) + (userText.length > 30 ? '...' : ''),
      preview: userText.slice(0, 50),
      date: '今天',
      synced: false,
      messages: [userMsg]
    };
    conversations.unshift(newConv);
    activeId = newConv.id;
    convId = newConv.id;
  } else {
    conversations = conversations.map(c =>
      c.id === convId ? { ...c, messages: [...c.messages, userMsg], synced: false } : c
    );
  }

  window._inputValue = '';
  pendingImage = null;
  isTyping = true;
  isSending = true;
  sendBtn.disabled = true;
  renderSidebar();
  renderMain();
  // 立即重新聚焦，不等 API 完成
  requestAnimationFrame(() => {
    const ta = document.getElementById('chatInput');
    if (ta) ta.focus();
  });

  try {
    const prompt = writingMode ? WRITING_SYSTEM_PROMPT : LILITH_SYSTEM_PROMPT;

    const conv = getActiveConv();
    const apiMessages = [
      { role: 'system', content: prompt },
      ...conv.messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ];

    // ── 意圖偵測：URL 閱讀（優先）──
    let injectedContext = '';
    const urlRegex = /https?:\/\/[^\s]+/;
    const urlMatch = content.match(urlRegex);
    if (urlMatch) {
      try {
        const url = urlMatch[0];
        const markdown = await readUrl(url);
        injectedContext = `[以下是來自 ${url} 的網頁內容]\n${markdown}\n---\n請根據以上網頁內容來回應使用者。`;
      } catch (e) {
        injectedContext = `（嘗試讀取網頁 ${urlMatch[0]} 時發生錯誤：${e.message}）`;
      }
    }

    // ── 意圖偵測：網路搜尋（僅在無 URL 時觸發）──
    if (!injectedContext) {
      const searchMatch = content.match(/^(幫我查|搜尋|查一下|查|search)\s+(.+)/i);
      if (searchMatch) {
        const query = searchMatch[2];
        try {
          const results = await firecrawlSearch(query);
          const formatted = formatSearchResults(results);
          injectedContext = `[以下是關於「${query}」的網路搜尋結果]\n${formatted}\n---\n請根據以上搜尋結果來回答使用者。`;
        } catch (e) {
          injectedContext = `（嘗試搜尋「${query}」時發生錯誤：${e.message}）`;
        }
      }
    }

    if (injectedContext) {
      apiMessages.splice(1, 0, { role: 'system', content: injectedContext });
    }

    // Phase 1: 非串流取得完整回覆（先不使用 tool calling 簡化流程）
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 2048,
        stream: true
      })
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`API 錯誤 (${resp.status}): ${errText.slice(0, 100)}`);
    }

    // Phase 2: 串流讀取
    removeTypingIndicator();
    const bubble = createEmptyMessageBubble();
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = '';
    let emotionProcessed = false;
    let buffer = '';
    let needsUpdate = false;

    const updateDOM = () => {
      if (!needsUpdate) return;
      let displayContent = fullReply;
      if (emotionProcessed) {
        displayContent = displayContent.replace(/^\[(害羞|生氣|難過|驚訝)\]\s*/, '');
      }
      displayContent = fixSelfReference(displayContent);
      bubble.innerHTML = marked.parse(displayContent, { breaks: true });
      // 串流時平滑跟隨文字往下
      bubble.closest('.msg-row')?.scrollIntoView({ block: 'end' });
      needsUpdate = false;
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            const deltaContent = data.choices[0].delta.content || '';
            fullReply += deltaContent;

            if (!emotionProcessed) {
              const emotionMatch = fullReply.match(/^\[(害羞|生氣|難過|驚訝)\]/);
              if (emotionMatch) {
                updatePortrait(fullReply);
                emotionProcessed = true;
              } else if (fullReply.length > 10) {
                emotionProcessed = true;
              }
            }
            needsUpdate = true;
            requestAnimationFrame(updateDOM);
          } catch (e) {
            // 略過解析中的部分 chunk
          }
        }
      }
    }

    // 儲存完整回覆
    const cleanedReply = fixSelfReference(fullReply);
    conversations = conversations.map(c =>
      c.id === convId ? { ...c, messages: [...c.messages, { id: Date.now().toString() + 1, role: 'assistant', content: cleanedReply }] } : c
    );

  } catch (e) {
    removeTypingIndicator();
    const errMsg = `[害羞] 唔…笨蛋老闆，好像出錯了（${e.message}）。要不要檢查一下 API Key 或網路連線？`;
    conversations = conversations.map(c =>
      c.id === convId ? { ...c, messages: [...c.messages, { id: Date.now().toString() + 1, role: 'assistant', content: errMsg }] } : c
    );
  } finally {
    isTyping = false;
    isSending = false;
    saveData();
    renderSidebar();
    renderMain();
    // 重新聚焦輸入框，游標保持在文字尾端
    requestAnimationFrame(() => {
      const ta = document.getElementById('chatInput');
      if (ta) {
        ta.focus();
        const len = ta.value.length;
        ta.setSelectionRange(len, len);
      }
    });
  }
}

function removeTypingIndicator() {
  const el = document.querySelector('.typing-row');
  if (el) el.remove();
}

function createEmptyMessageBubble() {
  const msgsArea = document.getElementById('messagesArea');
  const space = msgsArea?.querySelector('.space-y-6');
  const div = document.createElement('div');
  div.className = 'msg-row msg-row-ai';
  div.innerHTML = `
    <div class="msg-bubble msg-bubble-ai">
      <div class="msg-text-ai"></div>
    </div>`;
  if (space) space.appendChild(div);
  scrollToBottom();
  return div.querySelector('.msg-text-ai');
}

// ═══════════════════════════════════════════════════════
// 對話管理
// ═══════════════════════════════════════════════════════

function selectConversation(id) {
  activeId = id;
  window._inputValue = '';
  renderSidebar();
  renderMain();
  requestAnimationFrame(() => {
    const textarea = document.getElementById('chatInput');
    if (textarea) textarea.focus();
  });
}

function newConversation() {
  activeId = null;
  window._inputValue = '';
  renderSidebar();
  renderMain();
  requestAnimationFrame(() => {
    const textarea = document.getElementById('chatInput');
    if (textarea) textarea.focus();
  });
}

function deleteConversation(id, e) {
  e.stopPropagation();
  conversations = conversations.filter(c => c.id !== id);
  if (activeId === id) activeId = null;
  saveData();
  renderSidebar();
  renderMain();
}

// ═══════════════════════════════════════════════════════
// 對話重新命名
// ═══════════════════════════════════════════════════════

let renaming = false;

function startRename() {
  if (renaming) return;
  renaming = true;
  const titleEl = document.querySelector('.chat-title');
  if (!titleEl) return;
  const current = titleEl.textContent;
  titleEl.innerHTML = `<input type="text" id="renameInput" class="conv-rename-input" value="${escapeHtml(current)}" />`;
  const input = document.getElementById('renameInput');
  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finishRename(input.value);
    if (e.key === 'Escape') cancelRename();
  });
  input.addEventListener('blur', () => finishRename(input.value));
}

function finishRename(newTitle) {
  renaming = false;
  newTitle = newTitle.trim();
  const conv = getActiveConv();
  if (conv && newTitle && newTitle !== conv.title) {
    conv.title = newTitle;
    saveData();
    renderSidebar();
    const titleEl = document.querySelector('.chat-title');
    if (titleEl) titleEl.textContent = newTitle;
  } else {
    cancelRename();
  }
}

function cancelRename() {
  renaming = false;
  const conv = getActiveConv();
  const titleEl = document.querySelector('.chat-title');
  if (titleEl && conv) titleEl.textContent = conv.title;
}

// ═══════════════════════════════════════════════════════
// 側邊欄切換
// ═══════════════════════════════════════════════════════

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  sidebar.className = 'sidebar ' + (sidebarOpen ? 'open' : 'closed');
  toggleBtn.className = 'toggle-btn ' + (sidebarOpen ? 'open' : 'closed');
  toggleBtn.innerHTML = sidebarOpen ? icons.chevronLeft : icons.chevronRight;
}

// ═══════════════════════════════════════════════════════
// 主題切換
// ═══════════════════════════════════════════════════════

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

function toggleTheme() {
  isLight = !isLight;
  applyTheme();
}

// ═══════════════════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════════════════

loadData();
startPolling();
applyTheme();

// 綁定搜尋框
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
  searchInput.addEventListener('input', (e) => filterConversations(e.target.value));
}

// 圖片上傳：建立隱藏 file input
const imgInput = document.createElement('input');
imgInput.type = 'file';
imgInput.accept = 'image/*';
imgInput.id = 'imageUploadInput';
imgInput.style.display = 'none';
imgInput.addEventListener('change', handleImageSelect);
document.body.appendChild(imgInput);

renderSidebar();
renderMain();
