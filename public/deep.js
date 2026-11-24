// 창백한 푸른 점 — 먼 우주 장면 (three.js)
// 토성 곁, 보이저의 자리, 별 사이, 우리 은하, 은하의 바다. 장면마다 영화처럼 정해진 카메라 길을 따라 움직여요.
// 크기·거리는 보기 좋게 다듬은 값이 섞여 있어요(설명 글은 실제 값).
import * as THREE from "./lib/three.module.min.js";

const $ = id => document.getElementById(id);
let renderer, cam, scene, raf = 0, on = false, cur = null, t0 = 0, built = {}, labels = [], W = 0, H = 0;
const loader = new THREE.TextureLoader();
const tex = (url, srgb = true) => { const t = loader.load(url); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const clamp01 = x => Math.max(0, Math.min(1, x));
const lerp = (a, b, f) => a + (b - a) * f;

// ── 빛망울·별 모양 그림 (캔버스로 미리 그림) ──
function glowTex(stops, size = 128){
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d"), r = size / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
  for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function streakTex(){
  const c = document.createElement("canvas"); c.width = 512; c.height = 32; const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "rgba(255,220,180,0)"); gr.addColorStop(0.5, "rgba(255,240,220,1)"); gr.addColorStop(1, "rgba(255,220,180,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 32);
  const v = g.createLinearGradient(0, 0, 0, 32); v.addColorStop(0, "rgba(0,0,0,1)"); v.addColorStop(0.5, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out"; g.fillStyle = v; g.fillRect(0, 0, 512, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const DOT = glowTex([[0, "rgba(255,255,255,1)"], [0.2, "rgba(255,255,255,0.85)"], [0.5, "rgba(255,255,255,0.18)"], [1, "rgba(255,255,255,0)"]], 64);
function sprite(t, color, size, opacity = 1){
  const m = new THREE.SpriteMaterial({ map: t, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return s;
}
function skySphere(radius, brightness = 0.55){
  const m = new THREE.MeshBasicMaterial({ map: tex("view/stars-2048.webp"), side: THREE.BackSide, color: new THREE.Color(brightness, brightness, brightness), depthWrite: false });
  const s = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), m); s.rotation.x = 1.05; return s;
}
// 은하 그림 (먼 은하들에 쓸 작은 그림 여러 장)
function galaxyTex(kind, seed){
  const N = 128, c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d"); let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.globalCompositeOperation = "lighter";
  const core = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N * (kind === "e" ? 0.45 : 0.18));
  core.addColorStop(0, kind === "e" ? "rgba(255,225,180,0.95)" : "rgba(255,236,200,1)"); core.addColorStop(1, "rgba(255,200,150,0)");
  g.fillStyle = core; g.fillRect(0, 0, N, N);
  if (kind === "s"){
    for (let k = 0; k < 900; k++){ const arm = k % 2, tt = rnd() * 3.2, a = tt + arm * Math.PI + (rnd() - 0.5) * 0.5, r = (0.06 + tt * 0.13) * N * 0.5 * (1 + (rnd() - 0.5) * 0.25);
      const x = N / 2 + Math.cos(a) * r, y = N / 2 + Math.sin(a) * r; g.fillStyle = rnd() < 0.7 ? "rgba(150,190,255,0.22)" : "rgba(255,220,200,0.18)"; g.fillRect(x, y, 1.6, 1.6); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ── 이름표 ──
function label(text, sub, cls = ""){ const d = document.createElement("div"); d.className = "dsl " + cls; d.innerHTML = `<i></i><b>${text}</b>${sub ? `<small>${sub}</small>` : ""}`; $("dsLabels").appendChild(d); const L = { d, pos: new THREE.Vector3(), show: 1 }; labels.push(L); return L; }
function placeLabels(){
  const v = new THREE.Vector3();
  for (const L of labels){
    v.copy(L.pos).project(cam);
    const vis = L.show > 0.01 && v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    L.d.style.opacity = vis ? L.show : 0;
    if (vis) L.d.style.transform = `translate(${(v.x + 1) / 2 * W}px, ${(1 - v.y) / 2 * H}px)`;
  }
}
function clearLabels(){ for (const L of labels) L.d.remove(); labels = []; }

// ── 장면 1: 토성 곁에서 (1 단위 = 1,000km) ──
function buildSaturn(){
  const S = new THREE.Scene();
  S.add(skySphere(5e5, 0.5));
  const sunDir = new THREE.Vector3(1, 0.04, -0.35).normalize();
  const light = new THREE.DirectionalLight(0xffffff, 3.2); light.position.copy(sunDir); S.add(light);
  S.add(new THREE.AmbientLight(0x223344, 0.08));
  const sat = new THREE.Group(); S.add(sat);
  const body = new THREE.Mesh(new THREE.SphereGeometry(58.2, 96, 64), new THREE.MeshStandardMaterial({ map: tex("tex/saturn-1024.webp"), roughness: 1, metalness: 0 }));
  body.scale.y = 0.9; sat.add(body);
  // 고리: 2048×1 띠 그림을 반지름 방향으로 입힘
  const inner = 74.5, outer = 137, rg = new THREE.RingGeometry(inner, outer, 256, 4), pos = rg.attributes.position, uv = rg.attributes.uv;
  for (let i = 0; i < pos.count; i++){ const r = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (r - inner) / (outer - inner), 0.5); }
  const ringTex = tex("tex/saturn-ring-2048.webp");
  const ring = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: ringTex, alphaMap: null, transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; sat.add(ring);
  const ringGlow = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  ringGlow.rotation.x = -Math.PI / 2; sat.add(ringGlow);
  sat.rotation.z = 26.7 * Math.PI / 180; sat.rotation.y = 0.5;
  // 해: 아주 멀리
  const sun = new THREE.Group(); sun.position.copy(sunDir).multiplyScalar(4e5); S.add(sun);
  sun.add(sprite(glowTex([[0, "rgba(255,255,255,1)"], [0.08, "rgba(255,246,225,1)"], [0.25, "rgba(255,210,150,0.35)"], [1, "rgba(255,160,80,0)"]]), 0xffffff, 26000));
  // 지구: 해 곁 4°의 작은 파란 점
  const eDir = sunDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.07).add(new THREE.Vector3(0, -0.012, 0)).normalize();
  const earth = sprite(DOT, 0x8fd0ff, 1100); earth.position.copy(eDir).multiplyScalar(3.9e5); S.add(earth);
  return { scene: S, sat, ring, ringGlow, body, sun, earth, sunDir, eDir, dur: 22,
    enter(){ this.lE = label("지구", "14억 km 저편 · 우리는 여기", "blue"); this.lS = label("토성", "지름 지구의 9배"); },
    update(t){
      // 카메라: 햇빛 받는 쪽에서 출발해 토성 뒤 그늘로 돌아 들어감 → 해가 토성에 가려지며 고리가 빛나고, 지구가 보임
      const f = ease(clamp01(t / 18)), ang = lerp(-0.55, Math.PI - 0.13, f), dist = lerp(520, 430, f), up = lerp(70, 18, f);
      const back = this.sunDir.clone().multiplyScalar(-1);
      const side = new THREE.Vector3().crossVectors(back, new THREE.Vector3(0, 1, 0)).normalize();
      const p = this.sunDir.clone().multiplyScalar(Math.cos(ang) * dist).add(side.multiplyScalar(Math.sin(ang) * dist)); p.y += up;
      cam.position.copy(p); const look = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), this.eDir.clone().multiplyScalar(700), clamp01((t - 10) / 10) * 0.25); cam.lookAt(look);
      cam.fov = lerp(48, 58, f); cam.updateProjectionMatrix();
      this.sat.rotation.y = 0.5 + t * 0.01;
      const backlit = clamp01((f - 0.7) / 0.25);
      this.ringGlow.material.opacity = backlit * 0.55;
      this.lE.pos.copy(this.earth.position); this.lE.show = clamp01((t - 13) / 2);
      this.lS.pos.set(0, 62, 0); this.lS.show = 1 - clamp01((t - 9) / 3);
    } };
}

// ── 장면 2: 보이저의 자리에서 (방향만 중요, 1 단위 = 임의) ──
function buildPBD(){
  const S = new THREE.Scene();
  S.add(skySphere(9000, 0.35));
  const sunDir = new THREE.Vector3(0, 0, -1);
  const at = (degX, degY) => new THREE.Vector3(Math.sin(degX * Math.PI / 180), Math.sin(degY * Math.PI / 180), -1).normalize().multiplyScalar(5000);
  const sun = new THREE.Group(); sun.position.copy(sunDir).multiplyScalar(5000); S.add(sun);
  const core = sprite(glowTex([[0, "rgba(255,255,255,1)"], [0.05, "rgba(255,250,235,1)"], [0.2, "rgba(255,225,180,0.45)"], [1, "rgba(255,180,120,0)"]]), 0xffffff, 1400); sun.add(core);
  const halo = sprite(glowTex([[0, "rgba(255,240,220,0.35)"], [1, "rgba(255,200,160,0)"]], 256), 0xffffff, 6000, 0.7); sun.add(halo);
  // 카메라 렌즈에 생긴 햇빛 줄기 (원본 사진의 색 띠처럼)
  const st = streakTex(), rays = new THREE.Group(); sun.add(rays);
  for (const [rot, len, w, col, op] of [[0.0, 9000, 120, 0xffd9b0, 0.55], [1.2, 7000, 70, 0xfff0e0, 0.35], [-0.9, 6500, 60, 0xffc8a0, 0.3], [0.35, 12000, 260, 0xd8a878, 0.22], [-0.25, 11000, 200, 0xa8b8d8, 0.18]]){
    const m = new THREE.SpriteMaterial({ map: st, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, rotation: rot });
    const s = new THREE.Sprite(m); s.scale.set(len, w, 1); s.userData.op = op; rays.add(s); }
  const P = [["금성", 0.9, 0.35, 0xfff0c8, 55], ["지구", -1.25, 0.6, 0x9fd4ff, 38], ["목성", 6.8, -2.2, 0xffe2b0, 70], ["토성", -11.5, 3.4, 0xffeac0, 60], ["천왕성", 21, 6, 0xbff0f0, 45], ["해왕성", -34, -9, 0xa8bcff, 45]];
  const pl = P.map(([n, x, y, col, size]) => { const s = sprite(DOT, col, size); s.position.copy(at(x, y)); S.add(s); return { n, s }; });
  return { scene: S, sun, rays, pl, core, halo, dur: 26,
    enter(){ this.ls = this.pl.map(p => { const L = label(p.n, p.n === "지구" ? "60억 km 밖에서 본 우리 집" : "", p.n === "지구" ? "blue big" : ""); L.pos.copy(p.s.position); return L; }); this.lSun = label("태양"); this.lSun.pos.copy(this.sun.position); },
    update(t){
      // 넓게 '가족사진'을 보여준 뒤 지구 쪽으로 천천히 당김
      const e = this.pl[1].s.position, f = ease(clamp01((t - 6) / 14));
      cam.position.set(0, 0, 0);
      const look = new THREE.Vector3().lerpVectors(new THREE.Vector3(0.3, 0.02, -1).normalize().multiplyScalar(5000), e, f); cam.lookAt(look);
      cam.fov = lerp(95, 4.5, f); cam.updateProjectionMatrix();
      this.rays.rotation.z = t * 0.01;
      this.core.scale.setScalar(lerp(1400, 70, f)); this.halo.scale.setScalar(lerp(6000, 500, f)); this.halo.material.opacity = lerp(0.7, 0.25, f);
      this.rays.children.forEach(r => r.material.opacity = r.userData.op * lerp(1, 0.55, f));
      this.ls.forEach((L, k) => { L.show = k === 1 ? 1 : 1 - clamp01((t - 7) / 3); });
      this.lSun.show = 1 - clamp01((t - 7) / 3);
      this.pl[1].s.scale.setScalar(lerp(38, 3.5, f));      // 당길수록 점이 커지지 않고 그대로 작음 (화소 하나도 안 됨)
    } };
}

// ── 장면 3: 별 사이로 (1 단위 = 1광년) ──
function buildStars(){
  const S = new THREE.Scene();
  S.add(skySphere(4000, 0.7));
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const N = 9000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const C = [[1, 0.75, 0.55], [1, 0.88, 0.72], [1, 0.97, 0.9], [0.92, 0.95, 1], [0.75, 0.85, 1]];
  for (let i = 0; i < N; i++){ const r = 6 + Math.pow(rnd(), 0.5) * 220, th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th) * 0.55, r * Math.cos(ph)], i * 3); const c = C[Math.floor(rnd() * 5)], b = 0.4 + rnd() * 0.8; col.set([c[0] * b, c[1] * b, c[2] * b], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  S.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 3, map: DOT, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false })));
  const sun = sprite(DOT, 0xfff2d0, 1.4); S.add(sun);
  const acen = new THREE.Vector3(0.8, -0.3, -0.55).normalize().multiplyScalar(4.24);
  const ac = sprite(DOT, 0xffe8c0, 0.9); ac.position.copy(acen); S.add(ac);
  const sirius = new THREE.Vector3(-0.75, 0.45, 0.3).normalize().multiplyScalar(8.6), si = sprite(DOT, 0xd8e6ff, 1.3); si.position.copy(sirius); S.add(si);
  return { scene: S, sun, acen, sirius, dur: 24,
    enter(){ this.lSun = label("태양", "우리의 별", "gold"); this.lAc = label("알파 센타우리", "가장 가까운 이웃 별 · 4.24광년"); this.lAc.pos.copy(this.acen); this.lSi = label("시리우스", "8.6광년"); this.lSi.pos.copy(this.sirius); },
    update(t){
      // 태양 곁에서 출발해 뒤돌아보며 멀어짐 → 태양이 별무리 속 점 하나가 됨
      const f = ease(clamp01(t / 20)), d = Math.exp(lerp(Math.log(0.02), Math.log(40), f));
      const dir = new THREE.Vector3(0.55, 0.22, 0.8).normalize();
      cam.position.copy(dir.multiplyScalar(d)); cam.lookAt(0, 0, 0); cam.fov = 60; cam.updateProjectionMatrix();
      this.sun.scale.setScalar(d * 0.09);
      this.lAc.show = clamp01((t - 4) / 2); this.lSi.show = clamp01((t - 9) / 2);
    } };
}

