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
let mapMode = null;
async function openMap(mode = "ships"){
  mapMode = mode;
  $("layer").classList.add("show"); $("cams").classList.remove("show"); $("map").style.display = "block";
  loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  if (!map){
    map = L.map("map", { zoomControl: false, attributionControl: true }).setView([NOHWA.lat - 0.04, NOHWA.lon], 10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 15, attribution: "© OpenStreetMap 기여자" }).addTo(map);
    L.circleMarker([NOHWA.lat, NOHWA.lon], { radius: 6, color: "#ffb347", fillColor: "#ffb347", fillOpacity: 1 }).addTo(map).bindTooltip("노화도", { permanent: true, direction: "right" });
    shipLayer = L.layerGroup().addTo(map); planeLayer = L.layerGroup().addTo(map);
  }
  setTimeout(() => map.invalidateSize(), 50);
  clearInterval(shipTimer); clearInterval(planeTimer); clearInterval(planeAnim); shipLayer.clearLayers(); planeLayer.clearLayers();
  if (mode === "ships"){ map.setView([NOHWA.lat - 0.04, NOHWA.lon], 10); loadShips(); shipTimer = setInterval(loadShips, 60000); }
  else { map.setView([NOHWA.lat, NOHWA.lon], 7); loadPlanes(); planeTimer = setInterval(loadPlanes, 20000); planeAnim = setInterval(movePlanes, 1000); }
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
  return L.divIcon({ className: "ship-ico", iconSize: [26, 26], iconAnchor: [13, 13],
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
  if (mapMode !== "planes") return;
  if (!d.ok){ note.textContent = `✈️ 비행기 정보를 받지 못했어요 (${d.error || "오류"}). 20초 뒤 다시 시도해요.`; return; }
  const now = Date.now(), seen = new Set();
  for (const p of d.ac){
    seen.add(p.hex);
    let o = planeMarks.get(p.hex);
    if (!o){ o = { m: L.marker([p.lat, p.lon], { icon: planeIcon(p) }).addTo(planeLayer) }; planeMarks.set(p.hex, o); }
    o.p = p; o.t0 = now; o.m.setLatLng([p.lat, p.lon]); o.m.setIcon(planeIcon(p)); o.m.bindPopup(planePopup(p));
  }
  for (const [h, o] of planeMarks) if (!seen.has(h)){ planeLayer.removeLayer(o.m); planeMarks.delete(h); }
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
    o.m.setLatLng([p.lat + dist * Math.cos(tr) / 111320, p.lon + dist * Math.sin(tr) / (111320 * Math.cos(p.lat * Math.PI / 180))]);
  }
}

// ───────── 세계의 창 (실시간 카메라) ─────────
async function openCams(){
  clearInterval(shipTimer); clearInterval(planeTimer); clearInterval(planeAnim); mapMode = null;
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
function closeLayers(){ $("layer").classList.remove("show"); $("cams").classList.remove("show"); clearInterval(shipTimer); clearInterval(planeTimer); clearInterval(planeAnim); mapMode = null; $("pbd").classList.remove("show"); pbdOn = false; }

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
  { t: "노화도 앞바다", layer: true, go(){ openMap("ships"); },
    p: "출발은 노화도 앞바다예요. 지금 이 순간에도 여객선과 화물선, 고깃배가 이 바다를 오가요. 지도 위의 배는 <b>지금 실제로 위치 신호를 보내고 있는 배</b>들이에요." },
  { t: "세계의 창", layer: true, go(){ openCams(); },
    p: "같은 시각, 지구 어딘가는 한밤이고 어딘가는 막 해가 뜨고 있어요. 세계 곳곳에 공개된 카메라로 <b>지금 그곳</b>을 들여다봐요." },
  { t: "노화도 하늘의 비행기", layer: true, go(){ openMap("planes"); },
    p: "고개를 들면 노화도 하늘 높이 10km에도 길이 있어요. 제주와 김포를 오가는 국내선, 동남아와 중국으로 가는 국제선이 <b>지금 이 위를</b> 지나가고 있어요." },
  { t: "우주정거장", face: true, go(){ closeLayers(); showISS = true; window.earthFace = () => { const q = issAt(new Date(simMs)); return q ? q.lon : 126.6; }; goTo("earth"); select(null); loadISS().then(ok => { if (!ok) live("우주정거장 궤도 데이터를 받지 못했어요."); }); },
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
  { t: "창백한 푸른 점", pbd: true, go(){ openPBD(); },
    p: "1990년 2월 14일, 태양계 밖으로 나가던 보이저 1호가 카메라를 돌려 마지막으로 집을 찍었어요. 약 60억 km 떨어진 곳에서요. 사진 속 지구는 햇빛 줄기 사이에 떠 있는, <b>화소 하나도 채우지 못하는 점</b>이었어요.<br><br>이 사진을 찍자고 한 천문학자 칼 세이건은 이 점을 <b>'창백한 푸른 점'</b>이라고 불렀어요. 그리고 지금까지 있었던 모든 사람과 모든 일이 저 점 하나 위에서 벌어졌다는 것, 그러니 서로를 조금 더 너그럽게 대하고 우리의 하나뿐인 집을 아껴야 한다는 이야기를 남겼어요." },
  { t: "이웃 별", go(){ closeLayers(); goStep(5); },
    p: "가장 가까운 별, 프록시마 센타우리까지 빛으로 4년 3개월. 보이저 1호의 속도로 가면 <b>7만 년이 넘게</b> 걸려요." },
  { t: "우리 은하", go(){ goStep(8); },
    p: "별 1,000억 개가 넘는 우리 은하. 태양은 그중 평범한 별 하나이고, 노화도는 그 별을 도는 작은 행성의 작은 섬이에요." },
  { t: "안드로메다 은하", go(){ goStep(10); },
    p: "지금 보이는 안드로메다의 빛은 <b>250만 년 전</b>에 출발했어요. 그 빛이 떠날 때 지구에는 아직 사람이 없었어요." },
  { t: "볼 수 있는 우주의 끝", go(){ goStep(12); },
    p: "지금 거리로 465억 광년. 우리가 볼 수 있는 우주의 끝이에요. 이 안에만 <b>은하가 수천억 개</b> 있어요." },
  { t: "다시 노화도로", face: true, go(){ closeLayers(); showISS = false; window.earthFace = () => 126.6; follow = null; goTo("earth"); select(null); setTimeout(() => { follow = "earth"; }, 4000); },
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
  if (!c.layer) closeLayers();
  if (!c.pbd) { $("pbd").classList.remove("show"); pbdOn = false; }
  if (!c.face) window.earthFace = null;
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
