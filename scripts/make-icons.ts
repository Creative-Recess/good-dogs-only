// Draws the app icons: a little pixel dog's face (the favicon, Home Screen icon and manifest icons).
// Usage: node scripts/make-icons.ts
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const B = '#b8673a' // coat
const D = '#5a2e14' // ears
const L = '#f4e8d8' // muzzle
const K = '#1a1a1a' // eyes and nose
const r = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`

/** The face on a 16px grid, facing forward, with floppy ears and a pink tongue. */
const FACE = [
  r(1, 3, 3, 6, D), r(12, 3, 3, 6, D), r(2, 9, 2, 1, D), r(12, 9, 2, 1, D), // ears
  r(4, 2, 8, 11, B), r(3, 4, 1, 7, B), r(12, 4, 1, 7, B), // head
  r(5, 6, 2, 2, K), r(9, 6, 2, 2, K), r(6, 6, 1, 1, '#ffffff'), r(10, 6, 1, 1, '#ffffff'), // eyes
  r(5, 9, 6, 4, L), r(6, 13, 4, 1, L), // muzzle
  r(7, 9, 2, 2, K), r(6, 11, 1, 1, K), r(9, 11, 1, 1, K), // nose and mouth
  r(7, 12, 2, 2, '#e8506a'), // tongue
].join('')

/** The face on a soft Aqua Glass sky. `inset` leaves room for iOS and Android masks. */
const icon = (inset: number, background = true) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  ${background ? '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6fb"/><stop offset="1" stop-color="#6f9fd8"/></linearGradient></defs><rect width="16" height="16" fill="url(#sky)"/>' : ''}
  <g transform="translate(${8 - 8 * inset} ${8 - 8 * inset}) scale(${inset})">${FACE}</g>
</svg>`

const out = (name: string) => new URL(`../public/${name}`, import.meta.url).pathname
// The browser tab icon: just the face, no background, as big as it can be.
await writeFile(out('favicon.svg'), icon(1, false))
for (const [name, size, inset] of [['apple-touch-icon.png', 180, 0.8], ['icon-192.png', 192, 0.8], ['icon-512.png', 512, 0.8], ['icon-maskable-512.png', 512, 0.62]] as const) {
  await sharp(Buffer.from(icon(inset)), { density: (size / 16) * 72 }).resize(size, size, { kernel: 'nearest' }).png().toFile(out(name))
}
console.log('Wrote public/favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png')
