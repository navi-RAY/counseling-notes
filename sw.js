const CACHE = 'cn-v8';
const ASSETS = ['./', './index.html', './manifest.json'];

// Install: cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

// Activate: clear old caches, take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML (always get latest on reload), cache-first for others
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    // HTML: try network first so updates are picked up on reload
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Assets: cache first
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});

// Message from app: skip waiting to activate new SW
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