// ── 장면 4: 우리 은하 (1 단위 = 1,000광년) ──
function buildGalaxy(){
  const S = new THREE.Scene();
  S.add(skySphere(3000, 0.12));
  let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.8;
  const N = 200000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++){
    let x, y, z, c;
    const k = rnd();
    if (k < 0.18){ // 가운데 막대와 팽대부
      const a = gauss() * 9, b = gauss() * 3.2; x = a * Math.cos(0.45) - b * Math.sin(0.45); z = a * Math.sin(0.45) + b * Math.cos(0.45); y = gauss() * 2.2; c = [1, 0.82, 0.58];
    } else { // 나선팔 4개 (큰 팔 2, 작은 팔 2)
      const arm = Math.floor(rnd() * 4), major = arm % 2 === 0, r = 5 + Math.pow(rnd(), 0.8) * 45, th = Math.log(r / 5) / 0.36 + arm * Math.PI / 2 + gauss() * (major ? 0.28 : 0.4) + 0.45;
      x = Math.cos(th) * r + gauss() * 2.2; z = Math.sin(th) * r + gauss() * 2.2; y = gauss() * 0.45 * (1 - r / 70);
      const young = rnd() < (major ? 0.6 : 0.45); c = young ? [0.32, 0.52, 1] : [1, 0.76, 0.48];
      if (rnd() < 0.03) c = [1, 0.45, 0.55];  // 별이 태어나는 붉은 구름
    }
    pos.set([x, y, z], i * 3); const b = 0.35 + rnd() * 0.65; col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.5, map: DOT, vertexColors: true, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
  S.add(pts);
  const core = sprite(glowTex([[0, "rgba(255,230,190,0.9)"], [0.3, "rgba(255,200,140,0.25)"], [1, "rgba(255,180,120,0)"]]), 0xffffff, 40); S.add(core);
  // 태양 자리: 중심에서 2만 6천 광년, 오리온 팔
  const sunP = new THREE.Vector3(Math.cos(2.2) * 26, 0.02, Math.sin(2.2) * 26);
  return { scene: S, pts, sunP, dur: 24,
    enter(){ this.lSun = label("태양은 여기", "중심에서 2만 6천 광년", "gold"); this.lC = label("은하 중심", "거대한 블랙홀"); this.lC.pos.set(0, 0, 0); },
    update(t){
      const f = ease(clamp01(t / 19));
      // 태양 가까이 원반 안에서 출발 → 위로 솟아 은하 전체를 내려다봄
      const start = this.sunP.clone().add(new THREE.Vector3(0, 2.5, 7)), end = new THREE.Vector3(30, 95, 70);
      cam.position.lerpVectors(start, end, f);
      const look = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), f); cam.lookAt(look);
      cam.fov = lerp(70, 50, f); cam.updateProjectionMatrix();
      this.pts.rotation.y = t * 0.004;
      this.lSun.pos.copy(this.sunP).applyAxisAngle(new THREE.Vector3(0, 1, 0), t * 0.004); this.lSun.show = clamp01((t - 5) / 2);
      this.lC.show = 1 - clamp01((t - 10) / 3);
    } };
}

