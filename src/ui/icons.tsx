// Pixel-style icons, drawn on a 16px grid like the Windows 98 originals (bigPaw is the app logo, on 28px).

const ICONS = {
  eyes: { size: 16, d: '<rect x="1.5" y="3.5" width="5.5" height="9" rx="2.75" fill="#fff" stroke="#000"/><rect x="9" y="3.5" width="5.5" height="9" rx="2.75" fill="#fff" stroke="#000"/><rect x="4" y="7" width="2.5" height="3.5" rx="1" fill="#000"/><rect x="11.5" y="7" width="2.5" height="3.5" rx="1" fill="#000"/><rect x="4.6" y="7.6" width="0.9" height="0.9" fill="#fff"/><rect x="12.1" y="7.6" width="0.9" height="0.9" fill="#fff"/>' },
  bigPaw: { size: 28, d: '<rect x="2" y="9" width="5" height="7" fill="#ff0000"/><rect x="8" y="2" width="5" height="7" fill="#00a000"/><rect x="15" y="2" width="5" height="7" fill="#0000ff"/><rect x="21" y="9" width="5" height="7" fill="#ffcc00"/><rect x="8" y="14" width="12" height="10" fill="#ffffff"/><rect x="6" y="18" width="16" height="6" fill="#ffffff"/>' },
  infoBig: { size: 32, d: '<circle cx="16" cy="16" r="15" fill="#fff" stroke="#000"/><circle cx="16" cy="16" r="13" fill="#2050e0"/><rect x="14" y="7" width="4" height="4" fill="#fff"/><rect x="14" y="13" width="4" height="12" fill="#fff"/>' },
  warn: { size: 32, d: '<path d="M16 2L31 29H1z" fill="#ffcc00" stroke="#000"/><rect x="14" y="10" width="4" height="11" fill="#000"/><rect x="14" y="23" width="4" height="4" fill="#000"/>' },
  tick: { size: 16, d: '<path d="M1 8l2-2 2 2 6-6 2 2-8 8z" fill="#000"/>' },
  disk: { size: 16, d: '<rect x="1" y="1" width="14" height="14" fill="#000080"/><rect x="4" y="1" width="8" height="5" fill="#c0c0c0"/><rect x="9" y="2" width="2" height="3" fill="#000080"/><rect x="3" y="9" width="10" height="6" fill="#fff"/>' },
  tHeart: { size: 16, d: '<path d="M2 4h2V2h3v2h2V2h3v2h2v4h-2v2h-2v2h-2v2H7v-2H5v-2H3V8H1V4z" fill="#e00000"/><rect x="4" y="4" width="2" height="2" fill="#ff9090"/>' },
  tShield: { size: 16, d: '<path d="M2 2h12v6l-2 3-4 3-4-3-2-3z" fill="#c0c0c0" stroke="#000080"/><path d="M8 3v10M3 6h10" stroke="#000080"/>' },
  tBall: { size: 16, d: '<circle cx="8" cy="8" r="6.5" fill="#d8e000" stroke="#606000"/><path d="M3 5c3 1 3 5 0 7M13 4c-3 1-3 6 0 8" fill="none" stroke="#fff"/>' },
  tBulb: { size: 16, d: '<circle cx="8" cy="6" r="4.5" fill="#ffee55" stroke="#806000"/><rect x="6" y="10" width="4" height="4" fill="#808080" stroke="#404040"/>' },
  tBolt: { size: 16, d: '<path d="M9 1L3 9h4l-1 6 6-8H8z" fill="#ffcc00" stroke="#806000"/>' },
  tMoon: { size: 16, d: '<path d="M10 2a6 6 0 1 0 4 10A5 5 0 0 1 10 2z" fill="#ffee88" stroke="#806000"/>' },
  tHand: { size: 16, d: '<circle cx="8" cy="8" r="6.8" fill="#ffdd33" stroke="#806000"/><rect x="5" y="5" width="2" height="2.5" fill="#000"/><rect x="9" y="5" width="2" height="2.5" fill="#000"/><path d="M4.5 9.5c1.5 2.6 5.5 2.6 7 0" fill="none" stroke="#000" stroke-width="1.2"/>' },
  tEye: { size: 16, d: '<path d="M1 8c3-5 11-5 14 0-3 5-11 5-14 0z" fill="#fff" stroke="#000"/><circle cx="8" cy="8" r="2.6" fill="#0060c0"/><circle cx="8" cy="8" r="1.1" fill="#000"/>' },
  tCrook: { size: 16, d: '<path d="M6 15V6a3 3 0 1 1 6 0v1" fill="none" stroke="#804000" stroke-width="2"/>' },
  tLock: { size: 16, d: '<rect x="3" y="7" width="10" height="8" fill="#ffcc00" stroke="#806000"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#606060" stroke-width="1.6"/><rect x="7" y="10" width="2" height="3" fill="#806000"/>' },
  tCrown: { size: 16, d: '<path d="M1 12V4l4 4 3-5 3 5 4-4v8z" fill="#ffcc00" stroke="#806000"/><rect x="1" y="12" width="14" height="2" fill="#c09000"/>' },
  tDoor: { size: 16, d: '<rect x="3" y="1" width="10" height="14" fill="#a05a20" stroke="#402000"/><rect x="5" y="3" width="6" height="4" fill="#c07830"/><rect x="5" y="9" width="6" height="4" fill="#c07830"/><rect x="10" y="8" width="1.5" height="1.5" fill="#ffcc00"/>' },
  tCap: { size: 16, d: '<path d="M0 6l8-4 8 4-8 4z" fill="#000080"/><path d="M4 8v4c2 1.5 6 1.5 8 0V8l-4 2z" fill="#000060"/><path d="M14 7v5" stroke="#ffcc00"/>' },
  tHouse: { size: 16, d: '<path d="M1 8l7-6 7 6" fill="none" stroke="#c00000" stroke-width="1.6"/><rect x="3" y="8" width="10" height="7" fill="#e0e0e0" stroke="#404040"/><rect x="7" y="11" width="2.5" height="4" fill="#804000"/>' },
  tCompass: { size: 16, d: '<circle cx="8" cy="8" r="6.5" fill="#fff" stroke="#000"/><path d="M8 3l2 5-2 5-2-5z" fill="#c00000"/><path d="M8 8l2 0-2 5-2-5z" fill="#404040"/>' },
  tFeather: { size: 16, d: '<path d="M13 2C6 3 3 8 3 14c3-1 9-4 10-12z" fill="#e8e8ff" stroke="#6060a0"/><path d="M3 14L11 5" stroke="#6060a0"/>' },
} satisfies Record<string, { size: number; d: string }>

export type IconName = keyof typeof ICONS

export function Icon({ name, label }: { name: IconName; label?: string }) {
  const { size, d } = ICONS[name]
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Static, hand-written SVG shapes from this file only.
      dangerouslySetInnerHTML={{ __html: d }}
    />
  )
}
