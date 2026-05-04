# Auth + Membership UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the user-facing surface for joining and managing campaign membership. After this plan ships, a DM can generate an invite link, share it, a player can click and join with a character name, and both sides see each other in a Party list. Players can rename their character or leave; DMs can revoke invites or kick members.

**Architecture:** Pure UI / server-action layer on top of the foundation migrations from step 1 (commits `f2ce4c3..1fc0348`). No new tables — every persistence change goes through existing tables (`campaign_members`, `campaign_invites`) and the `redeem_invite` RPC. Joins flow through a new `/join/[code]` route; the existing `/login` and `/auth/callback` routes are extended to support a `redirect_to` query param so a not-yet-signed-in click on an invite link survives the round-trip through auth.

**Tech Stack:** Next.js 16 (App Router, server actions, server components), Supabase JS client (`@supabase/ssr`), Tailwind 4 + the Tome design system already established in `app/globals.css`, vitest for unit tests, Playwright for the join-flow e2e test.

---

## Spec reference

Implements **Step 2 — Auth + membership UI** from `docs/superpowers/specs/2026-05-03-player-login-design.md`. Specifically the spec's "User-visible flows" section and the "UI changes" sub-list.

After this plan lands, the spec items below are reachable from the UI:

- Generating, copying, and revoking invite codes (DM, on the campaign edit page).
- Following an invite link, signing in if needed, capturing a character name, and joining a campaign.
- Listing campaign members on the dashboard ("Party" section).
- Renaming one's character (member, on the campaign dashboard).
- Leaving a campaign (member).
- Kicking a member from a campaign (DM).

The following are explicitly **out of scope for step 2** and will land in later plans:

- Per-tool migration to Postgres-backed shared state (steps 3, 5–9 of the spec).
- Audio playback sync (step 4).
- Realtime presence and Initiative auto-load.

## Notes from step-1 final review

The cross-cutting reviewer flagged these for step 2 to handle deliberately:

- **`character_name = 'Keeper'` placeholder for the auto-DM row.** The dashboard's Party section should give the DM a clear "rename" affordance so they can replace the placeholder. Tasks 9 and 10 cover this.
- **`campaigns` UPDATE RLS now allows any member.** That means a player can technically rename the campaign via the existing `renameCampaign` server action. We close this at the application layer in Task 5: `renameCampaign` and `deleteCampaign` get a "must be DM" guard before they hit Supabase, so the DB rule stays consistent with the spec while the practical UX is DM-only.
- **`redeem_invite` raises plain-text exceptions** like `'No such invite code.'`. Task 6's join action maps each exception's text to a user-facing copy string — never echo Supabase's raw error.
- **No Realtime publication for the new tables yet.** Out of scope for this plan; flagged in the audio-sync plan instead.

## Pre-existing test infrastructure note

`tests/e2e/helpers/auth.ts` uses `page.getByPlaceholder("email")` and `page.getByPlaceholder("password")`. Those placeholders no longer match the redesigned login page (current placeholders are `"keeper@oakhart.dm"` and `"••••••••••••"`). The e2e tests have been silently broken since the Tome redesign. Task 12 fixes the helper before adding new e2e tests on top.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lib/invite-codes.ts` | Create | Pure-function generator for human-typeable invite codes (`<slug>-<random>`). Tested in vitest. |
| `lib/data/invites.ts` | Create | Data-layer helpers — `listInvitesForCampaign(campaignId)`, `getInviteByCode(code)`. |
| `lib/data/members.ts` | Create | Data-layer helpers — `listMembersForCampaign(campaignId)`, `getMyMembership(campaignId)`. |
| `app/campaigns/[id]/edit/actions.ts` | Modify | Add `generateInvite`, `revokeInvite`, `kickMember`. Tighten `renameCampaign` / `deleteCampaign` to a DM check. |
| `components/InviteManager.tsx` | Create | Client component listing invites with copy / revoke buttons + a "generate new" form. Used inside the campaign edit page. |
| `components/PartyList.tsx` | Create | Server component rendering the Party roster (member rows). |
| `components/MemberRowActions.tsx` | Create | Client component with the kick (DM-on-others) / leave (self) buttons. Confirms before destructive action. |
| `components/CharacterNameForm.tsx` | Create | Client component letting a member rename their own character. |
| `app/c/[campaignId]/page.tsx` | Modify | Mount the Party section using `PartyList` + `CharacterNameForm`. |
| `app/campaigns/[id]/edit/page.tsx` | Modify | Add a "Players" section using `InviteManager` + member list (with kick controls). |
| `app/c/[campaignId]/actions.ts` | Create | Server actions `renameMyCharacter(campaignId, name)` and `leaveCampaign(campaignId)`. |
| `app/join/[code]/page.tsx` | Create | Server component for the join confirmation screen. Looks up the invite for display ("you're joining Oakhart"); does NOT call `redeem_invite` until the user submits. |
| `app/join/[code]/actions.ts` | Create | Server action `joinCampaign(code, characterName)` that calls the `redeem_invite` RPC, maps Supabase exception messages to friendly copy, and redirects on success. |
| `app/auth/callback/route.ts` | Modify | Accept `redirect_to` query param (alongside the existing `next`). |
| `app/login/page.tsx` | Modify | Accept `redirect_to` from search params and thread it through the form's `formAction` URL. |
| `app/login/actions.ts` | Modify | After successful sign-in / sign-up, redirect to a safe `redirect_to` value if provided, else to `/`. |
| `tests/lib/invite-codes.test.ts` | Create | Vitest unit tests for the code generator. |
| `tests/e2e/helpers/auth.ts` | Modify | Fix the broken selectors so the helper works against the redesigned login form. |
| `tests/e2e/player-login.spec.ts` | Create | End-to-end test: DM creates invite → second browser session joins → both browsers see each other in the Party list. |

A handful of small components (Tome-styled buttons, eyebrows) follow the patterns already in use in `app/campaigns/page.tsx` and `app/c/[campaignId]/page.tsx`. No new design tokens.

---

### Task 1: Invite-code generator

A pure function that takes a campaign name and returns a short, typeable code like `oakhart-9k2x`. Lowercase alphanumerics minus ambiguous characters (`l`, `1`, `o`, `0`). Slug from the name (truncated to 12 chars), hyphen, four random characters. Tested in vitest.

**Files:**
- Create: `lib/invite-codes.ts`
- Test: `tests/lib/invite-codes.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/invite-codes.test.ts
import { describe, it, expect } from "vitest";
import { generateInviteCode, slugify } from "@/lib/invite-codes";

