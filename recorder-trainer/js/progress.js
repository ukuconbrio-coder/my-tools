// Saves progress on this device only (browser storage). Nothing is sent anywhere.
//
// 1) Each card (a note or pattern, in one practice direction) has a "box" from 0 to 5:
//      "I got it"        -> up one box (shown less often)
//      "Try again later" -> back to box 0 (shown more often, and again soon)
//
// 2) Each practice direction has a LEVEL = how many notes per card (1 to 4).
//    She moves up a level when she gets LEVEL_UP_NEEDED of her last LEVEL_UP_WINDOW cards.

const KEY = 'recorder-trainer-v1';
const MAX_BOX = 5;
const WEIGHT = [8, 5, 3, 2, 1.4, 1]; // chance of being picked, by box
const NEW_WEIGHT = 5;
export const LEVEL_UP_WINDOW = 10;
export const LEVEL_UP_NEEDED = 8;

const blank = () => ({ cards: {}, settings: {}, levels: {} });
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

// ---------- levels (notes per card) ----------
function levelData(mode) {
  return data.levels[mode] || (data.levels[mode] = { level: 1, recent: [] });
}

export function getLevel(mode) { return levelData(mode).level; }

// How many of the last few cards she got, at this level.
export function recentScore(mode) {
  const l = levelData(mode);
  return { got: l.recent.filter(Boolean).length, of: l.recent.length };
}

export function setLevel(mode, level) {
  const l = levelData(mode);
  l.level = level;
  l.recent = [];
  save();
}

// Call after each card. Returns true if she just moved up a level.
export function recordForLevel(mode, gotIt, maxLevel) {
  const l = levelData(mode);
  l.recent = [...l.recent, gotIt].slice(-LEVEL_UP_WINDOW);
  let movedUp = false;
  if (l.level < maxLevel &&
      l.recent.length >= LEVEL_UP_WINDOW &&
      l.recent.filter(Boolean).length >= LEVEL_UP_NEEDED) {
    l.level += 1;
    l.recent = [];
    movedUp = true;
  }
  save();
  return movedUp;
}

// ---------- choosing the next card ----------
function weightOf(cardKey) {
  const s = data.cards[cardKey];
  return s ? WEIGHT[s.box] : NEW_WEIGHT;
}

// Pick one item at random, favouring ones that need more practice.
// keyOf(item) gives its saved-progress key. avoidKey = don't repeat the card just shown.
export function pickWeighted(items, keyOf, avoidKey) {
  let pool = items.filter(it => keyOf(it) !== avoidKey);
  if (!pool.length) pool = items;
  const weights = pool.map(it => weightOf(keyOf(it)));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
