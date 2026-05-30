"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

export async function renameMyCharacter(campaignId: string, formData: FormData) {
  const name = String(formData.get("character_name") ?? "").trim();
  if (!name) {
    redirect(`/c/${campaignId}?error=${encodeURIComponent("Character name cannot be blank.")}`);
  }
  const supabase = await getServerSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) redirect("/login");

  const { data, error } = await supabase
    .from("campaign_members")
    .update({ character_name: name })
    .eq("campaign_id", campaignId)
    .eq("user_id", uid)
    .select("user_id");
  if (error) {
    redirect(`/c/${campaignId}?error=${encodeURIComponent(error.message)}`);
  }
  // A zero-row update means the caller isn't a member of this campaign —
  // typically a stale tab where they were kicked between render and submit.
  // Without this guard the UI would show success without saving.
  if (!data || data.length === 0) {
    redirect(`/c/${campaignId}?error=${encodeURIComponent("Thou art no longer a member of this chronicle.")}`);
  }
  revalidatePath(`/c/${campaignId}`);
}

export async function leaveCampaign(campaignId: string) {
  const supabase = await getServerSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) redirect("/login");

  // A DM trying to leave their own campaign is blocked here so we don't
  // orphan invites + playback + members. They can delete the campaign
  // itself if they actually want to be done with it.
  //
  // If the RPC errors out, fail loud rather than silently passing the
  // guard — a transient RPC failure shouldn't let a DM accidentally
  // delete their own membership row and orphan the chronicle.
  const { data: dm, error: dmErr } = await supabase.rpc("is_campaign_dm", { cid: campaignId });
  if (dmErr) throw dmErr;
  if (dm) {
    redirect(`/c/${campaignId}?error=${encodeURIComponent("DMs cannot leave their own chronicle. Delete it from /campaigns instead.")}`);
  }

  const { error } = await supabase
    .from("campaign_members")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("user_id", uid);
  if (error) {
    redirect(`/c/${campaignId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect("/campaigns");
}
