// Saves progress on this device only (browser storage). Nothing is sent anywhere.
//
// Each card (one note in one practice direction) has a "box" from 0 to 5:
//   "I got it"        -> up one box (shown less often)
//   "Try again later" -> back to box 0 (shown more often, and again soon)

const KEY = 'recorder-trainer-v1';
const MAX_BOX = 5;
const WEIGHT = [8, 5, 3, 2, 1.4, 1]; // chance of being picked, by box
const NEW_WEIGHT = 5;

const blank = () => ({ cards: {}, settings: {} });
let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* storage unavailable */ }
  return blank();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

export function getSettings() { return data.settings; }
export function saveSettings(s) { data.settings = s; save(); }

export function record(cardKey, gotIt) {
  const s = data.cards[cardKey] || { box: 0, seen: 0, got: 0 };
  s.seen += 1;
  if (gotIt) { s.got += 1; s.box = Math.min(MAX_BOX, s.box + 1); } else { s.box = 0; }
  data.cards[cardKey] = s;
  save();
}

function weightOf(cardKey) {
  const s = data.cards[cardKey];
  return s ? WEIGHT[s.box] : NEW_WEIGHT;
}

// Pick a note at random, favouring ones that need more practice.
// keyOf(note) gives the saved-progress key for that note in this mode.
export function pickWeighted(notes, keyOf, avoidId) {
  let pool = notes.filter(n => n.id !== avoidId);
  if (!pool.length) pool = notes;
  const total = pool.reduce((t, n) => t + weightOf(keyOf(n)), 0);
  let r = Math.random() * total;
  for (const n of pool) {
    r -= weightOf(keyOf(n));
    if (r <= 0) return n;
  }
  return pool[pool.length - 1];
}
