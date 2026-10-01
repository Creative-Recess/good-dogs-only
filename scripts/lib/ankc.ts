import { parse } from 'node-html-parser'

export const ANKC_ORIGIN = 'https://dogsaustralia.org.au'

export type AnkcGroupPage = {
  groupId: number
  groupName: string
  breeds: { name: string; url: string; lastUpdated: string | null }[]
}

/** Group page URL, asking for 100 items per page so each group fits on one page. */
export function groupPageUrl(groupId: number, page = 1): string {
  return `${ANKC_ORIGIN}/members/Breed/Index/${groupId}?Search.ItemsPerPage=100&Search.GroupID=${groupId}&page=${page}`
}

/** Parses one Dogs Australia breed-standards group page, e.g. "Group 1 (Toys)". */
export function parseGroupPage(html: string): AnkcGroupPage {
  const root = parse(html)
  const title = root.querySelector('h3.page-title')?.text.trim() ?? ''
  const match = /^Group (\d+) \((.+)\)$/.exec(title)
  if (!match) throw new Error(`Unexpected group page title: "${title}"`)

  const breeds = root.querySelectorAll('#LstBreeds li').map((li) => {
    const link = li.querySelector('h6')?.closest('a')
    const name = li.querySelector('h6')?.text.trim()
    const href = link?.getAttribute('href')
    if (!name || !href) throw new Error(`Breed entry missing name or link: ${li.toString().slice(0, 200)}`)
    const updated = /Last updated:\s*(\d{2} \w{3} \d{4})/.exec(li.text)
    return {
      name: name.replace(/\s+/g, ' '),
      url: new URL(href, ANKC_ORIGIN).href,
      lastUpdated: updated ? updated[1] : null,
    }
  })

  return { groupId: Number(match[1]), groupName: match[2], breeds }
}

/** Stable, URL-safe id from a breed name: "Chihuahua (Long Coat)" -> "chihuahua-long-coat". */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '') // drop accents left over by NFKD
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
