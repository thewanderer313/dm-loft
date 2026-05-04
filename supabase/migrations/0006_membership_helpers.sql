-- Helper SQL used by every RLS policy in the player-login system.
--
--   is_campaign_member(cid) → true if the calling user is in the campaign
--                             (DM or player).
--   is_campaign_dm(cid)     → true if the calling user is the campaign's DM.
--
-- Both are SECURITY DEFINER so they bypass RLS on campaign_members itself,
-- avoiding the "can't read your own membership row" recursion that would
-- otherwise break the helpers.
--
-- We use `language plpgsql` rather than `language sql` so the function
-- body's reference to public.campaign_members is resolved at first call,
-- not at CREATE FUNCTION time. That lets this migration land before 0007
-- (which creates campaign_members) without requiring a combined migration.

create or replace function public.is_campaign_member(cid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.campaign_members
    where campaign_id = cid and user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_campaign_dm(cid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.campaign_members
    where campaign_id = cid and user_id = auth.uid() and role = 'dm'
  );
end;
$$;

-- Allow authenticated users to call the helpers. SECURITY DEFINER means the
-- function runs as its owner, but EXECUTE still has to be granted to the
-- caller's role.
grant execute on function public.is_campaign_member(uuid) to authenticated;
grant execute on function public.is_campaign_dm(uuid)     to authenticated;
