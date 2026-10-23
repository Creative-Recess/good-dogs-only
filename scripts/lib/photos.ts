// Shared types for the photo pipeline.

/** One candidate photo for a dex entry, as stored in .cache/photo-candidates.json. */
export type Candidate = {
  file: string
  width: number
  height: number
  mime: string
  thumb330: string
  descriptionUrl: string
  licence: string
  licenceUrl: string | null
  artistHtml: string
  credit: string
  categories: string[]
  via: string[]
  score: number
  flags: string[]
}

/** The chosen photo for one dex entry (data/photo-picks.json). focus: dog centre as [x, y] fractions, for the square crop. */
export type PhotoPick = {
  file: string | null
  /** A photo from outside Commons chosen by hand (e.g. a Dogs Australia breed photo). */
  /**
   * A photo from outside Commons chosen by hand (e.g. a Dogs Australia breed photo). `saved` is a copy kept in
   * data/photos/ for sites that don't allow downloads; otherwise the build downloads `url`.
   */
  external?: { url: string; credit: string; sourceUrl: string; saved?: string }
  focus?: [number, number]
  by: 'claude-review' | 'claude' | 'justin'
  confidence?: 'high' | 'medium' | 'low'
  note?: string
  /** The file this pick replaced, kept for reference. */
  previous?: string | null
}

/** A reviewer's choice on one sheet: tile number (or null for none), crop focus, confidence, short note. */
export type Verdict = {
  tile: number | null
  focus: [number, number] | null
  confidence: 'high' | 'medium' | 'low'
  note: string
}

/** Plain-text author from Commons' HTML Artist field, e.g. '<a href="...">Entheta</a>' -> 'Entheta'. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}
