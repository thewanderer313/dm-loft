// lib/invite-codes.ts
//
// Human-typeable invite codes of the shape `<slug>-<random>`. Slug is
// derived from the campaign name (truncated, hyphen-collapsed, ambiguous
// characters stripped); random suffix is four characters from a-z2-9 with
// l/1/o/0 removed so a player typing the code from a phone screen has a
// fighting chance.

const SAFE_CHARS = "abcdefghijkmnpqrstuvwxyz23456789"; // no l, 1, o, 0
const SLUG_MAX = 12;

export function slugify(input: string): string {
  const dropped = input.toLowerCase().replace(/[l1o0]/g, "");
  const cleaned = dropped.replace(/[^a-z2-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!cleaned) return "chronicle";
  return cleaned.slice(0, SLUG_MAX);
}

export function generateInviteCode(campaignName: string): string {
  const slug = slugify(campaignName);
  let suffix = "";
  // Use crypto.getRandomValues so suffixes are unpredictable.
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  for (const b of buf) suffix += SAFE_CHARS[b % SAFE_CHARS.length];
  return `${slug}-${suffix}`;
}
