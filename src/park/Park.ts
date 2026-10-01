// The Park: an animated Rushcutters Bay with one storybook dog per spotted breed.
// Framework-free, so it can run in the Park tab and in the screensaver alike.
import type { Breed } from '../data/types.ts'
import { drawDog, type Dog } from './dog.ts'
import { BOTTOM, drawBackground, drawFig, drawWater, FIGS, SHADE_SPOT, timeOfDay, TOP } from './scene.ts'

/** At most this many dogs are out at once; with more spotted, dogs take turns, walking off and on. */
export const MAX_HERE = 20
/** How many of the most recently spotted breeds are always out when the Park opens. */
const ALWAYS_OUT = 3

type Options = {
  onTap?: (breedId: string) => void
  onCaption?: (text: string) => void
}

const shuffle = <T,>(xs: T[]) => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export class Park {
  private ctx: CanvasRenderingContext2D
  private dogs: Dog[] = []
  private spotted: Breed[] = []
  private made = 0
  private w = 0
  private h = 0
  private dpr = 1
  private bg: HTMLCanvasElement | null = null
  private running = false
  private last = 0
  private swapIn = 8
  private caption = ''
  private readonly still = matchMedia('(prefers-reduced-motion: reduce)').matches
  private readonly resizer: ResizeObserver
  private readonly canvas: HTMLCanvasElement
  private readonly opts: Options

  constructor(canvas: HTMLCanvasElement, opts: Options = {}) {
    this.canvas = canvas
    this.opts = opts
    this.ctx = canvas.getContext('2d')!
    this.resizer = new ResizeObserver(() => this.resize())
    this.resizer.observe(canvas)
    if (opts.onTap) canvas.addEventListener('click', this.onClick)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.resize()
  }

  /**
   * The breeds to show. The first call fills the park (the newest spots always come out); later calls let
   * newly spotted breeds trot in and unseen ones disappear.
   */
  setSpotted(spotted: Breed[], newestFirst: string[] = []) {
    const first = this.spotted.length === 0 && this.dogs.length === 0
    const ids = new Set(spotted.map((b) => b.id))
    this.spotted = spotted
    this.dogs = this.dogs.filter((d) => ids.has(d.breed.id))
    const here = new Set(this.dogs.map((d) => d.breed.id))
    if (first) {
      const newest = newestFirst.slice(0, ALWAYS_OUT).filter((id) => ids.has(id))
      const rest = shuffle(spotted.map((b) => b.id).filter((id) => !newest.includes(id)))
      for (const id of [...newest, ...rest].slice(0, MAX_HERE)) {
        const n = this.dogs.length
        this.dogs.push(this.newDog(spotted.find((b) => b.id === id)!, this.w * (0.12 + ((n * 0.37) % 0.76)), this.h * (TOP + ((n * 0.53) % 1) * (BOTTOM - TOP))))
      }
    } else {
      for (const b of spotted.filter((x) => !here.has(x.id))) {
        const d = this.enter(b)
        d.x = this.w * (0.15 + Math.random() * 0.7)
        d.y = this.h * (TOP + 0.1 + Math.random() * 0.4)
        d.state = 'idle'
        d.happy = 2
        d.hop = 1
      }
      while (this.dogs.filter((d) => !d.leaving).length > MAX_HERE) this.leave(this.dogs.find((d) => !d.leaving)!)
    }
    this.render(performance.now())
  }

  start() {
    if (this.running || document.hidden) return
    this.running = true
    this.last = performance.now()
    if (this.still) this.render(this.last)
    else requestAnimationFrame(this.loop)
  }

  stop() {
    this.running = false
  }

  destroy() {
    this.stop()
    this.resizer.disconnect()
    this.canvas.removeEventListener('click', this.onClick)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }

  /** The breeds out in the park (not counting any on their way home). */
  get dogsHere(): string[] {
    return this.dogs.filter((d) => !d.leaving).map((d) => d.breed.id)
  }

  /** Where a dog is drawn, as a fraction of the canvas (for the E2E tests to tap it). */
  whereIs(breedId: string): { x: number; y: number } | null {
    const d = this.dogs.find((x) => x.breed.id === breedId)
    return d && this.w ? { x: d.x / this.w, y: (d.y - 14 * d.scale) / this.h } : null
  }

  private onVisibility = () => {
    if (document.hidden) this.running = false
    else if (!this.running) this.start()
  }

  private onClick = (e: MouseEvent) => {
    const r = this.canvas.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * this.w
    const py = ((e.clientY - r.top) / r.height) * this.h
    let best: Dog | null = null
    let bestDistance = 36
    for (const d of this.dogs) {
      const distance = Math.hypot(px - d.x, py - (d.y - 14 * d.scale))
      if (distance < bestDistance) {
        best = d
        bestDistance = distance
      }
    }
    if (best) this.opts.onTap?.(best.breed.id)
  }

  private resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    const oldW = this.w
    const oldH = this.h
    this.dpr = Math.min(2, devicePixelRatio || 1)
    this.w = w
    this.h = h
    this.canvas.width = Math.round(w * this.dpr)
    this.canvas.height = Math.round(h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.bg = drawBackground(w, h, this.dpr)
    this.dogs.forEach((d, n) => {
      if (oldW && oldH) {
        d.x *= w / oldW
        d.y *= h / oldH
        d.tx *= w / oldW
        d.ty *= h / oldH
      } else {
        // Placed before the canvas had a size: spread them out now.
        d.x = d.tx = w * (0.12 + ((n * 0.37) % 0.76))
        d.y = d.ty = h * (TOP + ((n * 0.53) % 1) * (BOTTOM - TOP))
      }
    })
    this.render(performance.now())
  }

  private newDog(breed: Breed, x: number, y: number): Dog {
    const n = ++this.made
    return {
      breed,
      shape: breed.shape,
      body: breed.image?.colours.body ?? [170, 120, 70],
      patch: breed.image?.colours.patch ?? [240, 230, 210],
      seed: n * 1.7 + 0.3,
      x,
      y,
      dir: n % 2 ? 1 : -1,
      state: 'idle',
      timer: Math.random() * 2,
      hop: 0,
      happy: 0,
      scale: 1,
      tx: x,
      ty: y,
      toSpot: false,
      friend: null,
      leaving: false,
    }
  }

  /** A dog trots in from the side of the park. */
  private enter(b: Breed): Dog {
    const fromLeft = Math.random() < 0.5
    const d = this.newDog(b, fromLeft ? -30 : this.w + 30, this.h * (TOP + 0.15 + Math.random() * 0.6))
    d.state = 'walk'
    d.tx = this.w * (0.2 + Math.random() * 0.6)
    d.ty = d.y
    d.timer = 20
    d.dir = fromLeft ? 1 : -1
    this.dogs.push(d)
    return d
  }

  private leave(d: Dog) {
    d.leaving = true
    d.state = 'walk'
    d.tx = d.x < this.w / 2 ? -40 : this.w + 40
    d.ty = d.y
    d.friend = null
  }

  /** Every so often, when there are more spotted breeds than fit, one dog heads home and another arrives. */
  private rotate(dt: number) {
    if (this.spotted.length <= MAX_HERE) return
    this.swapIn -= dt
    if (this.swapIn > 0) return
    this.swapIn = 7 + Math.random() * 5
    const here = new Set(this.dogs.map((d) => d.breed.id))
    const out = this.spotted.filter((b) => !here.has(b.id))
    const candidates = this.dogs.filter((d) => !d.leaving && d.state !== 'run')
    const goer = candidates[Math.floor(Math.random() * candidates.length)]
    if (!goer || !out.length) return
    this.leave(goer)
    this.enter(out[Math.floor(Math.random() * out.length)])
  }

  private pickTarget(d: Dog) {
    if (Math.random() < 0.3) {
      d.tx = this.w * (SHADE_SPOT.x + (Math.random() - 0.5) * SHADE_SPOT.spreadX)
      d.ty = this.h * (SHADE_SPOT.y + Math.random() * SHADE_SPOT.spreadY)
      d.toSpot = true
    } else {
      d.tx = this.w * (0.08 + Math.random() * 0.84)
      d.ty = this.h * (TOP + Math.random() * (BOTTOM - TOP))
      d.toSpot = false
    }
  }

  /** Wander, pause, sit, and every so often run over to play with a friend. */
  private update(dt: number) {
    this.rotate(dt)
    this.dogs = this.dogs.filter((d) => !(d.leaving && (d.x < -35 || d.x > this.w + 35)))
    for (const d of this.dogs) {
      d.timer -= dt
      d.hop = Math.max(0, d.hop - dt * 1.6)
      d.happy = Math.max(0, d.happy - dt)
      if (d.leaving) {
        d.state = 'walk'
        d.timer = 99
      }
      if (d.timer <= 0) {
        const r = Math.random()
        if (r < 0.5) {
          d.state = 'walk'
          this.pickTarget(d)
          d.timer = 3 + Math.random() * 3
        } else if (r < 0.75) {
          d.state = 'idle'
          d.timer = 1 + Math.random() * 2.5
          d.happy = 1.5
        } else if (r < 0.9) {
          d.state = 'sit'
          d.timer = 2 + Math.random() * 3
        } else {
          const f = this.dogs[Math.floor(Math.random() * this.dogs.length)]
          if (f !== d && !f.leaving) {
            d.state = f.state = 'run'
            d.friend = f
            f.friend = d
            d.timer = f.timer = 3
          }
        }
      }
      if (d.state === 'run' && d.friend) {
        d.tx = d.friend.x
        d.ty = d.friend.y
      }
      if (d.state === 'walk' || d.state === 'run') {
        const speed = (d.state === 'run' ? 90 : 26) * dt
        const dx = d.tx - d.x
        const dy = d.ty - d.y
        const distance = Math.hypot(dx, dy)
        if (distance < (d.state === 'run' ? 26 : 2) && !d.leaving) {
          if (d.state === 'run') {
            d.hop = 1
            d.happy = 2
          }
          d.state = d.toSpot ? 'sit' : 'idle'
          d.timer = 1.5 + Math.random() * 2
        } else if (distance > 0) {
          d.x += (dx / distance) * speed
          d.y += (dy / distance) * speed
          if (Math.abs(dx) > 1) d.dir = dx > 0 ? 1 : -1
        }
      }
    }
  }

  private render(now: number) {
    if (!this.w || !this.bg) return
    const t = now / 1000
    const x = this.ctx
    x.drawImage(this.bg, 0, 0, this.w, this.h)
    drawWater(x, this.w, this.h, t)
    // Dogs and figs in depth order, so a dog can walk behind a tree. Further away = smaller.
    for (const d of this.dogs) d.scale = 0.72 + 0.5 * ((d.y / this.h - TOP) / (BOTTOM - TOP))
    const things = [
      ...this.dogs.map((d) => ({ y: d.y, draw: () => {
        x.save()
        x.translate(d.x, d.y)
        drawDog(x, d, t)
        x.restore()
      } })),
      ...FIGS.map(([fx, fy, k]) => ({ y: this.h * fy, draw: () => drawFig(x, this.w * fx, this.h * fy, k) })),
    ]
    for (const o of things.sort((a, z) => a.y - z.y)) o.draw()
    const { tint, label } = timeOfDay()
    if (tint) {
      x.fillStyle = tint
      x.fillRect(0, 0, this.w, this.h)
    }
    const here = this.dogsHere.length
    const n = this.spotted.length
    const caption = n === 0 ? `No dogs yet · ${label}` : `${n > here ? `${here} of ${n}` : n} ${n === 1 ? 'dog' : 'dogs'} · ${label}`
    if (caption !== this.caption) {
      this.caption = caption
      this.opts.onCaption?.(caption)
    }
  }

  private loop = (now: number) => {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.update(dt)
    this.render(now)
    requestAnimationFrame(this.loop)
  }
}
