// Fetches the official Dogs Australia (ANKC) breed list, one page per group, into data/ankc-breeds.json.
// Only breed names, groups and links are kept - these are facts. Standards text and photos are not copied.
// Usage: node scripts/fetch-ankc.ts
import { writeFile } from 'node:fs/promises'
import { groupPageUrl, parseGroupPage } from './lib/ankc.ts'
import { USER_AGENT, politeFetchText } from './lib/http.ts'

const GROUP_IDS = [1, 2, 3, 4, 5, 6, 7]
const OUT = new URL('../data/ankc-breeds.json', import.meta.url)

const groups: { id: number; name: string }[] = []
// Names are kept exactly as Dogs Australia publishes them; clean ids and display names come from data/breed-details.json.
const breeds: { ankcName: string; groupId: number; ankcUrl: string; standardLastUpdated: string | null }[] = []

for (const groupId of GROUP_IDS) {
  // Each group is requested at 100 per page; keep paging in case a group ever grows past that.
  for (let page = 1; ; page++) {
    const parsed = parseGroupPage(await politeFetchText(groupPageUrl(groupId, page)))
    if (parsed.groupId !== groupId) throw new Error(`Asked for group ${groupId}, got ${parsed.groupId}`)
    if (page === 1) groups.push({ id: groupId, name: parsed.groupName })
    const fresh = parsed.breeds.filter((b) => !breeds.some((x) => x.ankcUrl === b.url))
    for (const b of fresh) {
      breeds.push({ ankcName: b.name, groupId, ankcUrl: b.url, standardLastUpdated: b.lastUpdated })
    }
    if (parsed.breeds.length < 100 || fresh.length === 0) break
  }
  console.log(`Group ${groupId} (${groups.at(-1)?.name}): ${breeds.filter((b) => b.groupId === groupId).length} breeds`)
}

const out = {
  source: 'Dogs Australia (ANKC) breed standards group pages',
  sourceUrl: 'https://dogsaustralia.org.au/members/Breed/Index/1',
  fetchedAt: new Date().toISOString().slice(0, 10),
  fetchedWith: USER_AGENT,
  groups,
  breeds,
}
await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
console.log(`Wrote ${breeds.length} breeds in ${groups.length} groups to data/ankc-breeds.json`)
