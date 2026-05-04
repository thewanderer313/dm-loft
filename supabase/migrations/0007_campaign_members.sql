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

-- ───────── role-change guard ─────────
-- The UPDATE policy lets a member update their own row (so they can rename
-- their character). Without a column-level guard, that same code path
-- would also let a player set role='dm' on themselves. Block changes to
-- the immutable columns unless the caller is a DM of the campaign.

create or replace function public.guard_campaign_member_immutables()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_campaign_dm(old.campaign_id) then
    raise exception 'Only a DM may change a member''s role.';
  end if;
  if new.campaign_id is distinct from old.campaign_id then
    raise exception 'campaign_id is immutable.';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id is immutable.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_campaign_members_role        on public.campaign_members;
drop trigger if exists guard_campaign_members_immutables  on public.campaign_members;
create trigger guard_campaign_members_immutables
  before update on public.campaign_members
  for each row execute function public.guard_campaign_member_immutables();

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
