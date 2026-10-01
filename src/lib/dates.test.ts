import { describe, expect, it } from 'vitest'
import { formatDay, todayIso } from './dates.ts'

describe('dates', () => {
  it('uses the local calendar day', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('formats with fixed three-letter months', () => {
    expect(formatDay('2026-09-13')).toBe('13 Sep 2026')
    expect(formatDay('2026-09-03', false)).toBe('3 Sep')
  })
})
