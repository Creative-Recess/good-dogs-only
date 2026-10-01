// Rushcutters Bay: lawn and Moreton Bay figs in front, the marina across the water, and the Harbour Bridge,
// Opera House and city beyond. Sizes are in CSS pixels of the canvas.

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

function blob(x: Ctx, cx: number, cy: number, r: number, colour: string) {
  x.fillStyle = colour
  x.beginPath()
  x.arc(cx, cy, r, 0, Math.PI * 2)
  x.fill()
}

/** Everything that doesn't move, drawn once per size into its own canvas. */
export function drawBackground(w: number, h: number, dpr: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w * dpr
  c.height = h * dpr
  const x = c.getContext('2d')!
  x.scale(dpr, dpr)
  let seed = 7
  const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const sea = h * SEA
  const shore = h * SHORE
  const k = w / 400

  // Sky and sun
  const sky = x.createLinearGradient(0, 0, 0, sea)
  sky.addColorStop(0, '#9fd0f5')
  sky.addColorStop(1, '#e4f2f7')
  x.fillStyle = sky
  x.fillRect(0, 0, w, sea + 1)
  blob(x, w * 0.88, h * 0.06, 12, '#ffe27a')
  blob(x, w * 0.88, h * 0.06, 17, 'rgba(255,226,122,0.25)')

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
  const towers: [number, number, number][] = [
    [0.43, 9, 50], [0.47, 11, 38], [0.5, 8, 58], [0.53, 12, 44], [0.565, 10, 66], [0.6, 13, 52],
    [0.635, 9, 40], [0.69, 12, 56], [0.725, 10, 46], [0.76, 14, 34], [0.795, 9, 42], [0.83, 12, 28],
  ]
  towers.forEach(([fx, tw, th], i) => {
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
  for (const [dx, sw, sh] of [[0, 22, 24], [12, 20, 20], [22, 17, 15], [30, 13, 10], [42, 15, 16], [51, 13, 12], [58, 10, 8]]) shell(ox + dx * k, sw * k, sh)

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
  for (const [fx, fy] of [[0.24, 0.475], [0.76, 0.638]]) {
    x.fillStyle = '#3c3f44'
    x.fillRect(w * fx - 1, h * fy - 30, 2, 30)
    x.fillRect(w * fx - 3, h * fy - 32, 6, 3)
  }
  return c
}

/** A Moreton Bay fig with its base at (cx, cy): thick grey trunk, wide dark canopy. */
export function drawFig(x: Ctx, cx: number, cy: number, k: number) {
  x.fillStyle = 'rgba(30,60,25,0.18)'
  x.beginPath()
  x.ellipse(cx, cy + 2, 42 * k, 9 * k, 0, 0, Math.PI * 2)
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

/** A wash over the scene for the time of day, and its name for the caption. */
export function timeOfDay(now = new Date()): { tint: string | null; label: string } {
  const hr = now.getHours()
  if (hr >= 21 || hr < 5) return { tint: 'rgba(20,30,80,0.45)', label: 'Night' }
  if (hr < 7) return { tint: 'rgba(255,170,190,0.16)', label: 'Dawn' }
  if (hr >= 17) return { tint: 'rgba(255,150,60,0.18)', label: 'Golden hour' }
  return { tint: null, label: 'Daytime' }
}
