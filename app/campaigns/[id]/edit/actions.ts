"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/invite-codes";

// Throws (rather than redirecting like our other error paths) on purpose:
// the campaign edit page renders no UI exposing these actions to non-DMs,
// so reaching this failure means a hand-crafted request, a stale tab after
// role change, or a bug. A generic 500 in those cases is fine.
async function assertDM(supabase: Awaited<ReturnType<typeof getServerSupabase>>, campaignId: string) {
  const { data, error } = await supabase.rpc("is_campaign_dm", { cid: campaignId });
  if (error) throw error;
  if (!data) throw new Error("Only the keeper of this chronicle may do that.");
}

// Postgres unique-violation. Stable across versions, more reliable than
// matching on error.message text.
const PG_UNIQUE_VIOLATION = "23505";

export async function renameCampaign(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) {
    redirect(`/campaigns/${id}/edit?error=${encodeURIComponent("Name required.")}`);
  }
  const supabase = await getServerSupabase();
  await assertDM(supabase, id);
  const { error } = await supabase
    .from("campaigns")
    .update({ name, description })
    .eq("id", id);
  if (error) {
    redirect(`/campaigns/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect("/campaigns");
}

export async function deleteCampaign(id: string) {
  const supabase = await getServerSupabase();
  await assertDM(supabase, id);
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) {
    redirect(`/campaigns?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect("/campaigns");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateInvite(campaignId: string, _formData: FormData) {
  const supabase = await getServerSupabase();
  await assertDM(supabase, campaignId);
  const { data: userResp } = await supabase.auth.getUser();
  const uid = userResp.user!.id; // assertDM already proved we're authenticated

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) {
    redirect(`/campaigns/${campaignId}/edit?error=${encodeURIComponent("Campaign not found.")}`);
  }

  // Try a few times in the very unlikely case of a code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode(campaign.name);
    const { error } = await supabase.from("campaign_invites").insert({
      code,
      campaign_id: campaignId,
      created_by: uid,
    });
    if (!error) {
      revalidatePath(`/campaigns/${campaignId}/edit`);
      return;
    }
    if (error.code !== PG_UNIQUE_VIOLATION) {
      redirect(`/campaigns/${campaignId}/edit?error=${encodeURIComponent(error.message)}`);
    }
  }
  redirect(`/campaigns/${campaignId}/edit?error=${encodeURIComponent("Could not generate a unique invite code.")}`);
}

export async function revokeInvite(campaignId: string, code: string) {
  const supabase = await getServerSupabase();
  await assertDM(supabase, campaignId);
  const { error } = await supabase
    .from("campaign_invites")
    .update({ revoked: true })
    .eq("code", code)
    .eq("campaign_id", campaignId);
  if (error) {
    redirect(`/campaigns/${campaignId}/edit?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/campaigns/${campaignId}/edit`);
}

export async function kickMember(campaignId: string, userId: string) {
  const supabase = await getServerSupabase();
  await assertDM(supabase, campaignId);
  const { data: userResp } = await supabase.auth.getUser();
  if (userResp.user?.id === userId) {
    redirect(`/campaigns/${campaignId}/edit?error=${encodeURIComponent("DMs cannot kick themselves. Delete the chronicle to leave.")}`);
  }
  const { error } = await supabase
    .from("campaign_members")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("user_id", userId);
  if (error) {
    redirect(`/campaigns/${campaignId}/edit?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/campaigns/${campaignId}/edit`);
  revalidatePath(`/c/${campaignId}`);
}
