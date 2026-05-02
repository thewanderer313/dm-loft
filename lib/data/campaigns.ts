import { getServerSupabase } from "@/lib/supabase/server";

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  accent_color: string | null;
  last_tool_id: string | null;
  last_opened_at: string | null;
  created_at: string;
};

export async function listMyCampaigns(): Promise<Campaign[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id,name,description,accent_color,last_tool_id,last_opened_at,created_at")
    .order("last_opened_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
