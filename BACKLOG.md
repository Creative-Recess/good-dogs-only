# Backlog

Ideas for after v1, roughly in order of how much they'd add.
When one is picked up, it moves to In progress; when it ships, it's deleted from here (git history and the commit say what was done).

## In progress

Nothing right now.

## Ideas

- **Share spots with friends.** One shared collection across phones, or each keeps their own and you can compare progress.
  Needs a small backend: Cloudflare D1 (a database on the account the app already uses) with a sync from each phone.
  The sightings data was designed for this: every spot has its own id and timestamps, and Unsee is a soft delete, so merging is safe.
- **Your own photo of each dog.** Take a photo when you mark a breed Spotted, shown on its breed page and in Recently spotted.
  Uses the phone's camera through a file input, resized on the phone (which also drops its location data), stored on the phone and in backups.
- **Seen counts and places.** "Seen 5 times", and which park each spot was at.
- **Badges.** Small achievements, e.g. finishing a group, 50 breeds, or every Terrier.
- **"Which breed is this?"** Snap a photo and get a suggested breed. Needs a small backend holding an AI API key.

## Decided against

- Offline mode (service worker): reception at the park has been fine (2 Oct 2026).
- A monthly check for newly recognised breeds (2 Oct 2026). To refresh the list by hand: `node scripts/fetch-ankc.ts`, and the data tests flag any change in the count.
