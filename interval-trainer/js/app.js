// The screens of the app: Home, Card (practice or test), Test results, Progress.
// Each screen is a function that returns HTML. Buttons use data-action="..."
// and are handled in one place (ACTIONS, at the bottom).

import { CARDS, GROUPS, cardsFor, midiOf, prettyNote } from './cards.js';
import { staffSvg } from './staff.js';
import * as audio from './audio.js';
import * as progress from './progress.js';

const TEST_LENGTH = 10;
const root = document.getElementById('app');

// ---------- settings (remembered on the device) ----------
const saved = progress.getSettings();
const settings = {
  groups: saved.groups || GROUPS.filter(g => g.on).map(g => g.id),
  direction: saved.direction || 'both',
  showBoth: !!saved.showBoth,
};
const saveSettings = () => progress.saveSettings(settings);

// ---------- session state ----------
let screen = 'home';
let session = null;   // the current practice or test round
let lastResults = null;

function selectedCards() {
  return cardsFor(settings.groups, settings.direction);
}

function startSession(mode, cards) {
  session = {
    mode,              // 'practice' or 'test'
    cards,             // the cards in play
    turn: 0,
    again: [],         // practice: cards to bring back soon [{ id, due }]
    queue: mode === 'test' ? progress.pickTestSet(cards, TEST_LENGTH) : null,
    answers: [],       // test: [{ card, got }]
    card: null,
    revealed: false,
  };
  nextCard();
  screen = 'card';
}

function nextCard() {
  const s = session;
  s.revealed = false;
  if (s.mode === 'test') {
    s.card = s.queue[s.answers.length];
    return;
  }
  s.turn += 1;
  const dueIndex = s.again.findIndex(a => a.due <= s.turn && a.id !== s.card?.id);
  if (dueIndex >= 0) {
    const id = s.again.splice(dueIndex, 1)[0].id;
    s.card = CARDS.find(c => c.id === id);
  } else {
    s.card = progress.pickWeighted(s.cards, s.card?.id);
  }
}

function markCard(got) {
  const s = session;
  progress.record(s.card.id, got);
  if (s.mode === 'test') {
    s.answers.push({ card: s.card, got });
    if (s.answers.length >= s.queue.length) {
      const score = s.answers.filter(a => a.got).length;
      progress.recordTest(score, s.answers.length);
      lastResults = s.answers;
      screen = 'results';
      return;
    }
  } else if (!got) {
    // bring it back in 3 to 5 cards
    s.again.push({ id: s.card.id, due: s.turn + 3 + Math.floor(Math.random() * 3) });
  }
  nextCard();
}

// ---------- screens ----------
function homeScreen() {
  const count = selectedCards().length;
  const chips = GROUPS.map(g => `
    <button class="chip ${g.wide ? 'wide' : ''}" data-action="toggle-group" data-id="${g.id}"
      aria-pressed="${settings.groups.includes(g.id)}">${g.label}</button>`).join('');
  const dir = (val, label) => `
    <button class="seg" data-action="direction" data-id="${val}" aria-pressed="${settings.direction === val}">${label}</button>`;
  return `
    <header class="home-head">
      <h1>Interval Singing</h1>
      <p class="sub">B♭ major · do = B♭ below middle C</p>
    </header>

    <section class="panel">
      <div class="panel-head">
        <h2>Intervals</h2>
        <div class="mini-btns">
          <button class="link" data-action="all-groups">All</button>
          <button class="link" data-action="no-groups">None</button>
        </div>
      </div>
      <div class="chips">${chips}</div>
      <h2>Direction</h2>
      <div class="segs">${dir('up', '↑ Up')}${dir('down', '↓ Down')}${dir('both', 'Both')}</div>
      <label class="check">
        <input type="checkbox" data-action="show-both" ${settings.showBoth ? 'checked' : ''}>
        <span>Show both notes on the staff before the answer</span>
      </label>
      <p class="count">${count} card${count === 1 ? '' : 's'} selected</p>
    </section>

    <div class="big-btns">
      <button class="btn primary huge" data-action="practice" ${count ? '' : 'disabled'}>Practice</button>
      <button class="btn huge" data-action="test" ${count ? '' : 'disabled'}>Test · ${TEST_LENGTH} questions</button>
    </div>
    <button class="link center" data-action="progress">My progress</button>
  `;
}

