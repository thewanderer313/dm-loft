// lib/data/members.ts
import { getServerSupabase } from "@/lib/supabase/server";

export type Member = {
  campaign_id: string;
  user_id: string;
  character_name: string;
  // role is `text` in the DB but constrained by `check (role in ('dm','player'))`
  // — see supabase/migrations/0007_campaign_members.sql. Keep this union in
  // sync with that constraint when adding new roles.
  role: "dm" | "player";
  joined_at: string;
};

export async function listMembersForCampaign(campaignId: string): Promise<Member[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("campaign_members")
    .select("campaign_id,user_id,character_name,role,joined_at")
    .eq("campaign_id", campaignId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  // Bucket DMs above players explicitly so the ordering is robust against
  // any future addition to the role universe (rather than relying on the
  // happenstance that 'dm' < 'player' lexicographically).
  return ((data ?? []) as Member[]).sort((a, b) => {
    if (a.role === b.role) return 0;
    if (a.role === "dm") return -1;
    if (b.role === "dm") return 1;
    return 0;
  });
}

export async function getMyMembership(campaignId: string): Promise<Member | null> {
  const supabase = await getServerSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("campaign_members")
    .select("campaign_id,user_id,character_name,role,joined_at")
    .eq("campaign_id", campaignId)
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return data as Member | null;
}
