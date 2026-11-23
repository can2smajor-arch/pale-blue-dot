// 창백한 푸른 점 — 이야기 모드
// 노화도 앞바다 → 세계의 창 → 우주정거장 → 달 → 행성 → 보이저 1호 → 창백한 푸른 점 → 별 → 은하 → 우주의 끝 → 다시 노화도
(() => {
const NOHWA = { lat: 34.19, lon: 126.57 };

// ───────── 화면 요소 ─────────
const css = `
#story{position:fixed;left:0;right:0;bottom:0;z-index:4;padding:12px 16px calc(12px + env(safe-area-inset-bottom));
  background:linear-gradient(#02030a00,#02030aee 22%);display:none}
#story.show{display:block}
#story .st-t{font-size:13px;color:var(--acc);font-weight:800;letter-spacing:-.2px}
#story .st-p{font-size:14.5px;line-height:1.65;color:#e9edf8;margin-top:6px;max-height:34vh;overflow-y:auto;word-break:keep-all}
#story .st-p b{color:var(--acc)}
#story .st-live{margin-top:8px;font-size:12.5px;color:#cfd6ea;background:#ffffff0d;border-radius:10px;padding:8px 10px;line-height:1.6;display:none}
#story .st-live.show{display:block}
#story .st-live b{color:#9fd0ff}
#story .st-row{display:flex;align-items:center;gap:8px;margin-top:10px}
#story .st-row button{border-radius:12px;padding:10px 14px;font-size:14px;font-weight:700;border:1px solid #ffffff30;background:#0b1020dd;color:var(--ink)}
#story .st-next{background:var(--acc)!important;color:#1a1100!important;border-color:var(--acc)!important;flex:1}
#story .st-dots{display:flex;gap:4px;justify-content:center;margin-top:9px}
#story .st-dots i{width:6px;height:6px;border-radius:50%;background:#ffffff30}
#story .st-dots i.on{background:var(--acc);width:16px;border-radius:3px}
#story .st-x{position:absolute;right:12px;top:8px;background:none;border:none;color:var(--dim);font-size:20px}
#story .st-extra{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}
#story .st-extra button{border-radius:999px;padding:7px 12px;font-size:12.5px;border:1px solid #ffffff30;background:#ffffff12;color:var(--ink)}
body.storying #steps, body.storying #nav, body.storying #card, body.storying #hud{display:none!important}
#layer{position:fixed;inset:0;z-index:4;display:none;background:#02030a}
#layer.show{display:block}
#map{position:absolute;inset:0}
#mapNote{position:absolute;left:12px;right:12px;top:60px;z-index:500;background:#0b1020e8;color:#e9edf8;border:1px solid #ffffff25;border-radius:12px;
  padding:9px 12px;font-size:12.5px;line-height:1.55;display:none}
#mapNote.show{display:block}
#cams{position:absolute;inset:56px 0 0 0;overflow-y:auto;padding:8px 10px 46vh;display:none;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
#cams.show{display:grid}
.cam{background:#0b1020;border:1px solid #ffffff18;border-radius:12px;overflow:hidden;cursor:pointer}
.cam img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#111}
.cam div{padding:6px 8px;font-size:11.5px;line-height:1.4}
.cam small{color:var(--dim)}
.empty2{grid-column:1/-1;color:#cfd6ea;font-size:13.5px;line-height:1.7;padding:20px 8px;text-align:center}
#modal{position:fixed;inset:0;z-index:9;background:#000d;display:none;align-items:center;justify-content:center;padding:14px}
#modal.show{display:flex}
#modal .box{width:100%;max-width:820px}
#modal iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:12px;background:#000}
#modal .mrow{display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12.5px;color:#cfd6ea;gap:10px}
#modal a{color:var(--acc)}
#modal button{background:#ffffff18;color:#fff;border:1px solid #ffffff30;border-radius:10px;padding:8px 14px;font-size:13px}
#pbd{position:fixed;inset:0;z-index:3;display:none;background:#000}
#pbd.show{display:block}
#pbd canvas{position:absolute;inset:0;width:100%;height:100%}
.ship-ico{background:none;border:none}
#story .st-alt{font-size:12px;color:#9fb0cc;letter-spacing:.2px;margin-bottom:4px;font-variant-numeric:tabular-nums}
#story .st-alt b{font-size:19px;color:#fff;font-weight:800;margin:0 3px}
.radar{position:absolute;left:50%;top:50%;width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;z-index:450;pointer-events:none;border-radius:50%;
  background:conic-gradient(from 0deg,#3cff9a00 0deg,#3cff9a00 300deg,#3cff9a26 350deg,#3cff9a55 360deg);animation:sweep 4s linear infinite;display:none}
.radar.on{display:block}
@keyframes sweep{to{transform:rotate(360deg)}}
.plane-glow svg{filter:drop-shadow(0 0 4px currentColor)}
#photo{position:fixed;inset:0;z-index:3;background:#000;opacity:0;pointer-events:none;transition:opacity 1.2s ease;overflow:hidden}
#photo.show{opacity:1;pointer-events:auto}
#photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 40%}
#photo img.contain{object-fit:contain;object-position:50% 30%}
#photo img.kb{animation:kb 40s ease-out forwards}
#photo img.pan{animation:pan 60s ease-in-out infinite alternate}
@keyframes kb{from{transform:scale(1.02)}to{transform:scale(1.18) translateY(-2%)}}
@keyframes pan{from{object-position:0% 50%}to{object-position:100% 50%}}
#photo .ph-cap{position:absolute;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));font-size:12.5px;line-height:1.5;color:#e9edf8;
  text-shadow:0 1px 3px #000,0 0 8px #000;opacity:0;transition:opacity 1s .8s}
#photo.show .ph-cap{opacity:1}
#photo .ph-cap b{color:var(--acc)}
#photo .ph-cap small{display:block;color:#aeb8cc;font-size:10.5px;margin-top:2px}
#photo .ph-load{position:absolute;left:0;right:0;top:40%;text-align:center;color:#8d97ad;font-size:13px}
#photo .ph-shade{position:absolute;left:0;right:0;top:0;height:120px;background:linear-gradient(#000a,#0000)}
.leaflet-popup-content{font-size:12.5px;line-height:1.55}
`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
document.body.insertAdjacentHTML("beforeend", `
<div id="layer"><div id="map"></div><div class="radar" id="radar"></div><div id="mapNote"></div><div id="cams"></div></div>
<div id="pbd"><canvas id="pbdc"></canvas></div>
<div id="photo"><div class="ph-load" id="phLoad"></div><img id="phImg" alt=""><div class="ph-shade"></div><div class="ph-cap" id="phCap"></div></div>
<div id="story"><button class="st-x" id="stX" aria-label="이야기 끝내기">×</button>
  <div class="st-alt" id="stAlt"></div><div class="st-t" id="stT"></div><div class="st-p" id="stP"></div><div class="st-live" id="stLive"></div>
  <div class="st-extra" id="stExtra"></div>
  <div class="st-row"><button id="stPrev">◀</button><button class="st-next" id="stNext">다음 ▶</button></div>
  <div class="st-dots" id="stDots"></div></div>
<div id="modal"><div class="box"><div id="mBody"></div><div class="mrow"><span id="mNote"></span><button id="mClose">닫기</button></div></div></div>`);
const $ = id => document.getElementById(id);

// 필요할 때만 불러오는 라이브러리
const loaded = {};
function loadScript(src){ return loaded[src] || (loaded[src] = new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); })); }
function loadCss(href){ if (loaded[href]) return; loaded[href] = 1; const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); }

// ───────── 우주정거장 (실시간 궤도) ─────────
let satrec = null, issInfo = null;
async function loadISS(){
  if (satrec) return true;
  try {
    await loadScript("https://cdn.jsdelivr.net/npm/satellite.js@5.0.0/dist/satellite.min.js");
    const d = await (await fetch("/api/iss")).json();
    if (!d.ok) throw new Error(d.error);
    satrec = satellite.twoline2satrec(d.line1, d.line2); issInfo = d; return true;
  } catch (e) { issInfo = { error: true }; return false; }
}
function issAt(date){
  if (!satrec) return null;
  const pv = satellite.propagate(satrec, date); if (!pv || !pv.position) return null;
  const g = satellite.eciToGeodetic(pv.position, satellite.gstime(date)), v = pv.velocity;
  return { lat: satellite.degreesLat(g.latitude), lon: satellite.degreesLong(g.longitude), alt: g.height, speed: Math.hypot(v.x, v.y, v.z) };
}
function gcKm(a, b){ const R = 6371, t = Math.PI/180, dLat = (b.lat - a.lat)*t, dLon = (b.lon - a.lon)*t;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
// 지구 그림 위에 우주정거장과 앞뒤 45분 궤적
window.afterEarth = (x, y, r, rot) => {
  if (!satrec || !showISS) return;
  const now = new Date(simMs), H = 420 / 6371;
  ctx.save(); ctx.lineWidth = 1.6;
  for (const [from, to, col] of [[-45, 0, "#9fd0ff55"], [0, 45, "#9fd0ffcc"]]){
    ctx.beginPath(); let pen = false;
    for (let m = from; m <= to; m += 1){
      const p = issAt(new Date(now.getTime() + m*60000)); if (!p) continue;
      const q = geoOnEarth(p.lat, p.lon, rot, H);
      if (q.Z > 0 || !q.behind){ const sx = x + q.X*r, sy = y + q.Y*r; pen ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); pen = true; } else pen = false;
    }
    ctx.setLineDash(from < 0 ? [3, 4] : []); ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]);
  }
  const p = issAt(now);
  if (p){ const q = geoOnEarth(p.lat, p.lon, rot, H);
    if (q.Z > 0 || !q.behind){ const sx = x + q.X*r, sy = y + q.Y*r;
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#9fd0ff"; ctx.lineWidth = 2;
      ctx.fillRect(sx - 7, sy - 1.5, 14, 3); ctx.fillRect(sx - 1.5, sy - 4, 3, 8); ctx.beginPath(); ctx.arc(sx, sy, 9, 0, 7); ctx.stroke();
      ctx.font = "bold 12px sans-serif"; ctx.fillStyle = "#cfe8ff"; ctx.fillText("우주정거장", sx + 12, sy + 4); } }
  ctx.restore();
};
let showISS = false;

