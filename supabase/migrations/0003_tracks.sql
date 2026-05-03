-- Audio Library: per-campaign track metadata + storage bucket.
-- Path convention inside the `tracks` bucket: {campaign_id}/{track_id}.{ext}
-- so storage RLS can derive the owning campaign from the first path segment.

create table if not exists public.tracks (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  dm_id         uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  tags          text[] not null default '{}',
  storage_path  text not null,
  duration_sec  numeric,
  mime_type     text,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

create index if not exists tracks_campaign_id_created
  on public.tracks (campaign_id, created_at desc);

alter table public.tracks enable row level security;

drop policy if exists "DMs see only their own tracks" on public.tracks;
create policy "DMs see only their own tracks"
  on public.tracks for all
  using (dm_id = auth.uid())
  with check (dm_id = auth.uid());

-- ───────── Storage ─────────

insert into storage.buckets (id, name, public)
values ('tracks', 'tracks', false)
on conflict (id) do nothing;

-- Read: any object in the `tracks` bucket whose first path segment is the
-- id of a campaign owned by the requester. We compute foldername outside
-- the subquery to avoid the bare `name` resolving to campaigns.name.

drop policy if exists "DMs read their campaign tracks" on storage.objects;
create policy "DMs read their campaign tracks"
  on storage.objects for select
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] in (
      select id::text from public.campaigns where dm_id = auth.uid()
    )
  );

drop policy if exists "DMs upload to their campaign" on storage.objects;
create policy "DMs upload to their campaign"
  on storage.objects for insert
  with check (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] in (
      select id::text from public.campaigns where dm_id = auth.uid()
    )
  );

drop policy if exists "DMs update their campaign tracks" on storage.objects;
create policy "DMs update their campaign tracks"
  on storage.objects for update
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] in (
      select id::text from public.campaigns where dm_id = auth.uid()
    )
  );

drop policy if exists "DMs delete their campaign tracks" on storage.objects;
create policy "DMs delete their campaign tracks"
  on storage.objects for delete
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] in (
      select id::text from public.campaigns where dm_id = auth.uid()
    )
  );
