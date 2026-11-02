// The notes and their soprano recorder fingerings (Baroque fingering),
// matching the printed fingering chart: middle C up to the E a 10th above.
//
// Fingering format: [thumb, 1, 2, 3, 4, 5, 6, 7]
//   thumb = the hole on the back; 1-3 = left hand; 4-7 = right hand (6 and 7 are double holes)
//   1 = covered, 0 = open, 0.5 = half covered (pinched thumb)
//
// "note" is the WRITTEN note. A soprano recorder sounds one octave higher,
// so the app plays it an octave up (see SOUNDS_OCTAVE_UP).

export const SOUNDS_OCTAVE_UP = true;

export const NOTES = [
  { id: 'C4',  name: 'C',  fingering: [1,   1, 1, 1,  1, 1, 1, 1] },
  { id: 'D4',  name: 'D',  fingering: [1,   1, 1, 1,  1, 1, 1, 0] },
  { id: 'E4',  name: 'E',  fingering: [1,   1, 1, 1,  1, 1, 0, 0] },
  { id: 'F4',  name: 'F',  fingering: [1,   1, 1, 1,  1, 0, 1, 1] },
  { id: 'F#4', name: 'F♯', fingering: [1,   1, 1, 1,  0, 1, 1, 0] },
  { id: 'G4',  name: 'G',  fingering: [1,   1, 1, 1,  0, 0, 0, 0] },
  { id: 'A4',  name: 'A',  fingering: [1,   1, 1, 0,  0, 0, 0, 0] },
  { id: 'Bb4', name: 'B♭', fingering: [1,   1, 0, 1,  1, 0, 0, 0] },
  { id: 'B4',  name: 'B',  fingering: [1,   1, 0, 0,  0, 0, 0, 0] },
  { id: 'C5',  name: 'C',  fingering: [1,   0, 1, 0,  0, 0, 0, 0], high: true },
  { id: 'D5',  name: 'D',  fingering: [0,   0, 1, 0,  0, 0, 0, 0], high: true },
  { id: 'E5',  name: 'E',  fingering: [0.5, 1, 1, 1,  1, 1, 0, 0], high: true },
];

const LETTER_STEPS = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const LETTER_SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// "F#4" -> { letter: 'F', accidental: '#', octave: 4 }
export function parseNote(id) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(id);
  return { letter: m[1], accidental: m[2], octave: Number(m[3]) };
}

// Line/space position on the staff (C4 = 28, E4 = 30 = bottom line).
export function staffStepOf(id) {
  const n = parseNote(id);
  return n.octave * 7 + LETTER_STEPS[n.letter];
}

// MIDI number of the SOUNDING pitch (middle C = 60).
export function soundingMidi(id) {
  const n = parseNote(id);
  const shift = n.accidental === '#' ? 1 : n.accidental === 'b' ? -1 : 0;
  return 12 * (n.octave + 1) + LETTER_SEMIS[n.letter] + shift + (SOUNDS_OCTAVE_UP ? 12 : 0);
}