// ───────── 노화도 앞바다의 배 (지도) ─────────
let map = null, shipLayer = null, shipTimer = null;
const SHIP_TYPE = t => !t ? "종류 미상" : t >= 60 && t < 70 ? "여객선" : t >= 70 && t < 80 ? "화물선" : t >= 80 && t < 90 ? "유조선" :
  t === 30 ? "어선" : t === 31 || t === 32 || t === 52 ? "예인선" : t === 35 ? "군함" : t === 36 ? "범선" : t === 37 ? "레저 보트" :
  t === 50 ? "도선선" : t === 51 ? "수색구조선" : t === 55 ? "해경·경비정" : t >= 40 && t < 50 ? "고속선" : "기타 선박";
const SHIP_COL = t => t >= 60 && t < 70 ? "#4fc3ff" : t >= 70 && t < 80 ? "#7ee081" : t >= 80 && t < 90 ? "#ff8a65" : t === 30 ? "#ffd166" : "#cfd6ea";
let leaveTimer = null, mapMode = null, baseSat = null, baseDark = null, radarRings = null, mapWasShown = false;
async function openMap(mode = "ships"){
  clearTimeout(leaveTimer); $("layer").style.transition = ""; $("layer").style.opacity = "";
  mapMode = mode;
  $("layer").classList.add("show"); $("cams").classList.remove("show"); $("map").style.display = "block";
  loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  if (!map){
    map = L.map("map", { zoomControl: false, attributionControl: true }).setView([NOHWA.lat - 0.04, NOHWA.lon], 10);
    baseSat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 17, attribution: "위성사진 © Esri, Maxar, Earthstar Geographics" });
    baseDark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 15, subdomains: "abcd", attribution: "© OpenStreetMap 기여자 © CARTO" });
    radarRings = L.layerGroup();
    for (const km of [50, 100, 200]){ L.circle([NOHWA.lat, NOHWA.lon], { radius: km * 1000, color: "#3cff9a", weight: 1, opacity: 0.45, fill: false, dashArray: km === 200 ? null : "3 6" }).addTo(radarRings);
      L.marker([NOHWA.lat + km / 111, NOHWA.lon], { icon: L.divIcon({ className: "ship-ico", html: `<span style="color:#3cff9a;font-size:10px;opacity:.8">${km}km</span>`, iconSize: [40, 12], iconAnchor: [20, 12] }) }).addTo(radarRings); }
    L.circleMarker([NOHWA.lat, NOHWA.lon], { radius: 6, color: "#ffb347", fillColor: "#ffb347", fillOpacity: 1 }).addTo(map).bindTooltip("노화도", { permanent: true, direction: "right" });
    shipLayer = L.layerGroup().addTo(map); planeLayer = L.layerGroup().addTo(map);
  }
  setTimeout(() => map.invalidateSize(), 50);
  const wasOpen = mapWasShown; mapWasShown = true;
  if (mode === "ships"){ map.removeLayer(baseDark); baseSat.addTo(map); map.removeLayer(radarRings); $("radar").classList.remove("on"); }
  else { radarRings.addTo(map); $("radar").classList.add("on"); }
  clearInterval(shipTimer); clearInterval(planeTimer); clearInterval(planeAnim); shipLayer.clearLayers(); planeLayer.clearLayers(); planeMarks.clear();
  if (ferryLayer) ferryLayer.clearLayers();
  if (mode === "ships"){ map.setView([34.2, 126.575], 11); drawFerryBase(); ferryNote = "⛴️ 여객선 운항 정보를 불러오는 중…"; aisNote = ""; renderSeaNote();
    loadFerries(); loadShips(); clearInterval(ferryTimer); ferryTimer = setInterval(updateFerries, 5000); shipTimer = setInterval(() => { loadShips(); loadFerries(); }, 60000); }
  else { clearInterval(ferryTimer);
    if (wasOpen){ map.flyTo([NOHWA.lat, NOHWA.lon], 7, { duration: 2.6 }); setTimeout(() => { if (mapMode === "planes"){ map.removeLayer(baseSat); baseDark.addTo(map); } }, 1300); }
    else { map.setView([NOHWA.lat, NOHWA.lon], 7); map.removeLayer(baseSat); baseDark.addTo(map); }
    loadPlanes(); planeTimer = setInterval(loadPlanes, 20000); planeAnim = setInterval(movePlanes, 1000); }
}
async function loadShips(){
  let d; try { d = await (await fetch("/api/ships")).json(); } catch (e) { d = { ok: false }; }
  if (mapMode !== "ships") return;
  shipLayer.clearLayers();
  if (!d.ok || !d.ships || !d.ships.length){ aisNote = ""; renderSeaNote(); return; }
  for (const s of d.ships){
    const ang = s.heading != null && s.heading < 360 ? s.heading : (s.cog || 0), moving = (s.sog || 0) > 0.5, col = SHIP_COL(s.type);
    const svg = moving ? `<svg width="22" height="22" viewBox="-11 -11 22 22" style="transform:rotate(${ang}deg)"><path d="M0,-9 L5,7 L0,4 L-5,7 Z" fill="${col}" stroke="#fff" stroke-width="1.2"/></svg>`
                       : `<svg width="14" height="14" viewBox="-7 -7 14 14"><circle r="4.5" fill="${col}" stroke="#fff" stroke-width="1.2"/></svg>`;
    const icon = L.divIcon({ html: svg, className: "ship-ico", iconSize: moving ? [22, 22] : [14, 14], iconAnchor: moving ? [11, 11] : [7, 7] });
    const kmh = s.sog != null ? (s.sog * 1.852).toFixed(0) : "-";
    L.marker([s.lat, s.lon], { icon }).addTo(shipLayer).bindPopup(
      `<b>${s.name || "이름 없음"}</b> (실제 신호)<br>${SHIP_TYPE(s.type)}${s.len ? ` · 길이 ${s.len}m` : ""}<br>속도 ${moving ? kmh + "km/h" : "정박·정지"}${s.dest ? `<br>목적지 ${s.dest}` : ""}`);
  }
  aisNote = `📡 실제 위치 신호가 잡힌 배 <b>${d.ships.length}척</b> (흰 테두리)`; renderSeaNote();
}


// ───────── 노화도 둘레 여객선 (시간표로 계산한 추정 위치) ─────────
// 항구 좌표는 통계청 해안선 위에서 확인한 대략값, 소요 시간도 대략값이에요.
const PORTS = { "땅끝": [34.2945, 126.528], "산양": [34.2295, 126.565], "동천": [34.191, 126.621], "이목": [34.177, 126.563], "넙도": [34.197, 126.496],
  "서넙도": [34.19, 126.474], "횡간": [34.274, 126.565], "당사": [34.112, 126.603], "소안": [34.165, 126.645], "화흥포": [34.296, 126.677] };
