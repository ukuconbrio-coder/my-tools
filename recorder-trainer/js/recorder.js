// Draws a soprano recorder with its holes filled in for one fingering.
// Filled = covered, empty = open, half-filled = half covered (pinched thumb).
// The thumb hole is on the back, so it is drawn beside the recorder (like the chart).

const BODY_X = 78;               // centre line of the recorder
const HOLE_R = 9;
// y positions of front holes 1-7 (gap between left and right hand)
const HOLE_Y = [128, 162, 196, 250, 284, 318, 352];
const THUMB = { x: 24, y: 120 };

function hole(x, y, r, state, label) {
  const title = `<title>${label}: ${state === 1 ? 'covered' : state === 0 ? 'open' : 'half covered'}</title>`;
  if (state === 0.5) {
    // left half filled
    return `<g>${title}
      <circle class="hole open" cx="${x}" cy="${y}" r="${r}"/>
      <path class="hole-fill" d="M ${x} ${y - r} A ${r} ${r} 0 0 0 ${x} ${y + r} Z"/>
      <circle class="hole-ring" cx="${x}" cy="${y}" r="${r}"/></g>`;
  }
  return `<circle class="hole ${state ? 'closed' : 'open'}" cx="${x}" cy="${y}" r="${r}">${title}</circle>`;
}

// Double holes (6 and 7): a small and a larger hole side by side.
function doubleHole(y, state, label) {
  return hole(BODY_X - 6, y, 4.2, state, label) + hole(BODY_X + 6.5, y, 5.2, state, label);
}

export function recorderSvg(fingering) {
  const [thumb, ...front] = fingering;
  let s = `<svg class="recorder" viewBox="0 0 140 440" role="img" aria-label="Recorder fingering">`;
  // body: head, window, joints, bell
  s += `<path class="body" d="
      M ${BODY_X - 17} 14 Q ${BODY_X} 6 ${BODY_X + 17} 14
      L ${BODY_X + 19} 92 L ${BODY_X + 15} 100 L ${BODY_X + 15} 372
      Q ${BODY_X + 16} 392 ${BODY_X + 24} 410 L ${BODY_X + 24} 424
      L ${BODY_X - 24} 424 L ${BODY_X - 24} 410 Q ${BODY_X - 16} 392 ${BODY_X - 15} 372
      L ${BODY_X - 15} 100 L ${BODY_X - 19} 92 Z"/>`;
  s += `<rect class="window" x="${BODY_X - 7}" y="44" width="14" height="10" rx="2"/>`;
  s += `<line class="joint" x1="${BODY_X - 19}" x2="${BODY_X + 19}" y1="92" y2="92"/>`;
  s += `<line class="joint" x1="${BODY_X - 16}" x2="${BODY_X + 16}" y1="372" y2="372"/>`;
  s += `<line class="joint" x1="${BODY_X - 24}" x2="${BODY_X + 24}" y1="410" y2="410"/>`;

  // thumb hole (on the back)
  s += hole(THUMB.x, THUMB.y, HOLE_R, thumb, 'Thumb');
  s += `<text class="label" x="${THUMB.x}" y="${THUMB.y + 26}" text-anchor="middle">thumb</text>`;
  s += `<text class="label small" x="${THUMB.x}" y="${THUMB.y + 40}" text-anchor="middle">(back)</text>`;

  // front holes
  front.forEach((state, i) => {
    const label = `Hole ${i + 1}`;
    s += i >= 5 ? doubleHole(HOLE_Y[i], state, label) : hole(BODY_X, HOLE_Y[i], HOLE_R, state, label);
  });

  // hand labels
  s += `<text class="label hand" x="${BODY_X + 30}" y="${HOLE_Y[1] + 5}">L</text>`;
  s += `<text class="label hand" x="${BODY_X + 30}" y="${(HOLE_Y[4] + HOLE_Y[5]) / 2 + 5}">R</text>`;
  return s + '</svg>';
}
