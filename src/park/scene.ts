// Rushcutters Bay: lawn and Moreton Bay figs in front, the marina across the water, and the Harbour Bridge,
// Opera House and city beyond. Sizes are in CSS pixels of the canvas.
import type { Phase } from './sun.ts'

/** The harbour sits high so most of the screen is lawn (fractions of the height). */
export const SEA = 0.24
export const SHORE = 0.31
/** Dogs walk inside this band. */
export const TOP = 0.36
export const BOTTOM = 0.96
/** The shade under the big fig on the right, a favourite spot: centre x, y and spread, as fractions. */
export const SHADE_SPOT = { x: 0.82, y: 0.56, spreadX: 0.2, spreadY: 0.04 }
/** Moreton Bay figs: x, y (their base) and size. Drawn in depth order with the dogs. */
export const FIGS: [number, number, number][] = [
  [0.1, 0.41, 0.75],
  [0.9, 0.53, 0.95],
  [0.2, 0.84, 1.15],
]

type Ctx = CanvasRenderingContext2D

/** How the park looks at one time of day. */
export type Look = {
  /** Sky gradient, top to horizon. */
  sky: [string, string]
  /** The sun (or moon) as fractions of the size, and its colour. */
  sun?: { x: number; y: number; colour: string; r: number }
  moon?: boolean
  stars?: number
  /** A wash over everything below the sky (and over the dogs), for the light's colour and how dark it is. */
  wash?: string
  /** How much of the city's windows are lit, 0 to 1. Lamps, the Opera House and the Bridge light up when it's above 0. */
  lights: number
  /** Which way, and how far, the figs' shadows stretch (0 for midday). */
  shadow: number
}

export const LOOKS: Record<Phase, Look> = {
  day: { sky: ['#9fd0f5', '#e4f2f7'], sun: { x: 0.88, y: 0.06, colour: '#ffe27a', r: 12 }, lights: 0, shadow: 0 },
  sunrise: { sky: ['#f4a9a0', '#fde2bf'], sun: { x: 0.93, y: 0.11, colour: '#ffd59a', r: 14 }, wash: 'rgba(255,160,130,0.14)', lights: 0, shadow: -1 },
  golden: { sky: ['#f39a52', '#ffe0a0'], sun: { x: 0.3, y: 0.145, colour: '#ffd36e', r: 15 }, wash: 'rgba(255,145,50,0.17)', lights: 0, shadow: 1 },
  dusk: { sky: ['#3a3d78', '#ee9a84'], stars: 12, wash: 'rgba(60,45,110,0.3)', lights: 0.55, shadow: 0 },
  dawn: { sky: ['#465995', '#f3b9a8'], stars: 8, wash: 'rgba(70,70,130,0.26)', lights: 0.3, shadow: 0 },
  night: { sky: ['#0a1230', '#22345f'], moon: true, stars: 60, wash: 'rgba(8,16,52,0.52)', lights: 1, shadow: 0 },
}

/** City towers: x, width and height. */
const TOWERS: [number, number, number][] = [
  [0.43, 9, 50], [0.47, 11, 38], [0.5, 8, 58], [0.53, 12, 44], [0.565, 10, 66], [0.6, 13, 52],
  [0.635, 9, 40], [0.69, 12, 56], [0.725, 10, 46], [0.76, 14, 34], [0.795, 9, 42], [0.83, 12, 28],
]
/** Opera House shells: offset, width and height. */
const SHELLS: [number, number, number][] = [[0, 22, 24], [12, 20, 20], [22, 17, 15], [30, 13, 10], [42, 15, 16], [51, 13, 12], [58, 10, 8]]
/** The two lamp posts on the path. */
export const LAMPS: [number, number][] = [[0.24, 0.475], [0.76, 0.638]]

function blob(x: Ctx, cx: number, cy: number, r: number, colour: string) {
  x.fillStyle = colour
  x.beginPath()
  x.arc(cx, cy, r, 0, Math.PI * 2)
  x.fill()
}

const layer = (w: number, h: number, dpr: number) => {
  const c = document.createElement('canvas')
  c.width = w * dpr
  c.height = h * dpr
  const x = c.getContext('2d')!
  x.scale(dpr, dpr)
  return { c, x }
}