const P = n => PORTS[n];
const PATHS = {   // 섬을 피해 가는 꺾임점
  "땅끝-산양": [P("땅끝"), [34.265, 126.535], P("산양")], "땅끝-넙도": [P("땅끝"), [34.25, 126.505], P("넙도")], "넙도-서넙도": [P("넙도"), P("서넙도")],
  "산양-횡간": [P("산양"), P("횡간")], "화흥포-동천": [P("화흥포"), [34.24, 126.65], P("동천")], "동천-소안": [P("동천"), [34.178, 126.633], P("소안")],
  "이목-넙도": [P("이목"), [34.181, 126.545], [34.187, 126.53], P("넙도")], "이목-당사": [P("이목"), [34.171, 126.60], [34.162, 126.628], [34.14, 126.626], P("당사")]
};
const LEG_MIN = { "땅끝-산양": 30, "땅끝-넙도": 50, "넙도-서넙도": 15, "산양-횡간": 20, "화흥포-동천": 35, "동천-소안": 15, "이목-넙도": 30, "이목-당사": 45 };
// 항로 이름 → 출발 항구별 들르는 순서
const ITIN = {
  "땅끝산양": { "땅끝": ["땅끝", "산양"], "산양": ["산양", "땅끝"] },
  "땅끝넙도": { "땅끝": ["땅끝", "넙도"], "넙도": ["넙도", "땅끝"] },
  "땅끝넙도-서넙도": { "땅끝": ["땅끝", "넙도", "서넙도", "넙도", "땅끝"] },
  "산양횡간": { "산양": ["산양", "횡간"], "횡간": ["횡간", "산양"], "땅끝": ["땅끝", "산양", "횡간"] },
  "화흥포동천-소안": { "화흥포": ["화흥포", "동천", "소안"], "소안": ["소안", "동천", "화흥포"], "동천": ["동천", "소안"] },
  "이목서넙도(순환)": { "이목": ["이목", "넙도", "서넙도", "넙도", "이목"] },
  "이목넙도(순환)": { "이목": ["이목", "넙도", "이목"] },
  "이목당사": { "이목": ["이목", "당사"], "당사": ["당사", "이목"] }
};
const DWELL = 5;   // 들르는 항구에서 머무는 시간(분)
function legPath(a, b){ const k = `${a}-${b}`, r = `${b}-${a}`; return PATHS[k] ? { pts: PATHS[k], min: LEG_MIN[k] } : PATHS[r] ? { pts: PATHS[r].slice().reverse(), min: LEG_MIN[r] } : null; }
function alongPath(pts, f){
  const seg = []; let total = 0;
  for (let i = 1; i < pts.length; i++){ const d = Math.hypot(pts[i][0] - pts[i-1][0], (pts[i][1] - pts[i-1][1]) * 0.83); seg.push(d); total += d; }
  let want = f * total;
  for (let i = 0; i < seg.length; i++){ if (want <= seg[i]){ const g = seg[i] ? want / seg[i] : 0, a = pts[i], b = pts[i+1];
      return { lat: a[0] + (b[0] - a[0]) * g, lon: a[1] + (b[1] - a[1]) * g, heading: Math.atan2((b[1] - a[1]) * 0.83, b[0] - a[0]) * 180 / Math.PI }; } want -= seg[i]; }
  const e = pts[pts.length - 1]; return { lat: e[0], lon: e[1], heading: 0 };
}
// 출발 시각에서 몇 분 지났는지로 지금 위치 계산
function ferryNow(item, nowMin){
  const stops = (ITIN[item.route] || {})[item.from]; if (!stops) return null;
  const dep = parseInt(item.t.slice(0, 2)) * 60 + parseInt(item.t.slice(2));
  let tcur = dep;
  for (let i = 0; i < stops.length - 1; i++){
    const lp = legPath(stops[i], stops[i+1]); if (!lp) return null;
    if (nowMin < tcur) return null;
    if (nowMin <= tcur + lp.min){ const at = alongPath(lp.pts, (nowMin - tcur) / lp.min);
      return { ...at, from: stops[i], to: stops[i+1], arrive: tcur + lp.min, last: stops[stops.length - 1] }; }
    tcur += lp.min;
    if (i < stops.length - 2){ if (nowMin <= tcur + DWELL){ const p = P(stops[i+1]); return { lat: p[0], lon: p[1], heading: 0, docked: stops[i+1], arrive: tcur, last: stops[stops.length - 1] }; } tcur += DWELL; }
  }
  return null;
}
let ferryData = null, ferryLayer = null, ferryMarks = [], ferryTimer = null;
const hhmm = m => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const kstMin = () => { const d = new Date(Date.now() + 9 * 3600000); return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; };
function drawFerryBase(){
  if (!ferryLayer) ferryLayer = L.layerGroup().addTo(map);
  ferryLayer.clearLayers(); ferryMarks = [];
  for (const pts of Object.values(PATHS)) L.polyline(pts, { color: "#4fc3ff", weight: 2, opacity: 0.45, dashArray: "4 6" }).addTo(ferryLayer);
  for (const [n, [la, lo]] of Object.entries(PORTS))
    L.circleMarker([la, lo], { radius: 3.5, color: "#0b1020", weight: 1, fillColor: "#ffffff", fillOpacity: 1 }).addTo(ferryLayer).bindTooltip(n, { direction: "top", offset: [0, -4], className: "" });
}
async function loadFerries(){
  try { const d = await (await fetch("/api/ferries")).json(); if (d.ok) ferryData = d; } catch (e) {}
  updateFerries();
}
function updateFerries(){
  if (mapMode !== "ships" || !ferryLayer) return;
  for (const m of ferryMarks) ferryLayer.removeLayer(m); ferryMarks = [];
  if (!ferryData) return;
  const now = kstMin(); let moving = 0;
  const cancelled = ferryData.items.filter(x => /비운|통제|결항/.test(x.se));
  for (const it of ferryData.items){
    if (/비운|통제|결항/.test(it.se)) continue;
    const at = ferryNow(it, now); if (!at) continue;
    moving++;
    const svg = at.docked ? `<svg width="16" height="16" viewBox="-8 -8 16 16"><circle r="5.5" fill="#4fc3ff" stroke="#000" stroke-width="1"/></svg>`
      : `<svg width="26" height="26" viewBox="-13 -13 26 26" style="transform:rotate(${at.heading}deg)"><path d="M0,-11 L6,4 L4,10 L-4,10 L-6,4 Z" fill="#4fc3ff" stroke="#000" stroke-width="1.2"/></svg>`;
    const m = L.marker([at.lat, at.lon], { icon: L.divIcon({ html: svg, className: "ship-ico", iconSize: at.docked ? [16, 16] : [26, 26], iconAnchor: at.docked ? [8, 8] : [13, 13] }) })
      .bindPopup(`<b>${it.ship}</b> (여객선)<br>${it.route} · ${it.t.slice(0, 2)}:${it.t.slice(2)} ${it.from} 출발<br>` +
        (at.docked ? `지금 ${at.docked}에 잠시 정박 중` : `${at.from} → ${at.to} · ${hhmm(Math.round(at.arrive))}쯤 도착`) +
        `<br><small>시간표로 계산한 추정 위치예요</small>`).addTo(ferryLayer);
    ferryMarks.push(m);
  }
  const next = ferryData.items.filter(x => !/비운|통제|결항/.test(x.se) && ITIN[x.route] && ITIN[x.route][x.from])
    .map(x => ({ x, m: parseInt(x.t.slice(0, 2)) * 60 + parseInt(x.t.slice(2)) })).filter(o => o.m > now && o.m - now <= 90).slice(0, 3);
  ferryNote = (moving ? `⛴️ 지금 노화도 둘레 바다를 지나는 여객선 <b>${moving}척</b> (시간표로 계산한 추정 위치)` : `⛴️ 지금은 바다 위에 있는 여객선이 없어요`) +
    (next.length ? `<br>곧 출발: ${next.map(o => `${o.x.t.slice(0, 2)}:${o.x.t.slice(2)} ${o.x.from}→ ${o.x.ship}`).join(" · ")}` : (moving ? "" : (now > 21 * 60 ? "<br>오늘 운항은 모두 끝났어요" : ""))) +
    (cancelled.length ? `<br><span style="color:#ffb347">오늘 결항·통제 ${cancelled.length}편</span>` : "");
  renderSeaNote();
}
let ferryNote = "", aisNote = "";
function renderSeaNote(){ const n = $("mapNote"); if (mapMode !== "ships") return; n.className = "show";
  n.innerHTML = [ferryNote, aisNote].filter(Boolean).join("<br>") + `<br><small>출처: 한국해양교통안전공단 운항정보(완도뱃길 허브)${aisNote ? " · aisstream.io" : ""}</small>`; }

