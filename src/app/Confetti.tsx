// A shower of dog bones over the whole app, for every tenth breed spotted. Purely decoration: it can't be tapped,
// it tidies itself away when the last bone has fallen, and with reduced motion it doesn't happen at all.
import { useEffect, useState, type CSSProperties } from 'react'
import { Icon } from '../ui/icons.tsx'

const BONES = 40
/** The longest fall plus the latest start, in ms. */
const LASTS = 3400

/** Where each bone starts, how big it is, and how it falls. */
const makeBones = () =>
  Array.from({ length: BONES }, () => ({
    x: Math.random() * 100,
    size: 16 + Math.random() * 14,
    delay: Math.random() * 0.7,
    fall: 1.8 + Math.random() * 0.9,
    drift: (Math.random() - 0.5) * 80,
    spin: (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 480),
  }))

export function Confetti({ onDone }: { onDone: () => void }) {
  // Picked once when the shower starts (a lazy initial state), so a re-render doesn't reshuffle the bones.
  const [bones] = useState(makeBones)
  useEffect(() => {
    const t = setTimeout(onDone, LASTS)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="confetti" aria-hidden="true">
      {bones.map((b, i) => (
        <span
          key={i}
          className="bone"
          style={{ left: `${b.x}%`, width: b.size, height: b.size, animationDelay: `${b.delay}s`, animationDuration: `${b.fall}s`, '--drift': `${b.drift}px`, '--spin': `${b.spin}deg` } as CSSProperties}
        >
          <Icon name="bone" />
        </span>
      ))}
    </div>
  )
}
