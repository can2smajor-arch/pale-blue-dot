// 창백한 푸른 점 — Cloudflare Worker
// 화면 파일(public/)은 Cloudflare가 바로 내보내고, /api/* 만 이 코드가 처리합니다.
//   GET /api/iss      우주정거장 궤도 데이터 (CelesTrak, 키 필요 없음)
//   GET /api/ships    노화도 앞바다의 배 (aisstream.io, 비밀값 AISSTREAM_KEY 필요)
//   GET /api/webcams  세계 실시간 카메라 (Windy Webcams, 비밀값 WINDY_KEY 필요)
// 비밀값은 Cloudflare 대시보드 → 이 Worker → Settings → Variables and Secrets 에 넣습니다. 코드에는 넣지 않습니다.

const UA = "pale-blue-dot (nohwa hobby web app)";

// 노화도 둘레 바다: 남쪽 위도, 서쪽 경도, 북쪽 위도, 동쪽 경도 (보길도·소안도·땅끝·완도 앞바다까지)
const NOHWA_BOX = { s: 33.95, w: 126.30, n: 34.45, e: 126.95 };

function json(body, { status = 200, maxAge = 0 } = {}) {
  const headers = { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" };
  headers["cache-control"] = maxAge ? `public, max-age=${maxAge}` : "no-store";
  return new Response(JSON.stringify(body), { status, headers });
}

// 같은 요청은 잠깐 저장해 두고 나눠 써서, 바깥 서비스 한도를 아낌
async function cached(request, ctx, seconds, make) {
  const cache = caches.default;
  const key = new Request(new URL(request.url).toString(), { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await make();
  if (res.status === 200) {
    const copy = new Response(res.body, res);
    copy.headers.set("cache-control", `public, max-age=${seconds}`);
    ctx.waitUntil(cache.put(key, copy.clone()));
    return copy;
  }
  return res;
}

async function getText(url, ms = 8000, headers = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "user-agent": UA, ...headers } });
    return { ok: r.ok, status: r.status, text: await r.text() };
  } finally { clearTimeout(t); }
}

// ── 우주정거장 궤도 (TLE) ──
async function iss() {
  try {
    const r = await getText("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE");
    const lines = r.text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (r.ok && lines.length >= 3 && lines[1].startsWith("1 ") && lines[2].startsWith("2 "))
      return json({ ok: true, source: "CelesTrak", name: lines[0], line1: lines[1], line2: lines[2], fetched: Date.now() });
  } catch (e) {}
  try {   // 예비: 다른 공개 TLE 서비스
    const r = await getText("https://tle.ivanstanojevic.me/api/tle/25544");
    const d = JSON.parse(r.text);
    if (d.line1 && d.line2) return json({ ok: true, source: "tle.ivanstanojevic.me", name: d.name, line1: d.line1, line2: d.line2, fetched: Date.now() });
  } catch (e) {}
  return json({ ok: false, error: "궤도 데이터를 받지 못했어요" }, { status: 502 });
}

// ── 노화도 앞바다의 배 (AIS) ──
// aisstream.io 는 웹소켓으로 실시간 신호를 흘려 보내 줍니다. 몇 초 동안 받아서 배별로 정리해 돌려줍니다.
async function ships(env) {
  if (!env.AISSTREAM_KEY) return json({ ok: false, need: "AISSTREAM_KEY", error: "선박 위치 서비스 키가 아직 없어요" }, { status: 200 });
  const resp = await fetch("https://stream.aisstream.io/v0/stream", { headers: { Upgrade: "websocket" } });
  const ws = resp.webSocket;
  if (!ws) return json({ ok: false, error: "선박 위치 서비스에 연결하지 못했어요" }, { status: 502 });
  ws.accept();
  const list = new Map();
  const dec = new TextDecoder();
  ws.addEventListener("message", ev => {
    let m;
    try { m = JSON.parse(typeof ev.data === "string" ? ev.data : dec.decode(ev.data)); } catch { return; }
    const md = m.MetaData || {}, id = md.MMSI;
    if (!id) return;
    const s = list.get(id) || { mmsi: id };
    s.name = (md.ShipName || s.name || "").trim();
    if (typeof md.latitude === "number") { s.lat = md.latitude; s.lon = md.longitude; s.time = md.time_utc; }
    const msg = m.Message || {};
    const pr = msg.PositionReport || msg.StandardClassBPositionReport || msg.ExtendedClassBPositionReport;
    if (pr) { s.sog = pr.Sog; s.cog = pr.Cog; s.heading = pr.TrueHeading; s.status = pr.NavigationalStatus; }
    const st = msg.ShipStaticData;
    if (st) { s.type = st.Type; s.dest = (st.Destination || "").trim(); s.callsign = (st.CallSign || "").trim();
      if (st.Dimension) s.len = (st.Dimension.A || 0) + (st.Dimension.B || 0); }
    list.set(id, s);
  });
  ws.send(JSON.stringify({
    APIKey: env.AISSTREAM_KEY,
    BoundingBoxes: [[[NOHWA_BOX.s, NOHWA_BOX.w], [NOHWA_BOX.n, NOHWA_BOX.e]]],
    FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport", "ShipStaticData"]
  }));
  await new Promise(r => setTimeout(r, 7000));   // 7초 동안 들어오는 신호 모으기
  try { ws.close(1000, "done"); } catch {}
  const out = [...list.values()].filter(s => typeof s.lat === "number");
  return json({ ok: true, source: "aisstream.io", box: NOHWA_BOX, collectedSeconds: 7, ships: out });
}

// ── 세계 실시간 카메라 (Windy Webcams API v3) ──
async function webcams(env, url) {
  if (!env.WINDY_KEY) return json({ ok: false, need: "WINDY_KEY", error: "웹캠 서비스 키가 아직 없어요" }, { status: 200 });
  const q = new URLSearchParams({ limit: "24", include: "images,location,player,urls", sortKey: "popularity", sortDirection: "desc" });
  const near = url.searchParams.get("near");        // "위도,경도,반경km" 를 주면 그 근처
  if (near && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,\d+$/.test(near)) q.set("nearby", near);
  const r = await getText("https://api.windy.com/webcams/api/v3/webcams?" + q, 8000, { "x-windy-api-key": env.WINDY_KEY });
  if (!r.ok) return json({ ok: false, error: `웹캠 서비스 응답 ${r.status}` }, { status: 502 });
  let d; try { d = JSON.parse(r.text); } catch { return json({ ok: false, error: "웹캠 응답을 읽지 못했어요" }, { status: 502 }); }
  const cams = (d.webcams || []).map(w => ({
    id: w.webcamId, title: w.title, city: w.location && w.location.city, country: w.location && w.location.country,
    lat: w.location && w.location.latitude, lon: w.location && w.location.longitude,
    image: w.images && w.images.current && (w.images.current.preview || w.images.current.thumbnail),
    player: w.player && (w.player.live || w.player.day), page: w.urls && (w.urls.detail || w.urls.provider)
  }));
  return json({ ok: true, source: "Windy Webcams", cams });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/iss") return cached(request, ctx, 3 * 3600, iss);
    if (url.pathname === "/api/ships") return cached(request, ctx, 60, () => ships(env));
    if (url.pathname === "/api/webcams") return cached(request, ctx, 300, () => webcams(env, url));
    if (url.pathname.startsWith("/api/")) return json({ ok: false, error: "없는 주소" }, { status: 404 });
    return env.ASSETS.fetch(request);   // 그 밖의 주소는 화면 파일
  }
};