const AIRLINES = {
  KAL:"대한항공",AAR:"아시아나항공",JJA:"제주항공",TWB:"티웨이항공",JNA:"진에어",ABL:"에어부산",ASV:"에어서울",
  ESR:"이스타항공",APZ:"에어프레미아",EOK:"에어로케이",KJA:"에어인천",PTA:"파라타항공",HGG:"하이에어",
  JAL:"일본항공",ANA:"전일본공수",APJ:"피치항공",JJP:"젯스타 재팬",SKY:"스카이마크",
  CCA:"중국국제항공",CES:"중국동방항공",CSN:"중국남방항공",CSH:"상하이항공",CQH:"춘추항공",CDG:"산둥항공",CHH:"하이난항공",
  CXA:"샤먼항공",CSZ:"선전항공",DKH:"준야오항공",CPA:"캐세이퍼시픽",HKE:"홍콩익스프레스",CRK:"홍콩항공",
  EVA:"에바항공",CAL:"중화항공",TTW:"타이거에어 타이완",SJX:"스타럭스항공",
  PAL:"필리핀항공",CEB:"세부퍼시픽",APG:"필리핀 에어아시아",VJC:"비엣젯항공",HVN:"베트남항공",BAV:"뱀부항공",
  THA:"타이항공",TAX:"타이 에어아시아 X",SIA:"싱가포르항공",TGW:"스쿠트",MAS:"말레이시아항공",XAX:"에어아시아 X",GIA:"가루다인도네시아",
  UAE:"에미레이트항공",QTR:"카타르항공",ETD:"에티하드항공",THY:"터키항공",AFR:"에어프랑스",DLH:"루프트한자",KLM:"KLM",FIN:"핀에어",
  UAL:"유나이티드항공",DAL:"델타항공",AAL:"아메리칸항공",ACA:"에어캐나다",QFA:"콴타스항공",
  FDX:"페덱스(화물)",UPS:"UPS(화물)",GTI:"아틀라스항공(화물)",CKS:"칼리타항공(화물)",CLX:"카고룩스(화물)",PAC:"폴라에어카고(화물)",
  ABW:"에어브리지카고(화물)",CAO:"중국국제화물항공",CKK:"중국화물항공",AIC:"에어인디아",MGL:"몽골항공",UZB:"우즈베키스탄항공",
  ROK:"대한민국 공군",RKAF:"대한민국 공군"
};
const AIRPORTS = {
  ICN:"인천",GMP:"김포",CJU:"제주",PUS:"김해",KWJ:"광주",MWX:"무안",RSU:"여수",TAE:"대구",CJJ:"청주",USN:"울산",KPO:"포항경주",YNY:"양양",HIN:"사천",KUV:"군산",WJU:"원주",
  NRT:"도쿄 나리타",HND:"도쿄 하네다",KIX:"오사카 간사이",ITM:"오사카 이타미",NGO:"나고야",FUK:"후쿠오카",CTS:"삿포로",OKA:"오키나와",KOJ:"가고시마",KMJ:"구마모토",NGS:"나가사키",OIT:"오이타",HIJ:"히로시마",TAK:"다카마쓰",MYJ:"마쓰야마",KMQ:"고마쓰",SDJ:"센다이",
  PEK:"베이징",PKX:"베이징 다싱",PVG:"상하이 푸둥",SHA:"상하이 훙차오",TAO:"칭다오",CAN:"광저우",SZX:"선전",HGH:"항저우",NKG:"난징",DLC:"다롄",SHE:"선양",YNJ:"옌지",XMN:"샤먼",CTU:"청두",TFU:"청두 톈푸",CKG:"충칭",XIY:"시안",WEH:"웨이하이",YNT:"옌타이",HRB:"하얼빈",KMG:"쿤밍",
  HKG:"홍콩",MFM:"마카오",TPE:"타이베이",TSA:"타이베이 쑹산",KHH:"가오슝",RMQ:"타이중",
  MNL:"마닐라",CEB:"세부",CRK:"클라크",TAG:"보홀",KLO:"보라카이(칼리보)",MPH:"보라카이(카티클란)",
  BKK:"방콕",DMK:"방콕 돈므앙",HKT:"푸껫",CNX:"치앙마이",SGN:"호찌민",HAN:"하노이",DAD:"다낭",CXR:"나트랑(깜란)",PQC:"푸꾸옥",
  SIN:"싱가포르",KUL:"쿠알라룸푸르",BKI:"코타키나발루",CGK:"자카르타",DPS:"발리",VTE:"비엔티안",PNH:"프놈펜",RGN:"양곤",
  GUM:"괌",SPN:"사이판",HNL:"호놀룰루",LAX:"로스앤젤레스",SFO:"샌프란시스코",SEA:"시애틀",JFK:"뉴욕",ANC:"앵커리지",
  DXB:"두바이",DOH:"도하",IST:"이스탄불",SYD:"시드니",BNE:"브리즈번",ULN:"울란바토르",TAS:"타슈켄트",DEL:"델리"
};
const TYPES = {
  B738:"보잉 737-800",B737:"보잉 737-700",B38M:"보잉 737 MAX 8",B39M:"보잉 737 MAX 9",B739:"보잉 737-900",
  B744:"보잉 747-400",B748:"보잉 747-8",B74F:"보잉 747 화물기",B763:"보잉 767-300",B772:"보잉 777-200",B77W:"보잉 777-300ER",B77L:"보잉 777-200LR/화물",B788:"보잉 787-8",B789:"보잉 787-9",B78X:"보잉 787-10",
  A320:"에어버스 A320",A20N:"에어버스 A320neo",A321:"에어버스 A321",A21N:"에어버스 A321neo",A319:"에어버스 A319",A332:"에어버스 A330-200",A333:"에어버스 A330-300",A339:"에어버스 A330-900",A359:"에어버스 A350-900",A35K:"에어버스 A350-1000",A388:"에어버스 A380",
  AT76:"ATR 72",AT75:"ATR 72",DH8D:"대시 8",E190:"엠브라에르 190",E195:"엠브라에르 195",C919:"코맥 C919",ARJ:"코맥 ARJ21"
};
let planeLayer = null, planeTimer = null, planeAnim = null, planeMarks = new Map(), planeRoutes = new Map();
const PLANE_NM = 108;   // 노화도 둘레 약 200km
const altM = p => (typeof p.alt_baro === "number" ? p.alt_baro : (p.alt_geom || 0)) * 0.3048;
const altCol = m => m < 3000 ? "#5ee59b" : m < 9000 ? "#ffd166" : "#6cc6ff";
const callsign = p => (p.flight || "").trim();
const airline = p => { const c = callsign(p), pre = c.slice(0, 3); return /^[A-Z]{3}\d/.test(c) && AIRLINES[pre] ? AIRLINES[pre] : null; };
const apKo = a => a ? (AIRPORTS[a.iata] || a.location || a.name || a.iata || "") : "";
function planeIcon(p){
  const col = p.alt_baro === "ground" ? "#9aa3b5" : altCol(altM(p));
  return L.divIcon({ className: "ship-ico plane-glow", iconSize: [26, 26], iconAnchor: [13, 13],
    html: `<svg width="26" height="26" viewBox="-13 -13 26 26" style="transform:rotate(${p.track || 0}deg)"><path d="M0,-11 L2,-4 L10,1 L10,3 L2,1 L1.5,7 L4.5,9.5 L4.5,11 L0,10 L-4.5,11 L-4.5,9.5 L-1.5,7 L-2,1 L-10,3 L-10,1 L-2,-4 Z" fill="${col}" stroke="#000" stroke-width="1"/></svg>` });
}
function planePopup(p){
  const rt = planeRoutes.get(callsign(p)), m = altM(p);
  return `<b>${airline(p) || (p.r ? "등록번호 " + p.r : "이름 모를 비행기")}</b> ${callsign(p)}<br>` +
    (rt ? `${apKo(rt.from)} → ${apKo(rt.to)}<br>` : "") +
    `${TYPES[p.t] || p.t || ""}<br>고도 ${p.alt_baro === "ground" ? "지상" : (m/1000).toFixed(1) + "km"} · 시속 ${p.gs ? Math.round(p.gs * 1.852) : "-"}km`;
}
async function loadPlanes(){
  const note = $("mapNote"); note.className = "show";
  let d; try { d = await (await fetch(`/api/planes?lat=${NOHWA.lat}&lon=${NOHWA.lon}&nm=${PLANE_NM}`)).json(); } catch (e) { d = { ok: false, error: "연결 실패" }; }
  if (!d.ok){   // 서버가 막히면 휴대폰에서 직접 받아 보기
    for (const [name, u] of [["airplanes.live", `https://api.airplanes.live/v2/point/${NOHWA.lat}/${NOHWA.lon}/${PLANE_NM}`], ["adsb.lol", `https://api.adsb.lol/v2/lat/${NOHWA.lat}/lon/${NOHWA.lon}/dist/${PLANE_NM}`]]){
      try { const r = await fetch(u); if (!r.ok) continue; const j = await r.json(); d = { ok: true, source: name + " (직접)", ac: (j.ac || j.aircraft || []).filter(p => p.lat != null) }; break; } catch (e) {}
    }
  }
  if (mapMode !== "planes") return;
  if (!d.ok){ note.textContent = `✈️ 비행기 정보를 받지 못했어요 (${d.error || "오류"}). 20초 뒤 다시 시도해요.`; return; }
  const now = Date.now(), seen = new Set();
  for (const p of d.ac){
    seen.add(p.hex);
    let o = planeMarks.get(p.hex);
    if (!o){ o = { m: L.marker([p.lat, p.lon], { icon: planeIcon(p) }).addTo(planeLayer), tr: L.polyline([], { weight: 2, opacity: 0.55, interactive: false }).addTo(planeLayer) }; planeMarks.set(p.hex, o); }
    o.tr.setStyle({ color: p.alt_baro === "ground" ? "#9aa3b5" : altCol(altM(p)) });
    o.p = p; o.t0 = now; o.m.setLatLng([p.lat, p.lon]); o.m.setIcon(planeIcon(p)); o.m.bindPopup(planePopup(p));
  }
  for (const [h, o] of planeMarks) if (!seen.has(h)){ planeLayer.removeLayer(o.m); planeLayer.removeLayer(o.tr); planeMarks.delete(h); }
  const high = d.ac.filter(p => altM(p) > 9000).length;
  note.innerHTML = d.ac.length ? `✈️ 지금 노화도 둘레 200km 하늘에 <b>${d.ac.length}대</b>${high ? ` · 그중 ${high}대는 9km 넘게 높이 나는 국제선급` : ""}<br><small>초록 3km 아래 · 노랑 3~9km · 파랑 9km 위 / 비행기를 누르면 항공편 정보 · 출처: ${d.source}</small>`
                               : "✈️ 지금 이 하늘에서 잡힌 비행기가 없어요. 남해안은 수신기가 적어 실제보다 적게 잡힐 수 있어요.";
  // 출발·도착 공항
  const need = d.ac.filter(p => /^[A-Z]{3}\d/.test(callsign(p)) && !planeRoutes.has(callsign(p)));
  if (need.length){
    try {
      const r = await (await fetch("/api/routes", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ planes: need.slice(0, 60).map(p => ({ callsign: callsign(p), lat: p.lat, lng: p.lon })) }) })).json();
      need.slice(0, 60).forEach(p => planeRoutes.set(callsign(p), null));
      for (const x of r || []){ const a = x && x._airports; if (a && a.length >= 2 && x.plausible !== false && x.plausible !== 0) planeRoutes.set(x.callsign.trim(), { from: a[0], to: a[a.length - 1] }); }
      for (const o of planeMarks.values()) o.m.setPopupContent(planePopup(o.p));
    } catch (e) {}
  }
}
// 받은 속도·방향으로 1초마다 조금씩 앞으로 (부드럽게 움직이게)
function movePlanes(){
  const now = Date.now();
  for (const o of planeMarks.values()){
    const p = o.p; if (!p.gs || p.track == null || p.alt_baro === "ground") continue;
    const dt = Math.min(60, (now - o.t0) / 1000 + (p.seen_pos || 0)), dist = p.gs * 0.514444 * dt, tr = p.track * Math.PI / 180;
    const ll = [p.lat + dist * Math.cos(tr) / 111320, p.lon + dist * Math.sin(tr) / (111320 * Math.cos(p.lat * Math.PI / 180))];
    o.m.setLatLng(ll); const pts = o.tr.getLatLngs(); pts.push(ll); if (pts.length > 45) pts.shift(); o.tr.setLatLngs(pts);
  }
}

