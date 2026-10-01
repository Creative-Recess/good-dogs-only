// The Park canvas, for the Park tab and the screensaver.
import { useEffect, useRef, useState } from 'react'
import { breeds } from '../data/catalogue.ts'
import { newestFirst, type Spot } from '../lib/sightings.ts'
import { Park } from '../park/Park.ts'

type Props = { spots: Map<string, Spot>; onOpen?: (id: string) => void; caption?: boolean }

export function ParkView({ spots, onOpen, caption = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const parkRef = useRef<Park | null>(null)
  const openRef = useRef(onOpen)
  const [text, setText] = useState('')

  useEffect(() => {
    openRef.current = onOpen
  }, [onOpen])

  useEffect(() => {
    const park = new Park(canvasRef.current!, { onTap: onOpen ? (id) => openRef.current?.(id) : undefined, onCaption: setText })
    parkRef.current = park
    park.start()
    // A handle for the E2E tests, which need to find a dog to tap.
    ;(window as { goodDogsPark?: Park }).goodDogsPark = park
    return () => {
      park.destroy()
      parkRef.current = null
    }
    // The Park is created once per mount; taps go through openRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const newest = [...spots.values()].sort(newestFirst).map((s) => s.breedId)
    parkRef.current?.setSpotted(breeds.filter((b) => spots.has(b.id)), newest)
  }, [spots])

  return (
    <div className="park-view">
      <canvas ref={canvasRef} aria-label={`Dog park: ${text}`} data-testid="park" />
      {caption && <div className="park-hint">{text}</div>}
    </div>
  )
}
