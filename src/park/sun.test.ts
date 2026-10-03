import { describe, expect, it } from 'vitest'
import { phaseAt, sunAt } from './sun.ts'

// Sydney times (AEST is +10:00, AEDT +11:00), checked against Geoscience Australia's sunrise and sunset tables.
const at = (iso: string) => new Date(iso)

describe('the sun over Rushcutters Bay', () => {
  it('rises and sets at the published times, give or take a couple of minutes', () => {
    // Winter solstice: sunrise 7:00 am, sunset 4:54 pm.
    expect(sunAt(at('2026-06-21T06:58:00+10:00')).elevation).toBeLessThan(-0.833)
    expect(sunAt(at('2026-06-21T07:02:00+10:00')).elevation).toBeGreaterThan(-0.833)
    expect(sunAt(at('2026-06-21T16:52:00+10:00')).elevation).toBeGreaterThan(-0.833)
    expect(sunAt(at('2026-06-21T16:56:00+10:00')).elevation).toBeLessThan(-0.833)
    // Summer solstice: sunrise 5:41 am, sunset 8:05 pm (daylight saving).
    expect(sunAt(at('2026-12-21T05:39:00+11:00')).elevation).toBeLessThan(-0.833)
    expect(sunAt(at('2026-12-21T05:43:00+11:00')).elevation).toBeGreaterThan(-0.833)
    expect(sunAt(at('2026-12-21T20:03:00+11:00')).elevation).toBeGreaterThan(-0.833)
    expect(sunAt(at('2026-12-21T20:07:00+11:00')).elevation).toBeLessThan(-0.833)
  })

  it('is high at midday in summer and low in winter', () => {
    expect(sunAt(at('2026-12-21T13:00:00+11:00')).elevation).toBeGreaterThan(75)
    expect(sunAt(at('2026-06-21T12:00:00+10:00')).elevation).toBeLessThan(35)
  })

  it('names the time of day, morning and evening', () => {
    const day = '2026-10-02T'
    expect(phaseAt(at(`${day}03:00:00+10:00`))).toBe('night')
    expect(phaseAt(at(`${day}05:15:00+10:00`))).toBe('dawn')
    expect(phaseAt(at(`${day}05:45:00+10:00`))).toBe('sunrise')
    expect(phaseAt(at(`${day}12:00:00+10:00`))).toBe('day')
    expect(phaseAt(at(`${day}17:40:00+10:00`))).toBe('golden')
    expect(phaseAt(at(`${day}18:10:00+10:00`))).toBe('dusk')
    expect(phaseAt(at(`${day}22:00:00+10:00`))).toBe('night')
  })
})
