// Music facts for the app: notes, solfege, interval names, and the card list.
// Key: B-flat major, movable do, Do = B-flat below middle C (Bb3).

import { CARD_ROWS } from './cards-data.js';

// Solfege for every note the app uses.
// ′ (prime) = upper octave, as on the printed cards.
// ͵ (low mark) = the octave below low Do.
export const SOLFEGE = {
  F3: 'sol͵', G3: 'la͵', A3: 'ti͵',
  Bb3: 'do', C4: 're', D4: 'mi', Eb4: 'fa', F4: 'sol', G4: 'la', A4: 'ti',
  Bb4: 'do′', C5: 're′', D5: 'mi′', Eb5: 'fa′', F5: 'sol′',
};

// Interval codes -> names (spelled the same way as on the cards)
// and the practice group each one belongs to.
export const INTERVALS = {
  m2:  { name: 'Minor 2nd',      group: 'm2' },
  M2:  { name: 'Major 2nd',      group: 'M2' },
  m3:  { name: 'Minor 3rd',      group: 'm3' },
  M3:  { name: 'Major 3rd',      group: 'M3' },
  P4:  { name: 'Perfect 4th',    group: 'P4' },
  A4:  { name: 'Augmented 4th',  group: 'TT', note: 'tritone' },
  d5:  { name: 'Diminished 5th', group: 'TT', note: 'tritone' },
  P5:  { name: 'Perfect 5th',    group: 'P5' },
  m6:  { name: 'Minor 6th',      group: 'm6' },
  M6:  { name: 'Major 6th',      group: 'M6' },
  m7:  { name: 'Minor 7th',      group: 'm7' },
  M7:  { name: 'Major 7th',      group: 'M7' },
  P8:  { name: 'Perfect octave', group: 'P8' },
  m9:  { name: 'Minor 9th',      group: 'BIG' },
  M9:  { name: 'Major 9th',      group: 'BIG' },
  m10: { name: 'Minor 10th',     group: 'BIG' },
  M10: { name: 'Major 10th',     group: 'BIG' },
  P11: { name: 'Perfect 11th',   group: 'BIG' },
  P12: { name: 'Perfect 12th',   group: 'BIG' },
};

// The buttons she can switch on/off when choosing what to practice.
// "on" = selected the very first time the app is opened.
export const GROUPS = [
  { id: 'm2', label: 'min 2nd', on: true },
  { id: 'M2', label: 'Maj 2nd', on: true },
  { id: 'm3', label: 'min 3rd', on: true },
  { id: 'M3', label: 'Maj 3rd', on: true },
  { id: 'P4', label: 'Perf 4th', on: true },
  { id: 'TT', label: 'Tritone', on: true },
  { id: 'P5', label: 'Perf 5th', on: true },
  { id: 'm6', label: 'min 6th', on: true },
  { id: 'M6', label: 'Maj 6th', on: true },
  { id: 'm7', label: 'min 7th', on: true },
  { id: 'M7', label: 'Maj 7th', on: true },
  { id: 'P8', label: 'Octave', on: true },
  { id: 'BIG', label: 'Beyond the octave', on: false, wide: true },
];

const LETTER_STEPS = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const LETTER_SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// "Eb4" -> { letter: 'E', flat: true, octave: 4 }
function parseNote(note) {
  const m = /^([A-G])(b?)(\d)$/.exec(note);
  return { letter: m[1], flat: m[2] === 'b', octave: Number(m[3]) };
}

// MIDI number (middle C = 60), used for sound.
export function midiOf(note) {
  const n = parseNote(note);
  return 12 * (n.octave + 1) + LETTER_SEMIS[n.letter] - (n.flat ? 1 : 0);
}

// Position on the staff, counted in lines-and-spaces (C4 = 28, E4 = 30).
export function staffStepOf(note) {
  const n = parseNote(note);
  return n.octave * 7 + LETTER_STEPS[n.letter];
}

// "Eb4" -> "E♭4" for display
export function prettyNote(note) {
  return note.replace('b', '♭');
}

export const CARDS = CARD_ROWS.map(([num, code, from, to]) => {
  const up = midiOf(to) > midiOf(from);
  const iv = INTERVALS[code];
  return {
    id: num,
    code,
    name: iv.name,
    note: iv.note || '',
    group: iv.group,
    up,
    from,
    to,
    fromSyl: SOLFEGE[from],
    toSyl: SOLFEGE[to],
    extra: num > 132, // not in the printed deck
  };
});

export function cardsFor(groupIds, direction) {
  return CARDS.filter(c =>
    groupIds.includes(c.group) &&
    (direction === 'both' || (direction === 'up') === c.up));
}
