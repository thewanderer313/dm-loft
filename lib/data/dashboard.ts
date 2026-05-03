import { getServerSupabase } from "@/lib/supabase/server";

export async function pickDefaultCampaignId(): Promise<string | null> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("campaigns")
    .select("id")
    .order("last_opened_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.id ?? null;
}

export async function getCampaignForDashboard(id: string) {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("campaigns")
    .select("id,name,description,last_tool_id,last_opened_at")
    .eq("id", id)
    .maybeSingle();
  return data;
}