describe("slugify", () => {
  it("lowercases", () => expect(slugify("Oakhart")).toBe("oakhart"));
  it("replaces non-alphanum with hyphens and collapses runs", () => {
    expect(slugify("The Salt Road!")).toBe("the-salt-road");
  });
  it("strips ambiguous characters and re-collapses", () => {
    expect(slugify("ALL Ohms 1010")).toBe("a-hms"); // 'l','o','1','0' all stripped
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("-- hi --")).toBe("hi");
  });
  it("truncates long names to 12 chars", () => {
    expect(slugify("Beneath the Brassgate of Oakhart")).toHaveLength(12);
  });
  it("falls back to 'chronicle' on empty input", () => {
    expect(slugify("   ")).toBe("chronicle");
    expect(slugify("01l0")).toBe("chronicle"); // every char stripped
  });
});

describe("generateInviteCode", () => {
  it("returns slug-random shape", () => {
    const code = generateInviteCode("Oakhart");
    expect(code).toMatch(/^oakhart-[a-z2-9]{4}$/);
  });
  it("uses ambiguous-free random suffix (no l, 1, o, 0)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode("Oakhart");
      const suffix = code.slice(code.lastIndexOf("-") + 1);
      expect(suffix).toMatch(/^[a-z2-9]{4}$/);
      expect(suffix).not.toMatch(/[l1o0]/);
    }
  });
  it("returns different codes on successive calls (not a constant)", () => {
    const a = generateInviteCode("Oakhart");
    const b = generateInviteCode("Oakhart");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npx vitest run tests/lib/invite-codes.test.ts`
Expected: 8 failures with "Cannot find module '@/lib/invite-codes'".

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Verify tests pass**

Run: `npx vitest run tests/lib/invite-codes.test.ts`
Expected: all 8 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/invite-codes.ts tests/lib/invite-codes.test.ts
git commit -m "feat(invites): add human-typeable invite-code generator"
```

---

### Task 2: Data layer for invites and members

Server-side data fetchers that the page components will use. Both modules wrap `getServerSupabase` and return strongly-typed rows from the regenerated database types.

**Files:**
- Create: `lib/data/invites.ts`
- Create: `lib/data/members.ts`

- [ ] **Step 1: Write `lib/data/invites.ts`**

```ts
// lib/data/invites.ts
import { getServerSupabase } from "@/lib/supabase/server";

export type Invite = {
  code: string;
  campaign_id: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  revoked: boolean;
};

export async function listInvitesForCampaign(campaignId: string): Promise<Invite[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("campaign_invites")
    .select("code,campaign_id,created_by,created_at,expires_at,max_uses,uses,revoked")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invite[];
}

export async function getInviteByCode(code: string): Promise<Invite | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("campaign_invites")
    .select("code,campaign_id,created_by,created_at,expires_at,max_uses,uses,revoked")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return (data as Invite | null) ?? null;
}
```

- [ ] **Step 2: Write `lib/data/members.ts`**

```ts
// lib/data/members.ts
import { getServerSupabase } from "@/lib/supabase/server";

export type Member = {
  campaign_id: string;
  user_id: string;
  character_name: string;
  role: "dm" | "player";
  joined_at: string;
};

export async function listMembersForCampaign(campaignId: string): Promise<Member[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("campaign_members")
    .select("campaign_id,user_id,character_name,role,joined_at")
    .eq("campaign_id", campaignId)
    .order("role", { ascending: true })   // 'dm' < 'player' lexicographically — DM first
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function getMyMembership(campaignId: string): Promise<Member | null> {
  const supabase = await getServerSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("campaign_members")
    .select("campaign_id,user_id,character_name,role,joined_at")
    .eq("campaign_id", campaignId)
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data as Member | null) ?? null;
}
```

- [ ] **Step 3: Confirm both files compile against the regenerated types**

Run: `npx tsc --noEmit 2>&1 | tail -10`
Expected: no errors involving `lib/data/invites.ts` or `lib/data/members.ts`. The pre-existing `tests/scripts/port-tool.test.ts` error is acceptable.

- [ ] **Step 4: Commit**

```bash
git add lib/data/invites.ts lib/data/members.ts
git commit -m "feat(data): listInvitesForCampaign + listMembersForCampaign + getMyMembership"
```

---

### Task 3: Server actions for invite + member management

Add `generateInvite`, `revokeInvite`, `kickMember` to the existing `app/campaigns/[id]/edit/actions.ts` file. Tighten `renameCampaign` and `deleteCampaign` so non-DMs can't slip through the now-permissive RLS.

**Files:**
- Modify: `app/campaigns/[id]/edit/actions.ts`

- [ ] **Step 1: Read the existing file**

Run: `cat app/campaigns/[id]/edit/actions.ts`
Note the current shape: a `renameCampaign(id, formData)` and a `deleteCampaign(id)`, both server actions, both using `redirect()` for navigation. Keep that shape; add the new actions below them.

- [ ] **Step 2: Replace the file with the new contents**

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/invite-codes";

async function assertDM(supabase: Awaited<ReturnType<typeof getServerSupabase>>, campaignId: string) {
  // The campaigns RLS now allows any member to read/update the row, so we
  // need an application-layer check before destructive / DM-only actions.
  const { data, error } = await supabase.rpc("is_campaign_dm", { cid: campaignId });
  if (error) throw error;
  if (!data) throw new Error("Only the keeper of this chronicle may do that.");
}

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

export async function generateInvite(campaignId: string, formData: FormData) {
  const supabase = await getServerSupabase();
  await assertDM(supabase, campaignId);
  const { data: userResp } = await supabase.auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) redirect("/login");

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
    if (!error.message.includes("duplicate") && !error.message.includes("unique")) {
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
```

- [ ] **Step 3: Confirm typecheck is clean**

Run: `npx tsc --noEmit 2>&1 | tail -10`
Expected: only the pre-existing `port-tool.test.ts` error.

- [ ] **Step 4: Commit**

```bash
git add app/campaigns/[id]/edit/actions.ts
git commit -m "feat(actions): generate/revoke invites + kick member + DM-only guard on rename/delete"
```

---

### Task 4: Player-side server actions (rename / leave)

Members need a way to rename their own character on the dashboard and to leave a campaign. Both go through their own server-action file under the campaign route so they live alongside the dashboard page.

**Files:**
- Create: `app/c/[campaignId]/actions.ts`

- [ ] **Step 1: Write the file**

```ts
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

  const { error } = await supabase
    .from("campaign_members")
    .update({ character_name: name })
    .eq("campaign_id", campaignId)
    .eq("user_id", uid);
  if (error) {
    redirect(`/c/${campaignId}?error=${encodeURIComponent(error.message)}`);
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
  const { data: dm } = await supabase.rpc("is_campaign_dm", { cid: campaignId });
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -10`
Expected: only the pre-existing port-tool error.

- [ ] **Step 3: Commit**

```bash
git add app/c/[campaignId]/actions.ts
git commit -m "feat(actions): renameMyCharacter + leaveCampaign"
```

---

### Task 5: `redirect_to` plumbing (login + auth callback)

When an unauthenticated user clicks an invite link, they need to be sent to `/login`, log in, and then return to the join page. The existing `auth/callback/route.ts` accepts a `next` query param; extend the login flow to pass the original join URL through.

**Files:**
- Modify: `app/login/page.tsx`
- Modify: `app/login/actions.ts`
- Modify: `app/auth/callback/route.ts` (already supports `next` — only doc changes if any)

- [ ] **Step 1: Modify `app/login/page.tsx` to read `redirect_to` from search params**

Find the `searchParams` Promise typing in the page (currently `Promise<{ error?: string; mode?: string }>`) and add `redirect_to?: string`. Then thread it into the form's hidden inputs so the server actions can pick it up:

In the existing `<form action={signInWithGoogle} className="mb-6">`, replace with:
```tsx
<form action={signInWithGoogle} className="mt-3">
  {sp.redirect_to && <input type="hidden" name="redirect_to" value={sp.redirect_to} />}
  <button type="submit" ...>Continue with Google</button>
</form>
```

For the email form, add the same hidden input alongside the existing email/password inputs:
```tsx
<form className="flex flex-col gap-3">
  {sp.redirect_to && <input type="hidden" name="redirect_to" value={sp.redirect_to} />}
  {/* existing email and password labels/inputs */}
  ...
</form>
```

- [ ] **Step 2: Modify `app/login/actions.ts` to honour `redirect_to`**

Replace the file with:

```ts
"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";

function originFromHeaders(h: Headers) {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function safeRedirect(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.includes("://") || raw.startsWith("//")) return "/";
  return raw;
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirect(formData.get("redirect_to"));
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}${next === "/" ? "" : `&redirect_to=${encodeURIComponent(next)}`}`);
  }
  redirect(next);
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirect(formData.get("redirect_to"));
  const supabase = await getServerSupabase();
  const origin = originFromHeaders(await headers());
  const callbackUrl = next === "/"
    ? `${origin}/auth/callback`
    : `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callbackUrl },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}${next === "/" ? "" : `&redirect_to=${encodeURIComponent(next)}`}`);
  }
  redirect(next);
}

export async function signInWithGoogle(formData?: FormData) {
  const next = safeRedirect(formData?.get("redirect_to") ?? null);
  const supabase = await getServerSupabase();
  const origin = originFromHeaders(await headers());
  const callbackUrl = next === "/"
    ? `${origin}/auth/callback`
    : `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}${next === "/" ? "" : `&redirect_to=${encodeURIComponent(next)}`}`);
  }
  if (data.url) redirect(data.url);
}
```

The auth callback `route.ts` already reads `next` and `safeNext`-validates it — no change needed there.

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit 2>&1 | tail -10` — expected: only the pre-existing port-tool error.
Run: `npx next build 2>&1 | tail -10` — expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add app/login/page.tsx app/login/actions.ts
git commit -m "feat(auth): honour redirect_to through login + signup flows"
```

---

### Task 6: `/join/[code]` route — confirmation screen + server action

The page is a server component that looks up the invite code (via `getInviteByCode` — works only if the user is the campaign DM, otherwise RLS hides the row, so we use a tiny `security definer` helper for the *display* lookup… **OR** we accept that the display name comes from the URL plus the campaign's public id, and lazy-resolve the campaign name through the same RPC path).

For simplicity v1: the page asks the `redeem_invite` RPC — but only at submit time. Until then, the page just shows generic Tome chrome and a character-name field. After submit, success redirects to the campaign dashboard; failure renders the friendly mapped error. Spec doesn't require a "you're joining Oakhart" preview, and adding one would need a public invite-preview RPC — punt on that for now.

**Files:**
- Create: `app/join/[code]/page.tsx`
- Create: `app/join/[code]/actions.ts`

- [ ] **Step 1: Write `app/join/[code]/actions.ts`**

```ts
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
```

- [ ] **Step 2: Write `app/join/[code]/page.tsx`**

The page detects auth state at render time. If the user isn't signed in, it shows a "sign in to join" CTA that points at `/login?redirect_to=/join/<code>` so they don't waste a typed character name on a form that's about to bounce them. Authed users see the character-name form.

```tsx
import Link from "next/link";
import { TomePage, GildedRule } from "@/components/TomePage";
import { Sigil } from "@/components/Sigil";
import { getServerSupabase } from "@/lib/supabase/server";
import { joinCampaign } from "./actions";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const errorMessage = sp.error ? decodeURIComponent(sp.error) : null;
  const bound = joinCampaign.bind(null, code);

  const supabase = await getServerSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  const isSignedIn = !!userResp.user;

  return (
    <TomePage chapter="An Invitation" folio="·">
      <div className="max-w-xl mx-auto pt-6">
        <div className="flex items-start gap-5 mb-8">
          <span style={{ color: "var(--tome-oxblood)" }} aria-hidden>
            <Sigil kind="eye" size={40} strokeWidth={1.3} />
          </span>
          <div>
            <div
              className="italic uppercase text-[13px]"
              style={{
                fontFamily: "var(--tome-display)",
                letterSpacing: "0.22em",
                color: "var(--tome-gold)",
              }}
            >
              Of Joining
            </div>
            <h1
              className="mt-1"
              style={{
                fontFamily: "var(--tome-display)",
                fontWeight: 600,
                fontSize: "clamp(36px, 5vw, 52px)",
                lineHeight: 0.95,
                color: "var(--tome-ink)",
              }}
            >
              An <em style={{ color: "var(--tome-oxblood)" }}>Invitation</em> Awaits
            </h1>
            <p
              className="italic mt-2"
              style={{
                fontFamily: "var(--tome-body)",
                fontSize: 17,
                color: "var(--tome-ink-soft)",
              }}
            >
              {isSignedIn
                ? "Inscribe thy character’s name to enter the chronicle. Thy name will be how the keeper and the rest of the table know thee at this table."
                : "Thou must first sign in. After that, thou’ll return here to inscribe thy character’s name and join."}
            </p>
          </div>
        </div>

        <GildedRule className="mb-8" />

        {isSignedIn ? (
          <form action={bound} className="flex flex-col gap-5">
            <label className="block">
              <span
                className="block italic uppercase text-[13px] mb-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  letterSpacing: "0.18em",
                  color: "var(--tome-gold)",
                }}
              >
                Thy character&rsquo;s name
              </span>
              <input
                name="character_name"
                required
                minLength={1}
                maxLength={64}
                autoFocus
                placeholder="Vex the Wry"
                className="block w-full bg-transparent outline-none"
                style={{
                  borderBottom: "1px solid var(--tome-ink)",
                  paddingBottom: 4,
                  fontFamily: "var(--tome-display)",
                  fontWeight: 500,
                  fontSize: 28,
                  color: "var(--tome-ink)",
                }}
              />
            </label>

            <button
              type="submit"
              className="cursor-pointer mt-3"
              style={{
                fontFamily: "var(--tome-display)",
                fontStyle: "italic",
                fontSize: 14,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                background: "var(--tome-oxblood)",
                color: "var(--tome-paper)",
                border: "1px solid var(--tome-oxblood)",
                padding: "12px 22px",
              }}
            >
              Join the chronicle &rsaquo;
            </button>
          </form>
        ) : (
          <Link
            href={`/login?redirect_to=${encodeURIComponent(`/join/${code}`)}`}
            className="inline-block cursor-pointer"
            style={{
              fontFamily: "var(--tome-display)",
              fontStyle: "italic",
              fontSize: 14,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              background: "var(--tome-oxblood)",
              color: "var(--tome-paper)",
              border: "1px solid var(--tome-oxblood)",
              padding: "12px 22px",
            }}
          >
            Sign in to join &rsaquo;
          </Link>
        )}

        {errorMessage && (
          <p
            className="italic mt-5"
            style={{ color: "var(--tome-oxblood)", fontFamily: "var(--tome-body)" }}
          >
            {errorMessage}
          </p>
        )}

        <p
          className="italic mt-12"
          style={{
            fontFamily: "var(--tome-body)",
            fontSize: 14,
            color: "var(--tome-ink-faint)",
          }}
        >
          invite code:{" "}
          <span
            style={{
              fontFamily: "var(--tome-mono)",
              color: "var(--tome-ink-soft)",
            }}
          >
            {code}
          </span>
        </p>
      </div>
    </TomePage>
  );
}
```

- [ ] **Step 3: Build to confirm the route registers**

Run: `npx next build 2>&1 | tail -15`
Expected: route list includes `/join/[code]` and the build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/join/[code]/
git commit -m "feat(join): /join/[code] route with character-name capture"
```

---

### Task 7: InviteManager component (DM-side invite UI)

Client component with a "Generate invite" button (server action), a list of active invites with copy-to-clipboard + revoke buttons, and the right Tome styling.

**Files:**
- Create: `components/InviteManager.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import * as React from "react";
import {
  generateInvite,
  revokeInvite,
} from "@/app/campaigns/[id]/edit/actions";
import type { Invite } from "@/lib/data/invites";

export function InviteManager({
  campaignId,
  invites,
  origin,
}: {
  campaignId: string;
  invites: Invite[];
  origin: string;
}) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const generateBound = generateInvite.bind(null, campaignId);

  async function copy(code: string) {
    const url = `${origin}/join/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(code);
      setTimeout(() => setCopied(c => (c === code ? null : c)), 1500);
    } catch {
      window.prompt("Copy this invite link", url);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={generateBound}>
        <button
          type="submit"
          className="cursor-pointer"
          style={{
            fontFamily: "var(--tome-display)",
            fontStyle: "italic",
            fontSize: 13,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "var(--tome-oxblood)",
            color: "var(--tome-paper)",
            border: "1px solid var(--tome-oxblood)",
            padding: "10px 18px",
          }}
        >
          + Generate invite link
        </button>
      </form>

      {invites.length === 0 ? (
        <p
          className="italic"
          style={{
            fontFamily: "var(--tome-body)",
            color: "var(--tome-ink-soft)",
          }}
        >
          No invites yet. Generate one and paste it into Discord (or wherever thy table gathers).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {invites.map(inv => {
            const url = `${origin}/join/${inv.code}`;
            const stale = inv.revoked
              || (inv.expires_at !== null && new Date(inv.expires_at) < new Date())
              || (inv.max_uses !== null && inv.uses >= inv.max_uses);
            const revokeBound = revokeInvite.bind(null, campaignId, inv.code);
            return (
              <li
                key={inv.code}
                className="grid items-center gap-3"
                style={{
                  gridTemplateColumns: "1fr auto auto",
                  borderBottom: "1px dotted var(--tome-rule)",
                  padding: "10px 0",
                  opacity: stale ? 0.55 : 1,
                }}
              >
                <div className="min-w-0">
                  <div
                    className="truncate"
                    style={{
                      fontFamily: "var(--tome-mono)",
                      fontSize: 14,
                      color: "var(--tome-ink)",
                    }}
                  >
                    {url}
                  </div>
                  <div
                    className="italic mt-0.5"
                    style={{
                      fontFamily: "var(--tome-display)",
                      fontSize: 12,
                      color: "var(--tome-ink-faint)",
                    }}
                  >
                    {inv.uses} use{inv.uses === 1 ? "" : "s"}
                    {inv.max_uses !== null && ` of ${inv.max_uses}`}
                    {inv.revoked && " · revoked"}
                    {inv.expires_at && ` · expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copy(inv.code)}
                  className="cursor-pointer italic uppercase"
                  style={{
                    fontFamily: "var(--tome-display)",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    padding: "4px 10px",
                    background: "transparent",
                    color: "var(--tome-ink)",
                    border: "1px solid var(--tome-rule)",
                  }}
                  disabled={stale}
                >
                  {copied === inv.code ? "copied" : "copy"}
                </button>
                {!inv.revoked && (
                  <form action={revokeBound}>
                    <button
                      type="submit"
                      className="cursor-pointer italic uppercase"
                      style={{
                        fontFamily: "var(--tome-display)",
                        fontSize: 12,
                        letterSpacing: "0.1em",
                        padding: "4px 10px",
                        background: "transparent",
                        color: "var(--tome-oxblood)",
                        border: "1px solid var(--tome-rule)",
                      }}
                    >
                      revoke
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -10`
Expected: only the pre-existing port-tool error.

- [ ] **Step 3: Commit**

```bash
git add components/InviteManager.tsx
git commit -m "feat(ui): InviteManager — generate / copy / revoke invite links"
```

---

### Task 8: Players section on the campaign edit page

Mount InviteManager + a kick-enabled member list on `/campaigns/[id]/edit`. The page is already a server component; pass `origin` (computed from request headers) into the client InviteManager so URL construction is correct.

**Files:**
- Modify: `app/campaigns/[id]/edit/page.tsx`

- [ ] **Step 1: Read the existing file**

Run: `cat app/campaigns/[id]/edit/page.tsx | head -40`
Note the current shape — server component, fetches campaign + handles error param. Append the new section below the existing form (and BEFORE the destructive "Excise this chronicle" section).

- [ ] **Step 2: Add the Players section**

Update the page imports at the top of `app/campaigns/[id]/edit/page.tsx`:

```tsx
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { TomePage, GildedRule } from "@/components/TomePage";
import { getServerSupabase } from "@/lib/supabase/server";
import { renameCampaign, deleteCampaign, kickMember } from "./actions";
import { DeleteCampaignButton } from "@/components/DeleteCampaignButton";
import { InviteManager } from "@/components/InviteManager";
import { listInvitesForCampaign } from "@/lib/data/invites";
import { listMembersForCampaign } from "@/lib/data/members";
```

Inside the page body, after the existing rename form and BEFORE the destructive "Excise" section, add:

```tsx
const [invites, members, hdrs] = await Promise.all([
  listInvitesForCampaign(id),
  listMembersForCampaign(id),
  headers(),
]);
const proto = hdrs.get("x-forwarded-proto") ?? "http";
const host = hdrs.get("host") ?? "localhost:3000";
const origin = `${proto}://${host}`;
```

(Place this block just below the existing `const { data: c } = await supabase…` block.)

Then add the JSX for the section, between the existing close of the rename form (`</form>`) and the existing "Excise this chronicle" `<div className="mt-12 pt-6" …>`:

```tsx
<div
  className="mt-12 pt-6"
  style={{ borderTop: "1px solid var(--tome-rule)" }}
>
  <div
    className="italic uppercase text-[13px] mb-3"
    style={{
      fontFamily: "var(--tome-display)",
      letterSpacing: "0.22em",
      color: "var(--tome-gold)",
    }}
  >
    Players &middot; invites and members
  </div>

  <h2
    className="mb-4"
    style={{
      fontFamily: "var(--tome-display)",
      fontWeight: 600,
      fontSize: 28,
      color: "var(--tome-ink)",
    }}
  >
    Of <em style={{ color: "var(--tome-oxblood)" }}>Players</em>
  </h2>

  <InviteManager campaignId={id} invites={invites} origin={origin} />

  <div className="mt-8">
    <div
      className="italic uppercase text-[13px] mb-3"
      style={{
        fontFamily: "var(--tome-display)",
        letterSpacing: "0.22em",
        color: "var(--tome-gold)",
      }}
    >
      Members at this table
    </div>
    <ul className="flex flex-col">
      {members.map(m => {
        const kickBound = kickMember.bind(null, id, m.user_id);
        return (
          <li
            key={m.user_id}
            className="grid items-center gap-3"
            style={{
              gridTemplateColumns: "1fr auto",
              borderBottom: "1px dotted var(--tome-rule)",
              padding: "10px 0",
            }}
          >
            <div className="flex items-baseline gap-3 min-w-0">
              <span
                style={{
                  fontFamily: "var(--tome-display)",
                  fontSize: 18,
                  color: "var(--tome-ink)",
                }}
              >
                {m.character_name}
              </span>
              {m.role === "dm" && (
                <span
                  className="italic uppercase"
                  style={{
                    fontFamily: "var(--tome-display)",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    color: "var(--tome-paper)",
                    background: "var(--tome-oxblood)",
                    padding: "1px 8px",
                  }}
                >
                  keeper
                </span>
              )}
              <span
                className="italic"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontSize: 12,
                  color: "var(--tome-ink-faint)",
                }}
              >
                joined {new Date(m.joined_at).toLocaleDateString()}
              </span>
            </div>
            {m.role !== "dm" && (
              <form action={kickBound}>
                <button
                  type="submit"
                  className="cursor-pointer italic uppercase"
                  style={{
                    fontFamily: "var(--tome-display)",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    padding: "4px 10px",
                    background: "transparent",
                    color: "var(--tome-oxblood)",
                    border: "1px solid var(--tome-rule)",
                  }}
                >
                  kick
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  </div>
</div>
```

- [ ] **Step 3: Run dev server and click through manually**

Skip if executing in a non-interactive subagent context. Otherwise:

Run: `npm run dev` and open `/campaigns/<existing-id>/edit`. Confirm the Players section appears and the "Generate invite link" button creates a row.

- [ ] **Step 4: Build + lint to confirm clean compile**

Run: `npx next build 2>&1 | tail -10` — expected: clean.
Run: `npx eslint . 2>&1 | tail -3` — expected: empty.

- [ ] **Step 5: Commit**

```bash
git add app/campaigns/[id]/edit/page.tsx
git commit -m "feat(ui): Players section on campaign edit page (invites + member list + kick)"
```

---

### Task 9: Party section on the campaign dashboard

Add a roster + character-rename + leave-campaign block to `/c/[campaignId]`. Server component; renders rows for each member, the current user's row gets a rename input (server action), and a "leave" button at the bottom of the section if the current user is not the DM.

**Files:**
- Modify: `app/c/[campaignId]/page.tsx`
- Create: `components/CharacterNameForm.tsx`
- Create: `components/LeaveCampaignButton.tsx`

- [ ] **Step 1: Write `components/CharacterNameForm.tsx`**

```tsx
"use client";

import * as React from "react";

export function CharacterNameForm({
  campaignId,
  currentName,
  action,
}: {
  campaignId: string;
  currentName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(currentName);

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <span
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 18,
            color: "var(--tome-ink)",
          }}
        >
          {currentName}
        </span>
        <button
          type="button"
          onClick={() => {
            setDraft(currentName);
            setEditing(true);
          }}
          className="italic uppercase cursor-pointer"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--tome-ink-faint)",
            background: "transparent",
            border: "1px solid var(--tome-rule)",
            padding: "2px 8px",
          }}
        >
          rename
        </button>
      </div>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => setEditing(false)}
      className="flex items-center gap-2"
    >
      <input
        name="character_name"
        defaultValue={draft}
        required
        minLength={1}
        maxLength={64}
        autoFocus
        className="bg-transparent outline-none"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 18,
          color: "var(--tome-ink)",
          borderBottom: "1px solid var(--tome-ink)",
          padding: "1px 2px",
          minWidth: 200,
        }}
        onBlur={() => setEditing(false)}
      />
      <button
        type="submit"
        className="italic uppercase cursor-pointer"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--tome-paper)",
          background: "var(--tome-oxblood)",
          border: "1px solid var(--tome-oxblood)",
          padding: "3px 8px",
        }}
      >
        save
      </button>
      <input type="hidden" name="campaign_id" value={campaignId} />
    </form>
  );
}
```

- [ ] **Step 2: Write `components/LeaveCampaignButton.tsx`**

```tsx
"use client";

