// Saves progress on this device only (browser storage). Nothing is sent anywhere.
//
// Each card has a "box" from 0 to 5 (like a Leitner flash-card box):
//   "I got it"        -> moves up one box (shown less often)
//   "Try again later" -> back to box 0 (shown more often), and it also
//                        comes back again a few cards later in this session.

const KEY = 'interval-trainer-v1';
const MAX_BOX = 5;
// How likely a card is to be picked, by box. Box 0 is 8x more likely than box 5.
const WEIGHT = [8, 5, 3, 2, 1.4, 1];
const NEW_WEIGHT = 5; // cards she hasn't seen yet

const blank = () => ({ cards: {}, settings: {}, tests: [] });

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* storage unavailable: progress just won't be kept */ }
  return blank();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

export function getSettings() { return data.settings; }
export function saveSettings(s) { data.settings = s; save(); }

export function cardStats(id) {
  return data.cards[id] || null;
}

export function record(id, gotIt) {
  const s = data.cards[id] || { box: 0, seen: 0, got: 0 };
  s.seen += 1;
  if (gotIt) { s.got += 1; s.box = Math.min(MAX_BOX, s.box + 1); }
  else { s.box = 0; }
  s.last = Date.now();
  data.cards[id] = s;
  save();
}

export function recordTest(score, total) {
  data.tests.push({ date: Date.now(), score, total });
  data.tests = data.tests.slice(-20);
  save();
}

export function recentTests() { return data.tests.slice().reverse(); }

export function resetAll() {
  const settings = data.settings;
  data = blank();
  data.settings = settings; // keep her chosen intervals
  save();
}

export function weightOf(id) {
  const s = data.cards[id];
  return s ? WEIGHT[s.box] : NEW_WEIGHT;
}

// Pick one card at random, favouring cards that need more practice.
export function pickWeighted(cards, avoidId) {
  let pool = cards.filter(c => c.id !== avoidId);
  if (!pool.length) pool = cards;
  const total = pool.reduce((t, c) => t + weightOf(c.id), 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= weightOf(c.id);
    if (r <= 0) return c;
  }
  return pool[pool.length - 1];
}

// Pick n cards for a test, favouring weaker cards, without repeats when possible.
export function pickTestSet(cards, n) {
  const out = [];
  let pool = cards.slice();
  while (out.length < n && cards.length) {
    if (!pool.length) pool = cards.slice(); // small selection: allow repeats
    const last = out.length ? out[out.length - 1].id : null;
    const c = pickWeighted(pool, last);
    out.push(c);
    pool = pool.filter(x => x.id !== c.id);
  }
  return out;
}
