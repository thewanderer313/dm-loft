"use server";

import { getServerSupabase } from "@/lib/supabase/server";

export async function recordLastOpened(campaignId: string, toolId: string) {
  const supabase = await getServerSupabase();
  await supabase
    .from("campaigns")
    .update({ last_tool_id: toolId, last_opened_at: new Date().toISOString() })
    .eq("id", campaignId);
}
