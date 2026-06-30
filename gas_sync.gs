/**
 * 莉莉絲 — GAS 雲端同步端（Code.gs）
 *
 * 注意：本檔案需搭配 GAS_Index.html（更名為 Index.html）一起部署。
 *
 * 儲存方式：
 *   - Drive 資料夾「00.Lilith Agent」下，一天一份 YYYY-MM-DD.json
 *   - Google Sheet 自動建立（不需要手動開試算表），含 conversations 分頁供後台編輯
 *   - 使用者編輯 Sheet → onEdit → 自動回寫對應的 Drive 檔案
 *
 * 部署方式（兩個檔案 + Script Properties 設定）：
 *   1. 開新 Google Apps Script 專案（script.google.com → 新專案）
 *   2. 將 gas_sync.gs 內容貼入 Code.gs
 *   3. 建立新 HTML 檔案命名為 Index.html → 貼入 GAS_Index.html 內容
 *   4. 到專案設定 → Script Properties → 新增以下金鑰：
 *      - AGNES_API_KEY → 你的 Agnes AI API Key（必填，否則無法發送訊息）
 *      - AGNES_BASE_URL → https://apihub.agnes-ai.com/v1（選填，預設值）
 *      - AGNES_MODEL → agnes-2.0-flash（選填，預設值）
 *   5. 部署 → 新部署 → 網頁應用程式
 *      - 執行身分：自己
 *      - 誰可以存取：只有自己
 *   6. 直接開啟該部署 URL 即可使用莉莉絲網頁介面（同步 URL 自動偵測，無需手動設定）
 *   7. 首次 POST 會自動在 Drive 建立「00.Lilith Agent」資料夾 +
 *      自動建立專屬試算表（莉莉絲同步試算表）+ 設定分頁
 *
 * GAS 路由邏輯（doGet / doPost）：
 *   GET / → 回傳 Index.html 頁面
 *   GET ?since=... → 回傳增量同步 JSON
 *   POST → 接收前端推送資料並寫入 Drive + Sheet
 *
 * GAS 內部呼叫（google.script.run，無 HTTP 轉向問題）：
 *   handleSyncPush(conversations) → 寫入 Drive + Sheet，回傳 { ok, count, serverNow }
 *   handleSyncPull(since)         → 讀取 Drive，回傳 { conversations, serverNow }
 */

const FOLDER_NAME = '00.Lilith Agent';
const SHEET_NAME  = 'conversations';
const SETTINGS_SHEET_NAME = 'LilithSettings';
const SPREADSHEET_NAME    = '莉莉絲同步試算表';
const HEADERS     = ['id', 'title', 'preview', 'date', 'messages_json', 'updatedAt', 'deleted'];

// ═══════════════════════════════════════════════════════
// GET — 增量下載
// ═══════════════════════════════════════════════════════

function doGet(e) {
  // 有 since 參數 → 回傳增量同步 JSON
  if (e && e.parameter && e.parameter.since !== undefined) {
    return handleSyncGet(e);
  }
  // 無參數 → 回傳 HTML 頁面
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('莉莉絲 — 聊天介面')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function handleSyncGet(e) {
  try {
    // 如果 ?topicssync=1，只回傳 topics
    if (e && e.parameter && e.parameter.topicssync === '1') {
      return jsonResponse(handleSyncPullTopics());
    }

    const since = (e && e.parameter && e.parameter.since) || '';
    const folder = getOrCreateFolder();
    const files = folder.getFiles();

    const dateFiles = [];
    while (files.hasNext()) {
      const f = files.next();
      const name = f.getName();
      if (/^\d{4}-\d{2}-\d{2}\.json$/.test(name)) {
        dateFiles.push({ name, file: f });
      }
    }
    dateFiles.sort((a, b) => a.name.localeCompare(b.name));

    const allConversations = [];
    dateFiles.forEach(({ file }) => {
      try {
        const raw = file.getBlob().getDataAsString();
        const data = JSON.parse(raw);
        const convs = data.conversations || [];
        convs.forEach(conv => {
          if (!since || (conv.updatedAt && conv.updatedAt >= since)) {
            allConversations.push(conv);
          }
        });
      } catch (_) {}
    });

    return jsonResponse({
      conversations: allConversations,
      serverNow: new Date().toISOString()
    });

  } catch (e) {
    return jsonResponse({ error: e.message, conversations: [], serverNow: new Date().toISOString() }, 500);
  }
}

// ═══════════════════════════════════════════════════════
// POST — 前端推入（依 updatedAt 分日期存檔）
// ═══════════════════════════════════════════════════════

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ error: '缺少請求資料', ok: false }, 400);
    }

    const body = JSON.parse(e.postData.contents);
    const incoming = body.conversations || [];
    if (Array.isArray(incoming) && incoming.length > 0) {
      const folder = getOrCreateFolder();
      const sheet  = getOrCreateSheet();

      // 依日期分組
      const byDate = {};
      incoming.forEach(conv => {
        const dateStr = conv.updatedAt
          ? conv.updatedAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        if (!byDate[dateStr]) byDate[dateStr] = [];
        byDate[dateStr].push(conv);
      });

      // 逐日期 UPSERT
      Object.keys(byDate).forEach(dateStr => {
        const fileName = dateStr + '.json';
        const file     = getOrCreateFile(folder, fileName);

        let existing = [];
        try {
          const raw = file.getBlob().getDataAsString();
          existing = JSON.parse(raw).conversations || [];
        } catch (_) {
          existing = [];
        }

        const map = new Map(existing.map(c => [c.id, c]));
        byDate[dateStr].forEach(conv => map.set(conv.id, conv));
        const merged = Array.from(map.values());

        file.setContent(JSON.stringify({ date: dateStr, conversations: merged }, null, 2));
        merged.forEach(conv => upsertSheetRow(sheet, conv));
      });
    }

    // 同時處理 topics（如果有）
    if (Array.isArray(body.topics)) {
      handleSyncPushTopics(body.topics);
    }

    return jsonResponse({
      ok: true,
      count: incoming.length,
      serverNow: new Date().toISOString()
    });

  } catch (e) {
    return jsonResponse({ error: e.message, ok: false }, 500);
  }
}

