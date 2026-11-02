// Screens: Home and Card. Two ways to practice:
//   'note'      : see the note -> think of the fingering -> Show answer shows the fingering
//   'fingering' : see the fingering -> name the note -> Show answer shows the note
// Buttons use data-action="..." and are handled in ACTIONS at the bottom.

import { NOTES, soundingMidi } from './notes.js';
import { staffSvg } from './staff.js';
import { recorderSvg } from './recorder.js';
import * as audio from './audio.js';
import * as progress from './progress.js';

const root = document.getElementById('app');

const MODES = {
  note: { title: 'Note → Fingering', ask: 'What is the fingering?' },
  fingering: { title: 'Fingering → Note', ask: 'What note is this?' },
};

// ---------- settings (remembered on the device) ----------
const saved = progress.getSettings();
const settings = { notes: saved.notes || NOTES.map(n => n.id) };
const saveSettings = () => progress.saveSettings(settings);

let screen = 'home';
let session = null;

const chipLabel = n => (n.high ? 'high ' : '') + n.name;
const keyOf = mode => n => `${mode}:${n.id}`;

function selectedNotes() {
  return NOTES.filter(n => settings.notes.includes(n.id));
}

function startSession(mode) {
  session = { mode, notes: selectedNotes(), turn: 0, again: [], note: null, revealed: false };
  nextNote();
  screen = 'card';
}

function nextNote() {
  const s = session;
  s.revealed = false;
  s.turn += 1;
  const due = s.again.findIndex(a => a.due <= s.turn && a.id !== s.note?.id);
  if (due >= 0) {
    const id = s.again.splice(due, 1)[0].id;
    s.note = NOTES.find(n => n.id === id);
  } else {
    s.note = progress.pickWeighted(s.notes, keyOf(s.mode), s.note?.id);
  }
}

function mark(got) {
  const s = session;
  progress.record(keyOf(s.mode)(s.note), got);
  if (!got) s.again.push({ id: s.note.id, due: s.turn + 2 + Math.floor(Math.random() * 3) });
  nextNote();
}

// ---------- screens ----------
function homeScreen() {
  const count = selectedNotes().length;
  const chips = NOTES.map(n => `
    <button class="chip" data-action="toggle-note" data-id="${n.id}"
      aria-pressed="${settings.notes.includes(n.id)}">${chipLabel(n)}</button>`).join('');
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
    </section>
    <div class="big-btns">
      <button class="btn primary huge" data-action="start" data-id="note" ${count ? '' : 'disabled'}>
        Note → Fingering<small>See the note, show the fingering</small></button>
      <button class="btn primary huge" data-action="start" data-id="fingering" ${count ? '' : 'disabled'}>
        Fingering → Note<small>See the fingering, name the note</small></button>
    </div>
  `;
}

function noteBlock(n, big) {
  return `<div class="note-block ${big ? 'big' : ''}">
      <div class="staff-wrap">${staffSvg(n.id)}</div>
      <div class="note-name">${n.name}${n.high ? '<span class="octave">high</span>' : ''}</div>
    </div>`;
}

function fingeringBlock(n) {
  return `<div class="recorder-wrap">${recorderSvg(n.fingering)}</div>`;
}

function cardScreen() {
  const s = session;
  const n = s.note;
  const noteFirst = s.mode === 'note';
  const prompt = noteFirst ? noteBlock(n, true) : fingeringBlock(n);
  const answer = s.revealed
    ? `<div class="answer shown" aria-live="polite">${noteFirst ? fingeringBlock(n) : noteBlock(n, true)}</div>`
    : `<div class="answer"><button class="btn reveal" data-action="reveal">Show answer</button></div>`;
  const judge = s.revealed
    ? `<div class="judge">
         <button class="btn good" data-action="got">✓ I got it</button>
         <button class="btn again" data-action="again">↻ Try again later</button>
       </div>`
    : '';
  return `
    <header class="bar">
      <button class="link" data-action="home">‹ Home</button>
      <span class="bar-title">${MODES[s.mode].title}</span>
      <span></span>
    </header>
    <article class="card ${s.mode}">
      <p class="ask">${MODES[s.mode].ask}</p>
      <div class="card-body">
        <div class="side">${prompt}</div>
        <div class="side">${answer}</div>
      </div>
    </article>
    <div class="play-btns">
      <button class="btn" data-action="hear">▶ Hear it</button>
    </div>
    ${judge}
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
  'start': mode => { startSession(mode); window.scrollTo(0, 0); },
  'home': () => { screen = 'home'; window.scrollTo(0, 0); },
  'hear': () => { audio.playNote(soundingMidi(session.note.id)); return false; },
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