// ── 장면 5: 은하의 바다 (1 단위 = 100만 광년) ──
function buildCosmos(){
  const S = new THREE.Scene();
  let s = 19; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.8;
  const T = [galaxyTex("s", 3), galaxyTex("s", 7), galaxyTex("e", 11), galaxyTex("s", 13), galaxyTex("e", 17), galaxyTex("s", 23)];
  const mw = sprite(T[0], 0xffffff, 0.16); S.add(mw);
  const andro = sprite(T[3], 0xffffff, 0.24); andro.position.set(1.9, 0.6, -1.5); S.add(andro);
  // 은하들이 실처럼 이어진 우주 거미줄
  const nodes = []; for (let i = 0; i < 70; i++){ const r = Math.pow(rnd(), 0.5) * 1400; const th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1); nodes.push(new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph))); }
  nodes.push(new THREE.Vector3(0, 0, 0));
  const groups = T.map(() => []);
  for (let i = 0; i < 70000; i++){
    let p;
    if (i < 160){ p = new THREE.Vector3(gauss() * 4, gauss() * 4, gauss() * 4); }      // 우리 동네 (국부 은하군)
    else { const a = nodes[Math.floor(rnd() * nodes.length)], b = nodes[Math.floor(rnd() * nodes.length)];
      if (a.distanceTo(b) > 700 || rnd() < 0.15){ p = a.clone().add(new THREE.Vector3(gauss() * 18, gauss() * 18, gauss() * 18)); }
      else { p = a.clone().lerp(b, rnd()).add(new THREE.Vector3(gauss() * 9, gauss() * 9, gauss() * 9)); } }
    groups[Math.floor(rnd() * T.length)].push(p);
  }
  groups.forEach((list, k) => { const pos = new Float32Array(list.length * 3); list.forEach((p, i) => pos.set([p.x, p.y, p.z], i * 3));
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    S.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, map: T[k], transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))); });
  return { scene: S, andro, dur: 26,
    enter(){ this.lMW = label("우리 은하", "별 수천억 개", "gold"); this.lA = label("안드로메다 은하", "250만 광년 · 별 1조 개"); this.lA.pos.copy(this.andro.position); this.lW = label("은하가 실처럼 이어진 우주 거미줄"); },
    update(t){
      const f = ease(clamp01(t / 21)), d = Math.exp(lerp(Math.log(0.9), Math.log(3200), f));
      cam.position.set(0.35 * d, 0.28 * d, d); cam.lookAt(0, 0, 0); cam.fov = 55; cam.updateProjectionMatrix();
      this.lMW.show = 1 - clamp01((t - 15) / 4); this.lA.show = 1 - clamp01((t - 7) / 3);
      this.lW.pos.set(400, 300, 0); this.lW.show = clamp01((t - 14) / 3);
    } };
}

