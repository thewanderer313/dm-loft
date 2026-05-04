// lib/data/members.ts
import { getServerSupabase } from "@/lib/supabase/server";

export type Member = {
  campaign_id: string;
  user_id: string;
  character_name: string;
  role: "dm" | "player";
  joined_at: string;
};

export async function listMembersForCampaign(campaignId: string): Promise<Member[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("campaign_members")
    .select("campaign_id,user_id,character_name,role,joined_at")
    .eq("campaign_id", campaignId)
    .order("role", { ascending: true })   // 'dm' < 'player' lexicographically — DM first
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
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
  return (data as Member | null) ?? null;
}
