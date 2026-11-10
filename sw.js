/* ============================================================
   NEGRET'S — Service Worker (PWA 100% offline)
   Criado por Elias Costa NEGRET'S
   ============================================================ */
const CACHE_NEGRETS = 'negrets-v1.0.1';

const ASSETS_NEGRETS = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

/* Instalação: guarda todo o app em cache para abrir SEM INTERNET */
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NEGRETS)
      .then((cache) => cache.addAll(ASSETS_NEGRETS))
      .then(() => self.skipWaiting())
  );
});

/* Ativação: limpa caches antigos e assume o controle */
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(
        chaves.filter((c) => c !== CACHE_NEGRETS).map((c) => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

/* Estratégia:
   - Páginas (navegação): rede primeiro, cache como reserva
     → atualizações chegam ao cliente com internet; SEM INTERNET abre do cache.
   - Demais arquivos (ícones, imagens): cache primeiro.
   - API externa (Mercado Pago) nunca é interceptada. */
self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    evento.respondWith(
      fetch(req).then((rede) => {
        const copia = rede.clone();
        caches.open(CACHE_NEGRETS).then((c) => c.put(req, copia));
        return rede;
      }).catch(() =>
        caches.match(req).then((cacheado) => cacheado ||
          caches.match('./index.html'))
      )
    );
    return;
  }

  evento.respondWith(
    caches.match(req).then((cacheado) => cacheado ||
      fetch(req).then((rede) => {
        if (rede && rede.ok) {
          const copia = rede.clone();
          caches.open(CACHE_NEGRETS).then((c) => c.put(req, copia));
        }
        return rede;
      })
    )
  );
});
