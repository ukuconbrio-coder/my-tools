// Builds every possible pattern of 1-4 notes from the chosen notes.
// Any order is allowed, but the same note never comes twice in a row
// (E-G-E is a pattern; E-E is not).
//
// Example with E, G, A and 2 notes per card:
//   E-G, E-A, G-E, G-A, A-E, A-G   (6 patterns)

export const MAX_LENGTH = 4;

export function allPatterns(notes, length) {
  let patterns = notes.map(n => [n]);
  for (let i = 1; i < length; i++) {
    const longer = [];
    for (const p of patterns) {
      for (const n of notes) {
        if (n.id !== p[p.length - 1].id) longer.push([...p, n]);
      }
    }
    patterns = longer;
  }
  return patterns;
}

// A short name for a pattern, used to save progress: "E4-G4-A4"
export const patternKey = pattern => pattern.map(n => n.id).join('-');

// The longest patterns possible with this many notes chosen.
export function longestAllowed(noteCount) {
  return noteCount >= 2 ? MAX_LENGTH : 1;
}
