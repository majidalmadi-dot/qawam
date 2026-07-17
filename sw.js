/* Qawam (weight management) service worker — offline support + fresh-on-deploy. Scope: /Qawam/ */
const CACHE = 'qawam-v13';
const CORE = ['./', './index.html', './manifest.webmanifest', './qawam-192.png', './qawam-512.png', './qawam-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.startsWith('qawam-')).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return res; })
        .catch(() => caches.match('./index.html').then((c) => c || caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
        const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp));
      }
      return res;
    }).catch(() => cached))
  );
});
