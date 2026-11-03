// Screens: Home and Card. Two ways to practice:
//   'note'      : see the note(s) -> think of the fingering(s) -> Show answer shows the fingering(s)
//   'fingering' : see the fingering(s) -> name the note(s) -> Show answer shows the note(s)
// Each card is a PATTERN of 1-4 notes. She starts with single notes and the app
// moves her up to longer patterns as she gets them right (see progress.js).
// Buttons use data-action="..." and are handled in ACTIONS at the bottom.

import { NOTES, soundingMidi } from './notes.js';
import { allPatterns, patternKey, longestAllowed, MAX_LENGTH } from './patterns.js';
import { staffSvg } from './staff.js';
import { recorderSvg } from './recorder.js';
import * as audio from './audio.js';
import * as progress from './progress.js';

const root = document.getElementById('app');

const MODES = {
  note: { title: 'Note → Fingering', sub: 'See the note, show the fingering' },
  fingering: { title: 'Fingering → Note', sub: 'See the fingering, name the note' },
};

const levelName = n => (n === 1 ? 'Single notes' : `${n}-note patterns`);

// ---------- settings (remembered on the device) ----------
const saved = progress.getSettings();
const settings = { notes: saved.notes || NOTES.map(n => n.id) };
const saveSettings = () => progress.saveSettings(settings);

let screen = 'home';
let session = null;
// Notes per card is one setting shared by both practice directions.
// She picks it on the home screen; the app also moves her up when she's ready.
const LEVEL = 'all';

const chipLabel = n => (n.high ? 'high ' : '') + n.name;

function selectedNotes() {
  return NOTES.filter(n => settings.notes.includes(n.id));
}

// The pattern length to use right now (can't make patterns from just one note).
function currentLength() {
  return Math.min(progress.getLevel(LEVEL), longestAllowed(selectedNotes().length));
}

const keyOf = mode => pattern => `${mode}:${patternKey(pattern)}`;

function startSession(mode) {
  session = { mode, turn: 0, again: [], pattern: null, revealed: false, message: '' };
  buildPool();
  nextCard();
  screen = 'card';
}

function buildPool() {
  session.length = currentLength();
  session.pool = allPatterns(selectedNotes(), session.length);
  session.again = [];
}

function nextCard() {
  const s = session;
  s.revealed = false;
  s.turn += 1;
  const lastKey = s.pattern ? patternKey(s.pattern) : null;
  const due = s.again.findIndex(a => a.due <= s.turn && patternKey(a.pattern) !== lastKey);
  if (due >= 0) {
    s.pattern = s.again.splice(due, 1)[0].pattern;
  } else {
    const k = keyOf(s.mode);
    s.pattern = progress.pickWeighted(s.pool, k, s.pattern ? k(s.pattern) : null);
  }
}

function mark(got) {
  const s = session;
  progress.record(keyOf(s.mode)(s.pattern), got);
  if (!got) s.again.push({ pattern: s.pattern, due: s.turn + 2 + Math.floor(Math.random() * 3) });
  const maxLevel = longestAllowed(selectedNotes().length);
  s.message = '';
  if (progress.recordForLevel(LEVEL, got, maxLevel)) {
    buildPool();
    s.message = `Level up! Now: ${levelName(s.length).toLowerCase()}`;
  }
  nextCard();
}

// ---------- pieces of a card ----------
function namesRow(pattern) {
  return `<div class="names">${pattern.map(n =>
    `<span class="nm">${n.name}${n.high ? '<small>high</small>' : ''}</span>`).join('')}</div>`;
}

function notesBlock(pattern) {
  return `<div class="note-block">
      <div class="staff-wrap len-${pattern.length}">${staffSvg(pattern.map(n => n.id))}</div>
      ${namesRow(pattern)}
    </div>`;
}

function fingeringsBlock(pattern) {
  const compact = pattern.length > 1 ? 'compact' : '';
  return `<div class="recorders len-${pattern.length} ${compact}">${pattern.map(n =>
    `<div class="recorder-wrap">${recorderSvg(n.fingering)}</div>`).join('')}</div>`;
}

