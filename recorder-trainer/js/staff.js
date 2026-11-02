// Draws one whole note on a treble clef staff (no key signature),
// like the boxes on the printed fingering chart.

import { GLYPHS } from './glyphs.js';
import { staffStepOf, parseNote } from './notes.js';

const SP = 10;                 // one staff space
const FONT = SP / 250;         // font units -> drawing units
const E4_STEP = 30;            // bottom line
const BOTTOM_Y = 64;
const WIDTH = 110;
const NOTE_X = 66;
const HEAD_W = 422 * FONT;

const yOf = step => BOTTOM_Y - (step - E4_STEP) * (SP / 2);

const glyph = (path, x, y) =>
  `<path d="${path}" transform="translate(${x} ${y}) scale(${FONT} ${-FONT})"/>`;

export function staffSvg(noteId) {
  const step = staffStepOf(noteId);
  const y = yOf(step);
  const acc = parseNote(noteId).accidental;
  let s = `<svg class="staff" viewBox="0 6 ${WIDTH} 80" role="img" aria-label="Note on the treble clef staff">`;
  for (let i = 0; i < 5; i++) {
    const ly = BOTTOM_Y - i * SP;
    s += `<line class="staff-line" x1="2" x2="${WIDTH - 2}" y1="${ly}" y2="${ly}"/>`;
  }
  s += glyph(GLYPHS.gClef, 5, BOTTOM_Y - SP);
  // ledger lines below (middle C) and above (A5+, not used now)
  for (let st = E4_STEP - 2; st >= step; st -= 2) {
    s += `<line class="ledger" x1="${NOTE_X - 4}" x2="${NOTE_X + HEAD_W + 4}" y1="${yOf(st)}" y2="${yOf(st)}"/>`;
  }
  for (let st = E4_STEP + 10; st <= step; st += 2) {
    s += `<line class="ledger" x1="${NOTE_X - 4}" x2="${NOTE_X + HEAD_W + 4}" y1="${yOf(st)}" y2="${yOf(st)}"/>`;
  }
  if (acc === '#') s += glyph(GLYPHS.sharp, NOTE_X - 14, y);
  if (acc === 'b') s += glyph(GLYPHS.flat, NOTE_X - 13, y);
  s += glyph(GLYPHS.noteheadWhole, NOTE_X, y);
  return s + '</svg>';
}
