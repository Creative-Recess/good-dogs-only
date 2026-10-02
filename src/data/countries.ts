// Where breeds come from: each country's name and a simple flag, drawn once on a 30x20 grid.
// <Flag> crops it into a gel orb for Aqua and squeezes it to a 14x10 pixel flag for Windows 98.

/** A flag: static, hand-written SVG on a 30x20 grid. `fx` is where Aqua's round crop sits across it (0 left, 0.5 middle). */
type Country = { name: string; short?: string; art: string; fx?: number }

const UNION = '<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.4"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.4"/>'
const bands = (...c: string[]) => c.map((f, i) => `<rect y="${(20 / c.length) * i}" width="30" height="${20 / c.length + 0.1}" fill="${f}"/>`).join('')
const stripes = (...c: string[]) => c.map((f, i) => `<rect x="${(30 / c.length) * i}" width="${30 / c.length + 0.1}" height="20" fill="${f}"/>`).join('')
const nordic = (bg: string, cross: string, inner?: string) =>
  `<rect width="30" height="20" fill="${bg}"/><path d="M11 0v20M0 10h30" stroke="${cross}" stroke-width="${inner ? 5 : 3.4}"/>${inner ? `<path d="M11 0v20M0 10h30" stroke="${inner}" stroke-width="2.4"/>` : ''}`
const star = (cx: number, cy: number, r: number, fill: string) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const rr = i % 2 ? r * 0.4 : r
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`
  })
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`
}

