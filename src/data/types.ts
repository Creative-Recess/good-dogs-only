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
  width: number
  height: number
}

export type PhotoCredit = {
  author: string
  licence: string
  licenceUrl: string | null
  /** Wikimedia Commons file page. */
  sourceUrl: string
  /** How we changed it, for licence compliance, e.g. "resized and cropped". */
  changes: string
}

export type Breed = {
  /** Stable id used for sightings - never change once shipped. */
  id: string
  /** Display number: "001"-"227" for official breeds in group order, "B01"... for the bonus section. */
  dexNo: string
  name: string
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
  image?: BreedImage
  credit?: PhotoCredit
}
