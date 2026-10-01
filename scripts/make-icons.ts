// Draws the app icons from the paw logo: the Home Screen icon, manifest icons and the favicon.
// Usage: node scripts/make-icons.ts
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const source = await readFile(new URL('../src/ui/icons.tsx', import.meta.url), 'utf8')
const paw = /bigPaw: \{ size: 28, d: '(.*?)' \}/.exec(source)?.[1]
if (!paw) throw new Error('bigPaw not found in src/ui/icons.tsx')

/** The paw, centred on the Windows 98 desktop teal. `inset` leaves room for iOS and Android masks. */
const icon = (inset: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" shape-rendering="crispEdges">
  <rect width="28" height="28" fill="#008080"/>
  <g transform="translate(${14 - 14 * inset} ${14 - 13 * inset}) scale(${inset})"><!-- the paw sits slightly high in its 28px box -->${paw}</g>
</svg>`

const out = (name: string) => new URL(`../public/${name}`, import.meta.url).pathname
await writeFile(out('favicon.svg'), icon(0.86))
for (const [name, size, inset] of [['apple-touch-icon.png', 180, 0.72], ['icon-192.png', 192, 0.72], ['icon-512.png', 512, 0.72], ['icon-maskable-512.png', 512, 0.56]] as const) {
  await sharp(Buffer.from(icon(inset)), { density: (size / 28) * 72 }).resize(size, size, { kernel: 'nearest' }).png().toFile(out(name))
}
console.log('Wrote public/favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png')
