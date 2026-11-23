// 창백한 푸른 점 — 사람 눈높이 장면 (WebGL)
// 노화도 바다 위 배 갑판에서 출발해 하늘, 우주정거장, 달 거리까지 끊김 없이 솟아오르는 1인칭 카메라.
// 해·달·별은 지금 이 시각의 실제 방향, 섬은 실제 해안선(높이는 섬 크기로 어림한 값).
(() => {
const R = 6371, D2R = Math.PI / 180;
const REG = { lat0: 33.95, lat1: 34.45, lon0: 126.30, lon1: 126.95 };
REG.clat = (REG.lat0 + REG.lat1) / 2; REG.clon = (REG.lon0 + REG.lon1) / 2;
REG.w = (REG.lon1 - REG.lon0) * 111.32 * Math.cos(REG.clat * D2R); REG.h = (REG.lat1 - REG.lat0) * 111.32;

// ── 벡터 ──
const v = (x, y, z) => [x, y, z], add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const mul = (a, s) => [a[0]*s, a[1]*s, a[2]*s], dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => mul(a, 1 / len(a));
const unit = (lat, lon) => [Math.cos(lat*D2R)*Math.cos(lon*D2R), Math.cos(lat*D2R)*Math.sin(lon*D2R), Math.sin(lat*D2R)];
function enu(lat, lon){ const up = unit(lat, lon), east = norm(cross([0, 0, 1], up)), north = cross(up, east); return { up, east, north }; }
const ecef = (lat, lon, alt) => mul(unit(lat, lon), R + alt);

// ── 천문 (낮은 정밀도, 1° 안팎) ──
function astro(ms){
  const n = ms / 864e5 + 2440587.5 - 2451545.0;
  const eps = (23.439 - 4e-7 * n) * D2R;
  const gmst = ((280.46061837 + 360.98564736629 * n) % 360 + 360) % 360;
  const L = (280.460 + 0.9856474 * n) * D2R, g = (357.528 + 0.9856003 * n) * D2R;
  const lam = L + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
  const sra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)), sdec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const Lm = (218.316 + 13.176396 * n) * D2R, Mm = (134.963 + 13.064993 * n) * D2R, F = (93.272 + 13.229350 * n) * D2R;
  const D = (297.850 + 12.190749 * n) * D2R;
  const ml = Lm + (6.289 * Math.sin(Mm) + 1.274 * Math.sin(2*D - Mm) + 0.658 * Math.sin(2*D) - 0.186 * Math.sin(g)) * D2R;
  const mb = 5.128 * Math.sin(F) * D2R, mdist = 385001 - 20905 * Math.cos(Mm);
  const x = Math.cos(mb) * Math.cos(ml), y = Math.cos(eps) * Math.cos(mb) * Math.sin(ml) - Math.sin(eps) * Math.sin(mb), z = Math.sin(eps) * Math.cos(mb) * Math.sin(ml) + Math.cos(eps) * Math.sin(mb);
  const mra = Math.atan2(y, x), mdec = Math.asin(z);
  const sun = unit(sdec / D2R, sra / D2R - gmst), moonDir = unit(mdec / D2R, mra / D2R - gmst);
  // 달의 위상: 해와 달 사이 각도
  const phase = Math.acos(Math.max(-1, Math.min(1, dot(sun, moonDir))));
  return { sun, moon: mul(moonDir, mdist), gmst, illum: (1 - Math.cos(phase)) / 2 };
}
// 관측자에서 본 방위·고도
function azel(from, P){ const f = enu(from.lat, from.lon), rel = sub(P, ecef(from.lat, from.lon, from.alt)), d = norm(rel);
  return { az: (Math.atan2(dot(d, f.east), dot(d, f.north)) / D2R + 360) % 360, el: Math.asin(dot(d, f.up)) / D2R, dist: len(rel) }; }

