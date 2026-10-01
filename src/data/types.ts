// Shape of the generated breed data the app ships with (src/data/breeds.json, built by scripts/build-data.ts).

export type GroupId =
  | 'toys'
  | 'terriers'
  | 'gundogs'
  | 'hounds'
  | 'working-dogs'
  | 'utility'
  | 'non-sporting'
  | 'bonus'

/** The fixed list of 16 temperament traits, each with its own icon. */
export const TRAITS = [
  'Brave', 'Friendly', 'Clever', 'Energetic', 'Alert', 'Affectionate', 'Hard-working', 'Calm',
  'Loyal', 'Dignified', 'Reserved', 'Trainable', 'Protective', 'Independent', 'Gentle', 'Playful',
] as const
export type Trait = (typeof TRAITS)[number]

export type Rgb = [number, number, number]

/** Side-on cartoon proportions for the Park's drawn dog (data/dog-shapes.json). */
export type DogShape = {
  /** Body length; also sets overall size (Labrador 28). */
  len: number
  h: number
  leg: number
  head: number
  /** Muzzle length: 1 flat-faced to 10 long. */
  snout: number
  ears: 'floppy' | 'long' | 'pointy' | 'bat' | 'rose' | 'tipped'
  tail: 'straight' | 'plume' | 'curl' | 'stub' | 'up'
  /** 0 smooth to 1 very fluffy. */
  fluff?: number
}

export type Group = {
  id: GroupId
  name: string
  description: string
}

export type BreedImage = {
  /** Square crop for the dex grid, relative to the site root. */
  grid: string
  /** Larger uncropped image for the breed page. */
  detail: string
  /** The dog's shape in the grid photo (white on transparent), for the silhouette of a breed not yet spotted. */
  mask: string
  width: number
  height: number
  /** Where the dog is in the detail photo (0-1), for cropping it into the 770:540 frame. */
  focus: [number, number]
  /** Body and patch colours from the photo, for the Park's drawn dog. */
  colours: { body: Rgb; patch: Rgb }
}

export type PhotoCredit = {
  author: string
  licence: string
  licenceUrl: string | null
  /** Wikimedia Commons file page. */
  sourceUrl: string
  /** How we changed it, for licence compliance, e.g. "resized and cropped". */
  changes: string
  /** Not openly licensed: used at Justin's discretion for this private app (Dogs Australia photos). */
  restricted?: boolean
}

export type Breed = {
  /** Stable id used for sightings - never change once shipped. */
  id: string
  /** Display number: "001"-"227" for official breeds in group order, "B01"... for the bonus section. */
  dexNo: string
  name: string
  /** Shorter official name for grid tiles, when the full name is too long. */
  shortName?: string
  groupId: GroupId
  tier: 'ankc' | 'unofficial'
  /** Exact Dogs Australia name, when the display name differs. */
  officialName?: string
  /** Varieties covered by one standard, e.g. the six Dachshund varieties. */
  forms: string[]
  aliases: string[]
  /** Official Dogs Australia breed standard page. */
  ankcUrl?: string
  /** Bonus entries: a designer cross or an unrecognised breed. */
  kind?: 'cross' | 'breed'
  parents?: string[]
  about?: string
  /** 3 traits from TRAITS, and one line in our own words. */
  traits: Trait[]
  text: string
  shape: DogShape
  image?: BreedImage
  credit?: PhotoCredit
}
