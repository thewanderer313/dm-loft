// lib/invite-codes.ts
//
// Human-typeable invite codes of the shape `<slug>-<random>`. Slug is
// derived from the campaign name (lowercased, non-alphanumerics collapsed
// to hyphens, truncated). Random suffix is four characters from a-z2-9
// with l/1/o/0 omitted so a player typing the code from a phone screen
// has a fighting chance.
//
// We deliberately do NOT strip ambiguous characters from the slug — the
// slug exists for recognition ("oh, this is the Oakhart invite"), not
// for entropy. The four-char random suffix carries the unguessability.

const SAFE_CHARS = "abcdefghijkmnpqrstuvwxyz23456789"; // no l, 1, o, 0
const SLUG_MAX = 12;

export function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!cleaned) return "chronicle";
  // Truncate, then strip a trailing hyphen the truncation may have left.
  return cleaned.slice(0, SLUG_MAX).replace(/-$/, "");
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
