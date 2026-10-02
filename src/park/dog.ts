// One storybook dog: side-on, drawn from its breed's simple description in data/dog-shapes.json:
// size and build set the body; snout, ears and tail the details; coat the outline and texture;
// colour and markings the paint.
import type { Breed, Colour, DogShape, Rgb } from '../data/types.ts'

export type DogState = 'idle' | 'walk' | 'run' | 'sit'

export type Dog = {
  breed: Breed
  shape: DogShape
  seed: number
  x: number
  y: number
  /** 1 facing right, -1 facing left. */
  dir: 1 | -1
  state: DogState
  /** Seconds until the dog decides what to do next. */
  timer: number
  /** 1 to 0 while hopping after play. */
  hop: number
  /** Seconds left with its tongue out. */
  happy: number
  /** Smaller further back. */
  scale: number
  tx: number
  ty: number
  toSpot: boolean
  friend: Dog | null
  /** Walking off the edge to make room for another dog. */
  leaving: boolean
}

// ---------- Body proportions from size and build ----------

/** Body length, depth, leg length and head size for each size, in drawing units (a Labrador is L). */
const SIZES = {
  XS: { len: 17, h: 8, leg: 6.5, head: 7 },
  S: { len: 21, h: 9.5, leg: 7.5, head: 8 },
  M: { len: 25, h: 11, leg: 9.5, head: 8.8 },
  L: { len: 29, h: 12.5, leg: 11, head: 9.5 },
  XL: { len: 34, h: 14.5, leg: 13, head: 10.5 },
} as const
/** How each build stretches the size's proportions. */
const BUILDS = {
  standard: { len: 1, h: 1, leg: 1, head: 1 },
  long_low: { len: 1.22, h: 0.9, leg: 0.48, head: 0.95 },
  tall_lean: { len: 1.02, h: 0.82, leg: 1.38, head: 0.9 },
  stocky: { len: 0.94, h: 1.16, leg: 0.8, head: 1.16 },
} as const
/** Muzzle length for snout 1 (flat) to 5 (very long). */
const SNOUTS = [0, 1, 3, 5, 7, 9.5]

export type Body = { len: number; h: number; leg: number; head: number; snout: number }

export function bodyOf(shape: DogShape): Body {
  const size = SIZES[shape.size]
  const build = BUILDS[shape.build]
  return { len: size.len * build.len, h: size.h * build.h, leg: size.leg * build.leg, head: size.head * build.head, snout: SNOUTS[shape.snout] }
}

// ---------- Colours ----------

const PALETTE: Record<Colour, Rgb> = {
  black: [42, 42, 48],
  chocolate: [107, 62, 38],
  red: [181, 83, 42],
  gold: [217, 163, 82],
  cream: [234, 216, 182],
  white: [244, 241, 234],
  fawn: [210, 174, 124],
  blue: [111, 124, 138],
  silver: [169, 173, 177],
  sable: [201, 138, 62],
}
const TAN: Rgb = [201, 133, 63]
const WHITE: Rgb = PALETTE.white
/** Merle: a light base with dark patches. */
const MERLE: Partial<Record<Colour, [Rgb, Rgb]>> = { blue: [[185, 192, 200], [42, 42, 48]], red: [[226, 195, 166], [138, 74, 42]] }

const css = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
export const shade = (c: Rgb, k: number): Rgb => c.map((v) => Math.max(0, Math.min(255, Math.round(v * k)))) as Rgb

/** The dog's base coat colour, before markings. */
export function baseColour(shape: DogShape): Rgb {
  if (shape.markings === 'parti' || shape.markings === 'spotted') return WHITE
  if (shape.markings === 'saddle') return TAN
  if (shape.markings === 'merle') return (MERLE[shape.colour] ?? MERLE.blue!)[0]
  return PALETTE[shape.colour]
}

