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
