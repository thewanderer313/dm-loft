# Foundation Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the database foundation for player accounts. Add membership, invite, and per-campaign playback tables; add helper SQL functions used by RLS across the codebase; rewrite the `campaigns` RLS to grant access to all members (not just the DM). No UI changes — this plan delivers schema only.

**Architecture:** Four sequential SQL migrations (0006 through 0009) that build on each other. Each goes through the standard workflow: write the file, commit, ask the user to paste it into the Supabase SQL editor, verify with concrete SELECT queries. After all four are applied, regenerate the TypeScript bindings and confirm the existing app still builds/tests/lints clean against the new schema.

**Tech Stack:** PostgreSQL (Supabase), Supabase Auth, Next.js / TypeScript (only types touched).

---

## Spec reference

Implements **Step 1 — Foundation migration** from `docs/superpowers/specs/2026-05-03-player-login-design.md`. Specifically:

- `is_campaign_member(uuid)` and `is_campaign_dm(uuid)` helper SQL functions.
- `campaign_members` table with RLS + auto-DM-on-create trigger.
- `campaign_invites` table with RLS + `redeem_invite(text)` RPC.
- `campaign_playback` table with RLS.
- `campaigns` RLS rewrite from `dm_id = auth.uid()` to `is_campaign_member(id)`.

The spec also calls for renaming `dm_profiles` → `user_profiles` and `tracks.dm_id` → `tracks.uploader_id`. **Both renames are deferred to step 10 (cleanup) of the spec** because the live database is shared with the deployed `main` branch — renaming columns now would break production. The renames will happen at the cutover commit, after every code reference has been updated on the feature branch. This plan does not touch them.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/0006_membership_helpers.sql` | Create | `is_campaign_member` + `is_campaign_dm` SQL functions used by all subsequent RLS policies. |
| `supabase/migrations/0007_campaign_members.sql` | Create | `campaign_members` table, RLS policies, auto-DM trigger on `campaigns` insert, and the rewrite of `campaigns` RLS. |
| `supabase/migrations/0008_campaign_invites.sql` | Create | `campaign_invites` table, RLS, and the `redeem_invite(text)` RPC. |
| `supabase/migrations/0009_campaign_playback.sql` | Create | `campaign_playback` table + RLS. Subscribed to via Realtime once UI lands. |
| `lib/supabase/database.types.ts` | Modify | Regenerate after all four migrations apply so TypeScript matches the new schema. |

No JS/TS source files are added in this plan. The existing `npm run db:types` script handles the regen.

---

### Task 1: Helper SQL functions (`is_campaign_member`, `is_campaign_dm`)

These two functions are the lynchpin of every later RLS policy. Putting them in their own migration means the rest of the migrations can `select` against them and the function bodies live in one obvious place.

**Files:**
- Create: `supabase/migrations/0006_membership_helpers.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Helper SQL used by every RLS policy in the player-login system.
--
--   is_campaign_member(cid) → true if the calling user is in the campaign
--                             (DM or player).
--   is_campaign_dm(cid)     → true if the calling user is the campaign's DM.
--
-- Both are SECURITY DEFINER so they bypass RLS on campaign_members itself,
-- avoiding the "can't read your own membership row" recursion that would
-- otherwise break the helpers.

