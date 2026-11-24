// 창백한 푸른 점 — 앱 껍데기와 행성 사진은 저장해 두고, 실시간 자료(/api)는 늘 새로 받아요.
const V = "pbd-v12";
const SHELL = ["/", "/index.html", "/story.js", "/view.js", "/helix.js", "/manifest.webmanifest", "/icons/icon-192.png", "/favicon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.pathname.startsWith("/api/")) return;          // 실시간 자료는 그대로
  if (u.hostname.includes("tile.openstreetmap") || u.hostname.includes("youtube") || u.hostname.includes("windy")) return;
  const isTex = u.origin === location.origin && u.pathname.startsWith("/tex/");
  const isLib = /cdn\.jsdelivr\.net|unpkg\.com/.test(u.hostname);
  if (isTex || isLib) {   // 행성 사진·라이브러리: 저장본 먼저
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(e.request, c)); } return res; })));
    return;
  }
  if (u.origin === location.origin) {   // 화면 파일: 새것 먼저, 안 되면 저장본
    e.respondWith(fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(e.request, c)); } return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/index.html"))));
  }
});
