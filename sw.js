// アプリの画面（index.html）と地図の部品（Leaflet）を端末に置いておき、開いたらすぐそれを使う。
// 裏で新しい版を取りに行って入れ替えておく（新しい版は、次に開いたときから）。バスの位置などのデータには触らない
var CACHE = 'imadoko-v2';
var LEAFLET = /^https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\//;
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./', 'manifest.json', 'icon-192.png']); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  var mine = u.origin === location.origin;
  if (!mine && !LEAFLET.test(req.url)) return;
  var key = mine && req.mode === 'navigate' ? './' : req;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(key, { ignoreSearch: mine }).then(function (hit) {
      var net = fetch(req).then(function (r) {
        if (r && r.ok) c.put(key, r.clone());
        return r;
      });
      if (hit) { e.waitUntil(net.catch(function () { })); return hit; }
      return net;
    });
  }));
});
