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
#layer{position:fixed;inset:0;z-index:3;display:none;background:#02030a}
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
.leaflet-popup-content{font-size:12.5px;line-height:1.55}
`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
document.body.insertAdjacentHTML("beforeend", `
<div id="layer"><div id="map"></div><div id="mapNote"></div><div id="cams"></div></div>
<div id="pbd"><canvas id="pbdc"></canvas></div>
<div id="story"><button class="st-x" id="stX" aria-label="이야기 끝내기">×</button>
  <div class="st-t" id="stT"></div><div class="st-p" id="stP"></div><div class="st-live" id="stLive"></div>
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
async function openMap(){
  $("layer").classList.add("show"); $("cams").classList.remove("show"); $("map").style.display = "block";
  loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  if (!map){
    map = L.map("map", { zoomControl: false, attributionControl: true }).setView([NOHWA.lat - 0.04, NOHWA.lon], 10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 15, attribution: "© OpenStreetMap 기여자" }).addTo(map);
    L.circleMarker([NOHWA.lat, NOHWA.lon], { radius: 6, color: "#ffb347", fillColor: "#ffb347", fillOpacity: 1 }).addTo(map).bindTooltip("노화도", { permanent: true, direction: "right" });
    shipLayer = L.layerGroup().addTo(map);
  }
  setTimeout(() => map.invalidateSize(), 50);
  loadShips(); clearInterval(shipTimer); shipTimer = setInterval(loadShips, 60000);
}
async function loadShips(){
  const note = $("mapNote");
  note.className = "show"; note.textContent = "🚢 지금 이 바다의 배 신호를 모으는 중… (7초쯤 걸려요)";
  let d; try { d = await (await fetch("/api/ships")).json(); } catch (e) { d = { ok: false, error: "연결 실패" }; }
  shipLayer.clearLayers();
  if (!d.ok){
    note.innerHTML = d.need ? "🚢 배 위치는 <b>선박위치 서비스 키</b>를 넣으면 나와요. 지금은 지도만 보여 드려요." : `🚢 배 정보를 받지 못했어요 (${d.error || "오류"}). 1분 뒤 다시 시도해요.`;
    return;
  }
  for (const s of d.ships){
    const ang = s.heading != null && s.heading < 360 ? s.heading : (s.cog || 0), moving = (s.sog || 0) > 0.5, col = SHIP_COL(s.type);
    const svg = moving ? `<svg width="22" height="22" viewBox="-11 -11 22 22" style="transform:rotate(${ang}deg)"><path d="M0,-9 L5,7 L0,4 L-5,7 Z" fill="${col}" stroke="#000" stroke-width="1"/></svg>`
                       : `<svg width="14" height="14" viewBox="-7 -7 14 14"><circle r="4.5" fill="${col}" stroke="#000" stroke-width="1"/></svg>`;
    const icon = L.divIcon({ html: svg, className: "ship-ico", iconSize: moving ? [22, 22] : [14, 14], iconAnchor: moving ? [11, 11] : [7, 7] });
    const kmh = s.sog != null ? (s.sog * 1.852).toFixed(0) : "-";
    L.marker([s.lat, s.lon], { icon }).addTo(shipLayer).bindPopup(
      `<b>${s.name || "이름 없음"}</b><br>${SHIP_TYPE(s.type)}${s.len ? ` · 길이 ${s.len}m` : ""}<br>속도 ${moving ? kmh + "km/h" : "정박·정지"}${s.dest ? `<br>목적지 ${s.dest}` : ""}`);
  }
  note.innerHTML = d.ships.length ? `🚢 지금 이 바다에서 신호를 보낸 배 <b>${d.ships.length}척</b> · 배를 누르면 이름과 속도가 나와요<br><small>파랑 여객선 · 초록 화물선 · 노랑 어선 · 주황 유조선 / 출처: aisstream.io</small>`
                                  : "🚢 방금 7초 동안은 이 바다에서 잡힌 배 신호가 없었어요. 1분마다 다시 확인해요.";
}

