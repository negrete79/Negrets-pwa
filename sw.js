/* NEGRET'S — Service Worker
   PWA 100% offline: abre sem internet, cache-first com atualização silenciosa. */
const V = 'negrets-v1.0.2';
const CORE = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(V)
      .then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  const isNav = e.request.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(V);
    let hit = await cache.match(e.request, { ignoreSearch: true });
    if (!hit && isNav) {
      hit = await cache.match('./index.html', { ignoreSearch: true })
        || await cache.match('./admin.html', { ignoreSearch: true });
    }
    const net = fetch(e.request)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') cache.put(e.request, res.clone());
        return res;
      })
      .catch(() => null);
    if (hit) return hit;
    const res = await net;
    return res || cache.match('./index.html', { ignoreSearch: true });
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
