// 창백한 푸른 점 — 소리 (Web Audio로 직접 만드는 소리라 저작권 걱정 없음)
// 장마다 분위기가 바뀌어요: 파도, 바람, 비행기 실내, 정거장 웅웅 소리, 그리고 천천히 바뀌는 화음과 반짝이는 음.
(() => {
let ctx, master, wet, dry, verb, layers = {}, mood = null, chordTimer = 0, sparkTimer = 0, muted = false, started = false;
try { muted = localStorage.getItem("pbd-mute") === "1"; } catch (e) {}

function noiseBuf(type){
  const n = ctx.sampleRate * 4, b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); let last = 0;
    for (let i = 0; i < n; i++){ const w = Math.random() * 2 - 1; if (type === "brown"){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } }
  return b;
}
function reverbBuf(sec){
  const n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
  return b;
}
function fade(g, v, sec = 2.5){ const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(v, t + sec); }
function loopNoise(type, filt, freq, q){
  const s = ctx.createBufferSource(); s.buffer = noiseBuf(type); s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = filt; f.frequency.value = freq; f.Q.value = q || 0.7;
  const g = ctx.createGain(); g.gain.value = 0; s.connect(f).connect(g); s.start(); return { s, f, g };
}
function init(){
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
  verb = ctx.createConvolver(); verb.buffer = reverbBuf(5); wet = ctx.createGain(); wet.gain.value = 0.55; dry = ctx.createGain(); dry.gain.value = 0.7;
  verb.connect(wet).connect(master); dry.connect(master);
  // 파도: 갈색 잡음을 천천히 부풀렸다 가라앉힘
  const sea = loopNoise("brown", "lowpass", 700, 0.5); const swell = ctx.createGain(); swell.gain.value = 0.5;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11; const lg = ctx.createGain(); lg.gain.value = 0.45; lfo.connect(lg).connect(swell.gain); lfo.start();
  sea.g.connect(swell).connect(dry); layers.sea = sea;
  const wind = loopNoise("white", "bandpass", 900, 0.4); const wl = ctx.createOscillator(); wl.frequency.value = 0.07; const wlg = ctx.createGain(); wlg.gain.value = 500; wl.connect(wlg).connect(wind.f.frequency); wl.start();
  wind.g.connect(dry); layers.wind = wind;
  const cabin = loopNoise("brown", "lowpass", 260, 0.8); cabin.g.connect(dry); layers.cabin = cabin;
  // 정거장: 낮게 웅웅
  const hum = ctx.createOscillator(); hum.type = "sine"; hum.frequency.value = 58; const hg = ctx.createGain(); hg.gain.value = 0; hum.connect(hg).connect(dry); hum.start(); layers.hum = { g: hg };
  // 화음 패드
  const pad = ctx.createGain(); pad.gain.value = 0; const pf = ctx.createBiquadFilter(); pf.type = "lowpass"; pf.frequency.value = 900; pf.Q.value = 0.3;
  pad.connect(pf); pf.connect(verb); pf.connect(dry); layers.pad = { g: pad, f: pf, voices: [] };
  for (let i = 0; i < 4; i++){ const pair = [];
    for (const det of [-6, 6]){ const o = ctx.createOscillator(); o.type = "sawtooth"; o.detune.value = det; const vg = ctx.createGain(); vg.gain.value = 0.045; o.connect(vg).connect(pad); o.start(); pair.push(o); }
    layers.pad.voices.push(pair); }
  const spark = ctx.createGain(); spark.gain.value = 0; spark.connect(verb); layers.spark = { g: spark };
  const dly = ctx.createDelay(1.2); dly.delayTime.value = 0.42; const fb = ctx.createGain(); fb.gain.value = 0.38; spark.connect(dly); dly.connect(fb).connect(dly); dly.connect(verb);
}
// 화음들 (D 장조 둘레, 느리고 열린 소리)
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = { warm: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 57, 62], [45, 52, 57, 61]],
  open: [[50, 57, 64, 69], [43, 50, 59, 66], [47, 54, 62, 69], [45, 52, 61, 64]],
  deep: [[38, 45, 52, 57], [36, 43, 50, 55], [41, 48, 55, 60], [38, 45, 50, 57]],
  dusk: [[47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61], [42, 49, 54, 57]] };
