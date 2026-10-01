import { describe, expect, it } from 'vitest'
import ankc from '../data/ankc-breeds.json' with { type: 'json' }
import { parseGroupPage, slugify } from './lib/ankc.ts'

// Minimal copy of the Dogs Australia group page markup (structure only).
const FIXTURE = `
<h3 class="col-xs-9 page-title">
     Group 1 (Toys)
</h3>
<div id="LstBreeds"><div class="content"><ul>
<li>
  <div class="col-xs-1"><a href="/members/breeds/breed-standards/Affenpinscher"><img src="x.jpg" alt="Dog Images" /></a></div>
  <div class="col-xs-7"><a href="/members/breeds/breed-standards/Affenpinscher"><h6>Affenpinscher</h6></a></div>
  <div class="col-xs-4">Last updated: 09 Oct 2012</div>
</li>
<li>
  <div class="col-xs-7"><a href="/members/breeds/breed-standards/English-Toy-Terrier-(Black-&amp;-Tan)"><h6>English Toy Terrier (Black &amp; Tan)</h6></a></div>
</li>
</ul></div></div>`

describe('parseGroupPage', () => {
  it('reads the group and each breed name, link and update date', () => {
    expect(parseGroupPage(FIXTURE)).toEqual({
      groupId: 1,
      groupName: 'Toys',
      breeds: [
        {
          name: 'Affenpinscher',
          url: 'https://dogsaustralia.org.au/members/breeds/breed-standards/Affenpinscher',
          lastUpdated: '09 Oct 2012',
        },
        {
          name: 'English Toy Terrier (Black & Tan)',
          url: 'https://dogsaustralia.org.au/members/breeds/breed-standards/English-Toy-Terrier-(Black-&-Tan)',
          lastUpdated: null,
        },
      ],
    })
  })

  it('fails loudly if the page layout changes', () => {
    expect(() => parseGroupPage('<h3 class="page-title">Breeds</h3>')).toThrow(/Unexpected group page title/)
  })
})

describe('slugify', () => {
  it.each([
    ['Chihuahua (Long Coat)', 'chihuahua-long-coat'],
    ['English Toy Terrier (Black & Tan)', 'english-toy-terrier-black-and-tan'],
    ["Cirneco Dell'Etna", 'cirneco-dell-etna'],
    ['Löwchen', 'lowchen'],
  ])('%s -> %s', (name, slug) => {
    expect(slugify(name)).toBe(slug)
  })
})

// Pins the official list as fetched. If Dogs Australia adds or moves a breed, re-running
// scripts/fetch-ankc.ts makes these fail on purpose, so the change gets reviewed.
describe('data/ankc-breeds.json', () => {
  it('has the 7 Dogs Australia groups in order', () => {
    expect(ankc.groups.map((g) => g.name)).toEqual([
      'Toys',
      'Terriers',
      'Gundogs',
      'Hounds',
      'Working Dogs',
      'Utility',
      'Non Sporting',
    ])
  })

  it('has 227 breed standards with the expected count per group', () => {
    expect(ankc.breeds).toHaveLength(227)
    const counts = ankc.groups.map((g) => ankc.breeds.filter((b) => b.groupId === g.id).length)
    expect(counts).toEqual([28, 31, 33, 33, 37, 40, 25])
  })

  it('has no duplicate names or links', () => {
    expect(new Set(ankc.breeds.map((b) => b.ankcName)).size).toBe(ankc.breeds.length)
    expect(new Set(ankc.breeds.map((b) => b.ankcUrl)).size).toBe(ankc.breeds.length)
  })

  it('links every breed to its Dogs Australia standard page', () => {
    for (const b of ankc.breeds) {
      expect(b.ankcUrl).toMatch(/^https:\/\/dogsaustralia\.org\.au\/members\/breeds\/breed-standards\//)
    }
  })
})
