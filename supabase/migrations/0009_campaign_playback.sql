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