let chordSet = CHORDS.warm, chordIdx = 0;
function nextChord(){
  const c = chordSet[chordIdx++ % chordSet.length], t = ctx.currentTime;
  layers.pad.voices.forEach((pair, i) => pair.forEach(o => o.frequency.setTargetAtTime(midi(c[i]), t, 1.2)));
}
const PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86];
function pluck(){
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = midi(PENTA[Math.floor(Math.random() * PENTA.length)]);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
  o.connect(g).connect(layers.spark.g); o.start(t); o.stop(t + 2.6);
}
// 장면마다 섞는 비율: [파도, 바람, 실내, 웅웅, 화음, 반짝임, 화음종류, 필터]
const MOODS = {
  sea: [0.9, 0.08, 0, 0, 0.35, 0, "warm", 700], gull: [0.45, 0.35, 0, 0, 0.45, 0.25, "warm", 900], plane: [0, 0.12, 0.7, 0, 0.35, 0, "open", 700],
  moon: [0.6, 0.05, 0, 0, 0.5, 0.45, "dusk", 800], sunset: [0.8, 0.05, 0, 0, 0.55, 0.2, "dusk", 1000], iss: [0, 0, 0, 0.5, 0.55, 0.3, "open", 1200],
  earth: [0, 0, 0, 0.15, 0.7, 0.4, "open", 1400], helix: [0, 0, 0, 0, 0.6, 0.7, "open", 1600], saturn: [0, 0, 0, 0, 0.7, 0.35, "deep", 900],
  pbd: [0, 0, 0, 0, 0.55, 0.15, "deep", 600], stars: [0, 0, 0, 0, 0.6, 0.6, "deep", 1100], galaxy: [0, 0, 0, 0, 0.75, 0.5, "open", 1300],
  cosmos: [0, 0, 0, 0, 0.8, 0.35, "deep", 800], cal: [0, 0, 0, 0, 0.4, 0.1, "deep", 500], home: [0.85, 0.05, 0, 0, 0.5, 0.15, "warm", 900], off: [0, 0, 0, 0, 0, 0, "warm", 700] };
function setMood(name){
  if (!ctx || name === mood) return; mood = name; const m = MOODS[name] || MOODS.off;
  fade(layers.sea.g, m[0] * 0.5, 3); fade(layers.wind.g, m[1] * 0.25, 3); fade(layers.cabin.g, m[2] * 0.6, 3); fade(layers.hum.g, m[3] * 0.06, 3);
  fade(layers.pad.g, m[4] * 0.55, 4); fade(layers.spark.g, m[5], 3);
  layers.pad.f.frequency.setTargetAtTime(m[7], ctx.currentTime, 2);
  if (CHORDS[m[6]] !== chordSet){ chordSet = CHORDS[m[6]]; chordIdx = 0; nextChord(); }
  clearInterval(sparkTimer); if (m[5] > 0) sparkTimer = setInterval(() => { if (Math.random() < 0.55) pluck(); }, 900);
}
function start(){
  init(); if (ctx.state === "suspended") ctx.resume();
  if (!started){ started = true; nextChord(); chordTimer = setInterval(nextChord, 9000); }
}
function setMuted(v){ muted = v; try { localStorage.setItem("pbd-mute", v ? "1" : "0"); } catch (e) {} if (ctx) fade(master, v ? 0 : 0.8, 0.6); }
document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (started) ctx.resume(); });
window.SND = { start, setMood, setMuted, get muted(){ return muted; } };
})();
