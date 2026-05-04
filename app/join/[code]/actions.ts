"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

const FRIENDLY: Record<string, string> = {
  "Not signed in.":                          "You must sign in before joining.",
  "No such invite code.":                    "That invite code is unknown — double-check the link.",
  "This invite has been revoked.":           "This invite has been revoked.",
  "This invite has expired.":                "This invite has expired.",
  "This invite has reached its use limit.":  "This invite has reached its use limit.",
};

function friendly(message: string): string {
  return FRIENDLY[message] ?? `Something went wrong: ${message}`;
}

export async function joinCampaign(code: string, formData: FormData) {
  const characterName = String(formData.get("character_name") ?? "").trim() || "Adventurer";
  const supabase = await getServerSupabase();

  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) {
    // Send them to log in and bring them back here afterwards.
    redirect(`/login?redirect_to=${encodeURIComponent(`/join/${code}`)}`);
  }

  const { data, error } = await supabase.rpc("redeem_invite", {
    invite_code: code,
    character_name: characterName,
  });
  if (error) {
    redirect(`/join/${code}?error=${encodeURIComponent(friendly(error.message))}`);
  }
  const campaignId = data as unknown as string;
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect(`/c/${campaignId}`);
}
