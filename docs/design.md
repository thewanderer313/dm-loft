# DM Loft — Design Spec

**Date:** 2026-05-02
**Author:** Ryan Knox (with Claude)
**Status:** Approved (user waived final review gate; proceed directly to implementation plan)

## Summary

DM Loft is a multi-DM web hub on Vercel + Supabase that pulls Ryan's existing
D&D tools — Initiative Tracker, Time & Moon Tracker, Reputation Tracker, Battle
Map, Roll Tables, and Rules Reference — under one authenticated platform. Each
DM gets an account; each account holds many campaigns; tools open scoped to a
selected campaign.

The MVP is **lift-and-shift**: each existing single-file HTML tool is copied
into the Next.js project as a static asset and given a tiny patch so its
`localStorage` is namespaced by campaign. Originals in `DND-Tools/` are never
modified. Tools graduate to deeper integration (React rewrite, Supabase-backed
state, real-time) over time as Ryan finds friction points.

## Goals

- One sign-in destination for every DM tool Ryan has built.
- Multi-campaign per DM (one-shots are common — single-campaign would be
  immediately frustrating).
- Multi-DM accounts from day one (Ryan plus DM friends; each account isolated).
- Preserve existing tool work. Lift, don't rewrite.
- Cross-device access from a tablet at the table or a laptop in prep.
- Foundation that grows toward a virtual tabletop with players, real-time, and
  shared assets — without committing to building any of that yet.

## Non-Goals (explicitly out of scope for v1)

- Player accounts or player-facing views.
- Real-time multiplayer / live sync between devices.
- Migrating tool internal state into Postgres (still localStorage in v1).
- Supabase Storage / image & asset uploads.
- Billing, plan limits, admin tools.
- Custom domain (Vercel default subdomain is fine for v1; migrate later).
- Rewriting any tool's internals beyond the localStorage namespace patch.

## Identity

- **Name:** DM Loft
- **Palette:** "Lantern" — deep midnight navy `#1a1a2a` → muted dark olive
  `#3a3520` gradient, warm lantern-gold accent `#f5d68a`. Body text on dark
  background, Georgia serif (consistent with existing tools).
- **Tone:** atmospheric, cozy, dark-mode-first. The Oakhart green theme stays
  *inside* the Oakhart-themed tools; the platform shell uses the Lantern
  palette so it can host any DM's campaign without feeling like it belongs to
  one particular world.

## Audience and Auth

- DM-only MVP. Multi-DM (multi-tenant) from day one.
- **Auth via Supabase Auth:**
  - Primary: Google OAuth (one-click for most adults).
  - Fallback: email + password (escape hatch for non-Google users).
- Players are not in scope; the schema leaves room (`players` /
  `player_characters` tables can be added later without disturbing the MVP).

## Architecture

```
Browser (DM, often a tablet)
  ├── DM Loft shell  (Lantern-themed Next.js pages)
  └── Tool iframe    (static lifted HTML at /public/tools/{tool}/index.html)
            │
            ▼ HTTPS
Vercel · Next.js (App Router)
  ├── /login                          — Supabase Auth UI
  ├── /                               — dashboard (default/most-recent campaign)
  ├── /c/[campaignId]                 — campaign-scoped dashboard
  ├── /c/[campaignId]/t/[toolId]      — Lantern header + iframe wrapper
  ├── /campaigns                      — list / create / rename / delete
  ├── /settings                       — profile, sign out
  └── /public/tools/{tool}/index.html — lifted static tools
            │
            ▼ Supabase JS client (server + client)
Supabase
  ├── Auth      (Google OAuth + email/password)
  ├── Postgres  (dm_profiles, campaigns; RLS scoped per DM)
  └── Realtime / Storage  ← future (VTT, asset uploads)
```

The hub is the only thing that talks to Supabase. Lifted tools stay
client-only and keep their existing inline JS / localStorage state — they
just learn to namespace it by campaign.

## Routes & Components

| Route | Type | Purpose |
|---|---|---|
| `/login` | Server | Supabase Auth UI: Google button, email/password form |
| `/` | Server | Dashboard. Hybrid layout: "resume last session" card on top, tool grid below. Header has campaign switcher + avatar. Picks the most-recently-opened campaign by default; if none, prompts to create one. |
| `/c/[campaignId]` | Server | Same dashboard layout, scoped to a specific campaign |
| `/c/[campaignId]/t/[toolId]` | Server | Lantern header (campaign name + breadcrumb back to dashboard) + full-bleed iframe loading `/tools/{toolId}/index.html?campaign={campaignId}` |
| `/campaigns` | Server | Campaign list, create, rename, delete, accent-color picker |
| `/settings` | Server | Display name, sign out |

Plus `middleware.ts` enforcing auth on all routes except `/login` and the
auth callback.

### Tool registry

A static map (e.g. `lib/tools.ts`) defines the available tools — id, display
name, icon (emoji or imported asset), short blurb. Used by the dashboard grid
and the `[toolId]` route to validate the requested tool. New tools are added
by dropping their HTML into `/public/tools/{id}/index.html` and adding an
entry to the registry.

