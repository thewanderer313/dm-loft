import { getServerSupabase } from "@/lib/supabase/server";

export type Track = {
  id: string;
  campaign_id: string;
  dm_id: string;
  title: string;
  tags: string[];
  storage_path: string;
  duration_sec: number | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type TrackWithUrl = Track & { url: string };

const SIGNED_URL_TTL_SEC = 60 * 60 * 8;

export async function listTracksForCampaign(
  campaignId: string
): Promise<TrackWithUrl[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("tracks")
    .select(
      "id,campaign_id,dm_id,title,tags,storage_path,duration_sec,mime_type,size_bytes,created_at"
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const tracks = (data ?? []) as Track[];
  if (tracks.length === 0) return [];

  const paths = tracks.map(t => t.storage_path);
  const { data: signed, error: signErr } = await supabase.storage
    .from("tracks")
    .createSignedUrls(paths, SIGNED_URL_TTL_SEC);

  if (signErr) throw signErr;
  const urlByPath = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }
  return tracks.map(t => ({ ...t, url: urlByPath.get(t.storage_path) ?? "" }));
}
