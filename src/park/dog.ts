// One storybook dog: side-on, drawn with its breed's proportions (data/dog-shapes.json) and its photo's colours.
import type { Breed, DogShape, Rgb } from '../data/types.ts'

export type DogState = 'idle' | 'walk' | 'run' | 'sit'

export type Dog = {
  breed: Breed
  shape: DogShape
  body: Rgb
  patch: Rgb
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

const css = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
export const shade = (c: Rgb, k: number): Rgb => c.map((v) => Math.max(0, Math.min(255, Math.round(v * k)))) as Rgb

/** A soft scalloped outline for fluffy coats. */
function fluffOutline(x: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, bumps: number) {
  x.beginPath()
  for (let i = 0; i <= bumps; i++) {
    const a = (i / bumps) * Math.PI * 2
    const px = cx + Math.cos(a) * rx
    const py = cy + Math.sin(a) * ry
    x.moveTo(px + ry * 0.38, py)
    x.arc(px, py, ry * 0.38, 0, Math.PI * 2)
  }
  x.fill()
}

const UPRIGHT_EARS = new Set(['pointy', 'bat', 'rose', 'tipped'])

/** Draws the dog with its feet at (0, 0) of the current transform. */
export function drawDog(x: CanvasRenderingContext2D, d: Dog, t: number) {
  const P = d.shape
  const s = d.scale * 0.95
  const { body, patch } = d
  const walk = d.state === 'walk' || d.state === 'run'
  const swing = walk ? Math.sin(t * (d.state === 'run' ? 15 : 8) + d.seed) * 0.45 : 0
  const hop = d.hop > 0 ? Math.sin(d.hop * Math.PI) * 12 * s : 0
  const L = P.len * s
  const H = P.h * s
  const leg = P.leg * s
  const sit = d.state === 'sit'

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
  const line = css(shade(body, 0.5))
  x.lineWidth = 1.5
  x.lineJoin = 'round'
  x.lineCap = 'round'
  x.strokeStyle = line
  const bodyY = -leg - H / 2

  // Legs: the far pair behind the body, the near pair in front.
  const legW = Math.max(2.5, 3.2 * s * (P.h / 11))
  const drawLeg = (lx: number, angle: number, far: boolean, folded = false) => {
    x.save()
    x.translate(lx, bodyY + H * 0.3)
    x.rotate(angle)
    x.fillStyle = css(far ? shade(body, 0.8) : body)
    x.beginPath()
    x.roundRect(folded ? -legW : -legW / 2, 0, folded ? legW * 2 : legW, folded ? leg * 0.65 + H * 0.2 : leg + H * 0.2, legW / 2)
    x.fill()
    x.stroke()
    x.restore()
  }
  drawLeg(-L * 0.32, swing, true, sit)
  drawLeg(L * 0.3, -swing, true)

  // Tail
  const wag = Math.sin(t * (walk ? 6 : 11) + d.seed) * 0.35
  x.save()
  x.translate(-L * 0.47, bodyY - H * 0.2)
  x.rotate(-0.6 + wag)
  x.strokeStyle = css(shade(body, 0.9))
  x.lineWidth = P.tail === 'plume' ? 4.5 * s : 2.6 * s
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

  // Body and its patch
  x.fillStyle = css(body)
  if (P.fluff) fluffOutline(x, 0, bodyY, L / 2, H / 2, 10)
  x.beginPath()
  x.ellipse(0, bodyY, L / 2, H / 2, 0, 0, Math.PI * 2)
  x.fill()
  if (!P.fluff) x.stroke()
  x.fillStyle = css(patch, 0.9)
  x.beginPath()
  x.ellipse(L * 0.22, bodyY + H * 0.18, L * 0.2, H * 0.3, 0, 0, Math.PI * 2)
  x.fill()
  drawLeg(-L * 0.22, -swing, false, sit)
  drawLeg(L * 0.36, swing, false)

  // Neck and head
  const hr = P.head * s
  const hx = L * 0.46
  const hy = bodyY - H * 0.55 - hr * 0.35
  x.fillStyle = css(body)
  x.beginPath()
  x.moveTo(L * 0.25, bodyY - H * 0.3)
  x.lineTo(hx - hr * 0.5, hy + hr * 0.6)
  x.lineTo(hx + hr * 0.2, hy + hr * 0.4)
  x.lineTo(L * 0.42, bodyY + H * 0.1)
  x.closePath()
  x.fill()
  const ear = (front: boolean) => {
    x.fillStyle = css(shade(body, front ? 0.78 : 0.68))
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
      const len = P.ears === 'long' ? 1.25 : 0.8
      x.ellipse(hx - hr * 0.35, hy + hr * 0.15 * len, hr * 0.33, hr * 0.62 * len, 0.3, 0, Math.PI * 2)
    }
    x.fill()
    x.stroke()
  }
  const upright = UPRIGHT_EARS.has(P.ears)
  if (upright) ear(false)
  x.fillStyle = css(body)
  if (P.fluff) fluffOutline(x, hx, hy, hr * 0.85, hr * 0.85, 8)
  x.beginPath()
  x.arc(hx, hy, hr * 0.85, 0, Math.PI * 2)
  x.fill()
  if (!P.fluff) x.stroke()

  // Muzzle (or a flat face), nose and eye
  const sn = P.snout * s
  if (sn > 2 * s) {
    x.fillStyle = css(patch)
    x.beginPath()
    x.roundRect(hx + hr * 0.3, hy - hr * 0.05, sn + hr * 0.3, hr * 0.6, hr * 0.3)
    x.fill()
    x.stroke()
  } else {
    x.fillStyle = css(shade(body, 0.55))
    x.beginPath()
    x.ellipse(hx + hr * 0.6, hy + hr * 0.25, hr * 0.38, hr * 0.32, 0, 0, Math.PI * 2)
    x.fill()
  }
  x.fillStyle = '#2b2b33'
  x.beginPath()
  x.arc(hx + hr * 0.6 + sn, hy + hr * 0.1, 1.6 * s, 0, Math.PI * 2)
  x.fill()
  const blink = Math.sin(t * 0.9 + d.seed * 3) > 0.985 ? 0.2 : 1
  x.beginPath()
  x.ellipse(hx + hr * 0.25, hy - hr * 0.25, 1.4 * s, 1.6 * s * blink, 0, 0, Math.PI * 2)
  x.fill()
  if (!upright) ear(true)
  if (d.happy > 0 && sn > 2 * s) {
    x.fillStyle = '#e8506a'
    x.beginPath()
    x.ellipse(hx + hr * 0.6 + sn * 0.6, hy + hr * 0.6, 1.4 * s, 2 * s, 0, 0, Math.PI * 2)
    x.fill()
  }
  x.restore()
}
