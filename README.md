# DM Loft

Web hub for D&D DM tools. Vercel + Supabase + Next.js 15.

## Local dev
- `npm run dev` — start dev server on :3000
- `npm test` — run unit tests

## Deploys
- Push to `main` → Vercel deploys production
- Push to any other branch → Vercel deploys a preview

## Spec
See `docs/design.md` (mirror of the canonical spec).

## Running e2e tests locally

The e2e tests need:
1. A test user provisioned in Supabase Auth.
2. `.env.local` with `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` set to that user's credentials.
3. Browser binaries: `npx playwright install chromium`.

Then: `npm run e2e`. Tests live in `tests/e2e/`.

## For DMs

This is a personal hub for D&D tools — sign in with Google or email, create a
campaign, and launch the tracker you need. Every campaign has its own state,
so you can keep your Oakhart epic going while running a one-shot on the side.

To add a new tool: drop a single-file HTML into `public/tools/<id>/index.html`
(running `npm run tools:port` will patch it for you), then add an entry to
`lib/tools.ts`. The dashboard picks it up on next reload.