create or replace function public.is_campaign_member(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.campaign_members
    where campaign_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.is_campaign_dm(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.campaign_members
    where campaign_id = cid and user_id = auth.uid() and role = 'dm'
  );
$$;

-- Allow authenticated users to call the helpers. SECURITY DEFINER means the
-- function runs as its owner, but EXECUTE still has to be granted to the
-- caller's role.
grant execute on function public.is_campaign_member(uuid) to authenticated;
grant execute on function public.is_campaign_dm(uuid)     to authenticated;
```

> **Note:** `campaign_members` doesn't exist yet. Postgres compiles `language sql` functions lazily on first call, so this works as long as `campaign_members` exists by the time anything queries the function. Migration 0007 creates it. If you'd rather front-load the table, swap the order — but the current order keeps each migration single-concern.

- [ ] **Step 2: Verify the file is well-formed**

Run: `head -40 supabase/migrations/0006_membership_helpers.sql`
Expected: file shows the two `create or replace function` blocks and the `grant execute` lines.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0006_membership_helpers.sql
git commit -m "feat(db): is_campaign_member + is_campaign_dm helpers"
```

---

### Task 2: `campaign_members` table + auto-DM trigger + campaigns RLS rewrite

These three concerns are tightly coupled — the trigger writes to the new table, and the RLS rewrite calls the helper from Task 1, which queries the new table. Putting them in one migration means there is never a moment where the live DB has the table but no trigger (or has the new RLS but no membership rows).

**Files:**
- Create: `supabase/migrations/0007_campaign_members.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ───────── campaign_members ─────────

create table if not exists public.campaign_members (
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  user_id        uuid not null references auth.users(id)        on delete cascade,
  character_name text not null,
  role           text not null check (role in ('dm', 'player')),
  joined_at      timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create index if not exists campaign_members_user_id
  on public.campaign_members (user_id);

alter table public.campaign_members enable row level security;

-- SELECT: a member can see all rows for any campaign they belong to.
drop policy if exists "Members see their campaign roster" on public.campaign_members;
create policy "Members see their campaign roster"
  on public.campaign_members for select
  to authenticated
  using (public.is_campaign_member(campaign_id));

-- INSERT: only a campaign's DM can add new members. (The auto-DM trigger
-- below uses SECURITY DEFINER so it bypasses this for the initial DM row.)
drop policy if exists "DMs add members to their campaign" on public.campaign_members;
create policy "DMs add members to their campaign"
  on public.campaign_members for insert
  to authenticated
  with check (public.is_campaign_dm(campaign_id));

-- UPDATE: a member can edit their own row (rename their character); DMs can
-- edit any row in their campaign.
drop policy if exists "Members rename their own character or DM edits any" on public.campaign_members;
create policy "Members rename their own character or DM edits any"
  on public.campaign_members for update
  to authenticated
  using (user_id = auth.uid() or public.is_campaign_dm(campaign_id))
  with check (user_id = auth.uid() or public.is_campaign_dm(campaign_id));

-- DELETE: a member can remove themselves (leave); a DM can remove anyone
-- (kick) — including themselves, which we may want to forbid via UI rather
-- than RLS so the DB stays simple.
drop policy if exists "Members leave or DM kicks" on public.campaign_members;
create policy "Members leave or DM kicks"
  on public.campaign_members for delete
  to authenticated
  using (user_id = auth.uid() or public.is_campaign_dm(campaign_id));

-- ───────── auto-DM trigger ─────────
-- When a campaigns row is inserted, automatically add a campaign_members row
-- for the DM with role='dm'. Uses SECURITY DEFINER so RLS doesn't block
-- the insert (the new DM is not yet a member when this fires).

create or replace function public.handle_new_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.campaign_members (campaign_id, user_id, character_name, role)
  values (
    new.id,
    new.dm_id,
    'Keeper',
    'dm'
  )
  on conflict (campaign_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_campaign_created on public.campaigns;
create trigger on_campaign_created
  after insert on public.campaigns
  for each row execute function public.handle_new_campaign();

-- ───────── campaigns RLS rewrite ─────────
-- Replace the old "DM only" policy with member-based access. This is safe
-- against existing data because:
--   1. The trigger above auto-fills campaign_members for new campaigns.
--   2. Existing campaigns have no members yet — they get backfilled below.
--
-- Backfill: insert a campaign_members row for every existing campaign's DM.
insert into public.campaign_members (campaign_id, user_id, character_name, role)
select id, dm_id, 'Keeper', 'dm'
from public.campaigns
on conflict (campaign_id, user_id) do nothing;

-- Now safely swap the policies.
drop policy if exists "DMs see only their own campaigns" on public.campaigns;

drop policy if exists "Members see campaigns they belong to" on public.campaigns;
create policy "Members see campaigns they belong to"
  on public.campaigns for select
  to authenticated
  using (public.is_campaign_member(id));

drop policy if exists "Members may amend their campaign" on public.campaigns;
create policy "Members may amend their campaign"
  on public.campaigns for update
  to authenticated
  using (public.is_campaign_member(id))
  with check (public.is_campaign_member(id));

-- INSERT: any authed user can create a campaign and they're the DM (existing
-- behaviour). The dm_id has to match the caller.
drop policy if exists "Authenticated users may create their own campaign" on public.campaigns;
create policy "Authenticated users may create their own campaign"
  on public.campaigns for insert
  to authenticated
  with check (dm_id = auth.uid());

-- DELETE: only the DM (i.e. the campaign's creator) can delete the row.
drop policy if exists "DMs may strike their own campaign" on public.campaigns;
create policy "DMs may strike their own campaign"
  on public.campaigns for delete
  to authenticated
  using (public.is_campaign_dm(id));
```

- [ ] **Step 2: Skim the file to confirm it's coherent**

Run: `wc -l supabase/migrations/0007_campaign_members.sql`
Expected: between 80 and 120 lines.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0007_campaign_members.sql
git commit -m "feat(db): campaign_members + auto-DM trigger + campaigns RLS rewrite"
```

---

### Task 3: `campaign_invites` table + `redeem_invite` RPC

The RPC is what lets a non-member call into the system to join. RLS would block them from reading the invites table directly, so we wrap the read+insert pair in a `security definer` function the client can call as `supabase.rpc('redeem_invite', { code: 'oakhart-9k2x' })`.

**Files:**
- Create: `supabase/migrations/0008_campaign_invites.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ───────── campaign_invites ─────────

create table if not exists public.campaign_invites (
  code        text primary key,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz null,
  max_uses    int null,
  uses        int not null default 0,
  revoked     boolean not null default false
);

create index if not exists campaign_invites_campaign_id
  on public.campaign_invites (campaign_id);

alter table public.campaign_invites enable row level security;

-- Only DMs of the campaign may read or manage invite codes directly.
drop policy if exists "DMs see invites for their campaign" on public.campaign_invites;
create policy "DMs see invites for their campaign"
  on public.campaign_invites for select
  to authenticated
  using (public.is_campaign_dm(campaign_id));

drop policy if exists "DMs create invites" on public.campaign_invites;
create policy "DMs create invites"
  on public.campaign_invites for insert
  to authenticated
  with check (public.is_campaign_dm(campaign_id) and created_by = auth.uid());

drop policy if exists "DMs amend invites" on public.campaign_invites;
create policy "DMs amend invites"
  on public.campaign_invites for update
  to authenticated
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

drop policy if exists "DMs revoke invites" on public.campaign_invites;
create policy "DMs revoke invites"
  on public.campaign_invites for delete
  to authenticated
  using (public.is_campaign_dm(campaign_id));

-- ───────── redeem_invite RPC ─────────
--
-- Called by a signed-in non-member to join. SECURITY DEFINER so it can read
-- the invites table even though the caller can't (RLS blocks them).
--
-- Returns the campaign id on success. Raises an exception with a meaningful
-- message on rejection so the client can surface the reason.

create or replace function public.redeem_invite(
  invite_code text,
  character_name text default 'Adventurer'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.campaign_invites%rowtype;
  uid    uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in.';
  end if;

  select * into invite from public.campaign_invites where code = invite_code;
  if not found then
    raise exception 'No such invite code.';
  end if;
  if invite.revoked then
    raise exception 'This invite has been revoked.';
  end if;
  if invite.expires_at is not null and invite.expires_at < now() then
    raise exception 'This invite has expired.';
  end if;
  if invite.max_uses is not null and invite.uses >= invite.max_uses then
    raise exception 'This invite has reached its use limit.';
  end if;

  -- Idempotent join: if the user is already in the campaign, succeed
  -- without bumping the use counter.
  if exists (
    select 1 from public.campaign_members
    where campaign_id = invite.campaign_id and user_id = uid
  ) then
    return invite.campaign_id;
  end if;

  insert into public.campaign_members
    (campaign_id, user_id, character_name, role)
  values
    (invite.campaign_id, uid, coalesce(nullif(trim(character_name), ''), 'Adventurer'), 'player');

  update public.campaign_invites
    set uses = uses + 1
    where code = invite_code;

  return invite.campaign_id;
end;
$$;

grant execute on function public.redeem_invite(text, text) to authenticated;
```

- [ ] **Step 2: Skim the file**

Run: `wc -l supabase/migrations/0008_campaign_invites.sql`
Expected: between 60 and 100 lines.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0008_campaign_invites.sql
git commit -m "feat(db): campaign_invites + redeem_invite RPC"
```

---

### Task 4: `campaign_playback` table + RLS

Holds one row per campaign tracking what the DM is currently driving. UI doesn't exist yet — this just lays the schema so step 4 (audio sync) of the spec has a target.

**Files:**
- Create: `supabase/migrations/0009_campaign_playback.sql`

- [ ] **Step 1: Write the migration file**

```sql
create table if not exists public.campaign_playback (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  track_id    uuid null references public.tracks(id) on delete set null,
  started_at  timestamptz null,
  is_playing  boolean not null default false,
  updated_by  uuid not null references auth.users(id),
  updated_at  timestamptz not null default now()
);

alter table public.campaign_playback enable row level security;

-- Members can read what's currently playing.
drop policy if exists "Members see campaign playback" on public.campaign_playback;
create policy "Members see campaign playback"
  on public.campaign_playback for select
  to authenticated
  using (public.is_campaign_member(campaign_id));

-- Only DMs can drive the playback row. INSERT and UPDATE both require it,
-- and updated_by must match the caller.
drop policy if exists "DMs drive campaign playback (insert)" on public.campaign_playback;
create policy "DMs drive campaign playback (insert)"
  on public.campaign_playback for insert
  to authenticated
  with check (public.is_campaign_dm(campaign_id) and updated_by = auth.uid());

drop policy if exists "DMs drive campaign playback (update)" on public.campaign_playback;
create policy "DMs drive campaign playback (update)"
  on public.campaign_playback for update
  to authenticated
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id) and updated_by = auth.uid());

-- The row's lifecycle ends with the campaign (cascade); no separate DELETE
-- policy is needed for routine usage.
```

- [ ] **Step 2: Skim the file**

Run: `wc -l supabase/migrations/0009_campaign_playback.sql`
Expected: between 30 and 50 lines.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0009_campaign_playback.sql
git commit -m "feat(db): campaign_playback table + RLS"
```

---

### Task 5: User applies the four migrations

The user has been applying migrations by pasting SQL into the Supabase dashboard's SQL Editor. This task hands them a single combined paste so they don't have to apply four files individually, plus verification queries to confirm everything took.

**Files:** None (user action).

- [ ] **Step 1: Build the combined SQL block from the four files**

Run:

```bash
{ for f in supabase/migrations/0006_membership_helpers.sql \
            supabase/migrations/0007_campaign_members.sql \
            supabase/migrations/0008_campaign_invites.sql \
            supabase/migrations/0009_campaign_playback.sql; do \
    echo "-- ===== $f ====="; cat "$f"; echo; \
  done; } > /tmp/dm-loft-foundation.sql
wc -l /tmp/dm-loft-foundation.sql
```

Expected: a single file at `/tmp/dm-loft-foundation.sql` whose line count is roughly the sum of the four migration files (around 200–270 lines).

- [ ] **Step 2: Hand the SQL to the user with paste instructions**

Output the contents of `/tmp/dm-loft-foundation.sql` to the user along with this message:

> Paste this entire block into the SQL Editor at <https://supabase.com/dashboard/project/okvnehycqtwdeyuvhgqf/sql/new> and run it. It applies migrations 0006 through 0009 in order.

- [ ] **Step 3: Hand the user verification queries**

Tell the user to also run:

```sql
-- Should return 1 row each:
select count(*) from pg_proc where proname in ('is_campaign_member', 'is_campaign_dm', 'redeem_invite', 'handle_new_campaign');
-- Expected: 4

-- Should return at least one row per campaign you already have, all role='dm':
select campaign_id, user_id, character_name, role from public.campaign_members;

-- New tables exist:
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('campaign_members', 'campaign_invites', 'campaign_playback');
-- Expected: 3

-- New campaigns RLS policies are in place (old policy gone, new ones present):
select policyname from pg_policies where schemaname='public' and tablename='campaigns';
-- Expected: 'Members see campaigns they belong to', 'Members may amend their
--           campaign', 'Authenticated users may create their own campaign',
--           'DMs may strike their own campaign'
```

- [ ] **Step 4: Wait for user confirmation**

The user must reply that all four queries returned the expected counts/policies before moving on. If anything is missing, debug before continuing.

---

### Task 6: Regenerate `database.types.ts` and confirm the existing app still builds

After Task 5 completes, the live schema has new tables that TypeScript doesn't know about. Regenerate the types and verify nothing in the existing codebase breaks against the new schema.

**Files:**
- Modify: `lib/supabase/database.types.ts` (regenerated)

- [ ] **Step 1: Regenerate types**

Run: `npm run db:types`
Expected: completes silently. `lib/supabase/database.types.ts` now includes `campaign_members`, `campaign_invites`, `campaign_playback`, and the `redeem_invite` function under `public.Functions`.

If the command fails because `supabase` CLI isn't logged in, the user can also paste the contents of <https://supabase.com/dashboard/project/okvnehycqtwdeyuvhgqf/api?page=tables-intro> directly — but `db:types` is the script of record.

- [ ] **Step 2: Verify the new tables show up in the type file**

Run: `grep -E '^      (campaign_members|campaign_invites|campaign_playback):' lib/supabase/database.types.ts`
Expected: three matches.

- [ ] **Step 3: Run the typechecker**

Run: `npx tsc --noEmit 2>&1 | tail -20`
Expected: zero errors. (If the existing `tests/scripts/port-tool.test.ts` still has the pre-existing "Cannot find module '@/scripts/port-tool'" error from earlier in the project, that's fine — it predates this work and is not introduced by it.)

- [ ] **Step 4: Run the test suite**

Run: `npx vitest run 2>&1 | tail -8`
Expected: 15/15 tests pass (or whatever count matches the current main; no new failures introduced).

- [ ] **Step 5: Run the build**

Run: `npx next build 2>&1 | tail -10`
Expected: "Compiled successfully", route list rendered, no errors.

- [ ] **Step 6: Run lint**

Run: `npx eslint . 2>&1 | tail -3`
Expected: empty output (no errors, no warnings).

- [ ] **Step 7: Commit the regenerated types**

```bash
git add lib/supabase/database.types.ts
git commit -m "chore(db): regenerate types after foundation migration"
```

- [ ] **Step 8: Push the branch**

```bash
git push origin feat/player-login
```

The Vercel preview build will pick up the commits. Since no UI was touched, the preview should look identical to the main branch's audio-library deploy. The new schema is invisible until the next plan adds UI.

---

## Self-review notes

- **Spec coverage:** Every requirement in spec section "Data model" → "campaign_members / campaign_invites / campaign_playback" is covered by Tasks 2/3/4. Spec section "Row-level security" → "is_campaign_member / is_campaign_dm" and the campaigns RLS rewrite are Tasks 1 and 2. Two spec items intentionally out of scope and documented above: the `dm_profiles → user_profiles` rename and the `tracks.dm_id → tracks.uploader_id` rename, both deferred to step 10 of the spec.
- **Type consistency:** `is_campaign_member(uuid)` is referenced consistently across all RLS policies; `is_campaign_dm(uuid)` likewise. The `redeem_invite(text, text default 'Adventurer')` signature matches the planned client call shape (`supabase.rpc('redeem_invite', { invite_code, character_name })`).
- **No placeholders:** Every step has either concrete SQL or a concrete shell command with expected output. No "TODO", "TBD", "implement later".
- **Per-tool state tables:** Out of scope for this plan; they get added in their own per-tool plans (steps 5–9 of the spec).
