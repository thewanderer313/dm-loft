// lib/data/invites.ts
import { getServerSupabase } from "@/lib/supabase/server";

export type Invite = {
  code: string;
  campaign_id: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  revoked: boolean;
};

export async function listInvitesForCampaign(campaignId: string): Promise<Invite[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("campaign_invites")
    .select("code,campaign_id,created_by,created_at,expires_at,max_uses,uses,revoked")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invite[];
}

export async function getInviteByCode(code: string): Promise<Invite | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("campaign_invites")
    .select("code,campaign_id,created_by,created_at,expires_at,max_uses,uses,revoked")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return (data as Invite | null) ?? null;
}