// ── 셰이더 ──
const VS = `attribute vec2 p; varying vec2 q; void main(){ q = p; gl_Position = vec4(p, 0., 1.); }`;
const FS = `
precision highp float;
varying vec2 q;
uniform vec3 uUp, uF, uRt, uCu; uniform float uH, uTan, uAsp, uT;
uniform vec3 uSun, uMoon; uniform float uGmst, uMoonOn;
uniform vec3 uE, uN, uU, uCamL; uniform vec2 uRegHalf; uniform float uTerr;
uniform sampler2D tDay, tNight, tCloud, tStars, tMoon, tReg, tSat, tPatch;
uniform float uHmax, uSatOn, uPatchOn; uniform vec4 uPatch;
const float R = 6371.0, RA = 6431.0, PI = 3.14159265;

vec2 sph(vec3 o, vec3 d, float r){ float b = dot(o, d), c = dot(o, o) - r*r, h = b*b - c; if (h < 0.0) return vec2(-1.0); h = sqrt(h); return vec2(-b - h, -b + h); }
vec2 llUV(vec3 n){ float lat = asin(clamp(n.z, -1.0, 1.0)), lon = atan(n.y, n.x); return vec2(lon / (2.0*PI) + 0.5, 0.5 - lat / PI); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 satCol(vec2 u){ vec3 c = texture2D(tSat, u).rgb; c = pow(c, vec3(0.86)) * 1.35; float g = dot(c, vec3(0.3, 0.55, 0.15)); return mix(vec3(g), c, 1.2); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }

float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
// 대기: 지나는 공기 두께로 하늘빛을 어림
vec3 skyCol(vec3 o, vec3 d, float tEnd, out float air, out float haze, out vec3 hc){
  vec2 a = sph(o, d, RA); air = 0.0; haze = 0.0; hc = vec3(0.0);
  if (a.y < 0.0) return vec3(0.0);
  float t0 = max(a.x, 0.0), t1 = a.y; if (tEnd > 0.0) t1 = min(t1, tEnd);
  float L = max(t1 - t0, 0.0);
  // 공기 밀도를 길 따라 8번 더해 봄 (높이 8km마다 공기가 약 1/e로 옅어짐)
  float tau = 0.0, wsum = 0.0; vec3 mw = vec3(0.0);
  for (int i = 0; i < 8; i++){
    vec3 pp = o + d * (t0 + L * (float(i) + 0.5) / 8.0);
    float de = exp(-max(length(pp) - R, 0.0) / 8.0);
    tau += de; mw += pp * de; wsum += de;
  }
  tau *= L / 8.0;
  vec3 m = normalize(wsum > 0.0 ? mw : o);
  air = 1.0 - exp(-tau / 5.0);
  haze = 1.0 - exp(-tau / 32.0);
  float whiten = smoothstep(12.0, 160.0, tau);
  float sl = dot(m, uSun);
  float day = smoothstep(-0.18, 0.12, sl);
  float low = 1.0 - smoothstep(-0.05, 0.35, sl);                 // 해가 낮으면 붉게
  vec3 blue = mix(vec3(0.14, 0.36, 0.95), vec3(0.70, 0.79, 0.92), whiten);
  vec3 warm = vec3(1.0, 0.52, 0.25);
  float toward = pow(max(dot(d, uSun), 0.0), 3.0);
  vec3 c = mix(blue, warm, low * (0.3 + 0.7 * toward) * (0.35 + 0.65 * whiten));
  vec3 nightc = vec3(0.010, 0.016, 0.04);
  hc = mix(nightc, c, day);
  return hc * air + vec3(1.0, 0.9, 0.7) * pow(max(dot(d, uSun), 0.0), 60.0) * 0.35 * air * day;
}
vec3 starCol(vec3 d){
  float ra = atan(d.y, d.x) + uGmst, dec = asin(clamp(d.z, -1.0, 1.0));
  vec3 s = texture2D(tStars, vec2(fract(ra / (2.0*PI) + 0.5), 0.5 - dec / PI)).rgb;
  return s * s * 1.6;
}
vec3 earthSurf(vec3 n, vec3 d, float camH){
  vec2 uv = llUV(n);
  vec3 c = texture2D(tDay, uv).rgb;
  float li = dot(n, uSun), day = smoothstep(-0.08, 0.18, li);
  float cl = texture2D(tCloud, uv).r;
  cl = smoothstep(0.18, 0.85, cl + (fbm(uv * vec2(900.0, 450.0)) - 0.5) * 0.45 * smoothstep(0.05, 0.4, cl));   // 구름 가장자리에 잔결
  // 어제 위성이 실제로 찍은 사진 조각 (구름까지 들어 있음)
  if (uPatchOn > 0.5){
    float lat = asin(clamp(n.z, -1.0, 1.0)) * 57.29578, lon = atan(n.y, n.x) * 57.29578;
    vec2 pu = vec2(mod(lon - uPatch.x + 360.0, 360.0), uPatch.y - lat) / uPatch.zw;
    if (pu.x > 0.0 && pu.x < 1.0 && pu.y > 0.0 && pu.y < 1.0){
      vec3 pc = texture2D(tPatch, pu).rgb;
      float w = smoothstep(0.0, 0.08, pu.x) * smoothstep(1.0, 0.92, pu.x) * smoothstep(0.0, 0.08, pu.y) * smoothstep(1.0, 0.92, pu.y);
      w *= smoothstep(0.02, 0.06, dot(pc, vec3(0.33)));                        // 자료가 빈 검은 곳은 건너뜀
      c = mix(c, pow(pc, vec3(0.9)) * 1.1, w); cl *= 1.0 - w;
    }
  }
  // 노화도 둘레: 실제 해안선·위성 사진
  vec2 lu = (vec2(dot(n, uE), dot(n, uN)) * R) / (uRegHalf * 2.0) + 0.5;
  float reg = (dot(n, uU) > 0.99 && lu.x > 0.0 && lu.x < 1.0 && lu.y > 0.0 && lu.y < 1.0) ? 1.0 : 0.0;
  if (reg > 0.5){ vec2 ru = vec2(lu.x, 1.0 - lu.y); vec4 r = texture2D(tReg, ru);
    float ew = smoothstep(0.0, 0.06, lu.x) * smoothstep(1.0, 0.94, lu.x) * smoothstep(0.0, 0.06, lu.y) * smoothstep(1.0, 0.94, lu.y) * smoothstep(900.0, 250.0, camH);
    vec3 sea = vec3(0.03, 0.13, 0.22) + vec3(0.0, 0.10, 0.10) * (r.g > 0.99 ? 0.0 : r.g);
    vec3 land = mix(vec3(0.16, 0.27, 0.11), vec3(0.30, 0.34, 0.18), r.r * 3.0);
    vec3 rc = (r.g > 0.995) ? land : sea;
    if (uSatOn > 0.5) rc = satCol(ru);
    c = mix(c, rc, ew); cl *= 1.0 - ew * smoothstep(60.0, 12.0, camH); }
  cl *= smoothstep(1.5, 9.0, camH);
  vec3 lit = c * (0.04 + 0.96 * max(li, 0.0)) * day;
  lit = mix(lit, vec3(0.97) * (0.08 + 0.92 * max(li, 0.0)) * day, cl * 0.9);
  vec3 nl = texture2D(tNight, uv).rgb; nl = nl * (0.6 + nl) * 1.8 * vec3(1.0, 0.85, 0.6);
  if (reg > 0.5 && camH < 250.0) nl = vec3(1.0, 0.75, 0.4) * texture2D(tReg, vec2(lu.x, 1.0 - lu.y)).b * 1.4;
  lit += nl * (1.0 - day) * (1.0 - cl * 0.7);
  lit += vec3(1.0, 0.9, 0.7) * pow(max(dot(reflect(d, n), uSun), 0.0), 60.0) * 0.5 * day * (1.0 - cl);
  return lit;
}
// ── 섬 지형: 높이 지도 위를 광선으로 걸어가며 부딪히는 곳 찾기 ──
float hAt(vec2 xy){ vec2 u = xy / (uRegHalf * 2.0) + 0.5; if (u.x < 0.0 || u.x > 1.0 || u.y < 0.0 || u.y > 1.0) return 0.0;
  return texture2D(tReg, vec2(u.x, 1.0 - u.y)).r * uHmax; }
float surfZ(vec2 xy){ return hAt(xy) - dot(xy, xy) / (2.0 * R); }

void main(){
  vec3 d = normalize(uF + q.x * uAsp * uTan * uRt + q.y * uTan * uCu);
  vec3 o = uUp * (R + uH);
  float b = (R + uH) * dot(uUp, d), cc = uH * (2.0 * R + uH), hh = b*b - cc;
  float tE = (hh >= 0.0 && b < 0.0) ? (-b - sqrt(hh)) : -1.0;
  vec3 col; float air;
  bool done = false;
  // 가까운 섬 지형 (낮은 고도에서만)
  if (uTerr > 0.5){
    vec3 dl = vec3(dot(d, uE), dot(d, uN), dot(d, uU));
    float t = 0.001, tmax = tE > 0.0 ? min(tE * 1.02, 90.0) : 90.0, last = 0.0;
    vec3 p; bool hit = false;
    for (int i = 0; i < 380; i++){
      p = uCamL + dl * t;
      float s = surfZ(p.xy);
      if (p.z < s){ hit = true; break; }
      if (t > tmax || (dl.z > 0.0 && p.z > uHmax + 0.05)) break;
      last = max(0.0012, t * 0.017) + max(0.0, (p.z - s) * 0.4);
      t += last;
    }
    if (hit){
      float ta = t - last, tb = t;
      for (int k = 0; k < 6; k++){ float tm = (ta + tb) * 0.5; vec3 pm = uCamL + dl * tm; if (pm.z < surfZ(pm.xy)) tb = tm; else ta = tm; }
      t = tb; p = uCamL + dl * t;
      float h = hAt(p.xy);
      vec3 wn = normalize(uU + uE * (p.x / R) + uN * (p.y / R));       // 그 자리의 하늘 방향
      vec2 uv = p.xy / (uRegHalf * 2.0) + 0.5; vec4 rg = texture2D(tReg, vec2(uv.x, 1.0 - uv.y));
      float li = dot(wn, uSun), day = smoothstep(-0.12, 0.15, li);
      vec3 c;
      if (rg.g < 0.995){
        // 바다: 잔물결 + 하늘 반사
        vec2 w = p.xy * 260.0;
        float n1 = vnoise(w + uT * 0.6) - 0.5 + (vnoise(w * 3.7 + uT * 1.4) - 0.5) * 0.5, n2 = vnoise(w * 2.3 - uT * 0.9) - 0.5 + (vnoise(w * 5.1 - uT * 1.1) - 0.5) * 0.5;
        n1 += (vnoise(p.xy * 9.0 + uT * 0.08) - 0.5) * 0.45; n2 += (vnoise(p.xy * 7.0 - uT * 0.06) - 0.5) * 0.45;      // 너울
        float amp = 0.05 * exp(-t / 2.5) + 0.012;
        vec3 nrm = normalize(wn + (uE * n1 + uN * n2) * amp);
        vec3 rd = reflect(d, nrm); if (dot(rd, wn) < 0.01) rd = normalize(rd + wn * (0.01 - dot(rd, wn)));
        float a2, z2; vec3 h2; vec3 sk = skyCol(o, rd, -1.0, a2, z2, h2);
        float fr = 0.04 + 0.96 * pow(1.0 - max(dot(-d, nrm), 0.0), 5.0);
        vec3 deepc = mix(vec3(0.03, 0.12, 0.20), vec3(0.05, 0.22, 0.24), rg.g);
        if (uSatOn > 0.5) deepc = mix(deepc, satCol(vec2(uv.x, 1.0 - uv.y)), 0.75 * smoothstep(0.05, 0.5, max(dot(-d, wn), 0.0)) + 0.1);   // 내려다볼수록 실제 바다빛·양식장이 보임
        vec3 deep = deepc * (0.15 + 0.85 * max(li, 0.0)) * day;
        c = mix(deep, sk, fr) + vec3(1.0, 0.85, 0.6) * pow(max(dot(rd, uSun), 0.0), 500.0) * 4.0 * day;
        c += vec3(1.0, 0.75, 0.4) * rg.b * 0.25 * (1.0 - day) * exp(-t / 4.0);
      } else {
        float e = 0.06;
        vec3 gn = normalize(vec3(-(hAt(p.xy + vec2(e, 0.0)) - hAt(p.xy - vec2(e, 0.0))) / (2.0*e), -(hAt(p.xy + vec2(0.0, e)) - hAt(p.xy - vec2(0.0, e))) / (2.0*e), 1.0));
        vec3 nrm = normalize(uE * gn.x + uN * gn.y + wn * gn.z);
        float fn = vnoise(p.xy * 40.0) * 0.6 + vnoise(p.xy * 160.0) * 0.4;
        vec3 forest = mix(vec3(0.10, 0.20, 0.07), vec3(0.22, 0.30, 0.12), fn);
        vec3 rock = vec3(0.42, 0.38, 0.32);
        c = mix(rock, forest, smoothstep(0.004, 0.02, h));
        float sh = 0.12 + 0.88 * max(dot(nrm, uSun), 0.0) * day + 0.05 * day;
        if (uSatOn > 0.5){ c = satCol(vec2(uv.x, 1.0 - uv.y)) * (0.92 + 0.16 * fn); sh = (0.38 + 0.62 * max(dot(nrm, uSun), 0.0) / max(dot(wn, uSun), 0.25)) * (0.06 + 0.94 * max(li, 0.0)) * day; }
        c *= sh;
        c += vec3(1.0, 0.72, 0.35) * rg.b * 0.9 * (1.0 - day);
      }
      float a3, hz; vec3 hc;
      skyCol(o, d, t, a3, hz, hc);
      col = mix(c, hc, hz);
      done = true;
    }
  }
  if (!done){
    float hz; vec3 hc;
    vec3 sk = skyCol(o, d, tE, air, hz, hc);
    if (tE > 0.0){
      vec3 n = normalize(o + d * tE);
      col = mix(earthSurf(n, d, uH) * 1.25, hc, hz * mix(1.0, 0.6, smoothstep(30.0, 200.0, uH)));
    } else {
      col = sk;
      float vis = 1.0 - smoothstep(0.02, 0.25, dot(sk, vec3(0.3, 0.5, 0.2)));
      col += starCol(d) * vis;
      // 태양
      float cs = dot(d, uSun);
      float disk = smoothstep(0.999985, 0.999992, cs);
      vec3 sc = mix(vec3(1.0, 0.98, 0.95), vec3(1.0, 0.55, 0.25), smoothstep(0.4, 1.0, air));
      col += sc * (disk * 6.0 + pow(max(cs, 0.0), 30000.0) * 1.5 + pow(max(cs, 0.0), 3000.0) * 0.25 * (0.3 + air) + pow(max(cs, 0.0), 150.0) * 0.08 * air);
      // 달
      if (uMoonOn > 0.5){
        vec2 mh = sph(-uMoon, d, 1737.4);
        if (mh.x > 0.0){
          vec3 mn = normalize(d * mh.x - uMoon);
          vec3 zM = normalize(-(uMoon + o)), xM = normalize(cross(vec3(0.0, 0.0, 1.0), zM)), yM = cross(zM, xM);
          float lon = atan(dot(mn, xM), dot(mn, zM)), lat = asin(clamp(dot(mn, yM), -1.0, 1.0));
          vec3 mc = texture2D(tMoon, vec2(lon / (2.0*PI) + 0.5, 0.5 - lat / PI)).rgb;
          float ml = max(dot(mn, uSun), 0.0);
          col = col * 0.6 + mc * (0.02 + 1.25 * ml) * (1.0 - air * 0.35);
        }
      }
    }
  }
  col = 1.0 - exp(-col * 1.5);                                   // 부드러운 노출
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.35);            // 대비 조금
  col += (hash(q * 913.0 + uT) - 0.5) / 255.0;                    // 색 띠 방지
  gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(0.92)), 1.0);
}`;