function cardScreen() {
  const s = session;
  const c = s.card;
  const test = s.mode === 'test';
  const title = test ? `Test · ${s.answers.length + 1} of ${s.queue.length}` : 'Practice';
  const showTarget = s.revealed || (settings.showBoth && !test); // never give it away in a test
  const canHearInterval = !test || s.revealed;

  const answer = s.revealed
    ? `<div class="answer shown" aria-live="polite">
         <div class="syls"><span class="syl-start">${c.fromSyl}</span><span class="arrow">→</span><span class="syl-target">${c.toSyl}</span></div>
         <div class="letters">${prettyNote(c.from)} → ${prettyNote(c.to)}</div>
       </div>`
    : `<div class="answer"><button class="btn reveal" data-action="reveal">${test ? 'I sang it · Show answer' : 'Show answer'}</button></div>`;

  const judge = s.revealed
    ? `<div class="judge">
         <button class="btn good" data-action="got">✓ I got it</button>
         <button class="btn again" data-action="again">↻ Try again later</button>
       </div>`
    : '';

  return `
    <header class="bar">
      <button class="link" data-action="home">‹ Home</button>
      <span class="bar-title">${title}</span>
      <span class="card-num">${c.extra ? 'Extra card' : 'Card ' + c.id}</span>
    </header>

    <article class="card">
      <div class="prompt">
        <div class="interval">${c.name}${c.note ? ` <span class="iv-note">(${c.note})</span>` : ''}</div>
        <div class="dir ${c.up ? 'up' : 'down'}">${c.up ? '↑ up' : '↓ down'} from</div>
        <div class="from-syl">${c.fromSyl}</div>
      </div>
      <div class="staff-wrap">${staffSvg(c.from, c.to, showTarget)}</div>
      ${answer}
    </article>

    <div class="play-btns">
      <button class="btn primary" data-action="hear-start">▶ Hear starting pitch</button>
      <div class="pair">
        <button class="btn" data-action="hear-interval" ${canHearInterval ? '' : 'disabled'}>▶ Hear the interval</button>
        <button class="btn" data-action="hear-together" ${canHearInterval ? '' : 'disabled'}>▶ Both together</button>
      </div>
    </div>
    ${judge}
  `;
}

function cardLine(c) {
  return `<li><span class="li-name">${c.name} ${c.up ? '↑' : '↓'}</span>
    <span class="li-syl">${c.fromSyl} → ${c.toSyl}</span></li>`;
}

function resultsScreen() {
  const score = lastResults.filter(a => a.got).length;
  const total = lastResults.length;
  const missed = lastResults.filter(a => !a.got).map(a => a.card);
  const msg = score === total ? 'Perfect! Every one!' : score >= total * 0.8 ? 'Great singing!' : score >= total * 0.5 ? 'Good work. Keep going!' : 'Nice effort. Practice makes it easier!';
  return `
    <header class="bar"><button class="link" data-action="home">‹ Home</button><span class="bar-title">Test results</span><span></span></header>
    <section class="results">
      <div class="score">${score}<span>/ ${total}</span></div>
      <p class="msg">${msg}</p>
      ${missed.length ? `
        <h2>To practice</h2>
        <ul class="missed">${missed.map(cardLine).join('')}</ul>
        <button class="btn primary huge" data-action="practice-missed">Practice these</button>` : ''}
      <button class="btn huge" data-action="test">Another test</button>
    </section>
  `;
}

