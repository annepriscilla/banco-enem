// Guarda a página e as questões já abertas para funcionar sem internet.
const VERSAO = 'banco-enem-v1';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icones/icone-192.png', 'icones/icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Página: tenta a versão nova e usa a guardada se estiver sem internet.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      caches.open(VERSAO).then(c => c.put('index.html', r.clone()));
      return r;
    }).catch(() => caches.match('index.html')));
    return;
  }
  // Questões, ícones e fontes: usa a cópia guardada e busca na rede só na primeira vez.
  if (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSAO).then(c => c.put(req, cp)); }
      return r;
    })));
  }
});
