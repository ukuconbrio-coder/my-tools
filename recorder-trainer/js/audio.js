// A soft recorder-like tone made in the browser (no audio files).
// iPhone/iPad only allow sound after a tap, so unlock() is called on every tap.

let ctx = null;
let master = null;
let current = null;
let noiseBuffer = null;

function setup() {
  if (ctx) return;
  // Let sound play even with the iPhone ring/silent switch on (iOS 17+).
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  master = ctx.createGain();
  master.gain.value = 0.45;
  master.connect(comp).connect(ctx.destination);
  // a short buffer of soft noise, used for the breathy start ("chiff")
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function unlock() {
  setup();
  if (ctx.state !== 'running') ctx.resume();
}

const freqOf = midi => 440 * Math.pow(2, (midi - 69) / 12);

function stopCurrent() {
  if (!current) return;
  const g = current;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
  setTimeout(() => g.disconnect(), 300);
  current = null;
}

export function playNote(midi, length = 1.5) {
  unlock();
  stopCurrent();
  const f = freqOf(midi);
  const t = ctx.currentTime + 0.04;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(1, t + 0.06);
  out.gain.setValueAtTime(1, t + length);
  out.gain.linearRampToValueAtTime(0, t + length + 0.1);
  out.connect(master);
  current = out;

  // gentle vibrato that starts after the note settles
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.setValueAtTime(0, t);
  lfoDepth.gain.linearRampToValueAtTime(f * 0.004, t + 0.5);
  lfo.connect(lfoDepth);
  lfo.start(t);
  lfo.stop(t + length + 0.2);

  // mostly a pure tone, with a little of the 2nd and 3rd overtones
  [[1, 0.5], [2, 0.06], [3, 0.035]].forEach(([n, amp]) => {
    const osc = ctx.createOscillator();
    osc.frequency.value = f * n;
    lfoDepth.connect(osc.frequency);
    const g = ctx.createGain();
    g.gain.value = amp;
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + length + 0.2);
  });

  // breath: a little filtered noise, stronger at the start
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = f * 2;
  band.Q.value = 1.5;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.12, t);
  ng.gain.exponentialRampToValueAtTime(0.012, t + 0.12);
  noise.connect(band).connect(ng).connect(out);
  noise.start(t);
  noise.stop(t + length + 0.2);
}