/**
 * Everything that doesn't move, drawn once per size and time of day: `scene` is the park in that light, and `lights`
 * (drawn over the dogs) is what glows in the dark: windows, lamps, the Opera House and the Bridge.
 */
export function drawBackground(w: number, h: number, dpr: number, look: Look): { scene: HTMLCanvasElement; lights: HTMLCanvasElement } {
  const { c, x } = layer(w, h, dpr)
  let seed = 7
  const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const sea = h * SEA
  const shore = h * SHORE
  const k = w / 400


  // Harbour Bridge, hazy in the distance (left)
  const bx = w * 0.04
  const bw = w * 0.36
  const deck = sea - 6
  const arch = deck - 26
  x.strokeStyle = '#9fb0bf'
  x.fillStyle = '#9fb0bf'
  x.lineWidth = 2
  x.beginPath()
  x.moveTo(bx + 8, deck)
  x.quadraticCurveTo(bx + bw / 2, arch - 22, bx + bw - 8, deck)
  x.stroke()
  x.lineWidth = 1
  x.beginPath()
  x.moveTo(bx + 8, deck - 4)
  x.quadraticCurveTo(bx + bw / 2, arch - 14, bx + bw - 8, deck - 4)
  x.stroke()
  for (let i = 1; i < 12; i++) {
    const px = bx + 8 + ((bw - 16) * i) / 12
    const u = (i / 12) * 2 - 1
    x.beginPath()
    x.moveTo(px, deck)
    x.lineTo(px, deck - (1 - u * u) * (deck - arch + 4))
    x.stroke()
  }
  x.fillRect(bx - 4, deck, bw + 8, 2)
  for (const px of [bx + 1, bx + bw - 9]) x.fillRect(px, deck - 15, 8, 15)

  // The city skyline behind the Opera House, hazier the further back
  TOWERS.forEach(([fx, tw, th], i) => {
    const tx = w * fx
    const wd = tw * k
    x.fillStyle = ['#aebbc7', '#bcc7d1', '#c8d1d9'][i % 3]
    x.fillRect(tx, sea - th, wd, th)
    x.fillStyle = 'rgba(255,255,255,0.35)'
    x.fillRect(tx, sea - th, Math.max(1, wd * 0.3), th)
    if (i % 4 === 2) {
      x.fillStyle = '#aebbc7'
      x.fillRect(tx + wd / 2 - 0.5, sea - th - 6, 1, 6)
    }
  })
  // Sydney Tower: thin shaft, gold turret, spire
  const st = w * 0.665
  x.fillStyle = '#a7b4c0'
  x.fillRect(st - 1.5, sea - 74, 3, 74)
  x.fillStyle = '#d9b45a'
  x.beginPath()
  x.roundRect(st - 5, sea - 76, 10, 8, 2)
  x.fill()
  x.fillStyle = '#c49a3e'
  x.fillRect(st - 5, sea - 72, 10, 1)
  x.fillStyle = '#a7b4c0'
  x.fillRect(st - 0.5, sea - 90, 1, 14)
  // Darling Point apartments, closer and lower (far right)
  for (const [fx, tw, th] of [[0.86, 12, 22], [0.9, 10, 30], [0.94, 14, 18], [0.975, 10, 26]]) {
    x.fillStyle = '#ece5d8'
    x.fillRect(w * fx, sea - th, tw * k, th)
    x.fillStyle = 'rgba(90,110,130,0.25)'
    for (let fy = sea - th + 3; fy < sea - 2; fy += 4) x.fillRect(w * fx + 1, fy, tw * k - 2, 1)
  }
  // The Opera House on Bennelong Point, in front of the city
  const ob = sea - 1
  const ox = w * 0.4
  x.fillStyle = '#e3d2ad'
  x.fillRect(ox - 2 * k, ob - 4, 74 * k, 5)
  const shell = (sx: number, sw: number, sh: number) => {
    x.beginPath()
    x.moveTo(sx, ob - 4)
    x.quadraticCurveTo(sx + sw * 0.05, ob - 4 - sh * 0.8, sx + sw * 0.32, ob - 4 - sh)
    x.quadraticCurveTo(sx + sw * 0.62, ob - 4 - sh * 0.45, sx + sw, ob - 4)
    x.closePath()
    x.fill()
    x.stroke()
  }
  x.fillStyle = '#fbfaf5'
  x.strokeStyle = '#cfd5da'
  x.lineWidth = 0.8
  for (const [dx, sw, sh] of SHELLS) shell(ox + dx * k, sw * k, sh)

  // Harbour, with the marina's masts over moored hulls
  const water = x.createLinearGradient(0, sea, 0, shore)
  water.addColorStop(0, '#5d9cc4')
  water.addColorStop(1, '#3f7fac')
  x.fillStyle = water
  x.fillRect(0, sea, w, shore - sea)
  const my = sea + (shore - sea) * 0.42
  for (let i = 0; i < 22; i++) {
    const mx = w * 0.62 + R() * w * 0.38
    const mh = 14 + R() * 18
    const hy = my + R() * 5
    x.strokeStyle = 'rgba(255,255,255,0.85)'
    x.lineWidth = 1
    x.beginPath()
    x.moveTo(mx, hy)
    x.lineTo(mx, hy - mh)
    x.stroke()
    x.fillStyle = '#ffffff'
    x.beginPath()
    x.moveTo(mx - 7, hy - 2)
    x.lineTo(mx + 7, hy - 2)
    x.lineTo(mx + 5, hy + 1)
    x.lineTo(mx - 5, hy + 1)
    x.closePath()
    x.fill()
    x.fillStyle = 'rgba(30,60,90,0.3)'
    x.fillRect(mx - 5, hy + 1, 10, 1)
  }

  // Sandstone sea wall, then one flat mown lawn with soft mottling
  x.fillStyle = '#d9c39a'
  x.fillRect(0, shore - 3, w, 4)
  x.fillStyle = '#c4ab80'
  x.fillRect(0, shore + 1, w, 1)
  x.fillStyle = '#86c35f'
  x.fillRect(0, shore + 2, w, h - shore)
  for (let i = 0; i < 70; i++) {
    x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(40,90,30,0.06)'
    x.beginPath()
    x.ellipse(R() * w, shore + 8 + R() * (h - shore), 10 + R() * 26, 3 + R() * 6, 0, 0, Math.PI * 2)
    x.fill()
  }

  // The curving concrete path and its lamp posts
  x.strokeStyle = '#d4d1c8'
  x.lineWidth = 9
  x.lineCap = 'round'
  x.beginPath()
  x.moveTo(-10, h * 0.5)
  x.bezierCurveTo(w * 0.35, h * 0.45, w * 0.55, h * 0.68, w + 10, h * 0.62)
  x.stroke()
  x.strokeStyle = '#c4c1b7'
  x.lineWidth = 1
  x.stroke()
  for (const [fx, fy] of LAMPS) {
    x.fillStyle = '#3c3f44'
    x.fillRect(w * fx - 1, h * fy - 30, 2, 30)
    x.fillRect(w * fx - 3, h * fy - 32, 6, 3)
  }

  // The light: a wash over what's drawn so far (source-atop keeps it off the empty sky), then the sky behind it all.
  if (look.wash) {
    x.globalCompositeOperation = 'source-atop'
    x.fillStyle = look.wash
    x.fillRect(0, 0, w, h)
  }
  x.globalCompositeOperation = 'destination-over'
  drawSky(x, w, h, look)
  x.globalCompositeOperation = 'source-over'
  return { scene: c, lights: drawLights(w, h, dpr, look) }
}