/** The same scatter of spots and patches every time for a breed. */
function random(seedText: string) {
  let seed = [...seedText].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 1
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

// ---------- Drawing ----------

type Ctx = CanvasRenderingContext2D
const UPRIGHT_EARS = new Set(['pointy', 'bat', 'rose', 'tipped'])

/** An outline around an ellipse for each coat: smooth, jagged (wiry), bumpy (curly) or cloudy (fluffy). */
function coatPath(x: Ctx, cx: number, cy: number, rx: number, ry: number, coat: DogShape['coat']) {
  x.beginPath()
  if (coat === 'fluffy' || coat === 'curly') {
    const bumps = coat === 'fluffy' ? 12 : 18
    const r = ry * (coat === 'fluffy' ? 0.42 : 0.28)
    x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    for (let i = 0; i < bumps; i++) {
      const a = (i / bumps) * Math.PI * 2
      const px = cx + Math.cos(a) * rx
      const py = cy + Math.sin(a) * ry
      x.moveTo(px + r, py)
      x.arc(px, py, r, 0, Math.PI * 2)
    }
  } else if (coat === 'wiry') {
    const n = 26
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2
      const k = i % 2 ? 1.1 : 0.96
      const px = cx + Math.cos(a) * rx * k
      const py = cy + Math.sin(a) * ry * k
      if (i) x.lineTo(px, py)
      else x.moveTo(px, py)
    }
    x.closePath()
  } else x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
}

