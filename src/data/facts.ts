// Breed facts as the breed window shows them: weight classes and short ranges.
import type { IconName } from '../ui/icons/types.ts'

/** Weight classes, boxing style, by the middle of the breed's weight range. Each has its own icon. */
export const WEIGHT_CLASSES: { name: string; upTo: number; icon: IconName }[] = [
  { name: 'Featherweight', upTo: 5, icon: 'wFeather' },
  { name: 'Lightweight', upTo: 10, icon: 'wLight' },
  { name: 'Middleweight', upTo: 20, icon: 'wMiddle' },
  { name: 'Cruiserweight', upTo: 30, icon: 'wCruiser' },
  { name: 'Heavyweight', upTo: 45, icon: 'wHeavy' },
  { name: 'Super heavyweight', upTo: Infinity, icon: 'wSuper' },
]
export const weightClass = ([lo, hi]: [number, number]) => WEIGHT_CLASSES.find((c) => (lo + hi) / 2 <= c.upTo)!

/** "3–6", or just "12" when both ends match. */
export const range = ([lo, hi]: [number, number]) => (lo === hi ? `${lo}` : `${lo}–${hi}`)
