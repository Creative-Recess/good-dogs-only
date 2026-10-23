# Good Dogs Only

A Pokedex-style phone app for ticking off the dog breeds you spot at the park, dressed as an old desktop program.
The list is every Dogs Australia (ANKC) breed standard (227) plus a Bonus group of 12 common unofficial breeds and crosses, 239 in all.

It's a home-screen web app: open it in Safari on an iPhone, tap ••• next to the address bar, then Share, View More and "Add to Home Screen".
Sightings are stored on the phone only (IndexedDB), with a backup file you can save and restore from Help.

Ideas for what's next are in [BACKLOG.md](BACKLOG.md).
The original v1 plan, with the decisions made along the way, is archived outside this repo at `personal/task-plans/archive/dog-breed-dex.md` in Justin's AI workspace.

## What's in the app

- **Dogdex**: every breed in dex order, with Find (names and nicknames, e.g. "staffy", "sausage dog"), a Group filter and Show: All / Spotted / Unseen.
  Breeds you haven't spotted show as a "Who's that dog?" silhouette, tinted for each theme.
- **Breed window**: photo, then a Profile: 3 temperament traits, a line about the breed and one on what it was bred for, then dex rows (nicknames, weight with a weight-class icon, lifespan, and the country it's from with its flag) and a link to the official Dogs Australia standard.
  Then Spotted (with the date and a note) or Unsee.
- **Park**: an animated Rushcutters Bay with one dog per spotted breed (at most 20 out at once; they take turns).
  It follows the real sun over the park: Dawn, Sunrise, Daytime, Golden hour, Dusk and Night, each with its own sky and light, and the city, Opera House, Bridge and path lamps lit after dark.
  The yellow title-bar button opens it as a screensaver.
- **Progress**: the overall count, each group's percentage spotted, and the latest spots.
- **Milestones**: every tenth breed spotted sets off a shower of dog bones (skipped with Reduce Motion on).
- **Help** (the ? in the title bar): About, Theme, Add to Home Screen and Backup.
- **Add to Home Screen prompt**: opened in a phone's browser, the app shows how to add it every visit, straight away over the launch screen and blocking the app until closed (`src/app/HomeScreenPrompt.tsx`).
  iPhone gets Safari's steps, or Copy Link to open it in Safari from any other browser (Brave, DuckDuckGo and Opera included, which copy Safari's user agent) or an app's own browser.
  Android gets Chrome's Install button when Chrome offers one (steps otherwise), or Open App when Chrome says it's already installed (`related_applications` in the manifest); an iPhone can't tell.
  Add `?homescreen=safari`, `ios-other`, `in-app`, `android` or `android-installed` to any link to see a version.
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
  Its time of day comes from the sun's height over Rushcutters Bay (`src/park/sun.ts`), worked out from the phone's clock with no location needed: twilight is the sun up to 6° below the horizon, and Sunrise and Golden hour are the sun up to 6° above it.
  Each time of day's look is one entry in `LOOKS` in `src/park/scene.ts`; the scene and its lights are redrawn only when the time of day changes.
- Vitest for unit and data tests, Playwright (WebKit, iPhone 17 profile) for E2E tests.
- Hosted on Cloudflare Workers as static files; `public/_headers` sets the caching.

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
| `pnpm run deploy` | Build and deploy from your computer (only if the automatic deploy is broken; see Hosting) |

First-time setup for E2E: `pnpm exec playwright install webkit`.
The screenshot baselines are recorded on macOS (`*-darwin.png`); another OS would need its own.

## Hosting

Live at https://good-dogs-only.byrecess.com, on Cloudflare Workers' free plan as static files (`wrangler.jsonc`), shared by link with friends and family.
There's no password; `public/robots.txt`, a `noindex` header and a `noindex` meta tag ask search engines not to list it.

- Merging into `main` deploys it automatically (Cloudflare Workers Builds), and other branches get a preview link at `<branch>-good-dogs-only.byrecess.workers.dev`, also posted on their PR.
  The phones pick up a new version the next time the app is opened.
- `pnpm run deploy` builds and deploys from your computer, only needed if the automatic deploy is broken (first time on a new Mac: `pnpm exec wrangler login`).
- Spots are saved per web address, so keep this address: moving the app means a backup and restore on each phone.
- It moved here from https://dogdex.gooddogsonly.workers.dev on 15 Oct 2026, and that address no longer works (the Worker is now called `good-dogs-only`).

## Breed review page