Tool ids in the registry (and folder names) for v1:

| Id | Display | Source file |
|---|---|---|
| `initiative` | Initiative Tracker | `DND-DMTools/DND-DM_Tools/DND Combat Tracker -final.html` |
| `time-moon` | Time & Moon Tracker | `DND-Time_Tracker/DND-Time-and-Combat-tracker/oakhart_timer_singlefile_responsive_v2.html` |
| `reputation` | Reputation Tracker | `DND-Oakhart_Reputation_Tracker/Oakhart Reputation Tracker.html` |
| `battle-map` | Battle Map | `DND-DMTools/DND-DM_Tools/oakhart-battlemap.html` |
| `roll-tables` | Roll Tables | `DND-DMTools/DND-DM_Tools/oakhart-rolltables.html` (+ JSON in `data/`) |
| `rules` | Rules Reference | `DND-DMTools/DND-DM_Tools/oakhart-rules-reference.html` |

The `roll-tables` tool ships with the existing JSON files copied alongside
its HTML at `/public/tools/roll-tables/data/*.json` (the tool's
existing fetch paths are preserved by the namespaced patch — no path
rewriting needed if relative paths already work; spot-check during port).

### The "tool patch" — every lifted HTML gets this on copy

```html
<script>
  // dm-loft injection: namespace localStorage by campaign id (?campaign=...)
  (function () {
    var p = new URLSearchParams(window.location.search);
    var c = p.get('campaign');
    if (!c) return; // standalone use still works
    var ns = 'dmloft:' + c + ':';
    var ls = window.localStorage;
    var origGet = ls.getItem.bind(ls), origSet = ls.setItem.bind(ls),
        origRemove = ls.removeItem.bind(ls);
    ls.getItem    = function (k) { return origGet(ns + k); };
    ls.setItem    = function (k, v) { return origSet(ns + k, v); };
    ls.removeItem = function (k) { return origRemove(ns + k); };
  })();
</script>
```

Inserted in `<head>` before any other scripts. Small and fully reversible —
delete the `<script>` block and the file is back to its original behavior.
Applied automatically by a port script so we don't hand-edit each HTML.

This intercepts the standard `getItem` / `setItem` / `removeItem` calls. If
a tool accesses storage via property syntax (e.g. `localStorage.foo = 'bar'`)
or via `clear()`, those bypass the namespace. Spot-check each tool during the
port; the fallback if a tool uses property syntax is to either rewrite the
patch as a `Proxy` over `localStorage`, or do a small in-tool find-and-replace.

## Data Flow

1. User hits any protected route → middleware reads Supabase session cookie.
   Missing → redirect to `/login`.
2. Login completes → Supabase issues session → callback redirects back to `/`
   (or original requested route).
3. Dashboard server component queries `campaigns where dm_id = auth.uid()`
   ordered by `last_opened_at desc`. Picks the top one (or shows
   "create your first campaign" if none).
4. User clicks a tool card → navigates to `/c/{campaign}/t/{tool}`.
5. That route's server component:
   - Validates campaign ownership (RLS does the security; this is for the
     friendly 404).
   - Validates `toolId` against the tool registry.
   - Updates `campaigns.last_tool_id` and `last_opened_at`.
   - Renders Lantern header + iframe pointed at
     `/tools/{toolId}/index.html?campaign={campaignId}`.
6. Inside the iframe, the patched tool reads `?campaign=` and namespaces all
   `localStorage` keys with `dmloft:{campaignId}:`. State is automatically
   isolated per campaign.

## Database Schema (v1)

```sql
-- Supabase manages auth.users automatically.

create table dm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  accent_color text,            -- per-campaign color tint (future)
  last_tool_id text,            -- powers "resume last session"
  last_opened_at timestamptz,
  created_at timestamptz default now()
);

create index campaigns_dm_id_last_opened on campaigns (dm_id, last_opened_at desc);

alter table dm_profiles enable row level security;
alter table campaigns  enable row level security;

create policy "DMs see only their own profile"
  on dm_profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "DMs see only their own campaigns"
  on campaigns for all
  using (dm_id = auth.uid())
  with check (dm_id = auth.uid());
```

A trigger creates a `dm_profiles` row on `auth.users` insert so every
authenticated user has a profile.

**Future tables, deliberately deferred:** `tool_states`, `players`,
`player_characters`, `sessions`, `assets`. Added when graduating individual
tools or expanding to player-facing features.

## Error Handling

| Failure | Behavior |
|---|---|
| Session missing / expired | Redirect to `/login` with toast "Please sign in again." |
| Campaign not found / not owned | 404 page with "back to dashboard" button. RLS guarantees the security; the UI provides the friendly message. |
| Unknown `toolId` | 404 page; tool registry is the source of truth. |
| Tool iframe fails to load | Fallback panel: "Tool unavailable" + reload button + link to the original local HTML in `DND-Tools/` as a manual escape hatch. |
| Supabase write fails (e.g. updating `last_tool_id`) | Toast warning; do not block tool load. State inside the tool itself is unaffected (lives in localStorage). |
| Supabase fully down | Already-loaded pages keep working; new navigations show a maintenance banner. |

