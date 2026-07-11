# A.I.M. — Retro Design Assets Guide (Phase 0.3)

To keep this build **fully self-contained and free/open-source**, A.I.M. generates its
retro look primarily from **CSS + the Web Audio API + procedurally drawn pixel art**,
rather than shipping copyrighted AIM/ICQ binaries. This avoids licensing risk while
preserving authentic Y2K visual language (a core judging criterion).

## Fonts
- Primary: **Tahoma**, fallback **MS Sans Serif**, then Geneva/Verdana (system fonts,
  no license needed — declared in `tailwind.config.js` `fontFamily.sans`).
- If a pixel-exact "MS Sans Serif" is desired, the open-license **W95FA** or
  **Pixelated MS Sans Serif** webfonts (SIL OFL) can be dropped into `/public/fonts`
  and referenced in `app/globals.css` — optional, not required.

## Sounds (Web Audio API — synthesized, zero files)
`lib/sounds.js` synthesizes classic cues at runtime with oscillators so we ship **no
copyrighted .wav files**:
- `signOn`   — rising two-tone "door open" chime
- `signOff`  — falling two-tone "door close" chime
- `imReceive`— short blip
- `warning`  — buzzer for moderation/warning escalation
If you prefer authentic samples, place open-license `.wav` files in `/public/sounds`
and swap the implementation — the public API of `lib/sounds.js` stays the same.

## Buddy Icons
- **Procedurally generated** (Phase 2) as deterministic identicons seeded from the
  agent's DID hash — see `lib/buddyIcon.js`. No external asset needed; tamper-evident
  on key rotation because the hash changes.

## "Under Construction" GIFs & marquees
- Rendered with CSS animation + inline SVG (`components/retro/UnderConstruction.jsx`,
  `components/retro/Marquee.jsx`) — no binary GIFs shipped, same nostalgic effect.

## Icons
- Simple glyphs drawn with unicode/emoji + CSS bevels, or the open-license
  **Font Awesome Free** CDN if richer icons are wanted later.
