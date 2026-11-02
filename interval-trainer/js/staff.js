// Draws a treble-clef staff in B-flat major with one or two half notes,
// like the front of the printed flash cards.

import { GLYPHS } from './glyphs.js';
import { staffStepOf } from './cards.js';

// Drawing units: one staff space = 10.
const SP = 10;
const FONT = SP / 250;            // font units -> drawing units
const E4_STEP = 30;               // bottom line of the treble staff
const BOTTOM_Y = 64;              // y of the bottom line (E4)
const MIDDLE_Y = BOTTOM_Y - 2 * SP; // B4 line
const WIDTH = 160;
const HEAD_W = 295 * FONT;        // notehead width
const NOTE_X = [80, 124];         // x of first and second note
const STEM = 3.5 * SP;

const yOf = step => BOTTOM_Y - (step - E4_STEP) * (SP / 2);

function glyph(path, x, y, cls = '') {
  return `<path class="${cls}" d="${path}" transform="translate(${x} ${y}) scale(${FONT} ${-FONT})"/>`;
}

function noteSvg(note, x, cls) {
  const step = staffStepOf(note);
  const y = yOf(step);
  let out = `<g class="${cls}">`;
  // Ledger lines below the staff (C4 and lower)
  for (let s = E4_STEP - 2; s >= step; s -= 2) {
    out += `<line class="ledger" x1="${x - 4}" x2="${x + HEAD_W + 4}" y1="${yOf(s)}" y2="${yOf(s)}"/>`;
  }
  // Ledger lines above the staff (A5 and higher; not used by the current cards)
  for (let s = E4_STEP + 10; s <= step; s += 2) {
    out += `<line class="ledger" x1="${x - 4}" x2="${x + HEAD_W + 4}" y1="${yOf(s)}" y2="${yOf(s)}"/>`;
  }
  out += glyph(GLYPHS.noteheadHalf, x, y);
  // Stem: up for notes below the middle line, down otherwise.
  if (step < E4_STEP + 4) {
    const sx = x + HEAD_W - 0.6;
    out += `<line class="stem" x1="${sx}" x2="${sx}" y1="${y - 0.7}" y2="${Math.min(y - STEM, MIDDLE_Y)}"/>`;
  } else {
    const sx = x + 0.6;
    out += `<line class="stem" x1="${sx}" x2="${sx}" y1="${y + 0.7}" y2="${Math.max(y + STEM, MIDDLE_Y)}"/>`;
  }
  return out + '</g>';
}

// from/to are note names like "Bb3". showTarget=false leaves a "?" in place of the 2nd note.
export function staffSvg(from, to, showTarget) {
  let s = `<svg class="staff" viewBox="0 6 ${WIDTH} 100" role="img" aria-label="Notes on the treble clef staff">`;
  for (let i = 0; i < 5; i++) {
    const y = BOTTOM_Y - i * SP;
    s += `<line class="staff-line" x1="2" x2="${WIDTH - 2}" y1="${y}" y2="${y}"/>`;
  }
  s += glyph(GLYPHS.gClef, 5, BOTTOM_Y - SP);              // G clef curls around the G line
  s += glyph(GLYPHS.flat, 36, yOf(E4_STEP + 4));            // B flat
  s += glyph(GLYPHS.flat, 46, yOf(E4_STEP + 7));            // E flat
  s += noteSvg(from, NOTE_X[0], 'note-start');
  if (showTarget) {
    s += noteSvg(to, NOTE_X[1], 'note-target');
  } else {
    s += `<text class="note-hidden" x="${NOTE_X[1] + HEAD_W / 2}" y="${MIDDLE_Y + 6}" text-anchor="middle">?</text>`;
  }
  return s + '</svg>';
}
