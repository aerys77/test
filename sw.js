/* ===== 莉莉絲 PWA — Service Worker ===== */
const CACHE = 'lilith-v1';
const STATIC_ASSETS = [
  'GAS_Index.html',
  'manifest.json',
  'images/pwa-icon.svg'
];

// 安裝：快取靜態資源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      // 使用 addAll 但忽略失敗（GAS_Index.html 已內嵌所有 CSS/JS）
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  // 強制啟用新 SW
  self.skipWaiting();
});

// 啟用：清除舊快取 + 接管所有頁面
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 快取優先 + 網路更新（stale-while-revalidate）
self.addEventListener('fetch', (e) => {
  // 只處理 GET
  if (e.request.method !== 'GET') return;

  // 跳過非 http/https 請求（如 chrome-extension://）
  if (!e.request.url.startsWith('http')) return;

  // API 請求（Agnes AI、GAS、外部資源）不攔截
  const url = new URL(e.request.url);
  if (
    url.hostname.includes('agnes-ai.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('jina.ai') ||
    url.hostname.includes('firecrawl.dev') ||
    url.hostname === 'cdn.jsdelivr.net' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    // 對 CDN 字體和 marked.js 使用快取優先
    if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.gstatic.com') {
      e.respondWith(
        caches.match(e.request).then((cached) => {
          const fetched = fetch(e.request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((cache) => cache.put(e.request, clone));
            }
            return res;
          }).catch(() => cached);
          return cached || fetched;
        })
      );
      return;
    }
    // 其餘外部 API：永不快取
    return;
  }

  // 本機資源：stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);

      return cached || fetched;
    })
  );
});