// ── 초기화 ──
let gl, prog, cvs, ovl, oc, U = {}, tex = {}, ready = false, on = false, raf = 0, scale = 0.8, slow = 0, fast = 0, lastTs = 0;
const state = { lat: 34.262, lon: 126.538, alt: 0.004, az: 150, el: 1, fov: 60 };
let anim = null, timeOffset = 0, bob = false, markers = [], drift = 0, follow = null, lastNote = "";
const listeners = [];

function makeTex(unitIdx, url, wrap){
  return new Promise(res => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unitIdx); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 30, 60, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => { gl.activeTexture(gl.TEXTURE0 + unitIdx); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); res(true); };
    im.onerror = () => res(false); im.src = url;
  });
}
function init(){
  if (gl) return true;
  cvs = document.createElement("canvas"); cvs.id = "pv";
  ovl = document.createElement("canvas"); ovl.id = "pvo";
  const st = document.createElement("style");
  st.textContent = `#pv,#pvo{position:fixed;inset:0;width:100%;height:100%;z-index:3;display:none}#pvo{pointer-events:none}#pv.show,#pvo.show{display:block}
  #pvNote{position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:3;color:#e9edf8;font-size:12.5px;line-height:1.5;text-shadow:0 1px 3px #000,0 0 8px #000;display:none}
  #pvNote.show{display:block}#pvNote b{color:var(--acc)}`;
  document.head.appendChild(st);
  const ph = document.getElementById("photo");
  document.body.insertBefore(cvs, ph || null); document.body.insertBefore(ovl, ph || null);
  const note = document.createElement("div"); note.id = "pvNote"; document.body.insertBefore(note, ph || null);
  gl = cvs.getContext("webgl", { antialias: false, preserveDrawingBuffer: true }) || cvs.getContext("experimental-webgl");
  if (!gl) return false;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); throw new Error("shader"); } return s; };
  prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return false; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  for (const n of ["uUp","uF","uRt","uCu","uH","uTan","uAsp","uT","uSun","uMoon","uGmst","uMoonOn","uE","uN","uU","uCamL","uRegHalf","uTerr","uHmax","uSatOn","uPatchOn","uPatch","tSat","tPatch","tDay","tNight","tCloud","tStars","tMoon","tReg"]) U[n] = gl.getUniformLocation(prog, n);
  const T = [["tDay", "view/earth-day-4096.webp", 1], ["tNight", "view/earth-night-2048.webp", 1], ["tCloud", "view/clouds-2048.webp", 1],
             ["tStars", "view/stars-2048.webp", 1], ["tMoon", "view/moon-2048.webp", 1], ["tReg", "view/nohwa-1024.png", 0]];
  T.forEach(([n, url, wrap], i) => { gl.uniform1i(U[n], i); tex[n] = makeTex(i, url, wrap); });
  for (const [n, i] of [["tSat", 6], ["tPatch", 7]]){ gl.uniform1i(U[n], i); const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 40, 60, 255]));
    for (const [k, v2] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v2); }
  gl.uniform1f(U.uHmax, 0.5); gl.uniform1f(U.uSatOn, 0); gl.uniform1f(U.uPatchOn, 0);
  Promise.all(Object.values(tex)).then(() => { ready = true; loadReal(); setPatch(34, 127); });
  addEventListener("resize", resize); resize();
  return true;
}
function resize(){
  if (!cvs) return; const d = Math.min(devicePixelRatio || 1, 2);
  cvs.width = Math.round(innerWidth * d * scale); cvs.height = Math.round(innerHeight * d * scale);
  ovl.width = innerWidth * d; ovl.height = innerHeight * d;
}