// ───────── 세계의 창 (실시간 카메라) ─────────
async function openCams(){
  clearInterval(ferryTimer); clearInterval(shipTimer); clearInterval(planeTimer); clearInterval(planeAnim); mapMode = null;
  $("layer").classList.add("show"); $("map").style.display = "none"; $("mapNote").className = ""; const box = $("cams"); box.classList.add("show");
  box.innerHTML = `<div class="empty2">🌍 세계 곳곳의 카메라를 불러오는 중…</div>`;
  let d; try { d = await (await fetch("/api/webcams")).json(); } catch (e) { d = { ok: false, error: "연결 실패" }; }
  if (!d.ok){ box.innerHTML = `<div class="empty2">${d.need ? "🌍 세계의 실시간 카메라는 <b style='color:#ffb347'>웹캠 서비스 키</b>를 넣으면 여기에 나와요.<br>지금은 다음 장으로 넘어가 우주정거장에서 지구를 내려다봐요." : `카메라 목록을 받지 못했어요 (${d.error || "오류"})`}</div>`; return; }
  box.innerHTML = "";
  for (const c of d.cams){
    const el = document.createElement("div"); el.className = "cam";
    el.innerHTML = `<img alt="" loading="lazy"><div><b></b><br><small></small></div>`;
    if (c.image) el.querySelector("img").src = c.image;
    el.querySelector("b").textContent = c.title || "카메라";
    el.querySelector("small").textContent = [c.region, [c.city, c.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
    el.onclick = () => openModal(c.player ? `<iframe src="${c.player}" allow="autoplay; fullscreen" allowfullscreen></iframe>` : `<img src="${c.image}" style="width:100%;border-radius:12px">`,
      `${c.title || ""} · 출처: Windy Webcams${c.page ? ` · <a href="${c.page}" target="_blank" rel="noopener">원본 페이지</a>` : ""}`);
    box.appendChild(el);
  }
}
function openModal(html, note){ $("mBody").innerHTML = html; $("mNote").innerHTML = note || ""; $("modal").classList.add("show"); }
$("mClose").onclick = () => { $("modal").classList.remove("show"); $("mBody").innerHTML = ""; };
function openISSLive(){
  openModal(`<iframe src="https://www.youtube.com/embed/live_stream?channel=UCLA_DiR1FfKNvjuUpBHmylQ&autoplay=1&mute=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`,
    `NASA 공식 생중계 (유튜브) · 화면이 안 나오면 <a href="https://www.youtube.com/@NASA/streams" target="_blank" rel="noopener">NASA 생중계 목록</a>에서 'Live Video from the International Space Station'을 고르세요`);
}
function closeLayers(){ mapWasShown = false; $("radar").classList.remove("on"); clearInterval(ferryTimer); $("layer").classList.remove("show"); $("cams").classList.remove("show"); clearInterval(shipTimer); clearInterval(planeTimer); clearInterval(planeAnim); mapMode = null; $("pbd").classList.remove("show"); pbdOn = false; }

// ───────── 창백한 푸른 점 장면 ─────────
let pbdOn = false, pbdT0 = 0;
function openPBD(){
  $("pbd").classList.add("show"); pbdOn = true; pbdT0 = performance.now(); requestAnimationFrame(drawPBD);
}
function drawPBD(now){
  if (!pbdOn) return;
  const c = $("pbdc"), d = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
  if (c.width !== w*d){ c.width = w*d; c.height = h*d; }
  const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
  const t = (now - pbdT0) / 1000, fade = Math.min(1, t / 2.5);
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  // 카메라 안에서 흩어진 햇빛이 만든 줄무늬 (원본 사진의 느낌을 그림으로 흉내 냄)
  const bands = [[0.12, 0.10, "#8a5a3c"], [0.33, 0.07, "#7a4f86"], [0.52, 0.12, "#a8743f"], [0.78, 0.08, "#5b6fa3"]];
  g.save(); g.translate(w/2, h*0.32); g.rotate(-0.42);
  for (const [p, wd, col] of bands){
    const x = (p - 0.5) * Math.max(w, h) * 1.4, bw = wd * Math.max(w, h);
    const gr = g.createLinearGradient(x - bw/2, 0, x + bw/2, 0);
    gr.addColorStop(0, col + "00"); gr.addColorStop(0.5, col + Math.round(0x55 * fade).toString(16).padStart(2, "0")); gr.addColorStop(1, col + "00");
    g.fillStyle = gr; g.fillRect(x - bw/2, -h*1.5, bw, h*3);
  }
  g.restore();
  // 입자(필름 잡티)
  const r = (n => () => (n = (n * 16807) % 2147483647) / 2147483647)(42);
  g.fillStyle = "#ffffff"; for (let i = 0; i < 260; i++){ g.globalAlpha = r() * 0.12 * fade; g.fillRect(r()*w, r()*h*0.6, 1, 1); } g.globalAlpha = 1;
  // 지구: 화소 하나도 안 되는 작은 점
  const ex = w*0.58, ey = h*0.30;
  g.fillStyle = `rgba(170,200,255,${fade})`; g.beginPath(); g.arc(ex, ey, 1.4, 0, 7); g.fill();
  if (t > 3.5){ const a = Math.min(1, (t - 3.5)/1.2);
    g.strokeStyle = `rgba(255,179,71,${a})`; g.lineWidth = 1.5; g.beginPath(); g.arc(ex, ey, 14, 0, 7); g.stroke();
    g.fillStyle = `rgba(255,220,170,${a})`; g.font = "bold 13px sans-serif"; g.fillText("지구", ex + 20, ey - 4);
    g.font = "12px sans-serif"; g.fillStyle = `rgba(220,226,240,${a})`; g.fillText("노화도도 이 점 안에 있어요", ex + 20, ey + 13); }
  g.fillStyle = `rgba(160,170,190,${fade*0.8})`; g.font = "11px sans-serif";
  g.fillText("1990년 2월 14일 · 보이저 1호 · 약 60억 km 밖에서 (원본 사진을 바탕으로 다시 그린 그림)", 12, 64);
  requestAnimationFrame(drawPBD);
}


// ───────── 진짜 사진 ─────────
// 모두 공개 사진이에요. NASA 사진은 퍼블릭 도메인, ESO·ESA/허블·ESA/웹 사진은 CC BY 4.0 (출처 표시)
const NI = id => `https://images-assets.nasa.gov/image/${id}/${id}~large.jpg`;
const PH = {
  iss: { src: NI("s132e012208"), cap: "<b>국제우주정거장</b> · 2010년 5월, 우주왕복선 애틀랜티스호가 떠나며 찍은 모습", credit: "NASA", fx: "kb" },
  moon: { src: NI("as08-14-2383"), cap: "<b>지구돋이</b> · 1968년 크리스마스이브, 달 뒤를 돌던 아폴로 8호에서 본 지구", credit: "NASA / 아폴로 8호 빌 앤더스", fx: "kb" },
  sun: { src: () => `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg?t=${Math.floor(Date.now() / 9e5)}`,
    cap: "<b>오늘의 태양</b> · 지금 이 시각 태양 관측 위성 SDO가 찍은 사진 (자외선)", credit: "NASA / SDO, AIA 171Å", fx: "kb contain" },
  saturn: { src: NI("PIA17172"), cap: "<b>지구가 웃은 날</b> · 2013년 7월 19일, 토성 뒤에 숨은 카시니호가 찍은 사진. 이 안 어딘가의 작은 파란 점이 지구예요", credit: "NASA / JPL-Caltech / SSI", fx: "kb contain" },
  voyager: { src: NI("PIA17046"), cap: "<b>보이저 1호</b> · 태양계를 벗어나 별 사이 공간으로 들어가는 모습 (상상도)", credit: "NASA / JPL-Caltech", fx: "pan" },
  pbd: { src: NI("PIA23645"), cap: "<b>창백한 푸른 점</b> · 1990년 보이저 1호가 찍은 원본을 2020년에 다시 처리한 사진. 햇빛 줄기 속 아주 작은 점 하나가 지구예요", credit: "NASA / JPL-Caltech", fx: "kb contain" },
  stars: { src: "https://cdn.esawebb.org/archives/images/screen/weic2205a.jpg", cap: "<b>별이 태어나는 곳</b> · 웹 우주망원경이 본 용골자리 성운의 '우주 절벽'. 태양 같은 별도 이런 구름에서 태어났어요", credit: "NASA, ESA, CSA, STScI (CC BY 4.0)", fx: "pan" },
  milkyway: { src: "https://cdn.eso.org/images/screen/eso0932a.jpg", cap: "<b>우리 은하</b> · 밤하늘 전체를 이어 붙인 은하수. 우리는 이 원반 안쪽에서 바깥을 보고 있어요", credit: "ESO / S. Brunier (CC BY 4.0)", fx: "pan" },
  andromeda: { src: NI("PIA15416"), cap: "<b>안드로메다 은하</b> · 자외선으로 본 모습. 1조 개쯤의 별이 모인 이웃 은하예요", credit: "NASA / JPL-Caltech (GALEX)", fx: "kb" },
  deep: { src: "https://cdn.esahubble.org/archives/images/screen/heic0611b.jpg", cap: "<b>허블 울트라 딥 필드</b> · 하늘에서 모래알만 한 조각을 오래 들여다봤더니 은하가 약 1만 개 있었어요. 점 하나하나가 은하예요", credit: "NASA, ESA, S. Beckwith (STScI), HUDF Team (CC BY 4.0)", fx: "kb" },
  earth: { src: async () => { const d = await (await fetch("/api/epic")).json(); if (!d.ok) throw 0;
      PH.earth.capNow = `<b>최근 우주에서 찍은 지구</b> · ${d.date.slice(0, 10).replace(/-/g, ". ")}. 150만 km 밖 DSCOVR 위성의 사진이에요. 위쪽 한반도 남쪽 끝 어딘가에 노화도가 있어요`; return d.url; },
    cap: "", credit: "NASA EPIC / DSCOVR", fx: "kb contain" }
};
let phKey = null, phOn = false, phReq = 0;
async function showPhoto(key){
  const ph = PH[key]; if (!ph) return hidePhoto();
  const my = ++phReq; phKey = key; phOn = true;
  const box = $("photo"), img = $("phImg");
  box.classList.add("show"); img.style.opacity = 0; $("phCap").innerHTML = ""; $("phLoad").textContent = "📷 사진을 불러오는 중…";
  let src; try { src = typeof ph.src === "function" ? await ph.src() : ph.src; } catch (e) { src = null; }
  if (my !== phReq) return;
  if (!src){ $("phLoad").textContent = ""; hidePhoto(); live("사진을 받지 못해서 모형으로 보여드려요."); setPhotoBtn(); return; }
  const pre = new Image(); pre.decoding = "async";
  pre.onload = () => { if (my !== phReq) return;
    img.className = ""; void img.offsetWidth; img.src = src; img.className = ph.fx; img.style.transition = "opacity 1.2s"; img.style.opacity = 1;
    $("phLoad").textContent = "";
    $("phCap").innerHTML = `${ph.capNow || ph.cap}<small>사진: ${ph.credit}</small>`; };
  pre.onerror = () => { if (my !== phReq) return; $("phLoad").textContent = ""; hidePhoto(); live("사진을 받지 못해서 모형으로 보여드려요."); setPhotoBtn(); };
  pre.src = src;
  setPhotoBtn();
}
function hidePhoto(){ phReq++; phOn = false; $("photo").classList.remove("show"); setPhotoBtn(); }
function setPhotoBtn(){ const b = $("phBtn"); if (b) b.textContent = phOn ? (CH[cur].modelLabel || "🔭 모형으로 보기") : "📷 진짜 사진 보기"; }
function preloadPhoto(i){ const c = CH[i]; if (!c || !c.photo) return; const ph = PH[c.photo]; if (typeof ph.src === "string") { const im = new Image(); im.src = ph.src; } }


// ───────── 노화도에서 얼마나 멀리 왔나 (고도계) ─────────
const LY_KM = 9.4607e12;
let altShown = 0.001, altAnim = 0;
function fmtAlt(km){
  if (km < 0.002) return ["해발", "0", "m"];
  if (km < 1) return ["", Math.round(km * 1000).toLocaleString(), "m"];
  if (km < 10000) return ["", Math.round(km).toLocaleString(), "km"];
  if (km < 1e8) return ["", (km / 1e4).toLocaleString(undefined, { maximumFractionDigits: km < 1e5 ? 1 : 0 }), "만 km"];
  if (km < 0.05 * LY_KM) return ["", (km / 1e8).toLocaleString(undefined, { maximumFractionDigits: km < 1e10 ? 1 : 0 }), "억 km"];
  const ly = km / LY_KM;
  if (ly < 1e4) return ["", ly.toLocaleString(undefined, { maximumFractionDigits: ly < 10 ? 2 : 0 }), "광년"];
  if (ly < 1e8) return ["", (ly / 1e4).toLocaleString(undefined, { maximumFractionDigits: ly < 1e5 ? 1 : 0 }), "만 광년"];
  return ["", (ly / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 }), "억 광년"];
}
function setAlt(c){
  let target = typeof c.alt === "function" ? c.alt() : c.alt;
  if (target == null || isNaN(target)) { $("stAlt").innerHTML = ""; return; }
  target = Math.max(0.001, target);
  const from = Math.log10(altShown), to = Math.log10(target), t0 = performance.now(), dur = Math.min(2600, 700 + Math.abs(to - from) * 260), my = ++altAnim;
  const step = now => { if (my !== altAnim) return;
    const f = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - f, 3), v = Math.pow(10, from + (to - from) * e); altShown = v;
    const [pre, num, unit] = fmtAlt(v);
    $("stAlt").innerHTML = `${c.altNote ? c.altNote + " · " : (pre ? "노화도 · " : "노화도에서 ")}${pre ? pre + " " : ""}<b>${num}</b>${unit}`;
    if (f < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ───────── 이야기 ─────────
const fmtLyOrKm = au => fmtDist(au);

// ───────── 사람 눈높이 장면 (view.js) ─────────
const ISLANDS = [["노화도", 34.19, 126.575, 0.25], ["보길도", 34.143, 126.55, 0.3], ["소안도", 34.16, 126.655, 0.25], ["땅끝", 34.298, 126.527, 0.12],
  ["넙도", 34.198, 126.49, 0.1], ["완도", 34.31, 126.75, 0.2], ["횡간도", 34.275, 126.57, 0.1], ["해남", 34.36, 126.56, 0.3]];
const islandMarks = () => ISLANDS.map(([label, lat, lon, alt]) => ({ label, lat, lon, alt, maxAlt: 25, maxDist: 60 }));
let pvTimer = null, pvPlanes = [], pvPlaneT = 0;
const kstStr = ms => { const d = new Date(ms + 9 * 3600000); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };
const HERE = { lat: 34.2, lon: 126.6, alt: 0.01 };
function sunEl(ms = PV.now()){ return PV.azel(HERE, PV.ecef(0, 0, 0).map((x, k) => x + PV.astro(ms).sun[k] * 1.5e8)).el; }
function bodyAzel(from, which, ms = PV.now()){ const A = PV.astro(ms); return which === "moon" ? PV.azel(from, A.moon) : PV.azel(from, A.sun.map(x => x * 1.5e8)); }
function findTime(pred){ const t0 = Date.now(); for (let m = 0; m < 48 * 60; m += 10){ const ms = t0 + m * 60000; if (pred(ms)) return ms - Date.now(); } return null; }
function timeChip(){
  const off = PV.timeOffset;
  return off ? `🕐 시간을 옮겨 본 장면 · <b>${kstStr(PV.now())}</b>` : `🕐 지금 이 시각 · ${kstStr(Date.now())}`;
}
function pvEnter(){ closeLayers(); hidePhoto(); window.earthFace = null; clearInterval(pvTimer); PV.show(); PV.setFollow(null); PV.setDrift(0); PV.setBob(false); }
function pvLeave(){ clearInterval(pvTimer); if (window.PV) PV.hide(); }
function pvFerryMarks(){
  if (!ferryData) return [];
  const now = (() => { const d = new Date(PV.now() + 9 * 3600000); return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; })();
  const out = [];
  for (const it of ferryData.items){ if (/비운|통제|결항/.test(it.se)) continue; const at = ferryNow(it, now); if (!at || at.docked) continue;
    out.push({ kind: "ship", lat: at.lat, lon: at.lon, alt: 0.003, label: it.ship, sub: `${at.from}→${at.to}`, color: "#4fc3ff", maxAlt: 25, maxDist: 40 }); }
  return out;
}
async function loadPvPlanes(){
  try { const d = await (await fetch(`/api/planes?lat=${NOHWA.lat}&lon=${NOHWA.lon}&nm=${PLANE_NM}`)).json(); if (d.ok) { pvPlanes = d.ac.filter(p => p.alt_baro !== "ground"); pvPlaneT = Date.now(); } } catch (e) {}
}
function pvPlaneMarks(){
  const dt = (Date.now() - pvPlaneT) / 1000;
  return pvPlanes.map(p => { const dist = (p.gs || 0) * 0.514444 * Math.min(60, dt), tr = (p.track || 0) * Math.PI / 180;
    const lat = p.lat + dist * Math.cos(tr) / 111320, lon = p.lon + dist * Math.sin(tr) / (111320 * Math.cos(p.lat * Math.PI / 180)), m = altM(p);
    return { kind: "plane", lat, lon, alt: m / 1000, label: callsign(p) || p.r || "비행기", sub: `${airline(p) || ""} ${(m / 1000).toFixed(1)}km`.trim(), color: altCol(m), maxDist: 400 }; });
}
function dayButton(){
  return [PV.timeOffset ? "🕐 지금 시각으로" : "☀️ 낮 풍경으로", () => {
    if (PV.timeOffset) PV.setTimeOffset(0);
    else { const off = findTime(ms => { const a = bodyAzel(HERE, "sun", ms); return a.el > 18 && a.el < 32 && a.az > 180; }); if (off != null) PV.setTimeOffset(off); }
    show(cur); }];
}
function dayBtn(){ return (PV.timeOffset || sunEl() < 5) ? [dayButton()] : []; }
function seeBody(which, alt, fov){
  const from = { lat: 34.2, lon: 126.6, alt };
  let a = bodyAzel(from, which);
  const dip = -Math.acos(6371 / (6371 + alt)) * 180 / Math.PI;
  const name = which === "moon" ? "달" : "해";
  if (a.el < dip + 1){
    PV.flyTo({ ...from, az: a.az, el: Math.max(a.el, -3), fov: 50 }, 4000);
    const off = findTime(ms => bodyAzel(from, which, ms).el > 20);
    PV.note(`${which === "moon" ? "🌙" : "☀️"} 지금 ${which === "moon" ? "달은" : "해는"} 지구 반대편, 지평선 아래에 있어요.` + (off != null ? ` 다음에 높이 뜨는 때는 <b>${kstStr(Date.now() + off)}</b>쯤이에요.` : ""));
    return off;
  }
  PV.flyTo({ ...from, az: a.az, el: a.el, fov }, 5000);
  PV.note(`${which === "moon" ? "🌙" : "☀️"} ${which === "moon" ? "달은" : "해는"} 지금 노화도에서 ${["북", "북동", "동", "남동", "남", "남서", "서", "북서"][Math.round(a.az / 45) % 8]}쪽 하늘, 고도 ${Math.round(a.el)}°에 있어요` +
    (which === "moon" ? ` · 밝은 부분 ${Math.round(PV.astro(PV.now()).illum * 100)}%` : ""));
  return null;
}
function jumpButton(which){
  return [which === "moon" ? "🌙 달이 뜬 시각으로 가 보기" : "☀️ 해가 뜬 시각으로 가 보기", () => {
    const from = { lat: 34.2, lon: 126.6, alt: 35 }, off = findTime(ms => bodyAzel(from, which, ms).el > 20);
    if (off != null){ PV.setTimeOffset(off); show(cur); } }];
}
let issFollowOn = false;
function issCam(){
  const t = new Date(PV.now()), a = issAt(t), b = issAt(new Date(t.getTime() + 20000));
  if (!a || !b) return null;
  const y = Math.sin((b.lon - a.lon) * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180);
  const x = Math.cos(a.lat * Math.PI / 180) * Math.sin(b.lat * Math.PI / 180) - Math.sin(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.cos((b.lon - a.lon) * Math.PI / 180);
  return { lat: a.lat, lon: a.lon, alt: 420, az: (Math.atan2(y, x) * 180 / Math.PI + 360) % 360 };
}

const CH = [
  { t: "배 갑판 위에서", pv: true, alt: 0.004, altNote: "배 갑판", go(){
      pvEnter(); PV.setBob(true);
      PV.flyTo({ lat: 34.255, lon: 126.541, alt: 0.004, az: 155, el: 1.2, fov: 42 }, 1500);
      loadFerries();
      const upd = () => PV.setMarkers([...islandMarks(), ...pvFerryMarks()]); upd(); pvTimer = setInterval(upd, 2000);
      PV.note(timeChip() + (sunEl() < -4 && !PV.timeOffset ? "<br>지금 노화도는 밤이에요. 아래 <b>☀️ 낮 풍경으로</b>를 누르면 낮 바다를 볼 수 있어요." : "")); },
    extra: () => [...dayBtn(), ["🗺️ 뱃길 지도", () => $("layer").classList.contains("show") ? closeLayers() : openMap("ships")]],
    p: "땅끝에서 산양으로 가는 배 갑판 위예요. 눈앞에 다가오는 섬이 <b>노화도</b>, 오른쪽 너머로 보길도가 보여요. 하늘빛과 해·달의 자리는 <b>지금 이 시각 그대로</b>예요. 파란 배 표시는 지금 운항 중인 여객선이에요." },
  { t: "갈매기 눈높이", pv: true, alt: 0.35, go(){
      pvEnter(); PV.flyTo({ lat: 34.245, lon: 126.505, alt: 0.35, az: 125, el: -13, fov: 62 }, 5000); setTimeout(() => PV.setDrift(0.8), 5000);
      const upd = () => PV.setMarkers([...islandMarks(), ...pvFerryMarks()]); upd(); pvTimer = setInterval(upd, 2000); PV.note(timeChip()); },
    extra: () => [...dayBtn()],
    p: "갈매기처럼 조금만 날아오르면 섬들이 한눈에 들어와요. 노화도와 보길도, 소안도가 바다 위에 놓여 있고, 그 사이로 매일 배가 다녀요. 우리가 사는 곳은 <b>이만큼의 땅과 바다</b>예요." },
  { t: "비행기 창가 자리", pv: true, alt: 10.5, go(){
      pvEnter(); PV.flyTo({ lat: 34.40, lon: 126.40, alt: 10.5, az: 150, el: -11, fov: 70 }, 6000);
      loadPvPlanes(); let k = 0;
      const upd = () => { PV.setMarkers([...islandMarks(), ...pvPlaneMarks()]); if (++k % 15 === 0) loadPvPlanes(); }; upd(); pvTimer = setInterval(upd, 1000);
      PV.note(timeChip() + "<br>✈️ 점은 지금 이 하늘을 실제로 날고 있는 비행기예요"); },
    extra: () => [...dayBtn(), ["📡 레이더로 보기", () => $("layer").classList.contains("show") ? closeLayers() : openMap("planes")]],
    p: "고도 10km, 여객기 창가 자리예요. 발아래로 노화도가 손톱만 해졌어요. 같은 하늘에 <b>지금 이 순간</b> 제주로, 상하이로, 마닐라로 가는 사람들이 떠 있어요." },
  { t: "달을 올려다보다", pv: true, alt: 384400, altNote: "달까지", go(){
      pvEnter(); const off = seeBody("moon", 35, 4.5); },
    extra: () => [["🔭 망원경 끄기/켜기", () => { const s = PV.state; PV.flyTo({ fov: s.fov < 20 ? 60 : 4.5 }, 2000); }], jumpButton("moon"), ...(PV.timeOffset ? [["🕐 지금 시각으로", () => { PV.setTimeOffset(0); show(cur); }]] : [])],
    p: "하늘 높이 올라 고개를 들면, 38만 km 떨어진 <b>달</b>. 사람이 직접 걸어 본 가장 먼 곳이에요. 노화도 앞바다의 밀물과 썰물을 날마다 끌어당기는 것도 이 달이에요. 화면의 달은 지금 이 시각 실제 방향과 모양이에요." },
  { t: "태양을 바라보다", pv: true, alt: 1.496e8, altNote: "태양까지", photo: "sun", photoLater: true, go(){
      pvEnter(); PV.flyTo({ alt: 110 }, 2500); setTimeout(() => { if (CH[cur].t === "태양을 바라보다") seeBody("sun", 110, 10); }, 2600); },
    extra: () => [jumpButton("sun"), ...(PV.timeOffset ? [["🕐 지금 시각으로", () => { PV.setTimeOffset(0); show(cur); }]] : [])],
    p: "공기 위로 올라서면 하늘은 낮에도 까맣고, 태양은 눈부신 흰 별이 돼요. 지금 노화도를 비추는 햇빛은 <b>8분 20초 전</b>에 저 태양을 떠난 빛이에요. (실제로는 절대 맨눈으로 보면 안 돼요)" },
  { t: "우주정거장 창밖", pv: true, alt: 420, photo: "iss", photoLater: true, go(){
      pvEnter(); PV.setMarkers([{ kind: "ring", lat: 34.19, lon: 126.57, alt: 0, label: "노화도", r: 10, color: "#ffb347" }]);
      const go2 = () => { const c = issCam(); if (!c) { PV.flyTo({ lat: 30, lon: 126.6, alt: 420, az: 20, el: -27, fov: 75 }, 5000); return; }
        PV.flyTo({ ...c, el: -27, fov: 75 }, 5000); setTimeout(() => { if (CH[cur].t === "우주정거장 창밖") PV.setFollow(() => { const q = issCam(); return q ? { ...q } : null; }); }, 5100); };
      loadISS().then(go2); PV.note(timeChip()); },
    extra: () => [["📺 우주정거장 생중계", openISSLive]], live: true,
    p: "땅에서 420km 위, 국제우주정거장 창밖이에요. 지금 이 순간 정거장이 실제로 지나는 자리에서 본 모습이에요. <b>90분마다 지구를 한 바퀴</b> 돌아서 우주인들은 하루에 해돋이를 열여섯 번 봐요." },
  { t: "멀어지는 지구", pv: true, alt: 384400, altNote: "지구에서", go(){
      pvEnter(); PV.set({ lat: 30, lon: 126.6, alt: 1500, az: 0, el: -89.9, fov: 60 });
      PV.flyTo({ lat: 30, lon: 126.6, alt: 380000, az: 0, el: -89.9, fov: 28 }, 11000);
      PV.setMarkers([{ kind: "ring", lat: 34.19, lon: 126.57, alt: 0, label: "노화도", r: 8, color: "#ffb347", maxAlt: 60000 }, { dir: "moon", kind: "ring", label: "달", r: 10, color: "#cfd8ea" }]); PV.note(""); },
    p: "계속 멀어지면 바다도 섬도 나라도 하나로 이어진 <b>둥근 공</b>이 돼요. 달 거리쯤에서 지구는 팔을 뻗었을 때 엄지손톱보다 작아요. 국경선은 어디에도 보이지 않아요." },
  { t: "태양계의 끝", alt: 4.5e9, altNote: "해왕성까지", photo: "saturn", go(){ goStep(2); },
    p: "해왕성까지 빛으로 4시간. 여기서는 지구가 벌써 <b>작은 점 하나</b>로 보여요." },
  { t: "보이저 1호", alt: () => Math.hypot(pos.voyager1.x, pos.voyager1.y, pos.voyager1.z) * AU_KM, photo: "voyager", go(){ closeLayers(); goTo("voyager1"); select(null); },
    p: () => { const au = Math.hypot(pos.voyager1.x, pos.voyager1.y, pos.voyager1.z), sec = au * LIGHT_AU_S;
      return `1977년에 떠난 보이저 1호는 지금 지구에서 약 <b>${fmtKm(au * AU_KM)}</b>, 빛으로도 <b>${fmtDur(sec)}</b> 걸리는 곳에 있어요. 50년 가까이 지난 지금도 집으로 신호를 보내고 있습니다.`; } },
  { t: "창백한 푸른 점", pbd: true, alt: 6e9, altNote: "1990년 보이저 1호의 자리", photo: "pbd", modelLabel: "🎯 지구 위치 표시 보기", go(){ openPBD(); },
    p: "1990년 2월 14일, 태양계 밖으로 나가던 보이저 1호가 카메라를 돌려 마지막으로 집을 찍었어요. 약 60억 km 떨어진 곳에서요. 사진 속 지구는 햇빛 줄기 사이에 떠 있는, <b>화소 하나도 채우지 못하는 점</b>이었어요.<br><br>이 사진을 찍자고 한 천문학자 칼 세이건은 이 점을 <b>'창백한 푸른 점'</b>이라고 불렀어요. 그리고 지금까지 있었던 모든 사람과 모든 일이 저 점 하나 위에서 벌어졌다는 것, 그러니 서로를 조금 더 너그럽게 대하고 우리의 하나뿐인 집을 아껴야 한다는 이야기를 남겼어요." },
  { t: "이웃 별", alt: 4.24 * LY_KM, photo: "stars", go(){ closeLayers(); goStep(5); },
    p: "가장 가까운 별, 프록시마 센타우리까지 빛으로 4년 3개월. 보이저 1호의 속도로 가면 <b>7만 년이 넘게</b> 걸려요." },
  { t: "우리 은하", alt: 26000 * LY_KM, altNote: "은하 중심까지", photo: "milkyway", go(){ goStep(8); },
    p: "별 1,000억 개가 넘는 우리 은하. 태양은 그중 평범한 별 하나이고, 노화도는 그 별을 도는 작은 행성의 작은 섬이에요." },
  { t: "안드로메다 은하", alt: 2.5e6 * LY_KM, photo: "andromeda", go(){ goStep(10); },
    p: "지금 보이는 안드로메다의 빛은 <b>250만 년 전</b>에 출발했어요. 그 빛이 떠날 때 지구에는 아직 사람이 없었어요." },
  { t: "볼 수 있는 우주의 끝", alt: 4.65e10 * LY_KM, photo: "deep", go(){ goStep(12); },
    p: "지금 거리로 465억 광년. 우리가 볼 수 있는 우주의 끝이에요. 이 안에만 <b>은하가 수천억 개</b> 있어요." },
  { t: "다시 배 위로", pv: true, alt: 0.004, altNote: "다시 배 갑판", go(){
      pvEnter(); PV.setBob(true); PV.set({ lat: 34.255, lon: 126.541, alt: 0.004, az: 155, el: 1.2, fov: 42 });
      PV.setMarkers([...islandMarks(), ...pvFerryMarks()]); PV.note(timeChip()); },
    p: () => { const kst = new Date(PV.now() + 9*3600000), hh = kst.getUTCHours();
      return `그리고 다시 배 위. 이 넓은 우주에서 우리가 아는 집은 아직 여기 하나예요.<br><br>지금 노화도는 <b>${hh >= 6 && hh < 18 ? "낮" : "밤"}</b>이에요. 오늘도 앞바다에는 배가 오가고, 달은 바닷물을 끌어당기고, 사람들은 저마다의 하루를 살아요. 저 작은 점 위의, 바로 이곳에서요.`; },
    last: true }
];
let cur = -1, liveTimer = null;
function live(html){ const el = $("stLive"); el.innerHTML = html; el.classList.toggle("show", !!html); }
function show(i){
  i = Math.max(0, Math.min(CH.length - 1, i)); cur = i; const c = CH[i];
  $("stT").textContent = `${i + 1} / ${CH.length} · ${c.t}`;
  $("stP").innerHTML = typeof c.p === "function" ? c.p() : c.p; $("stP").scrollTop = 0;
  $("stPrev").disabled = i === 0; $("stNext").textContent = c.last ? "처음으로 ↺" : "다음 ▶";
  const ex = $("stExtra"); ex.innerHTML = "";
  for (const [label, fn] of (typeof c.extra === "function" ? c.extra() : c.extra) || []){ const b = document.createElement("button"); b.textContent = label; b.onclick = fn; ex.appendChild(b); }
  if (c.photo){ const b = document.createElement("button"); b.id = "phBtn"; b.onclick = () => phOn ? hidePhoto() : showPhoto(c.photo); ex.insertBefore(b, ex.firstChild); }
  $("stDots").innerHTML = CH.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("");
  live(""); clearInterval(liveTimer);
  if (c.live) liveTimer = setInterval(updateISSLive, 1000);
  if (!c.layer){
    if (mapMode === "planes" && map){   // 하늘에서 우주로: 지도가 멀어지며 사라져요
      const lay = $("layer"); map.flyTo([NOHWA.lat, NOHWA.lon], 3, { duration: 1.8 });
      lay.style.transition = "opacity 1.2s ease .7s"; lay.style.opacity = 0;
      leaveTimer = setTimeout(() => { closeLayers(); lay.style.transition = ""; lay.style.opacity = ""; }, 2000);
    } else closeLayers();
  }
  setAlt(c);
  if (!c.pbd) { $("pbd").classList.remove("show"); pbdOn = false; }
  if (!c.face) window.earthFace = null;
  if (!c.pv) pvLeave(); else PV.note("");
  c.go();
  if (c.photo && !c.photoLater) showPhoto(c.photo); else hidePhoto();
  preloadPhoto(i + 1);
}
function updateISSLive(){
  if (!satrec){ if (issInfo && issInfo.error) live("우주정거장 궤도 데이터를 받지 못했어요."); else live("우주정거장 위치를 계산하는 중…"); return; }
  const p = issAt(new Date(simMs)); if (!p) return;
  const lat = `${Math.abs(p.lat).toFixed(1)}°${p.lat >= 0 ? "N" : "S"}`, lon = `${Math.abs(p.lon).toFixed(1)}°${p.lon >= 0 ? "E" : "W"}`;
  const dk = gcKm(NOHWA, p);
  live(`🛰️ 지금 위치 <b>${lat}, ${lon}</b> · 고도 <b>${Math.round(p.alt)}km</b> · 초속 <b>${p.speed.toFixed(2)}km</b><br>노화도에서 땅 위로 <b>${Math.round(dk).toLocaleString("ko-KR")}km</b> 떨어진 곳 위를 지나는 중<br><small style="color:#8b95ad">궤도 데이터: ${issInfo.source}</small>`);
}
$("stNext").onclick = () => cur === CH.length - 1 ? show(0) : show(cur + 1);
$("stPrev").onclick = () => show(cur - 1);
$("stX").onclick = endStory;
function endStory(){ pvLeave(); hidePhoto(); window.earthFace = null; $("story").classList.remove("show"); document.body.classList.remove("storying"); closeLayers(); clearInterval(liveTimer); showISS = true; cur = -1;
  showToast("자유롭게 둘러보세요. 천체를 누르면 정보가 나와요"); }
window.startStory = () => { document.body.classList.add("storying"); $("story").classList.add("show"); show(0); };
// 자유 모드에서도 지구를 크게 보면 우주정거장이 보이도록
showISS = true; loadISS();
})();
