// MOCK (branch mock/breed-facts): breed facts for three example breeds, to try the combined Profile section.
import type { IconName } from '../ui/icons/types.ts'

export type Country = 'GB' | 'DE' | 'SCT' | 'FR' | 'JP' | 'IE' | 'CH' | 'AU' | 'US'
export type BreedFacts = { kg: [number, number]; life: string; origin: Country; job: string }

export const COUNTRY: Record<Country, { name: string; short: string; icon: IconName }> = {
  GB: { name: 'United Kingdom', short: 'UK', icon: 'flagGB' },
  DE: { name: 'Germany', short: 'Germany', icon: 'flagDE' },
  SCT: { name: 'Scotland', short: 'Scotland', icon: 'flagSCT' },
  FR: { name: 'France', short: 'France', icon: 'flagFR' },
  JP: { name: 'Japan', short: 'Japan', icon: 'flagJP' },
  IE: { name: 'Ireland', short: 'Ireland', icon: 'flagIE' },
  CH: { name: 'Switzerland', short: 'Switzerland', icon: 'flagCH' },
  AU: { name: 'Australia', short: 'Australia', icon: 'flagAU' },
  US: { name: 'United States', short: 'USA', icon: 'flagUS' },
}

/** Weight classes, boxing style, by the middle of the breed's weight range. */
export const WEIGHT_CLASSES: { name: string; upTo: number; icon: IconName; example: string }[] = [
  { name: 'Featherweight', upTo: 5, icon: 'wFeather', example: 'Chihuahua' },
  { name: 'Lightweight', upTo: 10, icon: 'wLight', example: 'Pug' },
  { name: 'Middleweight', upTo: 20, icon: 'wMiddle', example: 'Border Collie' },
  { name: 'Cruiserweight', upTo: 30, icon: 'wCruiser', example: 'Australian Cattle Dog' },
  { name: 'Heavyweight', upTo: 45, icon: 'wHeavy', example: 'Labrador Retriever' },
  { name: 'Super heavyweight', upTo: Infinity, icon: 'wSuper', example: 'Great Dane' },
]
export const weightClass = ([lo, hi]: [number, number]) => WEIGHT_CLASSES.find((c) => (lo + hi) / 2 <= c.upTo)!

export const FACTS: Record<string, BreedFacts> = {
  affenpinscher: { kg: [3, 6], life: '12–15 yrs', origin: 'DE', job: 'Bred to catch rats and mice in German kitchens and stables. "Affe" is German for monkey.' },
  'labrador-retriever': { kg: [25, 36], life: '10–12 yrs', origin: 'GB', job: 'Bred to fetch ducks and game birds from the water for hunters.' },
  'japanese-chin': { kg: [2, 4], life: '10–12 yrs', origin: 'JP', job: 'Bred as a lap dog for the Japanese imperial court and nobility.' },
  dachshund: { kg: [7, 15], life: '12–16 yrs', origin: 'DE', job: 'Bred to follow badgers down their burrows. "Dachs" is German for badger.' },
  'border-collie': { kg: [14, 20], life: '12–15 yrs', origin: 'GB', job: 'Bred to herd sheep in the hills along the Scottish–English border.' },
}