// ═══════════════════════════════════════════════════════
// google.script.run — 前端透過 GAS 內部通道直接呼叫（無 HTTP 轉向問題）
// ═══════════════════════════════════════════════════════

/**
 * 前端 pushToGAS 呼叫此函式（取代 fetch POST，避免 GAS 302 轉向問題）
 */
function handleSyncPush(conversations) {
  const folder = getOrCreateFolder();
  const sheet  = getOrCreateSheet();

  const byDate = {};
  (conversations || []).forEach(conv => {
    const dateStr = conv.updatedAt
      ? conv.updatedAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(conv);
  });

  Object.keys(byDate).forEach(dateStr => {
    const fileName = dateStr + '.json';
    const file     = getOrCreateFile(folder, fileName);

    let existing = [];
    try {
      const raw = file.getBlob().getDataAsString();
      existing = JSON.parse(raw).conversations || [];
    } catch (_) { existing = []; }

    const map = new Map(existing.map(c => [c.id, c]));
    byDate[dateStr].forEach(conv => map.set(conv.id, conv));
    const merged = Array.from(map.values());

    file.setContent(JSON.stringify({ date: dateStr, conversations: merged }, null, 2));
    merged.forEach(conv => upsertSheetRow(sheet, conv));
  });

  return { ok: true, count: (conversations || []).length, serverNow: new Date().toISOString() };
}

/**
 * 前端 pushToGAS 呼叫此函式，推送 topics 到 Drive 的 topics.json
 */
function handleSyncPushTopics(topics) {
  const folder = getOrCreateFolder();
  const fileName = 'topics.json';
  const file = getOrCreateFile(folder, fileName);
  const payload = { topics: topics || [], updatedAt: new Date().toISOString() };
  file.setContent(JSON.stringify(payload, null, 2));
  return { ok: true, count: (topics || []).length, serverNow: new Date().toISOString() };
}

/**
 * 前端 pullFromGAS 呼叫此函式（取代 fetch GET，確保拿到 JSON 而非 HTML）
 */
function handleSyncPull(since) {
  const folder = getOrCreateFolder();
  const files = folder.getFiles();

  const dateFiles = [];
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    if (/^\d{4}-\d{2}-\d{2}\.json$/.test(name)) {
      dateFiles.push({ name, file: f });
    }
  }
  dateFiles.sort((a, b) => a.name.localeCompare(b.name));

  const allConversations = [];
  dateFiles.forEach(({ file }) => {
    try {
      const raw = file.getBlob().getDataAsString();
      const data = JSON.parse(raw);
      const convs = data.conversations || [];
      convs.forEach(conv => {
        if (!since || (conv.updatedAt && conv.updatedAt >= since)) {
          allConversations.push(conv);
        }
      });
    } catch (_) {}
  });

  return { conversations: allConversations, serverNow: new Date().toISOString() };
}

/**
 * 前端 pullFromGAS 呼叫此函式，從 Drive 的 topics.json 拉取 topics
 */
