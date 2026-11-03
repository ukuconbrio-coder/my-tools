# Recorder Fingerings

A practice app for soprano recorder fingerings (Baroque fingering), written middle C up to the E a 10th above,
matching a printed fingering chart.

- **Note → Fingering:** see the note on the staff, think of the fingering, then *Show answer*.
- **Fingering → Note:** see the fingering, name the note, then *Show answer*.
- **Patterns:** she starts with single notes. After 8 right out of 10, the app moves her up to
  2-note patterns, then 3, then 4 (separately for each practice direction). Patterns use every possible
  order of her chosen notes, never the same note twice in a row. "Change level" on the home screen
  lets a teacher set the level by hand.
- **Hear it** plays the note at real soprano recorder pitch (an octave above written).
- "Try again later" notes come back sooner and more often. Progress is stored only on the device.
- Works offline after the first visit and can be added to the iPhone/iPad home screen.

## Files

| File | What it holds |
|---|---|
| `js/notes.js` | The notes and their fingerings, easy to edit or add to |
| `js/patterns.js` | Builds every 1–4 note pattern from the chosen notes |
| `js/recorder.js` | Draws the recorder and its holes |
| `js/staff.js` | Draws the note on the treble clef staff |
| `js/audio.js` | The recorder-like sound |
| `js/progress.js` | Saving progress, levels (notes per card), and choosing what comes next |
| `js/app.js` | The screens and buttons |
| `css/style.css` | Colors and layout |
| `sw.js` | Offline copy. **Change `VERSION` whenever any file changes** so devices update. |

## Credits

Treble clef, accidental and notehead shapes come from the [Bravura](https://github.com/steinbergmedia/bravura)
font by Steinberg, used under the SIL Open Font License 1.1.