function drawSky(x: Ctx, w: number, h: number, look: Look) {
  const sea = h * SEA
  // Drawn behind the scene (destination-over), so each thing goes under the last: sun or moon first, the sky's gradient last.
  if (look.sun) {
    const { x: sx, y: sy, colour, r } = look.sun
    blob(x, w * sx, h * sy, r, colour)
    const glow = x.createRadialGradient(w * sx, h * sy, r, w * sx, h * sy, r * 3.2)
    glow.addColorStop(0, `${colour}66`)
    glow.addColorStop(1, `${colour}00`)
    x.fillStyle = glow
    x.fillRect(0, 0, w, sea + 1)
  }
  if (look.moon) {
    // A crescent: the sky's colour over the top right of a full moon.
    blob(x, w * 0.86 + 4, h * 0.07 - 2, 8, look.sky[0])
    blob(x, w * 0.86, h * 0.07, 9, '#f3efd6')
  }
  let seed = 11
  const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < (look.stars ?? 0); i++) {
    x.fillStyle = `rgba(255,255,240,${0.4 + R() * 0.5})`
    const size = R() < 0.15 ? 1.6 : 1
    x.fillRect(R() * w, R() * sea * 0.8, size, size)
  }
  const sky = x.createLinearGradient(0, 0, 0, sea)
  sky.addColorStop(0, look.sky[0])
  sky.addColorStop(1, look.sky[1])
  x.fillStyle = sky
  x.fillRect(0, 0, w, sea + 1)
}