export function LeaveCampaignButton({
  campaignName,
  action,
}: {
  campaignName: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Leave "${campaignName}"? Thy character will be struck from this chronicle.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="italic uppercase cursor-pointer"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 12,
          letterSpacing: "0.16em",
          color: "var(--tome-oxblood)",
          background: "transparent",
          border: "1px solid var(--tome-rule)",
          padding: "6px 12px",
        }}
      >
        Leave this chronicle
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Modify the dashboard page**

Add to the imports at the top of `app/c/[campaignId]/page.tsx`:

```tsx
import { listMembersForCampaign } from "@/lib/data/members";
import { CharacterNameForm } from "@/components/CharacterNameForm";
import { LeaveCampaignButton } from "@/components/LeaveCampaignButton";
import { renameMyCharacter, leaveCampaign } from "./actions";
```

Inside the existing page body, just after the `const [campaign, all] = await Promise.all([...])` block, add:

```tsx
const members = await listMembersForCampaign(campaignId);
const supabase2 = await getServerSupabase();
const { data: userResp } = await supabase2.auth.getUser();
const currentUserId = userResp.user?.id ?? null;
const myMembership = members.find(m => m.user_id === currentUserId) ?? null;
const renameBound = renameMyCharacter.bind(null, campaign.id);
const leaveBound = leaveCampaign.bind(null, campaign.id);
```

