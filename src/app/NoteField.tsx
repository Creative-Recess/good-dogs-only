// The note on a spotted breed. Saves once you pause typing (and when you leave the field or close the window),
// rather than on every keystroke, which would redraw every tile in the grid each time.
import { useEffect, useRef } from 'react'
import { setNote } from '../lib/sightings.ts'
import { SAVE_FAILED, useDialog } from './dialogs.ts'

const PAUSE_MS = 400

export function NoteField({ sightingId, note }: { sightingId: string; note: string }) {
  const ask = useDialog()
  const pending = useRef<string | null>(null)
  const timer = useRef(0)
  const flush = () => {
    clearTimeout(timer.current)
    if (pending.current !== null) void setNote(sightingId, pending.current).catch(() => ask({ title: 'Note', text: SAVE_FAILED, icon: 'warn' }))
    pending.current = null
  }
  // Save anything still waiting when the window closes.
  useEffect(() => flush)
  return (
    <div className="field-row-stacked">
      <label htmlFor="note">Note:</label>
      <textarea
        id="note"
        className="nz nz-area"
        rows={2}
        defaultValue={note}
        onChange={(e) => {
          pending.current = e.target.value
          clearTimeout(timer.current)
          timer.current = window.setTimeout(flush, PAUSE_MS)
        }}
        onBlur={flush}
        placeholder="Where, what colour, the dog's name..."
      />
    </div>
  )
}