export const COUNTRIES: Record<string, Country> = {
  GB: { name: 'United Kingdom', short: 'UK', art: UNION },
  'GB-ENG': { name: 'England', art: '<rect width="30" height="20" fill="#fff"/><path d="M15 0v20M0 10h30" stroke="#ce1124" stroke-width="4"/>' },
  'GB-SCT': { name: 'Scotland', art: '<rect width="30" height="20" fill="#0065bd"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="3.4"/>' },
  'GB-WLS': {
    name: 'Wales',
    art: '<rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#00b140"/><path d="M5 14.5c.4-1.6 1.8-2.2 3-1.6 1-1.2 2.6-1.8 4.4-1.6l1.6-3.4-2.8 1-.2-2.8-1.8 2.4-1.4-2 .2 3.4C6.6 9.2 5.6 8 6 6.6 4.4 7.6 4.2 9.6 5.6 10.8 4 11.2 3.4 13 5 14.5zM12.4 11.3c1.6.6 3.4.6 5 .2l.8-1.6c.6-.8 1.6-1 2.4-.4l1.8-.6-.4 1.2 1.2.4-1.4 1.2-1.4-.4c-.6 1.4-1.8 2.4-3.2 2.8l.6 2.4h-1.4l-.8-2.2h-3.2l-1 2.2H10l.8-2.6c-.8-.2-1.6-.6-2.2-1.2" fill="#d30731"/>',
  },
  IE: { name: 'Ireland', art: stripes('#169b62', '#fff', '#ff883e') },
  FR: { name: 'France', art: stripes('#0055a4', '#fff', '#ef4135') },
  BE: { name: 'Belgium', art: stripes('#000', '#fdda24', '#ef3340') },
  IT: { name: 'Italy', art: stripes('#009246', '#fff', '#ce2b37') },
  ML: { name: 'Mali', art: stripes('#14b53a', '#fcd116', '#ce1126') },
  PE: { name: 'Peru', art: stripes('#d91023', '#fff', '#d91023') },
  DE: { name: 'Germany', art: bands('#000', '#dd0000', '#ffce00') },
  NL: { name: 'Netherlands', art: bands('#ae1c28', '#fff', '#21468b') },
  HU: { name: 'Hungary', art: bands('#ce2939', '#fff', '#477050') },
  AT: { name: 'Austria', art: bands('#ed2939', '#fff', '#ed2939') },
  RU: { name: 'Russia', art: bands('#fff', '#0039a6', '#d52b1e') },
  PL: { name: 'Poland', art: bands('#fff', '#dc143c') },
  SK: { name: 'Slovakia', art: `${bands('#fff', '#0b4ea2', '#ee1c25')}<path d="M7 5h7v7c0 3-3.5 4.5-3.5 4.5S7 15 7 12z" fill="#ee1c25" stroke="#fff" stroke-width="0.8"/><path d="M10.5 6.5v8M8.5 9h4M9 11h3" stroke="#fff" stroke-width="0.9"/>`, fx: 0.25 },
  SI: { name: 'Slovenia', art: `${bands('#fff', '#005da4', '#ed1c24')}<path d="M6 4h6v5c0 2.5-3 4-3 4s-3-1.5-3-4z" fill="#005da4" stroke="#ed1c24" stroke-width="0.7"/><path d="M6.6 9.5l1.5-2 1 1.4 1-1.4 1.4 2" fill="none" stroke="#fff" stroke-width="0.8"/>`, fx: 0.2 },
  HR: {
    name: 'Croatia',
    art: `${bands('#ff0000', '#fff', '#171796')}<rect x="12" y="5" width="6" height="7" fill="#fff" stroke="#ff0000" stroke-width="0.4"/><path d="M12 5h1.5v1.4H12zM15 5h1.5v1.4H15zM13.5 6.4H15v1.4h-1.5zM16.5 6.4H18v1.4h-1.5zM12 7.8h1.5v1.4H12zM15 7.8h1.5v1.4H15zM13.5 9.2H15v1.4h-1.5zM16.5 9.2H18v1.4h-1.5zM12 10.6h1.5V12H12zM15 10.6h1.5V12H15z" fill="#ff0000"/>`,
  },
  CZ: { name: 'Czechia', art: '<rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#d7141a"/><path d="M0 0l15 10L0 20z" fill="#11457e"/>', fx: 0.15 },
  CH: { name: 'Switzerland', art: '<rect width="30" height="20" fill="#da291c"/><path d="M13 4h4v4h4v4h-4v4h-4v-4H9V8h4z" fill="#fff"/>' },
  ES: { name: 'Spain', art: '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>' },
  PT: { name: 'Portugal', art: '<rect width="30" height="20" fill="#da291c"/><rect width="12" height="20" fill="#046a38"/><circle cx="12" cy="10" r="4" fill="#ffe900"/><circle cx="12" cy="10" r="2.4" fill="#da291c" stroke="#fff" stroke-width="0.6"/>', fx: 0.3 },
  NO: { name: 'Norway', art: nordic('#ba0c2f', '#fff', '#00205b'), fx: 0.3 },
  SE: { name: 'Sweden', art: nordic('#006aa7', '#fecc00'), fx: 0.3 },
  FI: { name: 'Finland', art: nordic('#fff', '#002f6c'), fx: 0.3 },
  DK: { name: 'Denmark', art: nordic('#c8102e', '#fff'), fx: 0.3 },
  IS: { name: 'Iceland', art: nordic('#02529c', '#fff', '#dc1e35'), fx: 0.3 },
  GR: { name: 'Greece', art: `${bands('#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf')}<rect width="11.1" height="11.1" fill="#0d5eaf"/><path d="M5.55 0v11.1M0 5.55h11.1" stroke="#fff" stroke-width="2.2"/>`, fx: 0.15 },
  MT: { name: 'Malta', art: '<rect width="15" height="20" fill="#fff"/><rect x="15" width="15" height="20" fill="#cf142b"/><path d="M3 2.5h1.4v1.4h1.4v1.4H4.4v1.4H3V5.3H1.6V3.9H3z" fill="#9a9a9a" stroke="#cf142b" stroke-width="0.3"/>' },
  TR: { name: 'Türkiye', short: 'Turkey', art: `<rect width="30" height="20" fill="#e30a17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.3" cy="10" r="4" fill="#e30a17"/>${star(17.5, 10, 2.4, '#fff')}` },
  IL: { name: 'Israel', art: '<rect width="30" height="20" fill="#fff"/><rect y="2" width="30" height="2.4" fill="#0038b8"/><rect y="15.6" width="30" height="2.4" fill="#0038b8"/><path d="M15 6l3.2 5.6H11.8zM15 14l-3.2-5.6h6.4z" fill="none" stroke="#0038b8" stroke-width="0.9"/>' },
  AF: { name: 'Afghanistan', art: `${stripes('#000', '#be0000', '#009900')}<circle cx="15" cy="10" r="3" fill="none" stroke="#fff" stroke-width="0.9"/>` },
  CN: { name: 'China', art: `<rect width="30" height="20" fill="#ee1c25"/>${star(5, 5, 3, '#ffff00')}${star(10, 2, 1, '#ffff00')}${star(12, 4, 1, '#ffff00')}${star(12, 7, 1, '#ffff00')}${star(10, 9, 1, '#ffff00')}`, fx: 0.1 },
  JP: { name: 'Japan', art: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>' },
  KR: {
    name: 'South Korea',
    art: '<rect width="30" height="20" fill="#fff"/><path d="M10 10a5 5 0 0 1 10 0z" fill="#cd2e3a"/><path d="M10 10a5 5 0 0 0 10 0z" fill="#0047a0"/><circle cx="12.5" cy="10" r="2.5" fill="#cd2e3a"/><circle cx="17.5" cy="10" r="2.5" fill="#0047a0"/><path d="M3 4l3-2.5M4 5l3-2.5M5 6l3-2.5M22 2.5l3 2.5M23 1.5l3 2.5M22 17.5l3-2.5M23 18.5l3-2.5M3 16l3 2.5M4 15l3 2.5M5 14l3 2.5" stroke="#000" stroke-width="0.7"/>',
  },
  TH: { name: 'Thailand', art: bands('#a51931', '#f4f5f8', '#2d2a4a', '#2d2a4a', '#f4f5f8', '#a51931') },
  MX: { name: 'Mexico', art: `${stripes('#006847', '#fff', '#ce1126')}<circle cx="15" cy="10" r="2.6" fill="#8c5a2b"/><path d="M12.4 11.5c1.5 1.6 3.7 1.6 5.2 0" fill="none" stroke="#006847" stroke-width="0.8"/>` },
  CU: { name: 'Cuba', art: `${bands('#002a8f', '#fff', '#002a8f', '#fff', '#002a8f')}<path d="M0 0l15 10L0 20z" fill="#cf142b"/>${star(5.2, 10, 2.8, '#fff')}`, fx: 0.15 },
  US: {
    name: 'United States',
    short: 'USA',
    art: `${bands('#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234')}<rect width="13" height="10.8" fill="#3c3b6e"/><g fill="#fff">${[2, 5, 8, 11].flatMap((x) => [2, 5.4, 8.8].map((y) => `<circle cx="${x}" cy="${y}" r="0.7"/>`)).join('')}</g>`,
    fx: 0.15,
  },
  CA: { name: 'Canada', art: '<rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#d80621"/><rect x="22.5" width="7.5" height="20" fill="#d80621"/><path d="M15 4l1.2 2.4 1.6-.6-.6 3.6 2-1.6.6 1.2 1.8-.4-.8 2.2 1 .6-3.6 2.6.4 1.4-3.2-.4v2.6h-.8v-2.6l-3.2.4.4-1.4-3.6-2.6 1-.6-.8-2.2 1.8.4.6-1.2 2 1.6-.6-3.6 1.6.6z" fill="#d80621"/>' },
  AR: { name: 'Argentina', art: `${bands('#74acdf', '#fff', '#74acdf')}<circle cx="15" cy="10" r="2.2" fill="#f6b40e"/>` },
  AU: {
    name: 'Australia',
    art: `<rect width="30" height="20" fill="#012169"/><svg width="15" height="10" viewBox="0 0 30 20">${UNION}</svg>${star(7.5, 15, 2.2, '#fff')}${star(22.5, 4, 1, '#fff')}${star(19, 9, 1, '#fff')}${star(26, 8, 1, '#fff')}${star(22.5, 16.5, 1.2, '#fff')}`,
    fx: 0.25,
  },
  MG: { name: 'Madagascar', art: '<rect width="30" height="10" fill="#fc3d32"/><rect y="10" width="30" height="10" fill="#007e3a"/><rect width="10" height="20" fill="#fff"/>', fx: 0.3 },
  CD: {
    name: 'DR Congo',
    short: 'Congo',
    art: `<rect width="30" height="20" fill="#007fff"/><path d="M0 20L30 0" stroke="#f7d618" stroke-width="7"/><path d="M0 20L30 0" stroke="#ce1021" stroke-width="4.6"/>${star(5, 4.5, 3, '#f7d618')}`,
  },
  IR: { name: 'Iran', art: `${bands('#239f40', '#fff', '#da0000')}<circle cx="15" cy="10" r="2" fill="none" stroke="#da0000" stroke-width="0.9"/>` },
  MA: { name: 'Morocco', art: `<rect width="30" height="20" fill="#c1272d"/><polygon points="15,5.2 16.4,9.6 20.6,9.6 17.2,12.2 18.5,16.4 15,13.8 11.5,16.4 12.8,12.2 9.4,9.6 13.6,9.6" fill="none" stroke="#006233" stroke-width="0.9"/>` },
  BA: { name: 'Bosnia and Herzegovina', short: 'Bosnia', art: `<rect width="30" height="20" fill="#002395"/><path d="M8 0h14v20z" fill="#fecb00"/><g fill="#fff">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${6 + i * 2}" cy="${1 + i * 2.85}" r="0.8"/>`).join('')}</g>` },
  RS: { name: 'Serbia', art: `${bands('#c6363c', '#0c4076', '#fff')}<path d="M8 5h4.4v5.4c0 2-2.2 3-2.2 3S8 12.4 8 10.4z" fill="#c6363c" stroke="#edb92e" stroke-width="0.6"/><path d="M10.2 6.2v6M8.6 8.6h3.2" stroke="#fff" stroke-width="0.8"/>`, fx: 0.25 },
  ZA: {
    name: 'South Africa',
    art: '<rect width="30" height="10" fill="#e03c31"/><rect y="10" width="30" height="10" fill="#001489"/><path d="M0 0l13 10L0 20" fill="none" stroke="#fff" stroke-width="6"/><path d="M13 10h17" stroke="#fff" stroke-width="6"/><path d="M0 0l13 10L0 20" fill="none" stroke="#007749" stroke-width="3.6"/><path d="M13 10h17" stroke="#007749" stroke-width="3.6"/><path d="M0 3.5L8.4 10 0 16.5z" fill="#ffb81c"/><path d="M0 5L6.4 10 0 15z" fill="#000"/>',
    fx: 0.2,
  },
}

export const countryName = (code: string) => COUNTRIES[code]?.short ?? COUNTRIES[code]?.name ?? code
