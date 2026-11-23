// 창백한 푸른 점 — 달리는 태양계 (금빛 입자 장면)
// 태양은 초속 약 230km로 은하를 돌고, 행성들은 그 둘레를 돌며 따라가서 우주에 나선을 그려요.
// 궤도면은 태양이 나아가는 방향에 거의 맞서 있어요(약 60° 기울어 있음). 크기와 빠르기는 보기 좋게 줄였어요.
(() => {
const PL = [["수성", 0.39, 0.24, 1.6, "#d9c7a3"], ["금성", 0.72, 0.62, 2.2, "#f3d58a"], ["지구", 1.0, 1.0, 2.6, "#7fc4ff"], ["화성", 1.52, 1.88, 2.0, "#ff9a6b"],
  ["목성", 5.2, 11.9, 4.2, "#f1c27d"], ["토성", 9.5, 29.5, 3.8, "#f5dfa0"], ["천왕성", 19.2, 84, 3.0, "#a9e6e6"], ["해왕성", 30.1, 165, 3.0, "#8fa8ff"]];
// 보기 좋게 줄인 궤도 반지름과 주기
const P = PL.map(([name, au, yr, size, col], i) => ({ name, size, col, r: 34 + i * 27 + (i > 3 ? 14 : 0), per: 5 + Math.pow(i + 1, 1.45) * 3.2, ph: i * 2.1 + 0.7 }));
const V = 12;                          // 태양이 나아가는 빠르기(화면 단위/초)
const TILT = 60 * Math.PI / 180;       // 궤도면과 진행 방향이 이루는 각
// 궤도면의 두 축: e1은 옆(z), e2는 진행 방향(x)에서 60° 일어선 축
const E1 = [0, 0, 1], E2 = [Math.cos(TILT), Math.sin(TILT), 0];
const sunAt = t => [V * t, 0, 0];
function planetAt(p, t){ const a = p.ph + t / p.per * Math.PI * 2, s = sunAt(t), c = Math.cos(a) * p.r, d = Math.sin(a) * p.r;
  return [s[0] + E1[0] * c + E2[0] * d, s[1] + E1[1] * c + E2[1] * d, s[2] + E1[2] * c + E2[2] * d]; }

let cvs, g, on = false, raf = 0, t0 = 0, W = 0, H = 0, dpr = 1, dust = [], stars = [], sprite = {};
function glow(col, r){   // 미리 그려 둔 빛망울
  const k = col + r; if (sprite[k]) return sprite[k];
  const c = document.createElement("canvas"); c.width = c.height = r * 2; const x = c.getContext("2d"), gr = x.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, col + "ff"); gr.addColorStop(0.25, col + "88"); gr.addColorStop(1, col + "00"); x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2); return sprite[k] = c;
}
function init(){
  if (cvs) return;
  cvs = document.createElement("canvas"); cvs.id = "hx";
  const st = document.createElement("style"); st.textContent = `#hx{position:fixed;inset:0;width:100%;height:100%;z-index:3;display:none;background:#000}#hx.show{display:block}
  #hxTitle{position:fixed;left:0;right:0;top:calc(54px + env(safe-area-inset-top));z-index:3;text-align:center;display:none;pointer-events:none;font-weight:900;font-size:25px;line-height:1.25;letter-spacing:-1px;color:#fff;text-shadow:0 2px 14px #000}
  #hxTitle.show{display:block}#hxTitle span{color:#35e0ff}`;
  document.head.appendChild(st);
  const ph = document.getElementById("photo"); document.body.insertBefore(cvs, ph || null);
  const tt = document.createElement("div"); tt.id = "hxTitle"; tt.innerHTML = "지구는 단 1초도<br><span>같은 자리에 있지 않았다</span>"; document.body.insertBefore(tt, ph || null);
  g = cvs.getContext("2d");
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (const p of P) for (let k = 0; k < 230; k++) dust.push({ p, a: rnd() * 6.283, dr: (rnd() - 0.5) * (4 + p.r * 0.05) + (rnd() - 0.5) * 3, dy: (rnd() - 0.5) * 2.5, b: 0.25 + rnd() * 0.75 });
  for (let k = 0; k < 1400; k++){ const r = 12 + Math.pow(rnd(), 0.6) * 300; dust.push({ p: { r, per: 6 + Math.pow(r / 30, 1.45) * 3.2, ph: 0 }, a: rnd() * 6.283, dr: 0, dy: (rnd() - 0.5) * 3, b: 0.12 + rnd() * 0.3, faint: true }); }
  for (let k = 0; k < 420; k++) stars.push([rnd(), rnd(), rnd()]);
  addEventListener("resize", size); size();
}
function size(){ if (!cvs) return; dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cvs.width = W * dpr; cvs.height = H * dpr; }

