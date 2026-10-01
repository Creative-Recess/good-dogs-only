# Good Dogs Only

A Pokedex-style phone app for ticking off dog breeds spotted at the park.
The main list is every Dogs Australia (ANKC) breed standard, sorted into its 7 groups, plus a bonus section of common unofficial breeds and crosses.

It's a home-screen web app: open it in Safari on an iPhone, tap Share, then "Add to Home Screen".
Sightings are stored on the phone only (IndexedDB), with an export/import backup.

The full plan lives outside this repo at `personal/task-plans/dog-breed-dex.md` in Justin's AI workspace.

## Stack

- Vite + React + TypeScript, Tailwind CSS 4, shadcn/ui (Radix, Nova preset)
- Dexie.js over IndexedDB for sightings
- Vitest for unit and data tests, Playwright (WebKit, iPhone 17 profile) for E2E tests
- Cloudflare Workers static assets for hosting

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local dev server |
| `pnpm build` | Type-check and build to `dist/` |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript project check |
| `pnpm test` | Unit and data tests (Vitest) |
| `pnpm test:e2e` | E2E tests in WebKit with iPhone emulation (builds and serves the app first) |

First-time setup for E2E: `pnpm exec playwright install webkit`.

## Content and licensing

- Breed names and group membership come from the Dogs Australia breed group pages.
  These are facts; Dogs Australia's standards text and photos are copyrighted and are not copied into this app.
- Breed photos come from Wikimedia Commons and are credited per image (author, licence, source link, "resized").
