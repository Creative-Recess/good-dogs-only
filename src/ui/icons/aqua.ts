// Aqua icons: glossy gel orbs lit from above, with white glyphs.
// Their gradients live once in <AquaIconDefs> (AquaIconDefs.tsx, rendered by the app) rather than inside each icon: if every icon
// carried its own copy, the copy inside a hidden icon could be the one the browser picks, and draw nothing.
import type { IconSet } from './types.ts'

/** Orb colours: [top, bottom] of each gel gradient, by gradient id. */
export const ORBS: Record<string, [string, string]> = {
  heart: ['#ff8a8a', '#c4141c'],
  shield: ['#8cc4ff', '#1d5fc4'],
  ball: ['#b4f07a', '#3e9a1a'],
  bulb: ['#ffe68a', '#e09a00'],
  bolt: ['#ffc27a', '#e05a00'],
  moon: ['#a9a6ff', '#3a2fa8'],
  smile: ['#ffe27a', '#e3a400'],
  eye: ['#86e8e0', '#128a86'],
  crook: ['#e9b98a', '#8a4a14'],
  lock: ['#e3a8ff', '#7a24b8'],
  crown: ['#ffe58a', '#c48a00'],
  door: ['#d6d6d6', '#6e6e6e'],
  cap: ['#8fb2ff', '#18348f'],
  house: ['#ff9f7a', '#b8340a'],
  compass: ['#8af0c8', '#0f8a5a'],
  feather: ['#ffb3d6', '#c42a78'],
  dogdex: ['#9fd2ff', '#1f63c4'],
  park: ['#a6ec86', '#2c8a1c'],
  progress: ['#ffd27a', '#d27a00'],
}

/** The app logo: a glossy blue gel paw. */
const PAW = {
  size: 64,
  d: '<g stroke="rgba(10,40,100,0.55)" stroke-width="1.2" fill="url(#aq-paw)"><ellipse cx="14" cy="27" rx="6.5" ry="8.5" transform="rotate(-20 14 27)"/><ellipse cx="25" cy="15" rx="6.5" ry="9"/><ellipse cx="39" cy="15" rx="6.5" ry="9"/><ellipse cx="50" cy="27" rx="6.5" ry="8.5" transform="rotate(20 50 27)"/><path d="M32 30c9 0 17 9 17 17 0 7-5 10-10 10-3 0-5-2-7-2s-4 2-7 2c-5 0-10-3-10-10 0-8 8-17 17-17z"/></g><g fill="url(#aq-pawshine)"><ellipse cx="13" cy="23" rx="3.5" ry="4" transform="rotate(-20 13 23)"/><ellipse cx="25" cy="10.5" rx="3.6" ry="4.2"/><ellipse cx="39" cy="10.5" rx="3.6" ry="4.2"/><ellipse cx="51" cy="23" rx="3.5" ry="4" transform="rotate(20 51 23)"/><ellipse cx="32" cy="37" rx="11" ry="5.5"/></g>',
}

const orb = (id: keyof typeof ORBS, glyph: string) => ({
  size: 32,
  d: `<circle cx="16" cy="16" r="15" fill="url(#aq-${id})" stroke="rgba(0,0,0,0.35)" stroke-width="0.8"/><g fill="#fff">${glyph}</g><ellipse cx="16" cy="9.5" rx="10.5" ry="6.5" fill="url(#aq-shine)"/>`,
})

