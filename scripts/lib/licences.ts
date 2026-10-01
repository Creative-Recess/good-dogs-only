// Which Wikimedia Commons licences we accept for breed photos.
// CC BY and CC BY-SA need attribution (author, licence, source, changes); CC0 and public domain don't, but we credit anyway.
// Everything else (GPL, GFDL-only, Free Art Licence, "copyrighted free use", fair use) is skipped to keep compliance simple.

const ALLOWED = [/^CC0\b/i, /^Public domain\b/i, /^PD\b/i, /^CC BY(-SA)? \d(\.\d)?\b/i]

export function isAllowedLicence(shortName: string | undefined): boolean {
  if (!shortName) return false
  return ALLOWED.some((re) => re.test(shortName.trim()))
}