// ── 진짜 자료 입히기: 위성 사진(Sentinel-2)·지형 높이(Terrarium)·어제의 지구(NASA GIBS) ──
const real = { sat: false, dem: false, patch: null };
function loadImg(url){ return new Promise(res => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => res(null); im.src = url; }); }
const mercY = (lat, n) => (1 - Math.asinh(Math.tan(lat * D2R)) / Math.PI) / 2 * n;
async function mosaic(kind, z){
  const n = 2 ** z, x0 = Math.floor((REG.lon0 + 180) / 360 * n), x1 = Math.floor((REG.lon1 + 180) / 360 * n), y0 = Math.floor(mercY(REG.lat1, n)), y1 = Math.floor(mercY(REG.lat0, n));
  const c = document.createElement("canvas"); c.width = (x1 - x0 + 1) * 256; c.height = (y1 - y0 + 1) * 256; const g = c.getContext("2d", { willReadFrequently: kind === "dem" });
  const jobs = []; let ok = 0, all = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++){ all++; jobs.push(loadImg(`/api/tile/${kind}/${z}/${x}/${y}`).then(im => { if (im){ ok++; g.drawImage(im, (x - x0) * 256, (y - y0) * 256, 256, 256); } })); }
  await Promise.all(jobs);
  if (ok < all * 0.9) return null;
  const px = lon => ((lon + 180) / 360 * n - x0) * 256, py = lat => (mercY(lat, n) - y0) * 256;
  return { c, g, px, py };
}
async function loadReal(){
  try {
    const m = await mosaic("sat", 12);
    if (m){
      const N = 2048, o = document.createElement("canvas"); o.width = o.height = N; const g = o.getContext("2d");
      const sx = m.px(REG.lon0), sw = m.px(REG.lon1) - sx;
      for (let j = 0; j < N; j++){ const lat = REG.lat1 - (j + 0.5) / N * (REG.lat1 - REG.lat0); g.drawImage(m.c, sx, m.py(lat), sw, 1, 0, j, N, 1); }
      gl.activeTexture(gl.TEXTURE6); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o);
      gl.uniform1f(U.uSatOn, 1); real.sat = true;
    }
  } catch (e) { console.warn("sat", e); }
  try {
    const m = await mosaic("dem", 11), base = await loadImg("view/nohwa-1024.png");
    if (m && base){
      const N = 1024, src = m.g.getImageData(0, 0, m.c.width, m.c.height), W = m.c.width, H = m.c.height, D = src.data;
      const hgt = (x, y) => { x = Math.max(0, Math.min(W - 1, x)); y = Math.max(0, Math.min(H - 1, y)); const k = (y * W + x) * 4; return D[k] * 256 + D[k + 1] + D[k + 2] / 256 - 32768; };
      const o = document.createElement("canvas"); o.width = o.height = N; const g = o.getContext("2d", { willReadFrequently: true }); g.drawImage(base, 0, 0, N, N);
      const im = g.getImageData(0, 0, N, N), P = im.data; let top = 0;
      for (let j = 0; j < N; j++){ const fy = m.py(REG.lat1 - (j + 0.5) / N * (REG.lat1 - REG.lat0)) - 0.5, y0 = Math.floor(fy), ty = fy - y0;
        for (let i = 0; i < N; i++){ const fx = m.px(REG.lon0 + (i + 0.5) / N * (REG.lon1 - REG.lon0)) - 0.5, x0 = Math.floor(fx), tx = fx - x0;
          let h = (hgt(x0, y0) * (1 - tx) + hgt(x0 + 1, y0) * tx) * (1 - ty) + (hgt(x0, y0 + 1) * (1 - tx) + hgt(x0 + 1, y0 + 1) * tx) * ty;
          const k = (j * N + i) * 4, land = P[k + 1] === 255 || h > 6;
          if (land){ h = Math.max(h, 1.5); P[k + 1] = 255; } else h = 0;
          if (h > top) top = h;
          P[k] = Math.max(0, Math.min(255, Math.round(h / 760 * 255))); } }
      if (top > 150 && top < 2000){   // 엉뚱한 자료면 쓰지 않음
        g.putImageData(im, 0, 0);
        gl.activeTexture(gl.TEXTURE5); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o);
        gl.uniform1f(U.uHmax, 0.76); real.dem = true; real.top = Math.round(top);
      }
    }
  } catch (e) { console.warn("dem", e); }
}
// 어제 위성이 찍은 지구 조각 (가로세로 18°)을 lat·lon 둘레에 입힘
let patchBusy = false;
async function setPatch(lat, lon){
  if (patchBusy || !gl) return;
  const z = 6, span = 288 / 2 ** z, cols = Math.round(360 / span), col0 = Math.floor((lon + 180) / span - 1.5), row0 = Math.max(0, Math.min(180 / span - 4, Math.floor((90 - lat) / span - 1.5)));
  const key = `${col0},${row0}`; if (real.patch === key) return;
  patchBusy = true;
  try {
    const date = new Date(now() - 30 * 3600e3).toISOString().slice(0, 10);
    const c = document.createElement("canvas"); c.width = c.height = 2048; const g = c.getContext("2d"); let ok = 0; const jobs = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) jobs.push(loadImg(`/api/tile/day/${date}/${z}/${row0 + j}/${((col0 + i) % cols + cols) % cols}`).then(im => { if (im){ ok++; g.drawImage(im, i * 512, j * 512, 512, 512); } }));
    await Promise.all(jobs);
    if (ok >= 14){
      gl.activeTexture(gl.TEXTURE7); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.uniform4f(U.uPatch, ((-180 + col0 * span) % 360 + 360) % 360, 90 - row0 * span, 4 * span, 4 * span); gl.uniform1f(U.uPatchOn, 1); real.patch = key; real.patchDate = date;
    }
  } catch (e) { console.warn("patch", e); }
  patchBusy = false;
}

