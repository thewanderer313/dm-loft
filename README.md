# DM Loft

A keeper's tome for running D&D campaigns at the table. Each campaign has its
own state and a launchpad of eight instruments — initiative, time & moon,
reputation, battle map, roll tables, rules reference, a shared audio library
for music & ambience, and a wordboard of evocative adjectives.

Built on Next.js 16 (App Router), Supabase (auth + Postgres + Storage),
Tailwind 4, and deployed on Vercel.

## Stack

- **Framework**: Next.js 16.2 (App Router, Turbopack), React 19
- **Database / Auth / Storage**: Supabase
- **Styling**: Tailwind 4 + a hand-rolled "Tome" design system in
  `app/globals.css` (Cormorant Garamond / EB Garamond, vellum & ink themes
  via `data-theme="ink"`)
- **Tests**: Vitest (unit/integration) + Playwright (e2e)

## Tools

The launchpad on every campaign opens one of these:

| Tool                 | Sigil     | Implementation                                  |
|----------------------|-----------|-------------------------------------------------|
| Initiative Tracker   | sword     | static HTML at `public/tools/initiative/`       |
| Time & Moon          | moon      | static HTML at `public/tools/time-moon/`        |
| Reputation           | crown     | static HTML at `public/tools/reputation/`       |
| Battle Map           | hex       | static HTML at `public/tools/battle-map/`       |
| Roll Tables          | d20       | static HTML at `public/tools/roll-tables/`      |
| Rules Reference      | book      | static HTML at `public/tools/rules/`            |
| Audio Library        | note      | native Next.js route at `app/c/[id]/t/audio/`   |
| Wordboard            | quill     | static HTML at `public/tools/wordboard/`        |

Seven of the eight are standalone HTML pages loaded into an iframe; each tool
keeps its own per-campaign localStorage (the parent injects a `?campaign=…`
param and the tool namespaces its keys). The first six share the cosmetic
Tome overlay at `public/tools/_tome.css` so they fit the surrounding aesthetic
without touching their JS or markup; the Wordboard is Tome-native — it ships
with the vellum/ink palette baked in and does not need the overlay.

The Audio Library is different — it's a real Next.js route backed by a
`tracks` table and a private Supabase Storage bucket. It's a single shared
library across every signed-in user (one upload, every keeper sees it); only
the original uploader can rename or delete their own tracks.

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # unit/integration tests via vitest
npm run e2e            # Playwright e2e (see below for setup)
```

You'll need a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Database migrations

SQL migrations live in `supabase/migrations/`. To apply against your project:

```bash
npx supabase link --project-ref <your-project-ref>   # one-time
npx supabase db push
```

Or paste the SQL into the Supabase dashboard's SQL Editor.

After applying, regenerate typed bindings:

```bash
npm run db:types
```

## Running e2e tests

Playwright tests sign in as a real Supabase user. To run them:

1. Provision a test user in Supabase Auth.
2. Add `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` to `.env.local`.
3. `npx playwright install chromium`
4. `npm run e2e` — tests live in `tests/e2e/`.

## Deploys

- Push to `main` → Vercel deploys production.
- Push to any other branch → Vercel publishes a preview URL.

## Adding a new tool

Two patterns:

**Static-HTML iframe tool** (existing six):
1. Drop a single-file HTML into `public/tools/<id>/index.html`. Running
   `npm run tools:port` patches it with the campaign-namespaced localStorage
   shim and links the Tome overlay.
2. Add an entry to `lib/tools.ts` with a `sigil` from the `SigilKind` set.
3. The launchpad picks it up on next reload.

**Native Next.js tool** (Audio Library pattern):
1. Create `app/c/[campaignId]/t/<id>/page.tsx`. Static segments win over the
   dynamic `[toolId]` route, so any specific path takes over the iframe
   wrapper for that ID.
2. Wire whatever Supabase tables / storage buckets the tool needs in a new
   migration under `supabase/migrations/`.
3. Add an entry to `lib/tools.ts`.

## Design system

Page chrome lives in `components/TomePage.tsx` (gilt double-frame, italic
chapter / *Anno · MMXXVI* / folio header). Sigils are stroke-only SVGs in
`components/Sigil.tsx`. The full token palette and utility classes
(`tome-page`, `tome-btn`, `tome-illum`, `tome-eyebrow`, `tome-card`) live in
`app/globals.css`. Switch the surface from vellum (light) to ink (dark) by
toggling `data-theme="ink"` on `<html>` — the app currently defaults to ink
to match the design handoff in `handoff/`.
