/* NEGRET'S — Service Worker (offline 24h+) */
var CACHE = 'negrets-v2';
var CORE = [
  './',
  './index.html',
  './admin.html',
  './rastreio.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(resp){
        if(resp.ok && e.request.url.indexOf(self.location.origin) === 0){
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return resp;
      }).catch(function(){
        if(e.request.mode === 'navigate'){
          return caches.match(e.request.url.indexOf('rastreio') >= 0 ? './rastreio.html' : e.request.url.indexOf('admin') >= 0 ? './admin.html' : './index.html');
        }
        return caches.match('./index.html');
      });
    })
  );
});
