create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  accent_color text,
  last_tool_id text,
  last_opened_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists campaigns_dm_id_last_opened
  on public.campaigns (dm_id, last_opened_at desc nulls last);

alter table public.campaigns enable row level security;

drop policy if exists "DMs see only their own campaigns" on public.campaigns;
create policy "DMs see only their own campaigns"
  on public.campaigns for all
  using (dm_id = auth.uid())
  with check (dm_id = auth.uid());
