// Dates are stored as local calendar days ("2026-10-01"): a spot belongs to the day you saw the dog, wherever you are.
const pad = (n: number) => String(n).padStart(2, '0')

export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Fixed three-letter months (the en-AU locale gives "Sept").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-09-13" -> "13 Sep 2026" (or "13 Sep" without the year). */
export function formatDay(iso: string, withYear = true): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`
}
