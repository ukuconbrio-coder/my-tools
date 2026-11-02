// Soft piano-like tones made in the browser (no audio files).
// iPhone/iPad only allow sound after a tap, so the audio system is
// started inside the first button tap (see unlock()).

let ctx = null;
let master = null;
let current = null; // the sound playing right now, so a new tap can replace it

function setup() {
  if (ctx) return;
  // Ask iOS to treat this as media playback, so sound plays even
  // when the ring/silent switch is on (iOS 17+; ignored elsewhere).
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3500;
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(tone).connect(comp).connect(ctx.destination);
}

// Call from inside a tap handler.
export function unlock() {
  setup();
  if (ctx.state !== 'running') ctx.resume();
}

const freqOf = midi => 440 * Math.pow(2, (midi - 69) / 12);

// Overtones of a gentle piano: [strength, how fast it fades]
const PARTIALS = [[1, 1], [0.45, 1.4], [0.22, 1.9], [0.12, 2.6], [0.06, 3.2], [0.03, 4]];

function playNote(midi, start, length, out) {
  const f = freqOf(midi);
  // lower notes ring a bit longer, like a real piano
  const decay = 1.6 + (72 - midi) * 0.03;
  PARTIALS.forEach(([amp, speed], i) => {
    const n = i + 1;
    const osc = ctx.createOscillator();
    osc.frequency.value = f * n * Math.sqrt(1 + 0.0003 * n * n); // slight piano "stretch"
    const g = ctx.createGain();
    const peak = amp * 0.22;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.008);
    g.gain.setTargetAtTime(peak * 0.35, start + 0.01, decay / (speed * 4));
    g.gain.setTargetAtTime(0, start + length, 0.12);
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + length + 0.8);
  });
}

function stopCurrent() {
  if (!current) return;
  const g = current;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
  setTimeout(() => g.disconnect(), 400);
  current = null;
}

// notes: array of { midi, at (seconds from now), len (seconds) }
function play(notes) {
  unlock();
  stopCurrent();
  const out = ctx.createGain();
  out.connect(master);
  current = out;
  const t0 = ctx.currentTime + 0.05;
  notes.forEach(n => playNote(n.midi, t0 + n.at, n.len, out));
}

export function playOne(midi) {
  play([{ midi, at: 0, len: 1.6 }]);
}

export function playMelodic(a, b) {
  play([{ midi: a, at: 0, len: 1.0 }, { midi: b, at: 1.1, len: 1.5 }]);
}

export function playTogether(a, b) {
  play([{ midi: a, at: 0, len: 2.0 }, { midi: b, at: 0, len: 2.0 }]);
}
