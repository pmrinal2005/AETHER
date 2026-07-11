// ============================================================================
// A.I.M. — Auto-Generated Buddy Icons (Feature 20, Phase 2.3)
// Deterministic pixel identicon seeded from the DID hash. Tamper-evident:
// any key rotation changes the DID/hash → the icon visibly changes.
// Returns an SVG data-URI (works everywhere, no canvas/binary needed).
// ============================================================================

// Simple deterministic PRNG from a hex hash string.
function seededRand(hashHex) {
  let i = 0;
  return function next() {
    // pull 8 hex chars, wrap around
    const chunk = hashHex.slice(i % hashHex.length, (i % hashHex.length) + 8).padEnd(8, '0');
    i += 8;
    return parseInt(chunk, 16) / 0xffffffff;
  };
}

const AIM_PALETTE = [
  '#245edb', '#22b14c', '#e8b000', '#e07000', '#c1272d',
  '#7a3fb0', '#0a41c4', '#008080', '#d94f8a', '#3f8cf3',
];

// status → optional "damage" overlay for warning ladder (Phase 4 hook, safe now)
const STATUS_TINT = {
  trusted: null,
  review: 'rgba(232,176,0,0.18)',
  probation: 'rgba(224,112,0,0.28)',
  blocked: 'rgba(193,39,45,0.45)',
  revoked: 'rgba(120,120,120,0.55)',
};

// hashHex: sha256 hex of the DID. Returns an SVG string.
export function buildBuddyIconSvg(hashHex, opts = {}) {
  const size = opts.size || 48;
  const grid = 5; // 5x5, mirrored → classic identicon
  const cell = size / grid;
  const rand = seededRand(hashHex || '0');
  const fg = AIM_PALETTE[Math.floor(rand() * AIM_PALETTE.length)];
  const bg = '#ece9d8';

  let rects = '';
  // fill left half + center column, mirror to right
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < Math.ceil(grid / 2); x++) {
      const on = rand() > 0.5;
      if (on) {
        const mx = grid - 1 - x;
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fg}"/>`;
        if (mx !== x) {
          rects += `<rect x="${mx * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fg}"/>`;
        }
      }
    }
  }

  const tint = STATUS_TINT[opts.status] || null;
  const tintRect = tint
    ? `<rect x="0" y="0" width="${size}" height="${size}" fill="${tint}"/>`
    : '';
  // a subtle "crack" line for probation/blocked (tamper/damage cue)
  const crack =
    opts.status === 'blocked' || opts.status === 'revoked'
      ? `<path d="M2,${size * 0.2} L${size * 0.5},${size * 0.55} L${size * 0.35},${size * 0.7} L${size - 2},${size - 2}" stroke="rgba(0,0,0,0.55)" stroke-width="1.5" fill="none"/>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
    <rect x="0" y="0" width="${size}" height="${size}" fill="${bg}"/>
    ${rects}
    ${tintRect}
    ${crack}
    <rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" fill="none" stroke="#808080"/>
  </svg>`;
}

export function svgToDataUri(svg) {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

// Convenience: DID hash → data-URI icon
export function buddyIconDataUri(hashHex, opts) {
  return svgToDataUri(buildBuddyIconSvg(hashHex, opts));
}
