// VergeIO 專案報備 — Service Worker
// 改了 index.html／圖示要讓舊版手機也換新：把 VERSION 改掉（例如日期）再上傳即可。
const VERSION = 'vergeio-20261115b';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
});

// 頁面按「更新」時才切換到新版，避免填到一半畫面被換掉
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // 只處理本站的 GET；送出報備（Apps Script POST）、統編查詢（g0v API）一律直接走網路、不快取
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 網頁本身：網路優先（有網路一定拿最新版），斷線才用快取
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 圖示、manifest：快取優先
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
