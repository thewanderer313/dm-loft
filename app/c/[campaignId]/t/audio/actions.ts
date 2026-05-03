"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

export async function deleteTrack(campaignId: string, trackId: string) {
  const supabase = await getServerSupabase();

  const { data: track, error: fetchErr } = await supabase
    .from("tracks")
    .select("storage_path")
    .eq("id", trackId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!track) return { ok: false, message: "Track not found." };

  // RLS gates this — only the uploader can delete the storage object.
  const { error: storageErr } = await supabase.storage
    .from("tracks")
    .remove([track.storage_path]);
  if (storageErr) {
    return { ok: false, message: storageErr.message };
  }

  const { error: rowErr } = await supabase
    .from("tracks")
    .delete()
    .eq("id", trackId);
  if (rowErr) {
    return { ok: false, message: rowErr.message };
  }

  revalidatePath(`/c/${campaignId}/t/audio`);
  return { ok: true };
}

export async function renameTrack(
  campaignId: string,
  trackId: string,
  title: string,
  tags: string[]
) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return { ok: false, message: "Title is required." };

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("tracks")
    .update({ title: cleanTitle, tags })
    .eq("id", trackId);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/c/${campaignId}/t/audio`);
  return { ok: true };
}