// ───────── 세계의 창 (실시간 카메라) ─────────
async function openCams(){
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
    el.querySelector("small").textContent = [c.city, c.country].filter(Boolean).join(", ");
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
function closeLayers(){ $("layer").classList.remove("show"); $("cams").classList.remove("show"); clearInterval(shipTimer); $("pbd").classList.remove("show"); pbdOn = false; }

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

// ───────── 이야기 ─────────
const fmtLyOrKm = au => fmtDist(au);
const CH = [
  { t: "노화도 앞바다", go(){ openMap(); },
    p: "출발은 노화도 앞바다예요. 지금 이 순간에도 여객선과 화물선, 고깃배가 이 바다를 오가요. 지도 위의 배는 <b>지금 실제로 위치 신호를 보내고 있는 배</b>들이에요." },
  { t: "세계의 창", go(){ openCams(); },
    p: "같은 시각, 지구 어딘가는 한밤이고 어딘가는 막 해가 뜨고 있어요. 세계 곳곳에 공개된 카메라로 <b>지금 그곳</b>을 들여다봐요." },
  { t: "우주정거장", go(){ closeLayers(); showISS = true; window.earthFace = () => { const q = issAt(new Date(simMs)); return q ? q.lon : 126.6; }; goTo("earth"); select(null); loadISS().then(ok => { if (!ok) live("우주정거장 궤도 데이터를 받지 못했어요."); }); },
    p: "땅에서 약 420km 위. 국제우주정거장은 <b>90분마다 지구를 한 바퀴</b> 돌아서, 우주인들은 하루에 해돋이를 열여섯 번 봐요. 파란 선이 앞으로 45분 동안 지나갈 길이에요.",
    extra: [["📺 우주정거장 생중계", openISSLive]], live: true },
  { t: "달", go(){ closeLayers(); showISS = false; window.earthFace = null; goStep(0); },
    p: "38만 km, 빛으로 1.3초. 사람이 직접 가 본 가장 먼 곳이에요. 노화도의 <b>밀물과 썰물</b>을 만드는 것도 이 달입니다." },
  { t: "태양과 이웃 행성", go(){ goStep(1); },
    p: "태양까지 1억 5천만 km. 지금 노화도를 비추는 햇빛은 <b>8분 20초 전</b>에 태양을 떠난 빛이에요." },
  { t: "태양계의 끝", go(){ goStep(2); },
    p: "해왕성까지 빛으로 4시간. 여기서는 지구가 벌써 <b>작은 점 하나</b>로 보여요." },
  { t: "보이저 1호", go(){ closeLayers(); goTo("voyager1"); select(null); },
    p: () => { const au = Math.hypot(pos.voyager1.x, pos.voyager1.y, pos.voyager1.z), sec = au * LIGHT_AU_S;
      return `1977년에 떠난 보이저 1호는 지금 지구에서 약 <b>${fmtKm(au * AU_KM)}</b>, 빛으로도 <b>${fmtDur(sec)}</b> 걸리는 곳에 있어요. 50년 가까이 지난 지금도 집으로 신호를 보내고 있습니다.`; } },
  { t: "창백한 푸른 점", go(){ openPBD(); },
    p: "1990년 2월 14일, 태양계 밖으로 나가던 보이저 1호가 카메라를 돌려 마지막으로 집을 찍었어요. 약 60억 km 떨어진 곳에서요. 사진 속 지구는 햇빛 줄기 사이에 떠 있는, <b>화소 하나도 채우지 못하는 점</b>이었어요.<br><br>이 사진을 찍자고 한 천문학자 칼 세이건은 이 점을 <b>'창백한 푸른 점'</b>이라고 불렀어요. 그리고 지금까지 있었던 모든 사람과 모든 일이 저 점 하나 위에서 벌어졌다는 것, 그러니 서로를 조금 더 너그럽게 대하고 우리의 하나뿐인 집을 아껴야 한다는 이야기를 남겼어요." },
  { t: "이웃 별", go(){ closeLayers(); goStep(5); },
    p: "가장 가까운 별, 프록시마 센타우리까지 빛으로 4년 3개월. 보이저 1호의 속도로 가면 <b>7만 년이 넘게</b> 걸려요." },
  { t: "우리 은하", go(){ goStep(8); },
    p: "별 1,000억 개가 넘는 우리 은하. 태양은 그중 평범한 별 하나이고, 노화도는 그 별을 도는 작은 행성의 작은 섬이에요." },
  { t: "안드로메다 은하", go(){ goStep(10); },
    p: "지금 보이는 안드로메다의 빛은 <b>250만 년 전</b>에 출발했어요. 그 빛이 떠날 때 지구에는 아직 사람이 없었어요." },
  { t: "볼 수 있는 우주의 끝", go(){ goStep(12); },
    p: "지금 거리로 465억 광년. 우리가 볼 수 있는 우주의 끝이에요. 이 안에만 <b>은하가 수천억 개</b> 있어요." },
  { t: "다시 노화도로", go(){ closeLayers(); showISS = false; window.earthFace = () => 126.6; follow = null; goTo("earth"); select(null); setTimeout(() => { follow = "earth"; }, 4000); },
    p: () => { const kst = new Date(simMs + 9*3600000), hh = kst.getUTCHours();
      return `그리고 다시 집으로. 이 넓은 우주에서 우리가 아는 집은 아직 여기 하나예요.<br><br>지금 노화도는 <b>${hh >= 6 && hh < 18 ? "낮" : "밤"}</b>이에요. 오늘도 앞바다에는 배가 오가고, 달이 끌어당기는 대로 물이 들고 납니다.`; },
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
  for (const [label, fn] of c.extra || []){ const b = document.createElement("button"); b.textContent = label; b.onclick = fn; ex.appendChild(b); }
  $("stDots").innerHTML = CH.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("");
  live(""); clearInterval(liveTimer);
  if (c.live) liveTimer = setInterval(updateISSLive, 1000);
  if (i !== 0 && i !== 1) $("layer").classList.remove("show");
  if (i !== 7) { $("pbd").classList.remove("show"); pbdOn = false; }
  if (i !== 2 && i !== 12) window.earthFace = null;
  c.go();
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
function endStory(){ window.earthFace = null; $("story").classList.remove("show"); document.body.classList.remove("storying"); closeLayers(); clearInterval(liveTimer); showISS = true; cur = -1;
  showToast("자유롭게 둘러보세요. 천체를 누르면 정보가 나와요"); }
window.startStory = () => { document.body.classList.add("storying"); $("story").classList.add("show"); show(0); };
// 자유 모드에서도 지구를 크게 보면 우주정거장이 보이도록
showISS = true; loadISS();
})();
