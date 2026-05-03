-- Audio Library becomes a single shared library across all DM Loft users
-- (one upload, every keeper sees it). Drop the campaign_id scoping and
-- rewrite RLS so:
--   • any authenticated user can SELECT all tracks and INSERT new ones,
--   • only the original uploader (dm_id) can UPDATE / DELETE.
-- New storage path convention: {track_id}.{ext} at the bucket root.

-- ───────── tracks table ─────────

alter table public.tracks
  drop column if exists campaign_id;
-- The composite (campaign_id, created_at) index auto-drops with the column;
-- add a single-column index for the new global ordering.
create index if not exists tracks_created_at on public.tracks (created_at desc);

drop policy if exists "DMs see only their own tracks" on public.tracks;

drop policy if exists "Tracks are visible to all keepers" on public.tracks;
create policy "Tracks are visible to all keepers"
  on public.tracks for select
  to authenticated
  using (true);

drop policy if exists "Keepers may contribute tracks" on public.tracks;
create policy "Keepers may contribute tracks"
  on public.tracks for insert
  to authenticated
  with check (dm_id = auth.uid());

drop policy if exists "Uploaders may amend their tracks" on public.tracks;
create policy "Uploaders may amend their tracks"
  on public.tracks for update
  to authenticated
  using (dm_id = auth.uid())
  with check (dm_id = auth.uid());

drop policy if exists "Uploaders may strike their tracks" on public.tracks;
create policy "Uploaders may strike their tracks"
  on public.tracks for delete
  to authenticated
  using (dm_id = auth.uid());

-- ───────── storage policies ─────────

drop policy if exists "DMs read their campaign tracks"   on storage.objects;
drop policy if exists "DMs upload to their campaign"     on storage.objects;
drop policy if exists "DMs update their campaign tracks" on storage.objects;
drop policy if exists "DMs delete their campaign tracks" on storage.objects;

drop policy if exists "Tracks bucket is readable by keepers" on storage.objects;
create policy "Tracks bucket is readable by keepers"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'tracks');

drop policy if exists "Keepers may upload to tracks bucket" on storage.objects;
create policy "Keepers may upload to tracks bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'tracks');

-- For modify/delete: only the uploader (the storage owner).
-- storage.objects.owner is auto-populated with auth.uid() on insert.
drop policy if exists "Uploaders may amend their objects" on storage.objects;
create policy "Uploaders may amend their objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'tracks' and owner = auth.uid())
  with check (bucket_id = 'tracks' and owner = auth.uid());

drop policy if exists "Uploaders may strike their objects" on storage.objects;
create policy "Uploaders may strike their objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tracks' and owner = auth.uid());