`pnpm review` opens `review/breeds.html`: every breed's grid photo and breed-page crop, its silhouette in each theme, its Park dog, its traits and text, its breed facts (with the weight class spelled out and a link to the source), and where the photo came from.
It's drawn live from the shipped data and the app's own code, so it always shows what the app shows.
It also flags breeds worth a look (several dogs in one photo, a silhouette that includes background, a dog cut off by the crop, a small photo, missing breed facts); tick "Only ones to check" to see just those.
Breeds already looked at are listed in `review/reviewed.json` and show as "Checked" instead.
It's a dev page only: it isn't part of the app build.

## Data

Hand-edited files in `data/`, merged by `scripts/lib/dataset.ts`:
- `ankc-breeds.json` (scraped list), `breed-details.json` (display names, varieties, nicknames), `groups.json`, `unofficial-breeds.json`, `short-names.json` (grid labels)
- `traits.json`: 3 temperament traits from a fixed list of 16, plus one line of text in our own words, per breed
- `breed-facts.json`: typical weight and lifespan ranges, country of origin (ISO code, or GB-ENG / GB-SCT / GB-WLS) and one line on what the breed was bred to do, with the source checked; flags are drawn in `src/data/countries.ts`
- `dog-shapes.json`: how each breed's Park dog is drawn: size (XS to XL), build, snout (1 to 5), ears, tail, coat type, and its colour and markings
- `photo-picks.json`: which photo each breed uses (a Wikimedia Commons file, or Dogs Australia's own breed photo) and where to centre the crops
- `wiki-map.json`, `wiki-overrides.json`, `photo-sources.json`: where to look for Commons photos
- `shipped-ids.json`: every breed id that has ever shipped.
  Spots are saved by id and the id comes from the breed's name, so a test fails if a rename would change one; add new breeds' ids here when they ship.

`node scripts/build-data.ts` turns these into what the app ships: `src/data/breeds.json` and `public/breeds/` (a square grid photo, a breed-page photo and a silhouette mask per breed).
Run it after changing any data file. It needs macOS: the silhouettes are cut out by Apple's Vision framework (`scripts/vision/mask.swift`, run through `swift`), once per photo.
Downloads and other working files go in `.cache/` (not committed).

### Changing a breed's photo

1. Edit its entry in `data/photo-picks.json`: a Commons `file` name, or an `external` photo, and a `focus` (the dog's centre, as fractions).
2. Run `node scripts/build-data.ts`, then `pnpm test` (the data tests check every breed has its files).
3. Check it with `pnpm review`.

### Changing a breed's facts

1. Edit its entry in `data/breed-facts.json`: `kg` and `life` as [low, high], `origin` as a country code, `job` as one sentence (no em or en dashes), and `src` for where you checked it.
   A new country also needs a flag in `src/data/countries.ts` (drawn on a 30x20 grid; the data tests fail without one).
2. Run `node scripts/build-data.ts`, then `pnpm test`.
3. Check it with `pnpm review`, or on the breed's page in `pnpm dev`.

### The photo pipeline (how the picks were made)

1. `node scripts/fetch-ankc.ts`: the Dogs Australia breed list into `data/ankc-breeds.json`.
2. `node scripts/map-wikipedia.ts`: each breed's Wikipedia and Wikidata entries into `data/wiki-map.json`.
3. `node scripts/fetch-photo-candidates.ts [id ...]`: ranked Commons candidates into `.cache/`.
4. `node scripts/make-review-sheets.ts <round> <perSheet> [id ...]`: numbered contact sheets to choose from.
5. `node scripts/apply-verdicts.ts <round> <verdicts.json>`: the chosen tiles into `data/photo-picks.json`.
6. `node scripts/build-data.ts`, then `node scripts/make-contact-sheet.ts` for a review page of picks and alternatives.

`node scripts/fetch-ankc-temperament.ts` reads the standards' temperament lines into `.cache/` for analysis only; `node scripts/make-icons.ts` redraws the pixel dog face used for the browser tab and Home Screen icons.

## Content and licensing

- Breed names and group membership come from the Dogs Australia breed group pages; these are facts.
  The breed text is written in our own words, never copied from a breed standard.
- Breed facts (weight, lifespan, origin, original job) were researched in Oct 2026 against the AKC, The Kennel Club, the FCI and Wikipedia, and written in our own words.
  The rare breeds were checked against those sources one by one; many common breeds' figures are typical published ranges that weren't each re-checked, so fix any that look off.
- Most breed photos are Dogs Australia's own (Justin's call for this private app), and the rest come from Wikimedia Commons.
  Credits are kept per photo in `src/data/breeds.json` but not shown in the app.
  The repo stays private. The site has no password (Justin's call, 2 Oct 2026), so anyone with the link can see the photos; search engines are asked not to list it.
- The earlier HTML mockups and prototypes were removed; they're kept in git history under the tag `mockups-final`.