function handleSyncPullTopics() {
  const folder = getOrCreateFolder();
  const files = folder.getFilesByName('topics.json');
  if (!files.hasNext()) return { topics: [], serverNow: new Date().toISOString() };
  try {
    const raw = files.next().getBlob().getDataAsString();
    const data = JSON.parse(raw);
    return { topics: data.topics || [], serverNow: data.updatedAt || new Date().toISOString() };
  } catch (_) {
    return { topics: [], serverNow: new Date().toISOString() };
  }
}

// ═══════════════════════════════════════════════════════
// onEdit — Sheet 手動編輯 → 回寫對應 Drive 檔案
// ═══════════════════════════════════════════════════════

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== SHEET_NAME) return;
    const row = e.range.getRow();
    if (row === 1) return;

    const data = sheet.getDataRange().getValues();
    const record = data[row - 1];
    if (!record || !record[0]) return;

    let messages = [];
    try {
      const parsed = JSON.parse(String(record[4] || '[]'));
      messages = Array.isArray(parsed) ? parsed : [];
    } catch (_) {}

    const conv = {
      id:       String(record[0]),
      title:    String(record[1] || ''),
      preview:  String(record[2] || ''),
      date:     String(record[3] || ''),
      messages: messages,
      updatedAt: String(record[5] || new Date().toISOString()),
      deleted:  record[6] === true || String(record[6]).toUpperCase() === 'TRUE'
    };

    const dateStr = conv.updatedAt.slice(0, 10);
    const folder  = getOrCreateFolder();
    const file    = getOrCreateFile(folder, dateStr + '.json');

    let fileData;
    try {
      fileData = JSON.parse(file.getBlob().getDataAsString());
    } catch (_) { return; }

    const convs = fileData.conversations || [];
    const idx = convs.findIndex(c => c.id === conv.id);
    if (idx >= 0) {
      convs[idx] = conv;
    } else {
      convs.push(conv);
    }
    fileData.conversations = convs;
    file.setContent(JSON.stringify(fileData, null, 2));

  } catch (_) { /* onEdit 必須靜默失敗 */ }
}

// ═══════════════════════════════════════════════════════
// 輔助函式
// ═══════════════════════════════════════════════════════

function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
}

function getOrCreateFile(folder, fileName) {
  const iter = folder.getFilesByName(fileName);
  if (iter.hasNext()) return iter.next();
  return folder.createFile(fileName, '{}', 'application/json');
}

function getOrCreateSheet() {
  const ss = getOrCreateSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  // 確保設定分頁也存在
  let settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    settingsSheet.getRange('A1').setValue('lastDateProcessed');
  }
  return sheet;
}

function getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('SPREADSHEET_ID');
  if (storedId) {
    try {
      return SpreadsheetApp.openById(storedId);
    } catch (_) { /* 可能被刪除了，重建 */ }
  }

  // 自動建立試算表
  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);

  // 刪除自動產生的 Sheet1
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) ss.deleteSheet(defaultSheet);

  // 建立 conversations 分頁
  const convSheet = ss.insertSheet(SHEET_NAME);
  convSheet.appendRow(HEADERS);
  convSheet.setFrozenRows(1);

  // 建立設定分頁
  const settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
  settingsSheet.getRange('A1').setValue('lastDateProcessed');

  // 儲存 ID 供後續使用
  props.setProperty('SPREADSHEET_ID', ss.getId());

  return ss;
}

function upsertSheetRow(sheet, conv) {
  const data = sheet.getDataRange().getValues();
  const row = [
    conv.id, conv.title || '', conv.preview || '', conv.date || '',
    JSON.stringify(conv.messages || []),
    conv.updatedAt || new Date().toISOString(),
    conv.deleted || false
  ];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === conv.id) {
      sheet.getRange(i + 1, 1, 1, HEADERS.length).setValues([row]);
      return;
    }
  }
  sheet.appendRow(row);
}

// ═══════════════════════════════════════════════════════
// google.script.run — 前端 init 呼叫，取得後端配置
// ═══════════════════════════════════════════════════════

/**
 * 前端 loadData() 呼叫此函式，從 Script Properties 讀取 API Key 等設定。
 *
 * 使用者在 GAS 專案設定 → Script Properties 中設定：
 *   AGNES_API_KEY  → 必填，Agnes AI API Key
 *   AGNES_BASE_URL → 選填，預設 https://apihub.agnes-ai.com/v1
 *   AGNES_MODEL    → 選填，預設 agnes-2.0-flash
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    apiKey:   props.getProperty('AGNES_API_KEY') || '',
    baseUrl:  props.getProperty('AGNES_BASE_URL') || 'https://apihub.agnes-ai.com/v1',
    model:    props.getProperty('AGNES_MODEL') || 'agnes-2.0-flash'
  };
}

function jsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
