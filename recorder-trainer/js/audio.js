// A soft recorder-like tone made in the browser (no audio files).
// iPhone/iPad only allow sound after a tap, so unlock() is called on every tap.

// ---- Tone settings: change these to adjust the sound ----
const TONE = {
  overtones: [[1, 0.55], [2, 0.022], [3, 0.006]], // [overtone number, loudness]: smaller = more mellow
  brightness: 2.2,       // gentle filter, as a multiple of the note's pitch: lower = darker, softer
  attack: 0.1,           // seconds to fade in at the start of the note
  breathStart: 0.035,    // breathy "chiff" at the start of the note
  breathSustain: 0.003,  // breath noise while the note holds
  vibrato: 0.0022,       // vibrato depth (0 = none)
  volume: 0.55,
};

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
  master.gain.value = TONE.volume;
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

// Play one note, or a pattern of notes one after another.
// midis: a MIDI number or a list of them.
export function playNotes(midis) {
  unlock();
  stopCurrent();
  const list = [].concat(midis);
  const group = ctx.createGain(); // all the notes go through this, so a new tap can stop them
  group.connect(master);
  current = group;
  const single = list.length === 1;
  const length = single ? 1.5 : 0.75;   // seconds each note sounds
  const step = single ? 0 : 0.9;        // seconds from one note to the next
  const start = ctx.currentTime + 0.04;
  list.forEach((midi, i) => playNote(midi, start + i * step, length, group));
}

function playNote(midi, t, length, dest) {
  const f = freqOf(midi);
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(1, t + TONE.attack);
  out.gain.setValueAtTime(1, t + length);
  out.gain.linearRampToValueAtTime(0, t + length + 0.1);
  // soft filter that rounds off the brightness
  const mellow = ctx.createBiquadFilter();
  mellow.type = 'lowpass';
  mellow.frequency.value = Math.min(f * TONE.brightness, 4000);
  mellow.Q.value = 0.5;
  out.connect(mellow).connect(dest);

  // gentle vibrato that starts after the note settles
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.setValueAtTime(0, t);
  lfoDepth.gain.linearRampToValueAtTime(f * TONE.vibrato, t + 0.5);
  lfo.connect(lfoDepth);
  lfo.start(t);
  lfo.stop(t + length + 0.2);

  // mostly a pure tone, with a touch of the 2nd and 3rd overtones
  TONE.overtones.forEach(([n, amp]) => {
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
  band.frequency.value = f * 1.5;
  band.Q.value = 2;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(TONE.breathStart, t);
  ng.gain.exponentialRampToValueAtTime(TONE.breathSustain, t + 0.15);
  noise.connect(band).connect(ng).connect(out);
  noise.start(t);
  noise.stop(t + length + 0.2);
}