// ── 카메라 ──
const now = () => Date.now() + timeOffset;
function camera(s, t){
  const f = enu(s.lat, s.lon);
  let alt = s.alt + (bob ? 0.0006 * Math.sin(t * 1.3) : 0);
  const el = s.el + (bob ? 0.6 * Math.sin(t * 0.9) : 0), az = s.az + drift * t;
  const F = norm(add(add(mul(f.east, Math.cos(el*D2R) * Math.sin(az*D2R)), mul(f.north, Math.cos(el*D2R) * Math.cos(az*D2R))), mul(f.up, Math.sin(el*D2R))));
  let Rt = cross(F, f.up); if (len(Rt) < 1e-6) Rt = f.east; Rt = norm(Rt);
  const Cu = cross(Rt, F);
  return { up: f.up, F, Rt, Cu, alt, pos: ecef(s.lat, s.lon, alt), tan: Math.tan(s.fov * D2R / 2) };
}
const ease = x => x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2;
function flyTo(target, ms = 3500){
  const from = { ...state }, to = { ...state, ...target };
  let daz = ((to.az - from.az + 540) % 360) - 180; to.az = from.az + daz;
  let dlon = ((to.lon - from.lon + 540) % 360) - 180; to.lon = from.lon + dlon;
  anim = { from, to, t0: performance.now(), ms };
}
function stepAnim(){
  if (!anim) return;
  const f = Math.min(1, (performance.now() - anim.t0) / anim.ms), e = ease(f), a = anim.from, b = anim.to;
  const la = Math.log(Math.max(a.alt, 1e-3)), lb = Math.log(Math.max(b.alt, 1e-3));
  state.alt = Math.exp(la + (lb - la) * e);
  for (const k of ["lat", "lon", "az", "el", "fov"]) state[k] = a[k] + (b[k] - a[k]) * e;
  if (f >= 1) anim = null;
}

