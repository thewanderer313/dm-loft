-- Fix: 0003 wrote storage policies that referenced `(storage.foldername(c.name))[1]`,
-- where the bare `name` inside the EXISTS subquery resolved to campaigns.name
-- (the column on the aliased `c` row), not the storage.objects.name (the file path).
-- That made foldername always operate on the campaign name string — which has no
-- "/" separator, so foldername returns {} and [1] is null, so the EXISTS never
-- matched, so every storage operation was rejected by RLS.
--
-- Rewrite each policy so the foldername is computed outside the subquery.

drop policy if exists "DMs read their campaign tracks" on storage.objects;
drop policy if exists "DMs upload to their campaign"   on storage.objects;
drop policy if exists "DMs update their campaign tracks" on storage.objects;
drop policy if exists "DMs delete their campaign tracks" on storage.objects;

create policy "DMs read their campaign tracks"
  on storage.objects for select
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] in (
      select id::text from public.campaigns where dm_id = auth.uid()
    )
  );

create policy "DMs upload to their campaign"
  on storage.objects for insert
  with check (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] in (
      select id::text from public.campaigns where dm_id = auth.uid()
    )
  );

create policy "DMs update their campaign tracks"
  on storage.objects for update
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] in (
      select id::text from public.campaigns where dm_id = auth.uid()
    )
  );

create policy "DMs delete their campaign tracks"
  on storage.objects for delete
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] in (
      select id::text from public.campaigns where dm_id = auth.uid()
    )
  );