function frame(ts){
  if (!on) return; raf = requestAnimationFrame(frame);
  const t = (ts - t0) / 1000 + 40;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalCompositeOperation = "source-over"; g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  // 카메라: 태양을 따라가며 천천히 둘레를 돎
  const S = sunAt(t), yaw = 0.42 + Math.sin(t * 0.07) * 0.5, pitch = 0.26 + Math.sin(t * 0.045 + 1) * 0.14, dist = 640 + Math.sin(t * 0.05) * 150;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), f = Math.min(W, H) * 1.5, cx0 = W * 0.5, cy0 = H * 0.42;
  const proj = q => { const x = q[0] - S[0] + 110, y = q[1] - S[1], z = q[2] - S[2];
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + dist;
    if (z2 < 40) return null; const k = f / z2; return [cx0 + x1 * k, cy0 - y2 * k, k]; };
  // 먼 별
  g.fillStyle = "#fff"; for (const [a, b, c] of stars){ g.globalAlpha = 0.15 + c * 0.5; const x = ((a + yaw * 0.05) % 1) * W, y = b * H; g.fillRect(x, y, c > 0.9 ? 1.6 : 1, c > 0.9 ? 1.6 : 1); }
  g.globalAlpha = 1; g.globalCompositeOperation = "lighter";
  // 태양이 지나온 길
  for (let k = 0; k < 260; k++){ const q = proj(sunAt(t - k * 0.3)); if (!q) continue; g.globalAlpha = 0.5 * (1 - k / 260); g.fillStyle = "#ffd98a"; g.fillRect(q[0], q[1], 1.6, 1.6); }
  // 금빛 먼지 고리 (지금의 궤도면)
  for (const d of dust){ const p = d.p, a = d.a + t / p.per * Math.PI * 2, r = p.r + d.dr, c = Math.cos(a) * r, e = Math.sin(a) * r;
    const q = proj([S[0] + E1[0] * c + E2[0] * e - E2[1] * d.dy, S[1] + E2[1] * e + E2[0] * d.dy, S[2] + E1[2] * c]); if (!q) continue;
    g.globalAlpha = d.b * (d.faint ? 0.55 : 0.8) * Math.min(1, q[2] * 1.1); g.fillStyle = d.faint ? "#c9954a" : "#ffcf7a"; const s2 = Math.max(0.8, q[2] * (d.faint ? 1.0 : 1.5)); g.fillRect(q[0], q[1], s2, s2); }
  // 행성이 그려 온 나선
  for (const p of P){
    const n = 420, span = Math.min(p.per * 3.2, 70); let prev = null; const earth = p.name === "지구";
    g.strokeStyle = earth ? "#7fc4ff" : "#f2c66d"; g.lineWidth = earth ? 1.5 : 1;
    for (let k = 0; k <= n; k++){ const tt = t - k / n * span, q = proj(planetAt(p, tt));
      if (q && prev){ g.globalAlpha = (earth ? 0.95 : 0.55) * (1 - k / n); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke(); }
      if (q && k % 6 === 0){ const sq = proj(sunAt(tt)); if (sq){ g.globalAlpha = 0.07 * (1 - k / n); g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(sq[0], sq[1]); g.stroke(); } }   // 태양과 잇는 가는 살
      prev = q; }
  }
  // 태양
  const sq = proj(S); if (sq){ const r = 26 * sq[2] + 14; g.globalAlpha = 1; g.drawImage(glow("#ffb648", 64), sq[0] - r * 2, sq[1] - r * 2, r * 4, r * 4); g.drawImage(glow("#fff3d0", 32), sq[0] - r * 0.6, sq[1] - r * 0.6, r * 1.2, r * 1.2); }
  // 행성과 이름
  g.font = "600 11px sans-serif"; g.textBaseline = "middle";
  for (const p of P){ const q = proj(planetAt(p, t)); if (!q) continue; const r = Math.max(1.6, p.size * q[2] * 1.5), earth = p.name === "지구";
    g.globalCompositeOperation = "lighter"; g.globalAlpha = 1; g.drawImage(glow(p.col, 32), q[0] - r * 3, q[1] - r * 3, r * 6, r * 6);
    g.globalCompositeOperation = "source-over"; g.fillStyle = p.col; g.beginPath(); g.arc(q[0], q[1], r, 0, 7); g.fill();
    if (earth){ g.strokeStyle = "#7fc4ff"; g.globalAlpha = 0.9; g.lineWidth = 1.2; g.beginPath(); g.arc(q[0], q[1], r + 7 + Math.sin(t * 3) * 1.5, 0, 7); g.stroke(); }
    g.globalAlpha = earth ? 1 : 0.7; g.fillStyle = earth ? "#bfe4ff" : "#e8d6b0"; g.font = earth ? "700 13px sans-serif" : "600 10.5px sans-serif";
    g.fillText(earth ? "지구 · 우리는 여기" : p.name, q[0] + r + (earth ? 12 : 6), q[1]); }
  // 진행 방향
  const a1 = proj([S[0] + 70, 0, 0]), a2 = proj([S[0] + 130, 0, 0]);
  if (a1 && a2){ g.globalAlpha = 0.75; g.strokeStyle = "#ffe2a8"; g.fillStyle = "#ffe2a8"; g.lineWidth = 1.2; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); g.stroke(); g.setLineDash([]);
    const an = Math.atan2(a2[1] - a1[1], a2[0] - a1[0]); g.beginPath(); g.moveTo(a2[0] + Math.cos(an) * 9, a2[1] + Math.sin(an) * 9); g.lineTo(a2[0] + Math.cos(an + 2.5) * 6, a2[1] + Math.sin(an + 2.5) * 6); g.lineTo(a2[0] + Math.cos(an - 2.5) * 6, a2[1] + Math.sin(an - 2.5) * 6); g.fill();
    g.font = "600 10.5px sans-serif"; g.fillText("태양이 가는 방향 · 초속 230km", a2[0] + 14, a2[1] + (an < 0 ? -10 : 10)); }
  g.globalAlpha = 1;
}
window.HX = {
  show(){ init(); on = true; t0 = performance.now(); cvs.classList.add("show"); document.getElementById("hxTitle").classList.add("show"); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); },
  hide(){ on = false; cancelAnimationFrame(raf); if (cvs){ cvs.classList.remove("show"); document.getElementById("hxTitle").classList.remove("show"); } },
  get on(){ return on; }
};
})();
