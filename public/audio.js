// 창백한 푸른 점 — 소리 (Web Audio로 직접 만드는 소리라 저작권 걱정 없음)
// 장마다 다른 '곡'이에요: 파도와 갈매기, 비행기 실내, 오르골 같은 달 노래, 해넘이의 낮은 현,
// 정거장의 숨소리, 달리는 태양계의 아르페지오, 창백한 푸른 점의 피아노, 달력의 시계 초침…
(() => {
let ctx, master, bus, verb, wet, started = false, muted = false, mood = "off", seqTimer = 0, step = 0, bed = {};
try { muted = localStorage.getItem("pbd-mute") === "1"; } catch (e) {}
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const now = () => ctx.currentTime;

function noiseBuf(type, sec = 4){
  const n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); let last = 0;
    for (let i = 0; i < n; i++){ const w = Math.random() * 2 - 1; if (type === "brown"){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } }
  return b;
}
function reverbBuf(sec){
  const n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
  return b;
}
let NOISE, BROWN;
function ramp(param, v, sec){ const t = now(); param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + sec); }
function out(node, rev = 0.5){ const d = ctx.createGain(); d.gain.value = 1 - rev * 0.5; node.connect(d).connect(bus); if (rev > 0){ const w = ctx.createGain(); w.gain.value = rev; node.connect(w).connect(verb); } }