// ---------- screens ----------
function homeScreen() {
  const count = selectedNotes().length;
  const chips = NOTES.map(n => `
    <button class="chip" data-action="toggle-note" data-id="${n.id}"
      aria-pressed="${settings.notes.includes(n.id)}">${chipLabel(n)}</button>`).join('');
  const modeButton = mode => `
    <button class="btn primary huge" data-action="start" data-id="${mode}" ${count ? '' : 'disabled'}>
      ${MODES[mode].title}<small>${MODES[mode].sub}</small></button>`;
  const canPattern = longestAllowed(count) > 1;
  const level = currentLength();
  const lengthButtons = [1, 2, 3, 4].slice(0, MAX_LENGTH).map(n => `
    <button class="seg" data-action="set-level" data-id="${n}" aria-pressed="${level === n}"
      ${n > 1 && !canPattern ? 'disabled' : ''}>${n}</button>`).join('');
  return `
    <header class="home-head">
      <h1>Recorder Fingerings</h1>
      <p class="sub">Soprano recorder · Baroque fingering</p>
    </header>
    <section class="panel">
      <div class="panel-head">
        <h2>Notes</h2>
        <div class="mini-btns">
          <button class="link" data-action="all-notes">All</button>
          <button class="link" data-action="no-notes">None</button>
        </div>
      </div>
      <div class="chips">${chips}</div>
      <p class="count">${count} note${count === 1 ? '' : 's'} selected</p>
      <h2>Notes per card</h2>
      <div class="segs len-picker">${lengthButtons}</div>
      <p class="hint">${canPattern
        ? `${levelName(level)}. Get ${progress.LEVEL_UP_NEEDED} right out of ${progress.LEVEL_UP_WINDOW} and the app moves you up.`
        : 'Choose 2 or more notes to practice patterns.'}</p>
    </section>
    <div class="big-btns">${modeButton('note')}${modeButton('fingering')}</div>
  `;
}

function cardScreen() {
  const s = session;
  const p = s.pattern;
  const noteFirst = s.mode === 'note';
  const multi = p.length > 1;
  const ask = noteFirst
    ? (multi ? 'What are the fingerings?' : 'What is the fingering?')
    : (multi ? 'What are the notes?' : 'What note is this?');
  const prompt = noteFirst ? notesBlock(p) : fingeringsBlock(p);
  const answer = s.revealed
    ? `<div class="answer shown" aria-live="polite">${noteFirst ? fingeringsBlock(p) : notesBlock(p)}</div>`
    : `<div class="answer"><button class="btn reveal" data-action="reveal">Show answer</button></div>`;
  const judge = s.revealed
    ? `<div class="judge">
         <button class="btn good" data-action="got">✓ I got it</button>
         <button class="btn again" data-action="again">↻ Try again later</button>
       </div>`
    : '';
  const score = progress.recentScore(LEVEL);
  return `
    <header class="bar">
      <button class="link" data-action="home">‹ Home</button>
      <span class="bar-title">${MODES[s.mode].title}</span>
      <span></span>
    </header>
    ${s.message ? `<div class="banner" role="status">🎉 ${s.message}</div>` : ''}
    <article class="card ${multi ? 'stacked' : ''}">
      <p class="level-label">${levelName(s.length)}</p>
      <p class="ask">${ask}</p>
      <div class="card-body">
        <div class="side">${prompt}</div>
        <div class="side">${answer}</div>
      </div>
    </article>
    <div class="play-btns">
      <button class="btn" data-action="hear">▶ Hear it</button>
    </div>
    ${judge}
    ${s.length < longestAllowed(selectedNotes().length) && score.of > 0
      ? `<p class="hint center">${score.got} right out of ${score.of} · get ${progress.LEVEL_UP_NEEDED} out of ${progress.LEVEL_UP_WINDOW} to move up</p>`
      : ''}
  `;
}

const SCREENS = { home: homeScreen, card: cardScreen };

function render() {
  root.innerHTML = SCREENS[screen]();
}

// ---------- button handling ----------
const ACTIONS = {
  'toggle-note': id => {
    settings.notes = settings.notes.includes(id)
      ? settings.notes.filter(x => x !== id)
      : [...settings.notes, id];
    saveSettings();
  },
  'all-notes': () => { settings.notes = NOTES.map(n => n.id); saveSettings(); },
  'no-notes': () => { settings.notes = []; saveSettings(); },
  'set-level': n => progress.setLevel(LEVEL, Number(n)),
  'start': mode => { startSession(mode); window.scrollTo(0, 0); },
  'home': () => { screen = 'home'; window.scrollTo(0, 0); },
  'hear': () => { audio.playNotes(session.pattern.map(n => soundingMidi(n.id))); return false; },
  'reveal': () => { session.revealed = true; },
  'got': () => mark(true),
  'again': () => mark(false),
};

root.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  audio.unlock(); // any tap wakes up sound on iOS
  if (ACTIONS[el.dataset.action](el.dataset.id, el) !== false) render();
});

render();

// Offline copy. When a newer version of the app arrives, reload once to show it.
if ('serviceWorker' in navigator) {
  let hadVersion = !!navigator.serviceWorker.controller; // false on the very first visit
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadVersion) location.reload();
    hadVersion = true;
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
