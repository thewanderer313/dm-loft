"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

export async function createCampaign(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) {
    redirect(`/campaigns/new?error=${encodeURIComponent("Name is required.")}`);
  }
  const supabase = await getServerSupabase();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  const { data, error } = await supabase
    .from("campaigns")
    .insert({ dm_id: user.user.id, name, description })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/campaigns/new?error=${encodeURIComponent(error?.message ?? "Failed to create.")}`);
  }
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect(`/c/${data.id}`);
}