/** What glows after dark, on its own layer so it sits over the dimmed dogs. */
function drawLights(w: number, h: number, dpr: number, look: Look): HTMLCanvasElement {
  const { c, x } = layer(w, h, dpr)
  if (!look.lights) return c
  const sea = h * SEA
  const k = w / 400
  let seed = 23
  const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  // Office windows: a few rows of dots on each tower, more of them lit the darker it is.
  for (const [fx, tw, th] of TOWERS) {
    const wd = tw * k
    for (let fy = sea - th + 3; fy < sea - 3; fy += 3)
      for (let ix = 1; ix < wd - 1; ix += 2.5) if (R() < look.lights * 0.55) {
        x.fillStyle = R() < 0.8 ? 'rgba(255,226,150,0.9)' : 'rgba(210,235,255,0.85)'
        x.fillRect(w * fx + ix, fy, 1, 1.2)
      }
  }
  // The Opera House, lit up white-gold.
  const ob = sea - 1
  const ox = w * 0.4
  const halo = x.createRadialGradient(ox + 30 * k, ob - 8, 2, ox + 30 * k, ob - 8, 44 * k)
  halo.addColorStop(0, `rgba(255,236,190,${0.35 * look.lights})`)
  halo.addColorStop(1, 'rgba(255,236,190,0)')
  x.fillStyle = halo
  x.fillRect(ox - 20 * k, ob - 50, 110 * k, 60)
  x.fillStyle = `rgba(255,246,222,${0.55 + 0.4 * look.lights})`
  for (const [dx, sw, sh] of SHELLS) {
    const sx = ox + dx * k
    x.beginPath()
    x.moveTo(sx, ob - 4)
    x.quadraticCurveTo(sx + sw * k * 0.05, ob - 4 - sh * 0.8, sx + sw * k * 0.32, ob - 4 - sh)
    x.quadraticCurveTo(sx + sw * k * 0.62, ob - 4 - sh * 0.45, sx + sw * k, ob - 4)
    x.closePath()
    x.fill()
  }
  // A string of lights along the Bridge's arch.
  const bx = w * 0.04
  const bw = w * 0.36
  const deck = sea - 6
  const arch = deck - 26
  x.fillStyle = 'rgba(255,230,170,0.95)'
  for (let i = 0; i <= 24; i++) {
    const u = i / 24
    const px = (1 - u) * (1 - u) * (bx + 8) + 2 * (1 - u) * u * (bx + bw / 2) + u * u * (bx + bw - 8)
    const py = (1 - u) * (1 - u) * deck + 2 * (1 - u) * u * (arch - 22) + u * u * deck
    x.fillRect(px - 0.5, py - 0.5, 1.2, 1.2)
  }
  for (let px = bx; px < bx + bw; px += 4) x.fillRect(px, deck - 0.5, 1.2, 1)
  // The path's lamps: a bright head and a pool of light on the grass.
  for (const [fx, fy] of LAMPS) {
    const lx = w * fx
    const ly = h * fy
    const pool = x.createRadialGradient(lx, ly - 4, 2, lx, ly - 4, 46)
    pool.addColorStop(0, 'rgba(255,225,150,0.38)')
    pool.addColorStop(1, 'rgba(255,225,150,0)')
    x.fillStyle = pool
    x.beginPath()
    x.ellipse(lx, ly - 4, 46, 26, 0, 0, Math.PI * 2)
    x.fill()
    const head = x.createRadialGradient(lx, ly - 30, 1, lx, ly - 30, 12)
    head.addColorStop(0, 'rgba(255,244,200,0.95)')
    head.addColorStop(1, 'rgba(255,230,160,0)')
    x.fillStyle = head
    x.fillRect(lx - 12, ly - 42, 24, 24)
    x.fillStyle = '#fff6d0'
    x.fillRect(lx - 2.5, ly - 31, 5, 2)
  }
  return c
}