const BUILD = { saturn: buildSaturn, pbd: buildPBD, stars: buildStars, galaxy: buildGalaxy, cosmos: buildCosmos };

function init(){
  if (renderer) return;
  const st = document.createElement("style");
  st.textContent = `#ds{position:fixed;inset:0;width:100%;height:100%;z-index:3;display:none;background:#000}#ds.show{display:block}
  #dsLabels{position:fixed;inset:0;z-index:3;pointer-events:none;display:none}#dsLabels.show{display:block}
  .dsl{position:absolute;left:0;top:0;white-space:nowrap;transition:opacity .4s;color:#fff;font-size:12px;text-shadow:0 1px 4px #000,0 0 8px #000}
  .dsl i{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border:1.2px solid #ffffffaa;border-radius:50%}
  .dsl b{position:absolute;left:14px;top:-9px;font-weight:700}.dsl small{position:absolute;left:14px;top:7px;color:#cfd8ea;font-size:10.5px}
  .dsl.blue i{border-color:#7fc4ff}.dsl.blue b{color:#bfe4ff}.dsl.gold i{border-color:#ffd27a}.dsl.gold b{color:#ffe2a8}
  .dsl.big i{left:-14px;top:-14px;width:28px;height:28px;border-width:1.6px;animation:dsp 2s ease-in-out infinite}.dsl.big b{left:20px;font-size:14px}.dsl.big small{left:20px;font-size:11.5px}
  @keyframes dsp{50%{transform:scale(1.25);opacity:.6}}`;
  document.head.appendChild(st);
  const ph = document.getElementById("photo");
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.domElement.id = "ds"; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  document.body.insertBefore(renderer.domElement, ph || null);
  const lab = document.createElement("div"); lab.id = "dsLabels"; document.body.insertBefore(lab, ph || null);
  cam = new THREE.PerspectiveCamera(55, 1, 0.01, 1e7);
  addEventListener("resize", size); size();
}
function size(){ if (!renderer) return; W = innerWidth; H = innerHeight; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false); cam.aspect = W / H;
  cam.setViewOffset(W, H, 0, H * 0.15, W, H);   // 화면 중심을 위로: 아래 글 상자에 가리지 않게
  cam.updateProjectionMatrix(); }
function frame(ts){
  if (!on) return; raf = requestAnimationFrame(frame);
  const t = (ts - t0) / 1000; cur.update(t); renderer.render(cur.scene, cam); placeLabels();
}
window.DS = {
  show(name){
    init(); clearLabels();
    cur = built[name] || (built[name] = BUILD[name]());
    cur.enter(); on = true; t0 = performance.now();
    renderer.domElement.classList.add("show"); $("dsLabels").classList.add("show");
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  },
  replay(){ t0 = performance.now(); },
  _seek(sec){ t0 = performance.now() - sec * 1000; },
  hide(){ on = false; cancelAnimationFrame(raf); clearLabels(); if (renderer){ renderer.domElement.classList.remove("show"); $("dsLabels").classList.remove("show"); } },
  get on(){ return on; }
};
window.dispatchEvent(new Event("ds-ready"));
