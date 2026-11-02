# Interval Singing

An ear-training and singing practice app for diatonic intervals in B♭ major
(movable do, do = B♭ below middle C). It's based on a printed deck of interval flash cards.

- **Practice mode:** choose intervals and directions; hear the starting pitch, sing, compare, show the answer.
- **Test mode:** 10 questions, answer and interval hidden until she taps "I sang it"; score and missed cards at the end.
- No microphone, no accounts, no tracking. Progress is stored only on the device.
- Works offline after the first visit and can be added to the iPhone/iPad home screen.

## Files

| File | What it holds |
|---|---|
| `js/cards-data.js` | The card list (cards 1–132 match the printed deck; 133+ are extra low-note cards) |
| `js/cards.js` | Solfege names, interval names, practice groups |
| `js/staff.js` | Draws the treble clef staff |
| `js/audio.js` | The piano-like sound |
| `js/progress.js` | Saving progress and choosing which card comes next |
| `js/app.js` | The screens and buttons |
| `css/style.css` | Colors and layout |
| `sw.js` | Offline copy. **Change `VERSION` whenever any file changes** so devices update. |

## Credits

Treble clef, flat, and notehead shapes come from the [Bravura](https://github.com/steinbergmedia/bravura)
font by Steinberg, used under the SIL Open Font License 1.1.
