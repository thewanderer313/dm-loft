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