// ── 그리기 ──
function frame(ts){
  if (!on) return; raf = requestAnimationFrame(frame);
  // 기기 성능에 맞춰 선명도 조절
  const dtf = ts - lastTs; lastTs = ts;
  if (dtf > 45 && dtf < 500){ if (++slow > 12 && scale > 0.4){ scale *= 0.82; slow = 0; resize(); } } else slow = Math.max(0, slow - 1);
  if (dtf < 20){ if (++fast > 240 && scale < 1){ scale = Math.min(1, scale * 1.12); fast = 0; resize(); } } else fast = 0;
  stepAnim();
  if (follow) { const p = follow(); if (p && !anim) Object.assign(state, p); }
  const t = ts / 1000, c = camera(state, t), A = astro(now());
  const asp = cvs.width / cvs.height;
  gl.viewport(0, 0, cvs.width, cvs.height);
  const u3 = (n, a) => gl.uniform3f(U[n], a[0], a[1], a[2]);
  u3("uUp", c.up); u3("uF", c.F); u3("uRt", c.Rt); u3("uCu", c.Cu);
  gl.uniform1f(U.uH, c.alt); gl.uniform1f(U.uTan, c.tan); gl.uniform1f(U.uAsp, asp); gl.uniform1f(U.uT, t);
  u3("uSun", A.sun); u3("uMoon", sub(A.moon, c.pos)); gl.uniform1f(U.uGmst, A.gmst * D2R); gl.uniform1f(U.uMoonOn, 1);
  const rg = enu(REG.clat, REG.clon), rel = sub(c.pos, ecef(REG.clat, REG.clon, 0));
  u3("uE", rg.east); u3("uN", rg.north); u3("uU", rg.up); u3("uCamL", [dot(rel, rg.east), dot(rel, rg.north), dot(rel, rg.up)]);
  gl.uniform2f(U.uRegHalf, REG.w / 2, REG.h / 2);
  const dReg = Math.hypot(dot(rel, rg.east), dot(rel, rg.north));
  gl.uniform1f(U.uTerr, c.alt < 40 && dReg < 120 ? 1 : 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  drawOverlay(c, A, asp);
  for (const fn of listeners) fn(c, A);
}
function project(c, P){
  const rel = sub(P, c.pos), z = dot(rel, c.F); if (z <= 0) return null;
  const x = dot(rel, c.Rt) / z / c.tan, y = dot(rel, c.Cu) / z / c.tan;
  const W = ovl.width, H = ovl.height, asp = W / H;
  return { x: W / 2 + x / asp * W / 2, y: H / 2 - y * H / 2, z };
}
function hidden(c, P){   // 지구에 가려지나
  const o = c.pos, d = sub(P, o), L = len(d), dn = mul(d, 1 / L), b = dot(o, dn), cc = dot(o, o) - (R - 0.05) * (R - 0.05), h = b*b - cc;
  if (h < 0) return false; const t = -b - Math.sqrt(h); return t > 0 && t < L;
}
// ── 눈앞의 것들: 배 난간, 갈매기, 비행기 날개와 옆을 나는 여객기, 우주정거장 ──
let prop = null, propT0 = 0;
function drawProps(g, t){
  if (!prop) return; const W = innerWidth, H = innerHeight, a = Math.min(1, (performance.now() - propT0) / 1200);
  g.save(); g.globalAlpha = a;
  if (prop === "ship"){
    const y = H * 0.565 + Math.sin(t * 1.3) * 5, tilt = Math.sin(t * 0.9) * 0.012;
    g.translate(W / 2, y); g.rotate(tilt); g.translate(-W / 2, 0);
    const dk = g.createLinearGradient(0, 30, 0, 140); dk.addColorStop(0, "#d9dde2"); dk.addColorStop(1, "#8d949c");
    g.fillStyle = dk; g.beginPath(); g.moveTo(-20, 62); g.lineTo(W * 0.5, 40); g.lineTo(W + 20, 62); g.lineTo(W + 20, H); g.lineTo(-20, H); g.fill();     // 뱃머리 갑판
    g.strokeStyle = "#f4f6f8"; g.lineCap = "round";
    for (const [dy, lw] of [[0, 4], [18, 2.5], [34, 2.5]]){ g.lineWidth = lw; g.beginPath(); g.moveTo(-20, 22 + dy); g.quadraticCurveTo(W * 0.5, -4 + dy, W + 20, 22 + dy); g.stroke(); }   // 난간
    g.lineWidth = 3.5; for (let i = 0; i <= 6; i++){ const x = W * i / 6, u = i / 6, top = 22 - 26 * 4 * u * (1 - u) * 0.5 - 0; g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + 52); g.stroke(); }
    g.fillStyle = "#c8452f"; g.beginPath(); g.arc(W * 0.14, 34, 15, 0, 7); g.fill(); g.fillStyle = "#f4f6f8"; g.beginPath(); g.arc(W * 0.14, 34, 7.5, 0, 7); g.fill();          // 구명튜브
  } else if (prop === "gull"){
    for (let i = 0; i < 4; i++){
      const sp = 0.035 + i * 0.008, x = ((t * sp + i * 0.31) % 1.3 - 0.15) * W, y = H * (0.2 + i * 0.07) + Math.sin(t * 0.7 + i * 2) * 14, s = 34 - i * 6, fl = Math.sin(t * (5 + i) + i) * 0.5 + 0.15;
      g.strokeStyle = "#f7f7f5"; g.lineWidth = Math.max(1.6, s * 0.13); g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(x - s, y - s * fl); g.quadraticCurveTo(x - s * 0.45, y - s * (0.25 + fl * 0.5), x, y); g.quadraticCurveTo(x + s * 0.45, y - s * (0.25 + fl * 0.5), x + s, y - s * fl); g.stroke();
      g.fillStyle = "#f7f7f5"; g.beginPath(); g.ellipse(x, y + 1, s * 0.22, s * 0.1, 0, 0, 7); g.fill();
      g.strokeStyle = "#333"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - s, y - s * fl); g.lineTo(x - s * 0.86, y - s * fl * 0.93); g.moveTo(x + s, y - s * fl); g.lineTo(x + s * 0.86, y - s * fl * 0.93); g.stroke();
    }
  } else if (prop === "plane"){
    // 옆을 나란히 나는 여객기와 비행운
    const px = W * (0.60 + Math.sin(t * 0.11) * 0.05), py = H * (0.27 + Math.sin(t * 0.17) * 0.012), s = 0.62;
    const tr = g.createLinearGradient(px - 300, 0, px - 20, 0); tr.addColorStop(0, "#ffffff00"); tr.addColorStop(1, "#ffffffb0");
    g.strokeStyle = tr; g.lineWidth = 3; g.beginPath(); g.moveTo(px - 300, py + 9); g.lineTo(px - 26 * s, py + 5); g.moveTo(px - 300, py + 15); g.lineTo(px - 26 * s, py + 9); g.stroke();
    g.save(); g.translate(px, py); g.scale(s, s);
    g.fillStyle = "#f3f5f8"; g.beginPath(); g.moveTo(-70, 0); g.quadraticCurveTo(-70, -9, -50, -9); g.lineTo(52, -9); g.quadraticCurveTo(74, -6, 80, 2); g.quadraticCurveTo(70, 9, 50, 9); g.lineTo(-50, 9); g.quadraticCurveTo(-64, 8, -70, 0); g.fill();   // 몸통
    g.fillStyle = "#2f6fd0"; g.beginPath(); g.moveTo(-66, -6); g.lineTo(-84, -34); g.lineTo(-70, -34); g.lineTo(-44, -9); g.fill();                                // 꼬리날개
    g.fillStyle = "#c9ced6"; g.beginPath(); g.moveTo(8, 4); g.lineTo(-34, 30); g.lineTo(-22, 30); g.lineTo(30, 6); g.fill();                                     // 날개
    g.fillStyle = "#9aa1ab"; g.beginPath(); g.ellipse(0, 15, 11, 4.5, -0.1, 0, 7); g.fill();                                                                      // 엔진
    g.fillStyle = "#3b4a5e"; for (let i = 0; i < 14; i++) g.fillRect(-40 + i * 6.4, -4, 3, 3); g.beginPath(); g.moveTo(62, -5); g.lineTo(72, -2); g.lineTo(62, -1); g.fill();
    g.restore();
    // 내 창가 자리의 날개
    const wy = H * 0.50 + Math.sin(t * 0.8) * 3;
    const wg = g.createLinearGradient(0, wy - 40, 0, wy + 120); wg.addColorStop(0, "#e9edf2"); wg.addColorStop(1, "#8f98a4");
    g.fillStyle = wg; g.beginPath(); g.moveTo(-10, wy + 36); g.lineTo(W * 0.80, wy - 20); g.lineTo(W * 0.86, wy - 62); g.lineTo(W * 0.895, wy - 60); g.lineTo(W * 0.885, wy - 6); g.lineTo(W * 0.5, wy + 70); g.lineTo(-10, wy + 150); g.fill();
    g.strokeStyle = "#6f7885"; g.lineWidth = 1; g.beginPath(); g.moveTo(-10, wy + 80); g.lineTo(W * 0.84, wy - 8); g.moveTo(W * 0.3, wy + 20); g.lineTo(W * 0.36, wy + 92); g.stroke();
    g.fillStyle = "#2f6fd0"; g.beginPath(); g.moveTo(W * 0.86, wy - 62); g.lineTo(W * 0.895, wy - 60); g.lineTo(W * 0.891, wy - 38); g.lineTo(W * 0.852, wy - 40); g.fill();
  } else if (prop === "iss"){
    const cx = W * 0.5 + Math.sin(t * 0.13) * 10, cy = H * 0.22 + Math.sin(t * 0.19) * 6;
    g.translate(cx, cy); g.rotate(-0.22 + Math.sin(t * 0.07) * 0.03); const s = Math.min(1.25, W / 400); g.scale(s, s);
    const panel = (x, y, w, h) => { const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, "#c9963c"); gr.addColorStop(0.5, "#8a6220"); gr.addColorStop(1, "#d8a850");
      g.fillStyle = gr; g.fillRect(x, y, w, h); g.strokeStyle = "#3a2a10"; g.lineWidth = 0.6; for (let i = 1; i < 8; i++){ g.beginPath(); g.moveTo(x, y + h * i / 8); g.lineTo(x + w, y + h * i / 8); g.stroke(); } g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke(); };
    for (const x of [-150, -118, 96, 128]){ panel(x, -66, 22, 56); panel(x, 10, 22, 56); }                         // 태양 전지판 8장
    g.fillStyle = "#aeb4bc"; g.fillRect(-156, -5, 312, 10);                                                           // 큰 뼈대
    g.strokeStyle = "#5c636d"; g.lineWidth = 0.8; for (let i = -150; i < 150; i += 12){ g.beginPath(); g.moveTo(i, -5); g.lineTo(i + 6, 5); g.lineTo(i + 12, -5); g.stroke(); }
    g.fillStyle = "#e6e9ee"; for (const x of [-58, 40]) g.fillRect(x, 8, 18, 34);                                    // 방열판
    const mod = (x, y, w, h) => { const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, "#f2f4f7"); gr.addColorStop(1, "#8d949e"); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, Math.min(w, h) / 2.4); g.fill(); };
    mod(-9, -62, 18, 124); mod(-44, -34, 88, 15); mod(-30, 24, 60, 14); mod(-7, 62, 14, 26);                         // 사람이 사는 방들
    g.fillStyle = "#ffd98a"; g.beginPath(); g.arc(0, 30, 2.2, 0, 7); g.fill();
  }
  g.restore();
}

