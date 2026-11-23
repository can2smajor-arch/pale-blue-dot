// 창백한 푸른 점 — Cloudflare Worker
// 화면 파일(public/)은 Cloudflare가 바로 내보내고, /api/* 만 이 코드가 처리합니다.
//   GET /api/iss      우주정거장 궤도 데이터 (CelesTrak, 키 필요 없음)
//   GET /api/planes   노화도 하늘의 비행기 (adsb.lol / adsb.fi, 키 필요 없음)
//   POST /api/routes  편명으로 출발·도착 공항 추정
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
  if (res.status === 200 && !res.headers.get("x-no-cache")) {
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
  try { return await shipsInner(env); }
  catch (e) { const r = json({ ok: false, error: "선박 위치를 받지 못했어요", detail: String(e && e.message || e).slice(0, 200) }); r.headers.set("x-no-cache", "1"); return r; }
}
async function shipsInner(env) {
  const resp = await fetch("https://stream.aisstream.io/v0/stream", { headers: { Upgrade: "websocket" } });
  const ws = resp.webSocket;
  if (!ws) { const r = json({ ok: false, error: "선박 위치 서비스에 연결하지 못했어요", detail: `HTTP ${resp.status} ${(await resp.text()).slice(0, 150)}` }); r.headers.set("x-no-cache", "1"); return r; }
  let closedWhy = "";
  ws.addEventListener("close", ev => { closedWhy = `${ev.code} ${ev.reason || ""}`.trim(); });
  ws.addEventListener("error", ev => { closedWhy = closedWhy || "error " + (ev.message || ""); });
  ws.accept();
  const list = new Map();
  const dec = new TextDecoder();
  let msgCount = 0;
  ws.addEventListener("message", ev => {
    msgCount++;
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
  return json({ ok: true, source: "aisstream.io", box: NOHWA_BOX, collectedSeconds: 7, messages: msgCount, closed: closedWhy || undefined, ships: out });
}

// ── 세계 실시간 카메라 (Windy Webcams API v3) ──
async function webcams(env, url) {
  if (!env.WINDY_KEY) return json({ ok: false, need: "WINDY_KEY", error: "웹캠 서비스 키가 아직 없어요" }, { status: 200 });
  // 세계 곳곳에서 고루: 한국, 일본, 동남아, 인도, 유럽, 아프리카, 미주, 오세아니아 (위도,경도,반경km)
  const REGIONS = [["한국", "36.5,127.8,350"], ["일본", "35.6,139.7,400"], ["동남아", "13.7,100.5,800"], ["인도", "20.6,78.9,1500"],
    ["유럽", "46.8,8.2,800"], ["아프리카", "-1.3,36.8,2500"], ["남미", "-22.9,-43.2,2000"], ["북미", "40.7,-74.0,1500"], ["오세아니아", "-33.9,151.2,1500"]];
  const near = url.searchParams.get("near");
  const list = near && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,\d+$/.test(near) ? [["", near]] : REGIONS;
  const per = list.length > 1 ? "3" : "24";
  const results = await Promise.all(list.map(async ([region, nb]) => {
    const q = new URLSearchParams({ limit: per, include: "images,location,player,urls", sortKey: "popularity", sortDirection: "desc", nearby: nb });
    try { const r = await getText("https://api.windy.com/webcams/api/v3/webcams?" + q, 8000, { "x-windy-api-key": env.WINDY_KEY });
      if (!r.ok) return { region, err: r.status, webcams: [] };
      const d = JSON.parse(r.text); return { region, webcams: d.webcams || [] };
    } catch (e) { return { region, err: "연결 실패", webcams: [] }; }
  }));
  const all = results.flatMap(x => x.webcams.map(w => ({ ...w, _region: x.region })));
  if (!all.length){ const r = json({ ok: false, error: "웹캠을 받지 못했어요", detail: results.map(x => `${x.region}:${x.err || 0}`).join(" ") }); r.headers.set("x-no-cache", "1"); return r; }
  const cams = all.map(w => ({ region: w._region,
    id: w.webcamId, title: w.title, city: w.location && w.location.city, country: w.location && w.location.country,
    lat: w.location && w.location.latitude, lon: w.location && w.location.longitude,
    image: w.images && w.images.current && (w.images.current.preview || w.images.current.thumbnail),
    player: w.player && (w.player.live || w.player.day), page: w.urls && (w.urls.detail || w.urls.provider)
  }));
  return json({ ok: true, source: "Windy Webcams", cams });
}


// ── 노화도 하늘의 비행기 (adsb.lol, 안 되면 adsb.fi · 키 필요 없음) ──
const PLANE_SOURCES = [
  { name: "airplanes.live", url: (la, lo, nm) => `https://api.airplanes.live/v2/point/${la}/${lo}/${nm}` },
  { name: "adsb.lol", url: (la, lo, nm) => `https://api.adsb.lol/v2/lat/${la}/lon/${lo}/dist/${nm}` },
  { name: "OpenSky", opensky: true, url: (la, lo, nm) => { const d = nm * 1.852 / 111, e = d / Math.cos(la * Math.PI / 180);
      return `https://opensky-network.org/api/states/all?lamin=${(la - d).toFixed(2)}&lamax=${(+la + d).toFixed(2)}&lomin=${(lo - e).toFixed(2)}&lomax=${(+lo + e).toFixed(2)}`; } },
  { name: "adsb.fi",  url: (la, lo, nm) => `https://opendata.adsb.fi/api/v2/lat/${la}/lon/${lo}/dist/${nm}` }
];
// OpenSky 형식을 다른 서비스와 같은 모양으로 바꾸기
function fromOpenSky(d){
  return (d.states || []).filter(x => x[5] != null && x[6] != null).map(x => ({
    hex: x[0], flight: x[1] || "", lon: x[5], lat: x[6], alt_baro: x[8] ? "ground" : (x[7] != null ? Math.round(x[7] / 0.3048) : undefined),
    gs: x[9] != null ? x[9] / 0.514444 : undefined, track: x[10] != null ? x[10] : undefined, seen_pos: x[3] ? Math.max(0, d.time - x[3]) : 0 }));
}
const KEEP = ["hex", "flight", "r", "t", "alt_baro", "alt_geom", "gs", "track", "lat", "lon", "seen_pos"];
async function planes(url) {
  const q = url.searchParams, lat = Number(q.get("lat") ?? 34.19), lon = Number(q.get("lon") ?? 126.57);
  const nm = Math.max(1, Math.min(250, Math.round(Number(q.get("nm")) || 80)));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json({ ok: false, error: "위치 값이 잘못됐어요" }, { status: 400 });
  const tried = [];
  for (const src of PLANE_SOURCES) {
    try {
      const r = await getText(src.url(lat.toFixed(2), lon.toFixed(2), nm));
      if (!r.ok) { tried.push(`${src.name}: ${r.status} ${r.text.slice(0, 120).replace(/\s+/g, " ")}`); continue; }
      const d = JSON.parse(r.text);
      const ac = (src.opensky ? fromOpenSky(d) : (d.ac || d.aircraft || [])).filter(p => p && p.lat != null && p.lon != null)
        .map(p => Object.fromEntries(KEEP.filter(k => p[k] !== undefined).map(k => [k, p[k]])));
      return json({ ok: true, source: src.name, ac });
    } catch (e) { tried.push(`${src.name}: ${e.name === "AbortError" ? "시간 초과" : "연결 실패 " + (e.message || "")}`); }
  }
  // 화면이 이유를 보여 줄 수 있도록 200으로 돌려주되 ok:false (캐시는 안 함)
  const fail = json({ ok: false, error: "비행 데이터 서버가 응답하지 않았어요", tried }); fail.headers.set("x-no-cache", "1"); return fail;
}
// 편명으로 출발·도착 공항 추정 (adsb.lol routeset)
async function routes(request) {
  let body; try { body = await request.json(); } catch { return json([], { status: 400 }); }
  const list = (Array.isArray(body && body.planes) ? body.planes : [])
    .filter(p => p && typeof p.callsign === "string" && /^[A-Z0-9]{2,8}$/.test(p.callsign.trim()) && Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .slice(0, 60).map(p => ({ callsign: p.callsign.trim(), lat: p.lat, lng: p.lng }));
  if (!list.length) return json([]);
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch("https://api.adsb.lol/api/0/routeset", { method: "POST", signal: ctl.signal,
      headers: { "content-type": "application/json", "user-agent": UA }, body: JSON.stringify({ planes: list }) });
    clearTimeout(t);
    if (!r.ok) return json([]);
    let d = await r.json(); if (typeof d === "string") { try { d = JSON.parse(d); } catch { d = []; } }
    return json(Array.isArray(d) ? d : []);
  } catch { return json([]); }
}


// ── 점검용: 배·웹캠 서비스가 실제로 어떻게 답하는지 (키 값은 내보내지 않음) ──
async function diag(env) {
  const out = { time: new Date().toISOString(), hasAisKey: !!env.AISSTREAM_KEY, hasWindyKey: !!env.WINDY_KEY };
  if (env.WINDY_KEY) {
    for (const [label, extra] of [["plain", {}], ["nearby", { nearby: "36.5,127.8,350" }]]) {
      const q = new URLSearchParams({ limit: "3", include: "location", ...extra });
      try { const r = await getText("https://api.windy.com/webcams/api/v3/webcams?" + q, 8000, { "x-windy-api-key": env.WINDY_KEY });
        let n = null; try { n = (JSON.parse(r.text).webcams || []).map(w => w.location && w.location.city); } catch {}
        out["windy_" + label] = { status: r.status, cities: n, body: n ? undefined : r.text.slice(0, 160) };
      } catch (e) { out["windy_" + label] = { error: String(e.message || e) }; }
    }
  }
  if (env.AISSTREAM_KEY) {
    const a = out.ais = {};
    try {
      const resp = await fetch("https://stream.aisstream.io/v0/stream", { headers: { Upgrade: "websocket" } });
      a.status = resp.status; const ws = resp.webSocket; a.gotSocket = !!ws;
      if (ws) {
        ws.accept(); a.msgs = 0; a.first = null;
        ws.addEventListener("message", ev => { a.msgs++; if (!a.first) a.first = (typeof ev.data === "string" ? ev.data : new TextDecoder().decode(ev.data)).slice(0, 160); });
        ws.addEventListener("close", ev => { a.closed = `${ev.code} ${ev.reason || ""}`; });
        ws.addEventListener("error", ev => { a.err = String(ev.message || "error"); });
        ws.send(JSON.stringify({ APIKey: env.AISSTREAM_KEY, BoundingBoxes: [[[33.0, 125.0], [35.5, 128.5]]] }));
        await new Promise(r => setTimeout(r, 5000));
        try { ws.close(1000, "diag"); } catch {}
      } else { a.body = (await resp.text()).slice(0, 160); }
    } catch (e) { a.error = String(e.message || e); }
  }
  return json(out);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/iss") return cached(request, ctx, 3 * 3600, iss);
    if (url.pathname === "/api/diag") return diag(env);
    if (url.pathname === "/api/planes") return cached(request, ctx, 15, () => planes(url));
    if (url.pathname === "/api/routes" && request.method === "POST") return routes(request);
    if (url.pathname === "/api/ships") return cached(request, ctx, 60, () => ships(env));
    if (url.pathname === "/api/webcams") return cached(request, ctx, 300, () => webcams(env, url));
    if (url.pathname.startsWith("/api/")) return json({ ok: false, error: "없는 주소" }, { status: 404 });
    return env.ASSETS.fetch(request);   // 그 밖의 주소는 화면 파일
  }
};