// ── 악기들 ──
function pad(notes, dur, gain = 0.05, bright = 900, rev = 0.7){      // 부드러운 화음 (사인파 겹침, 천천히 피고 짐)
  const t = now(), g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = bright;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * 0.35); g.gain.setValueAtTime(gain, t + dur * 0.65); g.gain.linearRampToValueAtTime(0, t + dur * 1.15);
  g.connect(f); out(f, rev);
  for (const m of notes) for (const [mul, type, lv, det] of [[1, "sine", 1, -4], [1, "sine", 1, 4], [2, "sine", 0.25, 0], [0.5, "triangle", 0.35, 0]]){
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = midi(m) * mul; o.detune.value = det; og.gain.value = lv / notes.length;
    o.connect(og).connect(g); o.start(t); o.stop(t + dur * 1.2); }
}
function bell(m, gain = 0.07, rev = 0.6, len = 3){                  // 오르골·첼레스타
  const t = now();
  for (const [mul, lv, d] of [[1, 1, len], [2.756, 0.35, len * 0.45], [5.4, 0.12, len * 0.2]]){
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = midi(m) * mul;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * lv, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); out(g, rev); o.start(t); o.stop(t + d + 0.1); }
}
function piano(m, gain = 0.09, rev = 0.55){                         // 부드러운 피아노 비슷한 소리
  const t = now();
  for (const [mul, lv, d] of [[1, 1, 4.5], [2, 0.42, 2.2], [3, 0.16, 1.2], [4, 0.07, 0.7]]){
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = "triangle"; o.frequency.value = midi(m) * mul; f.type = "lowpass"; f.frequency.value = 2600;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * lv, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(f).connect(g); out(g, rev); o.start(t); o.stop(t + d + 0.1); }
}
function strings(notes, dur, gain = 0.035){                         // 낮은 현 (톱니파를 아주 어둡게 걸러 따뜻하게)
  const t = now(), g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 520; f.Q.value = 0.2;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * 0.4); g.gain.linearRampToValueAtTime(0, t + dur * 1.1); g.connect(f); out(f, 0.75);
  for (const m of notes){ const o = ctx.createOscillator(), v = ctx.createOscillator(), vg = ctx.createGain(); o.type = "sawtooth"; o.frequency.value = midi(m);
    v.frequency.value = 4.6 + Math.random(); vg.gain.value = 3; v.connect(vg).connect(o.detune); o.connect(g); o.start(t); v.start(t); o.stop(t + dur * 1.2); v.stop(t + dur * 1.2); }
}
function wave(gain = 0.22){                                         // 부서지는 파도 한 번
  const t = now(), s = ctx.createBufferSource(); s.buffer = NOISE; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(380, t); f.frequency.linearRampToValueAtTime(1900, t + 1.6); f.frequency.exponentialRampToValueAtTime(280, t + 6);
  const g = ctx.createGain(), dur = 5.5 + Math.random() * 2; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 1.5); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (p) p.pan.value = Math.random() * 1.2 - 0.6;
  s.connect(f).connect(g); if (p) { g.connect(p); out(p, 0.25); } else out(g, 0.25); s.start(t, Math.random() * 3); s.stop(t + dur + 0.2);
}
function gull(gain = 0.03){                                          // 멀리서 우는 갈매기
  const t = now(), n = 2 + Math.floor(Math.random() * 3), base = 1300 + Math.random() * 500;
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (p) p.pan.value = Math.random() * 1.6 - 0.8;
  for (let k = 0; k < n; k++){ const t0 = t + k * 0.28, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = "triangle"; f.type = "bandpass"; f.frequency.value = base * 1.3; f.Q.value = 2;
    o.frequency.setValueAtTime(base * 1.25, t0); o.frequency.linearRampToValueAtTime(base * 0.8, t0 + 0.22);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);
    o.connect(f).connect(g); if (p) g.connect(p); else out(g, 0.6); o.start(t0); o.stop(t0 + 0.3); }
  if (p) out(p, 0.6);
}
function tick(accent){                                                // 시계 초침
  const t = now(), s = ctx.createBufferSource(); s.buffer = NOISE; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = accent ? 2600 : 3400; f.Q.value = 6;
  const g = ctx.createGain(); g.gain.setValueAtTime(accent ? 0.22 : 0.14, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(f).connect(g); out(g, 0.3); s.start(t, Math.random()); s.stop(t + 0.06);
}
function breath(gain = 0.05, len = 6){                                // 숨처럼 부푸는 바람결
  const t = now(), s = ctx.createBufferSource(); s.buffer = NOISE; s.loop = true; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 500 + Math.random() * 500; f.Q.value = 0.8;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + len * 0.45); g.gain.linearRampToValueAtTime(0, t + len);
  s.connect(f).connect(g); out(g, 0.8); s.start(t, Math.random() * 3); s.stop(t + len + 0.1);
}
// ── 늘 깔리는 바탕 소리 (켜고 끄기만) ──
function makeBeds(){
  const mk = (buf, type, freq, q) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0; s.connect(f).connect(g); out(g, 0.15); s.start(); return g; };
  bed.surf = mk(BROWN, "lowpass", 520, 0.4);          // 잔잔한 바다
  bed.wind = mk(NOISE, "bandpass", 700, 0.35);        // 높은 곳 바람
  bed.cabin = mk(BROWN, "lowpass", 170, 0.5);         // 비행기 실내
}
// ── 장면별 곡 ──
const D = [50, 54, 57, 62], Bm = [47, 50, 54, 59], G = [43, 50, 55, 59], A = [45, 52, 57, 61], Em = [40, 47, 52, 55], Fsm = [42, 49, 54, 57];
const MOON = [74, 78, 81, 78, 76, 74, 71, 74, 0, 0, 69, 71, 74, 76, 78, 0];        // 달 노래 (오르골)
const PBD = [66, 0, 69, 0, 71, 0, 0, 69, 66, 0, 64, 0, 62, 0, 0, 0];             // 창백한 푸른 점 (피아노)
const HOME = [62, 0, 66, 0, 69, 0, 74, 0, 73, 0, 71, 0, 69, 0, 0, 0];
const ARP = [50, 57, 62, 66, 69, 66, 62, 57];
const SONG = {
  //        한 박자(ms), 박자마다 할 일
  sea:    [500, s => { if (s % 16 === 0) pad([D, G, Bm, A][(s / 16) % 4], 9, 0.03, 700); if (s % 13 === 0 || Math.random() < 0.03) wave(); if (Math.random() < 0.025) gull(); }, { surf: 0.35 }],
  gull:   [500, s => { if (s % 16 === 0) pad([G, D, Em, A][(s / 16) % 4], 9, 0.05, 1100); if (Math.random() < 0.06) gull(0.035); if (s % 4 === 2 && Math.random() < 0.4) bell(74 + [0, 2, 4, 7, 9][Math.floor(Math.random() * 5)], 0.03); }, { wind: 0.08, surf: 0.08 }],
  plane:  [500, s => { if (s === 2) { bell(76, 0.05, 0.3, 1.5); setTimeout(() => bell(72, 0.05, 0.3, 2), 450); } if (s % 16 === 0) pad([D, A, Bm, G][(s / 16) % 4], 9, 0.03, 650); }, { cabin: 0.5, wind: 0.02 }],
  moon:   [420, s => { const n = MOON[s % 16]; if (n) bell(n, 0.06, 0.7); if (s % 16 === 0) pad([Bm, G, D, A][(s / 16) % 4], 8, 0.028, 800); if (s % 17 === 0) wave(0.12); }, { surf: 0.22 }],
  sunset: [600, s => { if (s % 12 === 0) strings([Bm, G, Em, Fsm][(s / 12) % 4], 8, 0.03); if (s % 11 === 0) wave(0.16); if (s % 6 === 3 && Math.random() < 0.5) piano(74 + [0, -3, -5, -7][Math.floor(Math.random() * 4)], 0.05); }, { surf: 0.3 }],
  iss:    [600, s => { if (s % 12 === 0) pad([[62, 66, 69, 76], [59, 64, 67, 74], [57, 62, 66, 74], [55, 62, 67, 71]][(s / 12) % 4], 8, 0.06, 1600, 0.85); if (s % 9 === 0) breath(0.05, 7); if (s % 24 === 18) bell(86, 0.02, 0.9); }, {}],
  earth:  [600, s => { if (s % 12 === 0) pad([D, G, A, D][(s / 12) % 4].map(m => m + 12), 8, 0.07, 1800, 0.85); if (s % 3 === 0 && Math.random() < 0.5) bell(74 + [0, 4, 7, 9, 12][Math.floor(Math.random() * 5)], 0.025, 0.9); }, {}],
  saturn: [700, s => { if (s % 10 === 0) pad([[38, 45, 50, 57], [36, 43, 50, 55]][(s / 10) % 2], 8, 0.085, 500, 0.8); if (Math.random() < 0.25) bell(86 + [0, 3, 5, 7, 10][Math.floor(Math.random() * 5)], 0.015, 0.95, 4); }, {}],
  helix:  [190, s => { piano(ARP[s % 8] + [0, -3, -5, -2][Math.floor(s / 16) % 4] + 12, 0.035, 0.45); if (s % 32 === 0) pad([D, Bm, G, A][(s / 32) % 4], 7, 0.03, 900); }, {}],
  pbd:    [650, s => { const n = PBD[s % 16]; if (n) piano(n, 0.11, 0.65); if (s % 16 === 0) pad([[50, 57, 62], [47, 54, 59], [43, 50, 55], [45, 52, 57]][(s / 16) % 4], 11, 0.025, 600); }, {}],
  stars:  [450, s => { if (Math.random() < 0.35) bell(79 + [0, 2, 4, 7, 9, 12, 14][Math.floor(Math.random() * 7)], 0.05, 0.9, 3.5); if (s % 18 === 0) pad([[50, 57, 64], [47, 54, 62]][(s / 18) % 2], 9, 0.055, 900, 0.9); }, {}],
  galaxy: [700, s => { if (s % 12 === 0) { const c = [D, Bm, G, A][(s / 12) % 4]; pad(c, 9, 0.08, 1400, 0.85); strings(c.map(m => m - 12), 9, 0.025); } if (s % 4 === 0 && Math.random() < 0.4) bell(81 + [0, 2, 4, 7][Math.floor(Math.random() * 4)], 0.02, 0.95); }, {}],
  cosmos: [800, s => { if (s % 10 === 0) pad([[38, 45, 50, 54, 57], [35, 42, 47, 50, 54], [31, 38, 43, 47, 50], [33, 40, 45, 49, 52]][(s / 10) % 4], 9, 0.09, 700, 0.9); }, {}],
  cal:    [1000, s => { tick(s % 4 === 0); if (s % 12 === 0) pad([50, 57, 62], 11, 0.03, 450, 0.8); }, {}],
  home:   [520, s => { const n = HOME[s % 16]; if (n) piano(n, 0.07, 0.6); if (s % 16 === 0) pad([D, G, Bm, A][(s / 16) % 4], 9, 0.03, 800); if (s % 13 === 0) wave(0.15); if (Math.random() < 0.02) gull(); }, { surf: 0.3 }],
  off:    [1000, () => {}, {}]
};
function setMood(name){
  if (!ctx) return; if (!SONG[name]) name = "off"; if (name === mood) return; mood = name; step = 0;
  const [beat, fn, beds] = SONG[name];
  for (const k of ["surf", "wind", "cabin"]) ramp(bed[k].gain, beds[k] || 0, 3);
  clearInterval(seqTimer);
  setTimeout(() => { if (mood !== name) return; fn(0); step = 1; seqTimer = setInterval(() => { if (ctx.state === "running") fn(step++); }, beat); }, 700);
}
function init(){
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  NOISE = noiseBuf("white"); BROWN = noiseBuf("brown");
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; master.connect(comp).connect(ctx.destination);
  bus = ctx.createGain(); bus.connect(master);
  verb = ctx.createConvolver(); verb.buffer = reverbBuf(4.5); wet = ctx.createGain(); wet.gain.value = 0.6; verb.connect(wet).connect(master);
  makeBeds();
}
function start(){ init(); if (ctx.state === "suspended") ctx.resume(); started = true; }
function setMuted(v){ muted = v; try { localStorage.setItem("pbd-mute", v ? "1" : "0"); } catch (e) {} if (ctx) ramp(master.gain, v ? 0 : 0.9, 0.5); }
document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (started) ctx.resume(); });
window.SND = { start, setMood, setMuted, get muted(){ return muted; }, _master: () => master, _ctx: () => ctx };
})();