function progressScreen() {
  const rows = GROUPS.map(g => {
    const cards = CARDS.filter(c => c.group === g.id);
    const stats = cards.map(c => progress.cardStats(c.id)).filter(Boolean);
    const strong = stats.filter(s => s.box >= 3).length;
    const seen = stats.reduce((t, s) => t + s.seen, 0);
    const got = stats.reduce((t, s) => t + s.got, 0);
    const pct = Math.round((strong / cards.length) * 100);
    return `<li>
      <span class="p-label">${g.label}</span>
      <span class="p-bar"><span style="width:${pct}%"></span></span>
      <span class="p-num">${seen ? Math.round((got / seen) * 100) + '%' : '·'}</span>
    </li>`;
  }).join('');
  const tests = progress.recentTests().slice(0, 5).map(t =>
    `<li><span>${new Date(t.date).toLocaleDateString()}</span><span>${t.score} / ${t.total}</span></li>`).join('');
  return `
    <header class="bar"><button class="link" data-action="home">‹ Home</button><span class="bar-title">My progress</span><span></span></header>
    <section class="panel">
      <p class="hint">The bar fills as cards get easy (when you tap “I got it” a few times in a row). The number shows how often you tapped “I got it”.</p>
      <ul class="prog">${rows}</ul>
      ${tests ? `<h2>Recent tests</h2><ul class="tests">${tests}</ul>` : ''}
      <button class="btn danger" data-action="reset">Reset progress</button>
    </section>
  `;
}

const SCREENS = { home: homeScreen, card: cardScreen, results: resultsScreen, progress: progressScreen };

function render() {
  root.innerHTML = SCREENS[screen]();
  window.scrollTo(0, 0);
}

// ---------- button handling ----------
const ACTIONS = {
  'toggle-group': id => {
    settings.groups = settings.groups.includes(id)
      ? settings.groups.filter(g => g !== id)
      : [...settings.groups, id];
    saveSettings();
  },
  'all-groups': () => { settings.groups = GROUPS.map(g => g.id); saveSettings(); },
  'no-groups': () => { settings.groups = []; saveSettings(); },
  'direction': id => { settings.direction = id; saveSettings(); },
  'show-both': (id, el) => { settings.showBoth = el.checked; saveSettings(); },
  'practice': () => startSession('practice', selectedCards()),
  'test': () => {
    const cards = screen === 'results' && session ? session.cards : selectedCards();
    startSession('test', cards);
  },
  'practice-missed': () => {
    const ids = [...new Set(lastResults.filter(a => !a.got).map(a => a.card.id))];
    startSession('practice', CARDS.filter(c => ids.includes(c.id)));
  },
  'home': () => { screen = 'home'; },
  'progress': () => { screen = 'progress'; },
  'reset': () => {
    if (confirm('Erase all progress and test scores on this device?')) progress.resetAll();
  },
  'hear-start': () => { audio.playOne(midiOf(session.card.from)); return false; },
  'hear-interval': () => { audio.playMelodic(midiOf(session.card.from), midiOf(session.card.to)); return false; },
  'hear-together': () => { audio.playTogether(midiOf(session.card.from), midiOf(session.card.to)); return false; },
  'reveal': () => { session.revealed = true; },
  'got': () => markCard(true),
  'again': () => markCard(false),
};

root.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled || el.type === 'checkbox') return;
  audio.unlock(); // any tap wakes up sound on iOS
  const keepScreen = ACTIONS[el.dataset.action](el.dataset.id, el) === false;
  if (!keepScreen) render();
});

root.addEventListener('change', e => {
  const el = e.target.closest('input[data-action]');
  if (!el) return;
  ACTIONS[el.dataset.action](el.dataset.id, el);
  render();
});

render();

// Offline support: save the app on the device after the first visit.
// When a newer version of the app arrives, reload once to show it.
if ('serviceWorker' in navigator) {
  let hadVersion = !!navigator.serviceWorker.controller; // false on the very first visit
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadVersion) location.reload();
    hadVersion = true;
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
