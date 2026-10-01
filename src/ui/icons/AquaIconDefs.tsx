// The gradients every Aqua icon refers to (see aqua.ts for why they live here).
import { ORBS } from './aqua.ts'

const vertical = (id: string, stops: [string, string, number?][]) => (
  <linearGradient id={id} key={id} x1="0" y1="0" x2="0" y2="1">
    {stops.map(([offset, color, opacity]) => (
      <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity ?? 1} />
    ))}
  </linearGradient>
)

/** Every Aqua gradient, once. Rendered (not display:none) but takes no space. */
export function AquaIconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {Object.entries(ORBS).map(([id, [top, bottom]]) => vertical(`aq-${id}`, [['0', top], ['1', bottom]]))}
        {vertical('aq-shine', [['0', '#fff', 0.9], ['1', '#fff', 0]])}
        {vertical('aq-paw', [['0', '#8fd0ff'], ['0.5', '#2f86e6'], ['1', '#155bb8']])}
        {vertical('aq-pawshine', [['0', '#fff', 0.95], ['1', '#fff', 0]])}
        {vertical('aq-warn', [['0', '#fff07a'], ['1', '#f0a800']])}
        <radialGradient id="aq-eyeball" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#d6dbe3" />
        </radialGradient>
      </defs>
    </svg>
  )
}
