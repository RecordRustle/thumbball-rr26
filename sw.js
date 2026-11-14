// ThumbBall – Offline-Speicher. Bei größeren Updates die Versionsnummer erhöhen.
const V = 'thumbball-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(CORE);
    // 3D-Bibliothek: erst die lokale Datei (falls vorhanden), sonst von cdnjs
    for (const u of ['three.min.js', CDN]) {
      try {
        const r = await fetch(u, u === CDN ? { mode: 'no-cors' } : {});
        if (r.ok || r.type === 'opaque') await c.put(u, r);
      } catch (err) {}
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(V);
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    return res || (await cache.match('index.html')) || Response.error();
  })());
});
