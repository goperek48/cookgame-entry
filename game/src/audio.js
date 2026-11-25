// audio.js — tiny WebAudio synth for Sizzle & Serve. No audio files: every
// sound is generated, so the game loads nothing over the network.

let ctx = null;
let muted = false;
let sizzleNodes = null;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopSizzle();
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(520, 0.07, 'triangle', 0.12); },
  place() { tone(330, 0.08, 'triangle', 0.12); tone(495, 0.06, 'triangle', 0.08, 0.05); },
  chop() { noiseBurst(0.08, 0.25, 900); tone(140, 0.08, 'square', 0.1); },
  flip() { noiseBurst(0.12, 0.15, 2400); tone(700, 0.09, 'sine', 0.1, 0, 900); },
  done() { tone(880, 0.12, 'sine', 0.14); tone(1318, 0.16, 'sine', 0.12, 0.09); },
  coin() { tone(988, 0.09, 'square', 0.07); tone(1319, 0.14, 'square', 0.07, 0.07); tone(1760, 0.18, 'square', 0.06, 0.14); },
  error() { tone(180, 0.18, 'sawtooth', 0.12, 0, 120); },
  walkout() { tone(392, 0.16, 'sine', 0.12); tone(311, 0.22, 'sine', 0.12, 0.14); tone(233, 0.3, 'sine', 0.12, 0.28); },
  click() { tone(660, 0.05, 'triangle', 0.08); },
  over() {
    tone(523, 0.2, 'triangle', 0.12);
    tone(659, 0.2, 'triangle', 0.12, 0.18);
    tone(784, 0.3, 'triangle', 0.12, 0.36);
    tone(1047, 0.5, 'triangle', 0.12, 0.54);
  },
};

// Looping grill sizzle while at least one patty cooks. Cheap filtered noise.
export function setSizzle(on) {
  if (!ctx) return;
  if (on && !sizzleNodes && !muted) {
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.045;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    sizzleNodes = { src, gain };
  } else if (!on && sizzleNodes) {
    stopSizzle();
  }
}

export function stopSizzle() {
  if (sizzleNodes) {
    try { sizzleNodes.src.stop(); } catch (e) { /* already stopped */ }
    sizzleNodes = null;
  }
}