/** Draws the dog with its feet at (0, 0) of the current transform, facing right before `dir` flips it. */
export function drawDog(x: Ctx, d: Dog, t: number) {
  const P = d.shape
  const B = bodyOf(P)
  const s = d.scale * 0.95
  const base = baseColour(P)
  const main = PALETTE[P.colour]
  const line = css(shade(base, P.markings === 'parti' || P.markings === 'spotted' || base === WHITE ? 0.62 : 0.5))
  const walk = d.state === 'walk' || d.state === 'run'
  const swing = walk ? Math.sin(t * (d.state === 'run' ? 15 : 8) + d.seed) * 0.45 : 0
  const hop = d.hop > 0 ? Math.sin(d.hop * Math.PI) * 12 * s : 0
  const L = B.len * s
  const H = B.h * s
  const leg = B.leg * s
  const sit = d.state === 'sit'
  const hairy = P.coat === 'long' || P.coat === 'corded'
  const rand = random(d.breed.id)

  x.save()
  x.scale(d.dir, 1)
  x.fillStyle = 'rgba(30,50,40,0.14)'
  x.beginPath()
  x.ellipse(0, 0, L * 0.6, 3 * s, 0, 0, Math.PI * 2)
  x.fill()
  x.translate(0, -hop)
  if (sit) {
    x.translate(-L * 0.35, 0)
    x.rotate(-0.32)
    x.translate(L * 0.35, 0)
  }
  x.lineWidth = 1.5
  x.lineJoin = 'round'
  x.lineCap = 'round'
  x.strokeStyle = line
  const bodyY = -leg - H / 2

  // Legs: the far pair behind the body, the near pair in front. White or tan socks come from the markings.
  const legW = Math.max(2.5, 3.2 * s * (B.h / 11))
  const sock = P.markings === 'tan_points' ? TAN : P.markings === 'white_markings' || P.markings === 'tricolour' ? WHITE : null
  const drawLeg = (lx: number, angle: number, far: boolean, folded = false) => {
    x.save()
    x.translate(lx, bodyY + H * 0.3)
    x.rotate(angle)
    const w = folded ? legW * 2 : legW
    const len = folded ? leg * 0.65 + H * 0.2 : leg + H * 0.2
    x.fillStyle = css(far ? shade(base, 0.8) : base)
    x.beginPath()
    x.roundRect(folded ? -legW : -legW / 2, 0, w, len, legW / 2)
    x.fill()
    if (sock) {
      x.fillStyle = css(far ? shade(sock, 0.85) : sock)
      x.beginPath()
      x.roundRect(folded ? -legW : -legW / 2, len * 0.62, w, len * 0.38, legW / 2)
      x.fill()
    }
    x.stroke()
    x.restore()
  }
  drawLeg(-L * 0.32, swing, true, sit)
  drawLeg(L * 0.3, -swing, true)

  // Tail
  const wag = Math.sin(t * (walk ? 6 : 11) + d.seed) * 0.35
  const bushy = P.tail === 'plume' || P.coat === 'fluffy' || P.coat === 'feathered' || P.coat === 'long'
  x.save()
  x.translate(-L * 0.47, bodyY - H * 0.2)
  x.rotate(-0.6 + wag)
  x.strokeStyle = css(shade(P.markings === 'saddle' ? main : base, 0.9))
  x.lineWidth = bushy ? 4.5 * s : 2.6 * s
  x.beginPath()
  if (P.tail === 'curl') x.arc(0, -3 * s, 3.2 * s, Math.PI * 0.6, Math.PI * 2.3)
  else if (P.tail === 'stub') {
    x.moveTo(0, 0)
    x.lineTo(-2 * s, -2 * s)
  } else if (P.tail === 'up') {
    x.moveTo(0, 0)
    x.lineTo(-1 * s, -9 * s)
  } else {
    x.moveTo(0, 0)
    x.quadraticCurveTo(-6 * s, -4 * s, -9 * s, P.tail === 'plume' ? -9 * s : -5 * s)
  }
  x.stroke()
  x.restore()
  x.lineWidth = 1.5
  x.strokeStyle = line

  // Long and corded coats hang down over the legs; feathered coats have a fringe under the belly. Drawn first, so
  // the body and its markings sit on top.
  if (hairy || P.coat === 'feathered') {
    const drop = P.coat === 'feathered' ? leg * 0.35 : P.coat === 'corded' ? leg * 0.7 : leg * 0.5
    x.fillStyle = css(shade(base, P.coat === 'corded' ? 0.92 : 0.97))
    x.beginPath()
    x.moveTo(-L * 0.45, bodyY)
    for (let i = 0; i <= 10; i++) {
      const px = -L * 0.45 + (L * 0.9 * i) / 10
      x.lineTo(px, bodyY + H * 0.45 + drop * (i % 2 ? 1 : 0.8))
    }
    x.lineTo(L * 0.45, bodyY)
    x.closePath()
    x.fill()
    if (P.coat === 'corded') {
      x.strokeStyle = css(shade(base, 0.7))
      x.lineWidth = 0.8
      for (let i = 1; i < 10; i++) {
        const px = -L * 0.42 + (L * 0.84 * i) / 10
        x.beginPath()
        x.moveTo(px, bodyY - H * 0.3)
        x.lineTo(px, bodyY + H * 0.45 + drop * 0.8)
        x.stroke()
      }
      x.lineWidth = 1.5
      x.strokeStyle = line
    }
  }
  // Body, then its markings clipped to the body's shape
  const outline = P.coat === 'hairless' ? 'smooth' : P.coat
  x.fillStyle = css(base)
  coatPath(x, 0, bodyY, L / 2, H / 2, outline)
  x.fill()
  if (outline === 'smooth' || outline === 'wiry' || outline === 'feathered' || outline === 'long' || outline === 'corded') x.stroke()
  x.save()
  coatPath(x, 0, bodyY, L / 2, H / 2, outline)
  x.clip()
  paintMarkings(x, P, main, L, H, bodyY, rand, s)
  x.restore()

  // Curly coats get little curls all over
  if (P.coat === 'curly') {
    x.fillStyle = css(shade(base, 1.12), 0.7)
    for (let i = 0; i < 14; i++) {
      x.beginPath()
      x.arc((rand() - 0.5) * L * 0.8, bodyY + (rand() - 0.5) * H * 0.7, 1.1 * s, 0, Math.PI * 2)
      x.fill()
    }
  }
  drawLeg(-L * 0.22, -swing, false, sit)
  drawLeg(L * 0.36, swing, false)

  // Neck and head
  const hr = B.head * s
  const hx = L * 0.46
  const hy = bodyY - H * 0.55 - hr * 0.35
  const headBase = P.markings === 'saddle' ? TAN : base
  x.fillStyle = css(headBase)
  x.beginPath()
  x.moveTo(L * 0.25, bodyY - H * 0.3)
  x.lineTo(hx - hr * 0.5, hy + hr * 0.6)
  x.lineTo(hx + hr * 0.2, hy + hr * 0.4)
  x.lineTo(L * 0.42, bodyY + H * 0.1)
  x.closePath()
  x.fill()
  const earColour = P.markings === 'parti' || P.markings === 'spotted' || P.markings === 'tricolour' || P.markings === 'saddle' ? main : base
  const ear = (front: boolean) => {
    x.fillStyle = css(shade(P.markings === 'merle' ? (MERLE[P.colour] ?? MERLE.blue!)[1] : earColour, front ? 0.85 : 0.72))
    x.beginPath()
    if (P.ears === 'pointy' || P.ears === 'bat') {
      const k = P.ears === 'bat' ? 1.3 : 1.15
      x.moveTo(hx - hr * 0.55, hy - hr * 0.45)
      x.lineTo(hx - hr * 0.35, hy - hr * k)
      x.lineTo(hx + hr * 0.1, hy - hr * 0.65)
      x.closePath()
    } else if (P.ears === 'rose' || P.ears === 'tipped') {
      x.moveTo(hx - hr * 0.5, hy - hr * 0.55)
      x.quadraticCurveTo(hx - hr * 0.4, hy - hr * 1.25, hx + hr * 0.05, hy - hr * 0.85)
      x.lineTo(hx - hr * 0.1, hy - hr * 0.5)
      x.closePath()
    } else {
      const len = (P.ears === 'long' ? 1.25 : 0.8) * (hairy || P.coat === 'feathered' ? 1.25 : 1)
      x.ellipse(hx - hr * 0.35, hy + hr * 0.15 * len, hr * 0.33, hr * 0.62 * len, 0.3, 0, Math.PI * 2)
    }
    x.fill()
    x.stroke()
  }
  const upright = UPRIGHT_EARS.has(P.ears)
  if (upright) ear(false)
  x.fillStyle = css(headBase)
  const headOutline = outline === 'feathered' || outline === 'long' || outline === 'corded' ? 'smooth' : outline
  coatPath(x, hx, hy, hr * 0.85, hr * 0.85, headOutline)
  x.fill()
  if (headOutline === 'smooth' || headOutline === 'wiry') x.stroke()
  // Face markings: a cap of colour (parti, tricolour), tan brows, a white blaze, a dark mask
  x.save()
  coatPath(x, hx, hy, hr * 0.85, hr * 0.85, headOutline)
  x.clip()
  if (P.markings === 'parti') {
    x.fillStyle = css(main)
    x.beginPath()
    x.ellipse(hx - hr * 0.3, hy - hr * 0.2, hr * 0.6, hr * 0.55, 0, 0, Math.PI * 2)
    x.fill()
  }
  if (P.markings === 'tricolour' || P.markings === 'white_markings') {
    x.fillStyle = css(WHITE)
    x.fillRect(hx + hr * 0.15, hy - hr, hr * 0.3, hr * 2)
  }
  if (P.markings === 'merle') paintPatches(x, (MERLE[P.colour] ?? MERLE.blue!)[1], hx, hy, hr, hr, 3, rand)
  if (P.markings === 'spotted') paintSpots(x, main, hx, hy, hr, hr, 4, rand, s)
  x.restore()

  // Muzzle (or a flat face), nose and eye
  const sn = B.snout * s
  const muzzle = P.mask ? shade(main === WHITE ? [60, 50, 45] : main, P.colour === 'black' ? 1 : 0.35)
    : P.markings === 'tan_points' || P.markings === 'tricolour' ? (P.markings === 'tricolour' ? WHITE : TAN)
    : P.markings === 'saddle' ? shade(main, 1) : shade(base, P.coat === 'wiry' ? 0.92 : 1.12)
  if (sn > 2 * s) {
    x.fillStyle = css(muzzle)
    x.beginPath()
    x.roundRect(hx + hr * 0.3, hy - hr * 0.05, sn + hr * 0.3, hr * 0.6, hr * 0.3)
    x.fill()
    x.stroke()
    if (P.coat === 'wiry') {
      // A beard under the muzzle
      x.fillStyle = css(shade(muzzle, 0.9))
      x.beginPath()
      x.moveTo(hx + hr * 0.4, hy + hr * 0.5)
      x.lineTo(hx + hr * 0.5 + sn * 0.6, hy + hr * 0.9)
      x.lineTo(hx + hr * 0.6 + sn, hy + hr * 0.5)
      x.closePath()
      x.fill()
    }
  } else {
    x.fillStyle = css(shade(P.mask ? muzzle : base, P.mask ? 1 : 0.55))
    x.beginPath()
    x.ellipse(hx + hr * 0.6, hy + hr * 0.25, hr * 0.38, hr * 0.32, 0, 0, Math.PI * 2)
    x.fill()
  }
  if (P.markings === 'tan_points' || P.markings === 'tricolour') {
    // Tan brow spot above the eye
    x.fillStyle = css(TAN)
    x.beginPath()
    x.arc(hx + hr * 0.25, hy - hr * 0.55, 1.3 * s, 0, Math.PI * 2)
    x.fill()
  }
  x.fillStyle = '#2b2b33'
  x.beginPath()
  x.arc(hx + hr * 0.6 + sn, hy + hr * 0.1, 1.6 * s, 0, Math.PI * 2)
  x.fill()
  const blink = Math.sin(t * 0.9 + d.seed * 3) > 0.985 ? 0.2 : 1
  x.fillStyle = P.colour === 'black' && !P.mask && P.markings === 'solid' ? '#f4efe6' : '#2b2b33'
  x.beginPath()
  x.ellipse(hx + hr * 0.25, hy - hr * 0.25, 1.4 * s, 1.6 * s * blink, 0, 0, Math.PI * 2)
  x.fill()
  if (P.colour === 'black' && !P.mask && P.markings === 'solid') {
    x.fillStyle = '#2b2b33'
    x.beginPath()
    x.arc(hx + hr * 0.28, hy - hr * 0.25, 0.8 * s, 0, Math.PI * 2)
    x.fill()
  }
  if (P.coat === 'wiry') {
    // Bushy brows
    x.strokeStyle = css(shade(base, 0.7))
    x.lineWidth = 1.2 * s
    x.beginPath()
    x.moveTo(hx + hr * 0.05, hy - hr * 0.45)
    x.lineTo(hx + hr * 0.5, hy - hr * 0.5)
    x.stroke()
    x.lineWidth = 1.5
    x.strokeStyle = line
  }
  if (P.coat === 'hairless') {
    // A little tuft on top, like a Chinese Crested
    x.fillStyle = css(WHITE)
    for (let i = 0; i < 3; i++) {
      x.beginPath()
      x.arc(hx - hr * 0.2 + i * hr * 0.25, hy - hr * 0.85, hr * 0.22, 0, Math.PI * 2)
      x.fill()
    }
  }
  if (!upright) ear(true)
  if (d.happy > 0 && sn > 2 * s) {
    x.fillStyle = '#e8506a'
    x.beginPath()
    x.ellipse(hx + hr * 0.6 + sn * 0.6, hy + hr * 0.6, 1.4 * s, 2 * s, 0, 0, Math.PI * 2)
    x.fill()
  }
  x.restore()
}

