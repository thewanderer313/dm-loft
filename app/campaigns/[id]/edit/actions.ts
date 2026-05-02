"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

export async function renameCampaign(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) {
    redirect(`/campaigns/${id}/edit?error=${encodeURIComponent("Name required.")}`);
  }
  const supabase = await getServerSupabase();
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
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) {
    redirect(`/campaigns?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect("/campaigns");
}