/** A Moreton Bay fig with its base at (cx, cy): thick grey trunk, wide dark canopy. */
export function drawFig(x: Ctx, cx: number, cy: number, k: number, shadow = 0) {
  // With the sun low, the shadow stretches away from it (shadow -1 or 1) and is a little darker.
  x.fillStyle = shadow ? 'rgba(40,40,60,0.22)' : 'rgba(30,60,25,0.18)'
  x.beginPath()
  x.ellipse(cx + shadow * 50 * k, cy + 3, (42 + Math.abs(shadow) * 46) * k, 9 * k, 0, 0, Math.PI * 2)
  x.fill()
  x.fillStyle = '#8b8378'
  x.beginPath()
  x.moveTo(cx - 9 * k, cy)
  x.quadraticCurveTo(cx - 4 * k, cy - 18 * k, cx - 5 * k, cy - 34 * k)
  x.lineTo(cx + 5 * k, cy - 34 * k)
  x.quadraticCurveTo(cx + 4 * k, cy - 18 * k, cx + 10 * k, cy)
  x.closePath()
  x.fill()
  const canopy: [number, number, number][] = [[-26, -44, 22], [0, -54, 28], [26, -44, 22], [-14, -62, 20], [14, -64, 20], [-36, -36, 14], [36, -36, 14]]
  canopy.forEach(([dx, dy, r], i) => blob(x, cx + dx * k, cy + dy * k, r * k, i % 2 ? '#3e7a3a' : '#356e33'))
  for (const [dx, dy, r] of [[-18, -66, 9], [8, -72, 10], [24, -54, 8]]) blob(x, cx + dx * k, cy + dy * k, r * k, 'rgba(120,180,90,0.45)')
}

/** The moving parts of the scene: glints on the water and two yachts sailing across the bay. */
export function drawWater(x: Ctx, w: number, h: number, t: number) {
  const sea = h * SEA
  const shore = h * SHORE
  x.fillStyle = 'rgba(255,255,255,0.5)'
  for (let i = 0; i < 10; i++) {
    const gx = (i * 0.37 * w + Math.sin(t * 0.6 + i) * 6) % w
    const gy = sea + 4 + ((i * 0.61) % 1) * (shore - sea - 10)
    x.fillRect(gx, gy, 6 + (i % 3) * 3, 1)
  }
  for (const [v, offset, fy] of [[0.022, 0.12, 0.6], [-0.015, 0.62, 0.78]]) {
    const span = w + 60
    const px = ((((t * v * w + offset * span) % span) + span) % span) - 30
    const py = sea + (shore - sea) * fy
    const dir = Math.sign(v)
    x.fillStyle = '#fff'
    x.beginPath()
    x.moveTo(px - 9, py)
    x.lineTo(px + 9, py)
    x.lineTo(px + 6, py + 3)
    x.lineTo(px - 6, py + 3)
    x.closePath()
    x.fill()
    x.beginPath()
    x.moveTo(px, py - 1)
    x.lineTo(px, py - 24)
    x.lineTo(px + dir * 11, py - 2)
    x.closePath()
    x.fill()
    x.fillStyle = 'rgba(255,255,255,0.75)'
    x.beginPath()
    x.moveTo(px - dir, py - 20)
    x.lineTo(px - dir, py - 2)
    x.lineTo(px - dir * 8, py - 2)
    x.closePath()
    x.fill()
  }
}