## Testing

- **Unit (Vitest or Jest):** tool registry validation, dashboard data loaders,
  campaign sort/order helpers, the localStorage namespace patch (run it in a
  jsdom env, assert keys are prefixed).
- **Integration (Playwright):**
  - Sign up via email/password, sign out, sign back in.
  - Sign in via Google (mocked or against a Supabase staging project).
  - Create campaign, rename, delete (with confirm).
  - Open a tool, write to localStorage from inside the iframe, refresh —
    state persists.
  - Switch campaign — confirm the tool sees a fresh state slice.
- **Manual smoke on Vercel preview** before merge to `main`: log in, create
  campaign, click each of the six tools, verify they open and basic
  interactions work.

## Repository structure (proposed)

```
DND-Tools/                           ← Ryan's existing folder, never modified by the new app
  DND-Combat_Tracker/                ← original
  DND-DMTools/                       ← original
  DND-Oakhart_Reputation_Tracker/    ← original
  DND-Time_Tracker/                  ← original
  ...
  dm-loft/                           ← NEW — the Next.js project
    .gitignore
    package.json
    next.config.mjs
    middleware.ts
    app/
      login/page.tsx
      page.tsx                       ← root dashboard
      c/[campaignId]/page.tsx
      c/[campaignId]/t/[toolId]/page.tsx
      campaigns/page.tsx
      settings/page.tsx
      auth/callback/route.ts
    components/
      Shell.tsx                      ← Lantern header + content frame
      ToolGrid.tsx
      ResumeCard.tsx
      CampaignSwitcher.tsx
    lib/
      supabase/server.ts
      supabase/client.ts
      tools.ts                       ← tool registry
    public/
      tools/
        initiative/index.html        ← lifted + patched
        time-moon/index.html
        reputation/index.html
        battle-map/index.html
        roll-tables/index.html
        roll-tables/data/*.json
        rules/index.html
    scripts/
      port-tool.mjs                  ← copies a source HTML, injects the patch
    supabase/
      migrations/0001_init.sql
    docs/
      design.md  ← copy of this spec, lives with the project code
```

The canonical copy of this spec lives at
`DND-Tools/docs/superpowers/specs/2026-05-02-dm-loft-design.md`. When the
`dm-loft/` project is initialized, the spec is also copied to
`dm-loft/docs/design.md` so the implementation repo carries its own design
record.

The `dm-loft/` folder is its own git repo (`git init` at the start of
implementation; the parent `DND-Tools/` folder is intentionally not a single
repo today and we won't change that).

## Phasing for implementation

The implementation plan (next step) will sequence the work in roughly this
order. This is a sketch for the plan to refine, not a contract.

1. **Project skeleton.** Next.js + Supabase client + Vercel deploy of a
   "hello DM" page. No tools yet. Confirms the deploy pipeline works.
2. **Auth + middleware.** Google + email/password sign-in. Protected route
   redirect. `dm_profiles` trigger.
3. **Campaigns CRUD.** `campaigns` table with RLS. Create / list / rename /
   delete UI. No tools yet.
4. **Lantern shell.** Dashboard layout (hybrid grid + resume card). Campaign
   switcher in header.
5. **Tool registry + port script.** `port-tool.mjs` copies a source HTML and
   injects the localStorage patch. Run it once per tool; commit the outputs.
6. **Tool wrapper route.** `/c/[id]/t/[tool]` renders header + iframe.
   `last_tool_id` / `last_opened_at` writes on view.
7. **Polish + smoke.** Playwright tests, error states, mobile/tablet
   responsiveness check on the dashboard and the tool wrappers, README.
8. **Deploy.** Production Vercel project pointed at the Supabase project.
   Verify on a real device.

## Risks & open questions

- **Roll Tables JSON paths:** the existing tool fetches its data files; if
  it uses absolute paths or expects to be served from a specific location,
  the port may need a small path tweak. Spot-check during step 5.
- **Battle Map and Roll Tables file sizes:** several lifted HTMLs are large
  (Initiative Tracker is ~1.25 MB single file). Vercel serves static assets
  fine, but first-load time inside the iframe may be slow on tablets.
  Acceptable for v1; revisit if it's painful.
- **localStorage size limits:** typical browsers allow 5–10 MB per origin.
  All campaigns share the same origin (the Vercel domain). If a single DM
  has many campaigns with heavy state, this could become a constraint. v2
  signal: when this hurts, that tool graduates to Supabase-backed state.
- **Google OAuth setup** requires creating a Google Cloud project and adding
  the Vercel preview + production URLs as authorized redirects. The plan
  will treat this as a manual step Ryan does once with documented inputs.