function drawOverlay(c, A){
  const g = ovl.getContext("2d"), d = Math.min(devicePixelRatio || 1, 2);
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ovl.width, ovl.height); g.setTransform(d, 0, 0, d, 0, 0);
  g.font = "600 12px sans-serif"; g.textBaseline = "middle";
  for (const m of markers){
    let P;
    if (m.dir === "moon") P = A.moon; else if (m.dir === "sun") P = add(c.pos, mul(A.sun, 1e7));
    else P = ecef(m.lat, m.lon, m.alt || 0);
    if (m.maxAlt && c.alt > m.maxAlt) continue;
    const dist = len(sub(P, c.pos)); if (m.maxDist && dist > m.maxDist) continue;
    if (!m.dir && hidden(c, P)) continue;
    const s = project(c, P); if (!s) continue;
    const x = s.x / d, y = s.y / d; if (x < -40 || y < -40 || x > innerWidth + 40 || y > innerHeight + 40) continue;
    const col = m.color || "#ffd27a";
    g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1.2;
    if (m.kind === "plane"){ g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); g.globalAlpha = 0.5; g.beginPath(); g.arc(x, y, 7, 0, 7); g.stroke(); g.globalAlpha = 1; }
    else if (m.kind === "ship"){ g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.lineTo(x + 4, y + 3); g.lineTo(x - 4, y + 3); g.closePath(); g.fill(); }
    else if (m.kind === "ring"){ g.beginPath(); g.arc(x, y, m.r || 14, 0, 7); g.stroke(); }
    else { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 16); g.stroke(); }
    const ty = m.kind === "plane" || m.kind === "ring" ? y : y - 22;
    const tx = m.kind === "ring" ? x + (m.r || 14) + 6 : x + (m.kind === "plane" ? 10 : -g.measureText(m.label).width / 2);
    g.lineWidth = 3; g.strokeStyle = "#000a"; g.strokeText(m.label, tx, ty); g.fillStyle = "#fff"; g.fillText(m.label, tx, ty);
    if (m.sub){ g.font = "11px sans-serif"; g.strokeText(m.sub, tx, ty + 14); g.fillStyle = "#cfd8ea"; g.fillText(m.sub, tx, ty + 14); g.font = "600 12px sans-serif"; }
  }
  drawProps(g, performance.now() / 1000);
}

function show(){ if (!init()) return false; on = true; cvs.classList.add("show"); ovl.classList.add("show"); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); return true; }
function hide(){ on = false; cancelAnimationFrame(raf); if (cvs){ cvs.classList.remove("show"); ovl.classList.remove("show"); } note(""); }
function note(html){ const n = document.getElementById("pvNote"); if (!n) return; n.innerHTML = html; n.classList.toggle("show", !!html); }

window.PV = {
  show, hide, flyTo, note, azel, astro, ecef, enu,
  get state(){ return state; }, get on(){ return on; }, get ready(){ return ready; },
  set(s){ anim = null; Object.assign(state, s); },
  setMarkers(m){ markers = m || []; }, setBob(b){ bob = b; }, setDrift(dps){ drift = dps; }, setFollow(fn){ follow = fn; },
  setTimeOffset(ms){ timeOffset = ms; }, setPatch, setProp(n){ if (n !== prop){ prop = n; propT0 = performance.now(); } }, get real(){ return real; }, get anim(){ return !!anim; }, get timeOffset(){ return timeOffset; }, now,
  onFrame(fn){ listeners.push(fn); },
  supported(){ try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (e) { return false; } },
  REG
};
})();