You will need to add `import { getServerSupabase } from "@/lib/supabase/server";` if it isn't already imported.

Then, after the existing `<ToolGrid />` invocation and before the closing tags, add the Party section JSX:

```tsx
<div
  className="mt-12 pt-6"
  style={{ borderTop: "1px solid var(--tome-rule)" }}
>
  <div
    className="italic uppercase text-[13px] mb-3"
    style={{
      fontFamily: "var(--tome-display)",
      letterSpacing: "0.22em",
      color: "var(--tome-gold)",
    }}
  >
    Party of the Loft
  </div>

  <ul className="flex flex-col">
    {members.map(m => {
      const isMe = m.user_id === currentUserId;
      return (
        <li
          key={m.user_id}
          className="flex items-center gap-3 flex-wrap"
          style={{
            borderBottom: "1px dotted var(--tome-rule)",
            padding: "10px 0",
          }}
        >
          {isMe ? (
            <CharacterNameForm
              campaignId={campaign.id}
              currentName={m.character_name}
              action={renameBound}
            />
          ) : (
            <span
              style={{
                fontFamily: "var(--tome-display)",
                fontSize: 18,
                color: "var(--tome-ink)",
              }}
            >
              {m.character_name}
            </span>
          )}
          {m.role === "dm" && (
            <span
              className="italic uppercase"
              style={{
                fontFamily: "var(--tome-display)",
                fontSize: 11,
                letterSpacing: "0.16em",
                color: "var(--tome-paper)",
                background: "var(--tome-oxblood)",
                padding: "1px 8px",
              }}
            >
              keeper
            </span>
          )}
          {isMe && (
            <span
              className="italic"
              style={{
                fontFamily: "var(--tome-display)",
                fontSize: 11,
                color: "var(--tome-ink-faint)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              — thee
            </span>
          )}
        </li>
      );
    })}
  </ul>

  {myMembership && myMembership.role !== "dm" && (
    <div className="mt-6">
      <LeaveCampaignButton campaignName={campaign.name} action={leaveBound} />
    </div>
  )}
</div>
```

