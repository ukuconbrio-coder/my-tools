// Draws whole notes on a treble clef staff (no key signature),
// like the boxes on the printed fingering chart. One note, or a pattern of up to 4.

import { GLYPHS } from './glyphs.js';
import { staffStepOf, parseNote } from './notes.js';

const SP = 10;                 // one staff space
const FONT = SP / 250;         // font units -> drawing units
const E4_STEP = 30;            // bottom line
const BOTTOM_Y = 64;
const FIRST_X = 58;            // where the first note goes (after the clef)
const GAP = 34;                // space between notes in a pattern
const HEAD_W = 422 * FONT;

const yOf = step => BOTTOM_Y - (step - E4_STEP) * (SP / 2);

const glyph = (path, x, y) =>
  `<path d="${path}" transform="translate(${x} ${y}) scale(${FONT} ${-FONT})"/>`;

function noteSvg(noteId, x) {
  const step = staffStepOf(noteId);
  const y = yOf(step);
  const acc = parseNote(noteId).accidental;
  let s = '';
  // ledger lines below (middle C) and above (A5+, not used now)
  for (let st = E4_STEP - 2; st >= step; st -= 2) {
    s += `<line class="ledger" x1="${x - 4}" x2="${x + HEAD_W + 4}" y1="${yOf(st)}" y2="${yOf(st)}"/>`;
  }
  for (let st = E4_STEP + 10; st <= step; st += 2) {
    s += `<line class="ledger" x1="${x - 4}" x2="${x + HEAD_W + 4}" y1="${yOf(st)}" y2="${yOf(st)}"/>`;
  }
  if (acc === '#') s += glyph(GLYPHS.sharp, x - 14, y);
  if (acc === 'b') s += glyph(GLYPHS.flat, x - 13, y);
  return s + glyph(GLYPHS.noteheadWhole, x, y);
}

// noteIds: one note id ("F#4") or a list of them.
export function staffSvg(noteIds) {
  const ids = [].concat(noteIds);
  const width = FIRST_X + (ids.length - 1) * GAP + HEAD_W + 18;
  let s = `<svg class="staff" viewBox="0 6 ${width} 80" role="img" aria-label="Notes on the treble clef staff">`;
  for (let i = 0; i < 5; i++) {
    const ly = BOTTOM_Y - i * SP;
    s += `<line class="staff-line" x1="2" x2="${width - 2}" y1="${ly}" y2="${ly}"/>`;
  }
  s += glyph(GLYPHS.gClef, 5, BOTTOM_Y - SP);
  ids.forEach((id, i) => { s += noteSvg(id, FIRST_X + i * GAP); });
  return s + '</svg>';
}
