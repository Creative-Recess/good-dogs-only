// Where the sun is over Rushcutters Bay at a moment in time, and what that makes the time of day.
// The park is in one place, so this needs no location: the phone's clock gives the moment, and the sun's
// height above the horizon (a standard low-precision solar position, good to a fraction of a degree) gives the light.

const RAD = Math.PI / 180
/** Rushcutters Bay Park, Sydney. */
const LAT = -33.875
const LON = 151.229

/** The sun's height above the horizon in degrees, and whether it's a morning (rising) sun. */
export function sunAt(when: Date): { elevation: number; rising: boolean } {
  // Days since noon UTC on 1 Jan 2000.
  const d = when.getTime() / 86_400_000 - 10_957.5
  const g = (357.529 + 0.98560028 * d) * RAD
  const q = 280.459 + 0.98564736 * d
  const lng = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD
  const tilt = (23.439 - 0.00000036 * d) * RAD
  const ra = Math.atan2(Math.cos(tilt) * Math.sin(lng), Math.cos(lng))
  const dec = Math.asin(Math.sin(tilt) * Math.sin(lng))
  const siderealHours = (((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24
  let hourAngle = (siderealHours * 15 + LON) * RAD - ra
  hourAngle = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle))
  const el = Math.asin(Math.sin(LAT * RAD) * Math.sin(dec) + Math.cos(LAT * RAD) * Math.cos(dec) * Math.cos(hourAngle))
  return { elevation: el / RAD, rising: hourAngle < 0 }
}

export type Phase = 'night' | 'dawn' | 'sunrise' | 'day' | 'golden' | 'dusk'

export const PHASE_LABEL: Record<Phase, string> = {
  night: 'Night',
  dawn: 'Dawn',
  sunrise: 'Sunrise',
  day: 'Daytime',
  golden: 'Golden hour',
  dusk: 'Dusk',
}

/**
 * Twilight is the sun up to 6 degrees below the horizon (it's light enough to see without lamps at the end of it);
 * the golden hours are the sun from the horizon up to 6 degrees, when its light is low and warm.
 * -0.833 is where the top of the sun touches the horizon, the usual sunrise and sunset.
 */
export function phaseAt(when: Date): Phase {
  const { elevation: e, rising } = sunAt(when)
  if (e < -6) return 'night'
  if (e < -0.833) return rising ? 'dawn' : 'dusk'
  if (e < 6) return rising ? 'sunrise' : 'golden'
  return 'day'
}
