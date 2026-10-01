# Good Dogs Only

A Pokedex-style phone app for ticking off the dog breeds you spot at the park, dressed as an old desktop program.
The list is every Dogs Australia (ANKC) breed standard (227) plus a Bonus group of 12 common unofficial breeds and crosses, 239 in all.

It's a home-screen web app: open it in Safari on an iPhone, tap Share, then "Add to Home Screen".
Sightings are stored on the phone only (IndexedDB), with a backup file you can save and restore from Help.

The full plan lives outside this repo at `personal/task-plans/dog-breed-dex.md` in Justin's AI workspace.

## What's in the app

- **Dogdex**: every breed in dex order, with Find (names and nicknames, e.g. "staffy", "sausage dog"), a Group filter and Show: All / Spotted / Unseen.
  Breeds you haven't spotted show as a "Who's that dog?" silhouette, tinted for each theme.
- **Breed window**: photo, nicknames, a link to the official Dogs Australia standard, 3 temperament traits and a line of text, then Spotted (with the date and a note) or Unsee.
- **Park**: an animated Rushcutters Bay with one dog per spotted breed (at most 20 out at once; they take turns). The yellow title-bar button opens it as a screensaver.
- **Progress**: the overall count, a row per group, and the latest spots.
- **Help** (the ? in the title bar): About, Theme, Add to Home Screen and Backup.
- **Themes**: Aqua Glass (the default), Aqua and Windows 98.

## Stack

- Vite + React + TypeScript, with plain CSS: shared layout in `src/styles/base.css`, one file per theme in `src/styles/themes/`.
  Windows 98 builds on 98.css (vendored in `src/vendor/98css`).
- Themes: the choice is `<html data-theme>`, saved in localStorage (`src/theme/`), and a tiny script in `index.html` sets it before the first paint so the wrong theme never flashes.
  Each theme's CSS sits in a cascade layer inside an `@scope` for that theme (needs Safari 17.4 or later); a Vite plugin (`scripts/lib/scope-css.ts`) fences 98.css in to Windows 98 the same way, so no theme's styles reach another.
  Components that differ by theme (title bar, toolbar or tabs, fold-away sections, sheets, the launch screen, icons in `src/ui/icons/`) read `useTheme()`.
- Dexie.js over IndexedDB for sightings (`src/lib/sightings.ts`); Unsee keeps a deleted marker so an older backup can't bring a dog back.
  Backups (`src/lib/backup.ts`) merge by sighting, newest change wins.
- The Park is a framework-free canvas engine in `src/park/` (scene, dog drawing, behaviour).
- Vitest for unit and data tests, Playwright (WebKit, iPhone 17 profile) for E2E tests.
- Static hosting, provider still to choose (`public/_headers` sets cache rules for Cloudflare or Netlify).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local dev server (`pnpm dev --host` to open it on a phone on the same Wi-Fi) |
| `pnpm review` | Opens the breed review page (below) |
| `pnpm build` | Type-check and build to `dist/` |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript project check |
| `pnpm test` | Unit and data tests (Vitest) |
| `pnpm test:e2e` | E2E tests in WebKit with iPhone emulation, once per theme, including screenshot comparisons (builds and serves the app first) |
| `pnpm test:e2e --update-snapshots` | Accept new screenshots after an intended look change (review them first) |

First-time setup for E2E: `pnpm exec playwright install webkit`.
The screenshot baselines are recorded on macOS (`*-darwin.png`); another OS would need its own.

## Breed review page

`pnpm review` opens `review/breeds.html`: every breed's grid photo and breed-page crop, its silhouette in each theme, its Park dog, its traits and text, and where the photo came from.
It's drawn live from the shipped data and the app's own code, so it always shows what the app shows.
It also flags breeds worth a look (several dogs in one photo, a silhouette that includes background, a dog cut off by the crop, a small photo); tick "Only ones to check" to see just those.
It's a dev page only: it isn't part of the app build.

## Data

Hand-edited files in `data/`, merged by `scripts/lib/dataset.ts`:
- `ankc-breeds.json` (scraped list), `breed-details.json` (display names, varieties, nicknames), `groups.json`, `unofficial-breeds.json`, `short-names.json` (grid labels)
- `traits.json`: 3 temperament traits from a fixed list of 16, plus one line of text in our own words, per breed
- `dog-shapes.json`: each breed's proportions for its Park dog
- `photo-picks.json`: which photo each breed uses (a Wikimedia Commons file, or Dogs Australia's own breed photo) and where to centre the crops
- `wiki-map.json`, `wiki-overrides.json`, `photo-sources.json`: where to look for Commons photos

`node scripts/build-data.ts` turns these into what the app ships: `src/data/breeds.json` and `public/breeds/` (a square grid photo, a breed-page photo and a silhouette mask per breed, plus the Park colours taken from each photo).
Run it after changing any data file. It needs macOS: the silhouettes are cut out by Apple's Vision framework (`scripts/vision/mask.swift`, run through `swift`), once per photo.
Downloads and other working files go in `.cache/` (not committed).

### Changing a breed's photo

1. Edit its entry in `data/photo-picks.json`: a Commons `file` name, or an `external` photo, and a `focus` (the dog's centre, as fractions).
2. Run `node scripts/build-data.ts`, then `pnpm test` (the data tests check every breed has its files).
3. Check it with `pnpm review`.

### The photo pipeline (how the picks were made)

1. `node scripts/fetch-ankc.ts`: the Dogs Australia breed list into `data/ankc-breeds.json`.
2. `node scripts/map-wikipedia.ts`: each breed's Wikipedia and Wikidata entries into `data/wiki-map.json`.
3. `node scripts/fetch-photo-candidates.ts [id ...]`: ranked Commons candidates into `.cache/`.
4. `node scripts/make-review-sheets.ts <round> <perSheet> [id ...]`: numbered contact sheets to choose from.
5. `node scripts/apply-verdicts.ts <round> <verdicts.json>`: the chosen tiles into `data/photo-picks.json`.
6. `node scripts/build-data.ts`, then `node scripts/make-contact-sheet.ts` for a review page of picks and alternatives.

`node scripts/fetch-ankc-temperament.ts` reads the standards' temperament lines into `.cache/` for analysis only; `node scripts/make-icons.ts` redraws the Home Screen icons from the paw logo.

## Content and licensing

- Breed names and group membership come from the Dogs Australia breed group pages; these are facts.
  The breed text is written in our own words, never copied from a breed standard.
- Most breed photos are Dogs Australia's own (Justin's call for this private app), and the rest come from Wikimedia Commons.
  Credits are kept per photo in `src/data/breeds.json` but not shown in the app.
  Because of the Dogs Australia photos, this repo stays private and the site should sit behind a password.
- The earlier HTML mockups and prototypes were removed; they're kept in git history under the tag `mockups-final`.