export const AQUA_ICONS = {
  bigPaw: PAW,
  eyes: {
    size: 32,
    d: '<g stroke="#333" stroke-width="1"><ellipse cx="10" cy="16" rx="7.5" ry="10" fill="url(#aq-eyeball)"/><ellipse cx="22.5" cy="16" rx="7.5" ry="10" fill="url(#aq-eyeball)"/></g><circle cx="12" cy="18" r="3.6" fill="#1b2a44"/><circle cx="24.5" cy="18" r="3.6" fill="#1b2a44"/><circle cx="13.2" cy="16.6" r="1.2" fill="#fff"/><circle cx="25.7" cy="16.6" r="1.2" fill="#fff"/>',
  },
  tick: { size: 16, d: '<path d="M3 8.5l3 3 7-7.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' },
  warn: {
    size: 32,
    d: '<path d="M16 2.5c1 0 1.7.5 2.2 1.4l12.4 22.6c.9 1.7-.3 3.5-2.2 3.5H3.6c-1.9 0-3.1-1.8-2.2-3.5L13.8 3.9c.5-.9 1.2-1.4 2.2-1.4z" fill="url(#aq-warn)" stroke="#9a6a00" stroke-width="1"/><rect x="14.4" y="10" width="3.2" height="11" rx="1.6" fill="#3a2a00"/><circle cx="16" cy="25" r="1.9" fill="#3a2a00"/>',
  },
  // Aqua message boxes show the app icon rather than an info icon.
  infoBig: PAW,
  disk: {
    size: 32,
    d: '<rect x="4" y="4" width="24" height="24" rx="3" fill="url(#aq-cap)" stroke="rgba(0,0,0,0.4)" stroke-width="0.8"/><rect x="9" y="4" width="14" height="9" rx="1" fill="#d8dde6"/><rect x="18" y="5.5" width="3" height="6" fill="#4a5a78"/><rect x="8" y="17" width="16" height="9" rx="1" fill="#fff"/><ellipse cx="16" cy="9" rx="11" ry="5" fill="url(#aq-shine)"/>',
  },
  tHeart: orb('heart', '<path d="M16 25s-8-5-8-11c0-3 2-5 4.5-5 1.6 0 2.8.9 3.5 2 .7-1.1 1.9-2 3.5-2 2.5 0 4.5 2 4.5 5 0 6-8 11-8 11z"/>'),
  tShield: orb('shield', '<path d="M16 6l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V9z"/>'),
  tBall: orb('ball', '<circle cx="16" cy="16" r="8"/><path d="M9.5 11c3 2 3 8 0 10M22.5 11c-3 2-3 8 0 10" fill="none" stroke="#5aa82a" stroke-width="1.4"/>'),
  tBulb: orb('bulb', '<path d="M16 6.5a6.5 6.5 0 0 0-3.8 11.8c.6.5.8 1.1.8 1.9V21h6v-.8c0-.8.2-1.4.8-1.9A6.5 6.5 0 0 0 16 6.5z"/><rect x="13" y="22.5" width="6" height="2.2" rx="1"/>'),
  tBolt: orb('bolt', '<path d="M18 5l-9 13h6l-2 9 9-13h-6z"/>'),
  tMoon: orb('moon', '<path d="M19 7a9 9 0 1 0 6 15A7.5 7.5 0 0 1 19 7z"/>'),
  tHand: orb('smile', '<circle cx="12.3" cy="13" r="1.9" fill="#7a5200"/><circle cx="19.7" cy="13" r="1.9" fill="#7a5200"/><path d="M10 18c2.8 4.5 9.2 4.5 12 0" fill="none" stroke="#7a5200" stroke-width="2.2" stroke-linecap="round"/>'),
  tEye: orb('eye', '<path d="M5 16c3-5 7.5-7 11-7s8 2 11 7c-3 5-7.5 7-11 7s-8-2-11-7z"/><circle cx="16" cy="16" r="4" fill="#0f6e6b"/><circle cx="17.3" cy="14.8" r="1.2" fill="#fff"/>'),
  tCrook: orb('crook', '<path d="M13 26V12a4 4 0 1 1 8 0v1.5" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>'),
  tLock: orb('lock', '<rect x="9.5" y="14" width="13" height="10" rx="2"/><path d="M12 14v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="16" cy="19" r="1.6" fill="#8a3cc4"/>'),
  tCrown: orb('crown', '<path d="M7 22V11l5 4.5L16 8l4 7.5 5-4.5v11z"/>'),
  tDoor: orb('door', '<rect x="10.5" y="7" width="11" height="18" rx="1.2"/><circle cx="18.7" cy="16.5" r="1.2" fill="#7a7a7a"/>'),
  tCap: orb('cap', '<path d="M4.5 13.5L16 8l11.5 5.5L16 19z"/><path d="M10 16.5v4.5c3.5 2.6 8.5 2.6 12 0v-4.5L16 19.4z"/>'),
  tHouse: orb('house', '<path d="M6.5 16L16 8l9.5 8h-2.7v8.5h-5v-5.5h-3.6v5.5h-5V16z"/>'),
  tCompass: orb('compass', '<path d="M16 6l3 10-3 10-3-10z"/><path d="M16 16l3 0-3 10-3-10z" fill="#bfe9d6"/>'),
  tFeather: orb('feather', '<path d="M22.5 7C14 8 9.5 14 9.5 24c4-1 11.5-5 13-17z"/><path d="M9.5 24L19 12" stroke="#c42a78" stroke-width="1.2"/>'),
  tbDogdex: orb('dogdex', '<rect x="8" y="8" width="7" height="7" rx="1.6"/><rect x="17" y="8" width="7" height="7" rx="1.6"/><rect x="8" y="17" width="7" height="7" rx="1.6"/><rect x="17" y="17" width="7" height="7" rx="1.6"/>'),
  tbPark: orb('park', '<circle cx="16" cy="12.5" r="6.5"/><circle cx="11.5" cy="15" r="4"/><circle cx="20.5" cy="15" r="4"/><rect x="14.8" y="17" width="2.4" height="8" rx="1"/>'),
  tbProgress: orb('progress', '<rect x="8" y="17" width="4" height="8" rx="1"/><rect x="14" y="12" width="4" height="13" rx="1"/><rect x="20" y="8" width="4" height="17" rx="1"/>'),
} satisfies IconSet

