/* 时序 service worker：导航与 index.html 走网络优先（保证更新能到），其余静态资源缓存优先（离线可用） */
var CACHE = 'shixu-v2';
var ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon-180.png'
];
function netFirst(req){
  return fetch(req).then(function(r){
    var cp = r.clone();
    caches.open(CACHE).then(function(c){ c.put(req, cp); });
    return r;
  }).catch(function(){
    return caches.match(req).then(function(r){ return r || caches.match('index.html'); });
  });
}
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var html = false;
  try { html = req.mode === 'navigate' || /\/index\.html$/.test(new URL(req.url).pathname); }
  catch (err) { html = req.mode === 'navigate'; }
  if (html) { e.respondWith(netFirst(req)); return; }
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        var cp = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, cp); });
        return res;
      });
    })
  );
});