/** The body's markings, drawn inside the body's clip. */
function paintMarkings(x: Ctx, P: DogShape, main: Rgb, L: number, H: number, bodyY: number, rand: () => number, s: number) {
  switch (P.markings) {
    case 'white_markings':
    case 'tricolour':
      // White chest and belly
      x.fillStyle = css(WHITE)
      x.beginPath()
      x.ellipse(L * 0.3, bodyY + H * 0.3, L * 0.28, H * 0.42, 0, 0, Math.PI * 2)
      x.fill()
      if (P.markings === 'tricolour') {
        // Tan between the black saddle and the white
        x.fillStyle = css(TAN)
        x.beginPath()
        x.ellipse(L * 0.38, bodyY - H * 0.05, L * 0.14, H * 0.3, 0, 0, Math.PI * 2)
        x.ellipse(-L * 0.42, bodyY + H * 0.1, L * 0.1, H * 0.35, 0, 0, Math.PI * 2)
        x.fill()
      }
      break
    case 'tan_points':
      x.fillStyle = css(TAN)
      x.beginPath()
      x.ellipse(L * 0.4, bodyY + H * 0.2, L * 0.12, H * 0.3, 0, 0, Math.PI * 2)
      x.fill()
      break
    case 'parti':
      paintPatches(x, main, 0, bodyY, L / 2, H / 2, 2, rand)
      break
    case 'spotted':
      paintSpots(x, main, 0, bodyY, L / 2, H / 2, 16, rand, s)
      break
    case 'merle':
      paintPatches(x, (MERLE[P.colour] ?? MERLE.blue!)[1], 0, bodyY, L / 2, H / 2, 5, rand)
      break
    case 'saddle':
      x.fillStyle = css(main)
      x.beginPath()
      x.ellipse(-L * 0.05, bodyY - H * 0.35, L * 0.42, H * 0.45, 0, 0, Math.PI * 2)
      x.fill()
      break
    case 'brindle':
      x.strokeStyle = css(shade(main, 0.45), 0.55)
      x.lineWidth = 1.1 * s
      for (let i = -6; i <= 6; i++) {
        x.beginPath()
        x.moveTo((i * L) / 12, bodyY - H / 2)
        x.lineTo((i * L) / 12 + H * 0.35, bodyY + H / 2)
        x.stroke()
      }
      x.lineWidth = 1.5
      break
    case 'solid':
      break
  }
  if (P.colour === 'sable') {
    // Sable: dark tips along the back
    x.fillStyle = 'rgba(40,25,10,0.28)'
    x.beginPath()
    x.ellipse(0, bodyY - H * 0.45, L * 0.48, H * 0.3, 0, 0, Math.PI * 2)
    x.fill()
  }
}

function paintPatches(x: Ctx, colour: Rgb, cx: number, cy: number, rx: number, ry: number, n: number, rand: () => number) {
  x.fillStyle = css(colour)
  for (let i = 0; i < n; i++) {
    x.beginPath()
    x.ellipse(cx + (rand() - 0.5) * rx * 1.4, cy + (rand() - 0.5) * ry * 1.2, rx * (0.25 + rand() * 0.25), ry * (0.35 + rand() * 0.3), rand() * Math.PI, 0, Math.PI * 2)
    x.fill()
  }
}

function paintSpots(x: Ctx, colour: Rgb, cx: number, cy: number, rx: number, ry: number, n: number, rand: () => number, s: number) {
  x.fillStyle = css(colour)
  for (let i = 0; i < n; i++) {
    x.beginPath()
    x.arc(cx + (rand() - 0.5) * rx * 1.8, cy + (rand() - 0.5) * ry * 1.6, (0.8 + rand() * 0.9) * s, 0, Math.PI * 2)
    x.fill()
  }
}