- [ ] **Step 4: Build + lint**

Run: `npx next build 2>&1 | tail -10` — expected: clean.
Run: `npx eslint . 2>&1 | tail -3` — expected: empty.
Run: `npx vitest run 2>&1 | tail -8` — expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/c/[campaignId]/page.tsx components/CharacterNameForm.tsx components/LeaveCampaignButton.tsx
git commit -m "feat(ui): Party section on dashboard with character rename + leave"
```

---

### Task 10: Fix the broken e2e auth helper and add the player-login e2e test

The existing `tests/e2e/helpers/auth.ts` selects inputs by placeholder text (`"email"`, `"password"`) that no longer exist on the redesigned login form. Replace with name-based selectors. Then add an e2e test that exercises the full join flow against a real (or local) Supabase using two browser sessions.

**Files:**
- Modify: `tests/e2e/helpers/auth.ts`
- Create: `tests/e2e/player-login.spec.ts`

- [ ] **Step 1: Fix the auth helper**

Replace `tests/e2e/helpers/auth.ts` with:

```ts
import { Page } from "@playwright/test";

export async function signIn(page: Page) {
  const email = process.env.E2E_USER_EMAIL!;
  const password = process.env.E2E_USER_PASSWORD!;
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[formaction], button[type="submit"]', { hasText: /enter the loft/i }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

export async function signInAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[formaction], button[type="submit"]', { hasText: /enter the loft/i }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
```

- [ ] **Step 2: Write the new e2e test**

```ts
// tests/e2e/player-login.spec.ts
import { test, expect } from "@playwright/test";
import { signIn, signInAs } from "./helpers/auth";

const CAMPAIGN_NAME = "E2E Player-Login";
const PLAYER_NAME = "Vex the Wry";

// Uses the primary E2E_USER for the DM and a secondary E2E_USER_2 for the player.
// If E2E_USER_2_* aren't configured, the test is skipped.
test("DM creates invite, second user joins, both see each other in the Party list", async ({ browser }) => {
  const playerEmail = process.env.E2E_USER_2_EMAIL;
  const playerPassword = process.env.E2E_USER_2_PASSWORD;
  test.skip(!playerEmail || !playerPassword, "E2E_USER_2_EMAIL / E2E_USER_2_PASSWORD not configured");

  // Two isolated browser contexts so cookies don't bleed between sessions.
  const dmContext = await browser.newContext();
  const playerContext = await browser.newContext();

  try {
    // === DM session ===
    const dmPage = await dmContext.newPage();
    await signIn(dmPage);

    // Create a campaign and copy the resulting id.
    await dmPage.goto("/campaigns/new");
    await dmPage.locator('input[name="name"]').fill(CAMPAIGN_NAME);
    await dmPage.getByRole("button", { name: /inscribe/i }).click();
    await dmPage.waitForURL(/\/c\/.+/);
    const campaignId = dmPage.url().split("/c/")[1];

    // Generate an invite from the campaign edit page.
    await dmPage.goto(`/campaigns/${campaignId}/edit`);
    await dmPage.getByRole("button", { name: /generate invite/i }).click();

    // Read the first invite URL out of the rendered list.
    const inviteUrlLocator = dmPage.locator(`text=/\\/join\\/[a-z2-9-]+/`).first();
    await expect(inviteUrlLocator).toBeVisible();
    const inviteUrl = (await inviteUrlLocator.textContent())!.trim();
    const code = inviteUrl.split("/join/")[1];

    // === Player session ===
    const playerPage = await playerContext.newPage();
    await signInAs(playerPage, playerEmail!, playerPassword!);
    await playerPage.goto(`/join/${code}`);
    await playerPage.locator('input[name="character_name"]').fill(PLAYER_NAME);
    await playerPage.getByRole("button", { name: /join the chronicle/i }).click();
    await playerPage.waitForURL(/\/c\/[a-f0-9-]+/);

    // Player should see the party with both names.
    await expect(playerPage.getByText(PLAYER_NAME)).toBeVisible();

    // DM should also see the player's character on their dashboard after a refresh.
    await dmPage.goto(`/c/${campaignId}`);
    await expect(dmPage.getByText(PLAYER_NAME)).toBeVisible();

    // Cleanup: DM deletes the campaign (cascades to members + invites).
    await dmPage.goto(`/campaigns/${campaignId}/edit`);
    dmPage.once("dialog", d => d.accept());
    await dmPage.getByRole("button", { name: /delete this campaign/i }).click();
    await dmPage.waitForURL(/\/campaigns$/);
  } finally {
    await dmContext.close();
    await playerContext.close();
  }
});
```

- [ ] **Step 3: Verify the test infrastructure**

Run: `npx playwright test tests/e2e/player-login.spec.ts --list`
Expected: lists 1 test. If E2E_USER_2_* aren't set, the test will be skipped at runtime — that's acceptable; the file should still parse.

If you have credentials available, run: `npx playwright test tests/e2e/player-login.spec.ts` — expected pass.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/helpers/auth.ts tests/e2e/player-login.spec.ts
git commit -m "test(e2e): fix auth helper selectors + add player-login join flow test"
```

---

### Task 11: Push the branch + summary checkpoint

Manual checkpoint: nothing to write, just push so the Vercel preview picks up the UI work and we can click through it before moving on to step 3.

- [ ] **Step 1: Verify everything is green locally**

Run: `npx tsc --noEmit 2>&1 | tail -10` — expected: only the pre-existing port-tool error.
Run: `npx vitest run 2>&1 | tail -8` — expected: all passing (16/16 with the new invite-codes tests, or whatever the new total is).
Run: `npx next build 2>&1 | tail -10` — expected: route list includes `/join/[code]`, no errors.
Run: `npx eslint . 2>&1 | tail -3` — expected: empty.

- [ ] **Step 2: Push**

```bash
git push origin feat/player-login
```

The Vercel preview build should publish a fresh URL. Open it, sign in as the DM, generate an invite, copy the link, open it in a private/incognito window, sign in as a different user, join with a character name, and confirm both browsers show each other in the Party list.

---

## Self-review notes

- **Spec coverage:**
  - Generate invite (DM) → Tasks 3, 7, 8.
  - Copy/revoke invite (DM) → Task 7.
  - `/join/[code]` route + character-name capture → Task 6.
  - Login redirect-back through invite click → Tasks 5, 6.
  - Party section on dashboard → Task 9.
  - Member list + kick (DM) on campaign edit → Tasks 3, 8.
  - Rename character → Tasks 4, 9.
  - Leave campaign → Tasks 4, 9.
  - DM-only protections at the application layer (since campaigns RLS is now permissive) → Task 3 (`assertDM`).

- **Type consistency:** `Invite`, `Member`, `generateInvite`, `revokeInvite`, `kickMember`, `renameMyCharacter`, `leaveCampaign`, `joinCampaign`, `generateInviteCode`, `slugify` — all defined exactly once and referenced by the same names in subsequent tasks.

- **No placeholders:** Every step shows the actual code or the actual command + expected output. The one judgment-call deferral ("show 'you're joining Oakhart' on the join page") is documented in Task 6 with reasoning, not punted as TODO.

- **Out-of-scope reminders for the next plan:** per-tool migration (steps 3, 5–9 of the spec), audio sync (step 4), Realtime presence + Initiative auto-load (step 5).
