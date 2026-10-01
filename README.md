# Good Dogs Only

A Pokedex-style phone app for ticking off dog breeds spotted at the park, dressed as a Windows 98 program.
The list is every Dogs Australia (ANKC) breed standard (227) plus a Bonus group of 12 common unofficial breeds and crosses, 239 in all.

It's a home-screen web app: open it in Safari on an iPhone, tap Share, then "Add to Home Screen".
Sightings are stored on the phone only (IndexedDB), with a backup file you can save and restore.

The full plan lives outside this repo at `personal/task-plans/dog-breed-dex.md` in Justin's AI workspace.

## Stack

- Vite + React + TypeScript, styled with 98.css (vendored in `src/vendor/98css`) and plain CSS in `src/styles/app.css`
- Dexie.js over IndexedDB for sightings (`src/lib/sightings.ts`); backups in `src/lib/backup.ts`
- The Park is a framework-free canvas engine in `src/park/`
- Vitest for unit and data tests, Playwright (WebKit, iPhone 17 profile) for E2E tests
- Static hosting, provider still to choose (`public/_headers` sets cache rules for Cloudflare or Netlify)

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local dev server |
| `pnpm build` | Type-check and build to `dist/` |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript project check |
| `pnpm test` | Unit and data tests (Vitest) |
| `pnpm test:e2e` | E2E tests in WebKit with iPhone emulation (builds and serves the app first) |
| `node scripts/build-data.ts` | Rebuilds `src/data/breeds.json` and `public/breeds/` from the data files (run after changing a photo pick) |
| `node scripts/make-icons.ts` | Redraws the app icons from the paw logo |
| `node design/make-dog-review.ts` | With `pnpm dev --port 5174` running, builds a review page of every breed's Park dog |
| `node design/make-photo-audit.ts` | Builds a review page of every breed photo |

First-time setup for E2E: `pnpm exec playwright install webkit`.

## Data

Hand-edited files in `data/`, merged by `scripts/lib/dataset.ts`:
- `ankc-breeds.json` (scraped list), `breed-details.json` (display names, varieties, nicknames), `groups.json`, `unofficial-breeds.json`, `short-names.json` (grid labels)
- `traits.json`: 3 temperament traits from a fixed list of 16, plus one line of text in our own words, per breed
- `dog-shapes.json`: each breed's proportions for its Park dog
- `photo-picks.json`: which photo each breed uses

## Content and licensing

- Breed names and group membership come from the Dogs Australia breed group pages; these are facts.
  The breed text is written in our own words, never copied from a breed standard.
- Most breed photos are Dogs Australia's own (Justin's call for this private app), and the rest come from Wikimedia Commons.
  Credits are kept per photo in `src/data/breeds.json` but not shown in the app.
  Because of the Dogs Australia photos, this repo stays private and the site should sit behind a password.
