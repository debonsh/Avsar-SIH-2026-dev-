const C = "kc-v1";
const ASSETS = ["./", "index.html", "app.js", "manifest.json"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => caches.match("index.html"))));
});
