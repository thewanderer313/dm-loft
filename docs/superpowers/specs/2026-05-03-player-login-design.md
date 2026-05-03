# Player login & shared-state tools

Design doc for the `feat/player-login` branch.

## Goals

Add player accounts to the DM Loft so players can join campaigns and use the
tools alongside the DM in real time. Existing tools (initiative, time & moon,
reputation, battle map, roll tables, rules reference) shift from per-browser
`localStorage` state to Postgres-backed shared state so two browsers in the
same campaign see the same combatants, the same calendar, the same factions.

The Audio Library gains a per-campaign **DM-driven playback** layer: the DM
picks a track and every member of the campaign hears it on their own speakers.

## Non-goals

The following are deliberately *not* in scope for this update and are backlog:

- **D&D Beyond character sheet import** into the Initiative Tracker. Saved
  in memory; revisit after this ships.
- **Per-tool permission gates** (e.g. "only the DM can edit the calendar").
  Day-one, members can edit anything except DM-driven music. We tighten only
  if play surfaces a problem.
- **Multiple DMs per campaign**. The campaign creator is the sole DM. The
  membership table has a `role` column to leave room, but no UI for promoting.
- **Public/discoverable campaigns**. All joining is via invite code.
- **DM-private surfaces** (notes, hidden monster HP, secret faction info).
  Everything is shared.

## Vocabulary

- **DM** — the user who created the campaign. Stored in `campaigns.dm_id`. Has
  a corresponding `campaign_members` row with `role='dm'`.
- **Player** — any campaign member who is not the DM. `role='player'`.
- **Member** — DM or player. Used when a rule applies to anyone in the campaign.
- **Character name** — a campaign-specific display name a member chose when
  they joined. Members of campaign A and campaign B may have different names.

## Data model

All new tables are in the `public` schema.

### `campaign_members`

Tracks who is in which campaign and their per-campaign character name.

```
campaign_members (
  campaign_id    uuid not null → campaigns.id ON DELETE CASCADE
  user_id        uuid not null → auth.users.id ON DELETE CASCADE
  character_name text not null
  role           text not null check (role in ('dm','player'))
  joined_at      timestamptz not null default now()
  primary key (campaign_id, user_id)
);
create index campaign_members_user_id on campaign_members (user_id);
```

When a campaign is created, a row with `role='dm'` is auto-inserted via
trigger so the DM is also a member.

### `campaign_invites`

Short codes the DM hands out to bring players in.

```
campaign_invites (
  code        text primary key,                          -- e.g. "oakhart-9k2x"
  campaign_id uuid not null → campaigns.id ON DELETE CASCADE,
  created_by  uuid not null → auth.users.id,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz null,                          -- null = no expiry
  max_uses    int null,                                  -- null = unlimited
  uses        int not null default 0,
  revoked     boolean not null default false
);
create index campaign_invites_campaign_id on campaign_invites (campaign_id);
```

The code generator builds `<campaign-slug>-<random>` strings (lowercase, no
ambiguous characters) so the codes are typeable.

Redemption goes through an RPC: `redeem_invite(code text) returns uuid`
(the campaign id), `security definer`. The function checks `revoked`,
`expires_at`, `max_uses`, increments `uses`, and inserts into
`campaign_members`. Using `security definer` lets a non-member execute the
join even though they can't read the invites table directly.

### `campaign_playback`

One row per campaign. Holds the DM's currently-driven track.

```
campaign_playback (
  campaign_id  uuid primary key → campaigns.id ON DELETE CASCADE,
  track_id     uuid null → tracks.id ON DELETE SET NULL,
  started_at   timestamptz null,
  is_playing   boolean not null default false,
  updated_by   uuid not null → auth.users.id,
  updated_at   timestamptz not null default now()
);
```

Subscribed to via Supabase Realtime. When the DM updates the row, every
member's `AudioPlayerProvider` reacts.

`started_at` is server-set when `is_playing` flips true. Latecomers can use
it to seek roughly into the track if we want; v1 just plays from the start
on join, which is simpler and avoids drift problems.

### Per-tool state tables

One bucket per tool. The exact column lists below are starting points; each
tool migration step (5–9 in the implementation order) gets its own short
design pass to confirm the schema before writing code. The shape across all
of them is the same: scoped by `campaign_id`, accessed under a single
membership-based RLS policy, optionally subscribed to via Realtime.

- `initiative_combatants(id, campaign_id, name, hp, max_hp, initiative,
  source_user_id null, sort_order, ...)` — `source_user_id` non-null marks
  a row that came from a player; cascades when the membership row is deleted.
- `time_moon_state(campaign_id pk, current_day, current_hour, current_minute,
  ...)` and `time_moon_entries(id, campaign_id, day, kind, body, ...)`.
- `factions(id, campaign_id, name, ...)` and
  `reputation_levels(id, campaign_id, faction_id, settlement, value, ...)`.
- `battle_map_state(campaign_id pk, ...)` and
  `battle_map_tokens(id, campaign_id, kind, x, y, ...)`.
- `roll_tables(id, campaign_id, name, ...)` and
  `roll_table_entries(id, table_id, weight, body, ...)`.
- `rules_marginalia(id, campaign_id, article_id, body, author_user_id,
  created_at)` — Rules content stays mostly static; this is per-campaign
  bookmarks/notes.

### Tweaks to existing tables

- `tracks.dm_id` → renamed to `tracks.uploader_id` for clarity. No behaviour
  change. RLS continues to be "any authenticated user can SELECT/INSERT,
  uploader can UPDATE/DELETE."
- `dm_profiles` → renamed to `user_profiles`. The current name is misleading
  now that signed-up users may be either DMs or players. Schema unchanged
  (`id`, `display_name`, `created_at`); the existing `handle_new_user`
  trigger that auto-inserts a row on auth.users insert keeps working
  for both DMs and players.
- `campaigns`: no schema change. The `dm_id` column stays as the campaign
  creator/owner; membership is layered on via `campaign_members`.

## Row-level security

A new SQL helper, used everywhere:

```sql
create or replace function public.is_campaign_member(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.campaign_members
    where campaign_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.is_campaign_dm(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.campaign_members
    where campaign_id = cid and user_id = auth.uid() and role = 'dm'
  );
$$;
```

Policy patterns:

- **`campaigns`** — replace existing "DMs see only their own campaigns"
  policy. New: SELECT/UPDATE if `is_campaign_member(id)`; DELETE if
  `is_campaign_dm(id)`. INSERT unchanged.
- **`campaign_members`** — SELECT if `is_campaign_member(campaign_id)`;
  INSERT/DELETE if `is_campaign_dm(campaign_id)` *or* the row is the
  caller's own. (Letting users delete their own row = "leave campaign".)
  UPDATE if the row is the caller's own (rename character) or
  `is_campaign_dm(campaign_id)`.
- **`campaign_invites`** — all operations gated on `is_campaign_dm(campaign_id)`.
  Redemption flows through the `redeem_invite` RPC which sidesteps RLS.
- **`campaign_playback`** — SELECT if `is_campaign_member(campaign_id)`;
  INSERT/UPDATE if `is_campaign_dm(campaign_id)`.
- **All per-tool state tables** — SELECT/INSERT/UPDATE/DELETE if
  `is_campaign_member(<table>.campaign_id)`. One short policy on each.
- **`tracks`** — unchanged from current state.

## User-visible flows

### Joining a campaign

1. The DM, on the campaign edit screen, clicks **Generate invite link** in a
   new "Players" section. Result: `https://dmloft.app/join/oakhart-9k2x`,
   one-click copyable. The DM can revoke a code, set an expiry, or cap uses.

2. The DM pastes the link into Discord (or wherever the group hangs out).

3. A player clicks. Two paths:
   - Not signed in → standard login page → after auth, redirected to the
     join confirmation screen.
   - Signed in → straight to the join confirmation screen.

4. **Join confirmation** (`/join/[code]`):

   > *"You've been invited to join the chronicle of **Oakhart** as a player.
   > Inscribe thy character's name to begin."*

   Single field for character name, default empty. Big oxblood **Join the
   chronicle** button. After submit, redirect to the campaign dashboard.

5. **Campaign dashboard** gains a "Party" section: one row per member, with
   character name + role badge (DM badge in oxblood). The DM's row has a
   pencil-icon link to invite management; each player's row has a "leave"
   action (only on their own row).

6. The Tools grid is unchanged from the player's perspective — the same
   seven instruments are available, opening the same shared state.

### Member management (DM-side)

A new "Players" tab on `/campaigns/[id]/edit`:

- Active invite codes (with copy / revoke / per-code stats).
- "Generate new invite" with optional expiry + max-uses.
- Member list: character name, role, joined date, kick button.

Kicking deletes the member's row, which cascades to:

- Their `initiative_combatants` rows (where `source_user_id` matches them).
- Their `rules_marginalia` rows authored by them.

### Member management (player-side)

A small section on the campaign dashboard or in `/settings`:

- Rename my character (per campaign).
- Leave campaign (delete my own `campaign_members` row).

### DM-driven audio playback

1. **DM in the Audio Library hits play** on a track. Client writes to
   `campaign_playback` (track_id, is_playing=true, started_at=now,
   updated_by=DM). RLS enforces DM-only writes.

2. **All members subscribed to that campaign's playback channel** receive
   the Realtime event in their `AudioPlayerProvider`. Their provider:
   - Generates a signed URL for the track (8h TTL),
   - Loads it into the local audio element,
   - Calls `play()`.

3. **First-time autoplay gate** — the browser blocks autoplay until the
   user has interacted with the page. Players see a small persistent
   "*Tap to follow the DM's music — opt out and stay muted by ignoring*"
   toast/button at session start. Once tapped, audio is unblocked for
   the rest of the session and subsequent track changes autoplay
   automatically. This is a feature, not a workaround: it lets players
   choose between full ambience and quiet on a per-session basis.

4. **DM hits pause** → `is_playing=false` propagates → all listeners pause.

5. **DM picks a different track** → replaces what's playing on every
   listener. New tracks override any local pause: a new track from the DM
   is interpreted as a fresh DM gesture.

6. **Player local override** — pause / volume / seek changes affect only
   their browser; never written back. If the DM is still streaming, hitting
   play again resumes from the position the player paused at, not the DM's
   current position. (Acceptable v1 behaviour; we can revisit if it feels
   wrong at the table.)

7. **Player navigates between campaigns** — their playback subscription
   follows the campaign they're currently viewing. The audio bar empties
   if they're not viewing a campaign.

8. **DM's browser closes** → music keeps playing on members' ends until
   the track finishes or another DM action arrives. Stops are explicit.

### Presence + Initiative auto-load

Each signed-in user joins one Realtime presence channel per campaign they're
a member of. Presence drops when the tab closes, the network dies, or a
heartbeat is missed.

When the DM opens the **Initiative Tracker** for a campaign:

- If `initiative_combatants` for that campaign is **empty** (no combat in
  progress), the tracker auto-creates one combatant per **online member**
  using their character name. HP/initiative are blank, ready for input.
- If combatants already exist, no auto-load. Existing combat is preserved.
- A "**refresh from party**" button re-runs the auto-load: adds online
  members not yet in the list. It does NOT remove combatants who've gone
  offline mid-combat — that decision stays with the DM (they can manually
  remove anyone via the row's existing controls).
- A player who **leaves or is kicked mid-combat** has their combatant row
  cascade-deleted automatically.
- A player going **offline mid-combat** stays in the encounter. (No combat
  interruption from a wifi blip.)

## Realtime architecture

Three kinds of channel per campaign:

1. **Playback channel** — Postgres changes feed on `campaign_playback`
   row matching `campaign_id=X`. Used by `AudioPlayerProvider`.

2. **Tool state channels** — Postgres changes feed for the live tools
   (Initiative, Time & Moon, Battle Map). Each tool subscribes to its
   own table(s) filtered by `campaign_id=X` and patches local state on
   change. Reputation, Roll Tables, and Rules Reference do not subscribe
   — they re-fetch on focus.

3. **Presence channel** — Supabase Realtime presence for "who's online
   in this campaign". Used by Initiative auto-load and (potentially) for
   showing "online" dots on the Party list.

The provider hierarchy (mounted in `app/layout.tsx`):

```
<RootLayout>
  <CampaignContextProvider>      // tracks active campaign id from URL
    <PresenceProvider>           // joins presence channel for active campaign
      <AudioPlayerProvider>      // subscribes to playback channel
        {children}
```

Each tool's page subscribes to its own state channel on mount and unsubscribes
on unmount.

## UI changes

- **`app/login/page.tsx`** — no change to the form, but post-auth flow
  changes: if there's a pending `?redirect_to=/join/<code>` query, honour it.

- **`app/join/[code]/page.tsx`** — new route. Server component fetches the
  invite (via the RPC for the auth check) and renders the character-name
  capture screen. POST submits to `joinCampaign(code, characterName)` server
  action.

- **`app/campaigns/[id]/edit/page.tsx`** — adds a "Players" tab/section
  with invite + member management UI.

- **`app/c/[campaignId]/page.tsx`** — adds the "Party" section listing
  members with character names + role badges + online dots.

- **`app/c/[campaignId]/t/<each-tool>/page.tsx`** — six new native pages,
  one per tool, replacing the iframe wrapper for that toolId.

- **`components/AudioPlayerProvider.tsx`** — extended to subscribe to
  `campaign_playback` for the active campaign, render the "tap to follow"
  toast, and gate audio playback on user interaction.

- **`components/Shell.tsx`** — campaign switcher already exists; add an
  online-count badge per campaign in the dropdown if it's not noisy.

- **`public/tools/<id>/`** — deleted in step 10 of the cutover.

## Implementation order

Each numbered step is a commit (or a small series of commits) on
`feat/player-login`. Each is reviewable independently and triggers a Vercel
preview deploy. Because of the size, the writing-plans phase will likely
break this into multiple plan documents — the natural seams are after step
2 (membership infrastructure complete), after step 4 (audio sync done),
after step 5 (Initiative Tracker, the biggest single tool), and at the
final cutover.

1. **Foundation migration** — new tables, RLS rewrites, helper functions,
   `redeem_invite` RPC. Trigger to auto-insert the DM's `campaign_members`
   row on campaign create. No UI changes.

2. **Auth + membership UI** — `/join/[code]`, character-name capture,
   campaign edit "Players" tab with invite/kick/leave, Party section on
   the dashboard. After this, you can already invite players and see them.

3. **First tool migration: Roll Tables** — small state, no realtime, used
   to validate the iframe-→-native conversion plus the new RLS pattern.
   Schema, native page, edit/list UI, gates on `is_campaign_member`.

4. **Audio playback sync** — `campaign_playback`, DM-write from the Audio
   Library, AudioPlayerProvider subscribes to active campaign's row,
   "tap to follow" toast, local pause/volume override.

5. **Initiative Tracker** — schema, native page, Realtime subscription,
   presence-driven auto-load, "refresh from party" button.

6. **Time & Moon** — schema, native page, Realtime subscription. Astrolabe
   + 28-day phase grid (port the layout from `handoff/screens/tome.jsx`).

7. **Reputation** — schema, native page. Refresh-to-see, no Realtime.

8. **Battle Map** — schema (probably tokens + terrain), native page,
   Realtime subscription with debouncing on token positions to keep
   payload size reasonable.

9. **Rules Reference** — native page (port content from current
   `public/tools/rules/index.html` into a static-content + per-campaign
   marginalia model).

10. **Cutover & cleanup** — delete `public/tools/<id>/index.html` for all
    six migrated tools. Delete `app/c/[campaignId]/t/[toolId]/page.tsx`
    (the iframe wrapper) since every toolId now has its own static
    segment. Drop `public/tools/_tome.css` if no longer used. Run all
    tests, smoke-test on Vercel preview, then merge to `main`.

## Testing

- **Unit/integration (vitest)** — RLS helper functions, invite redemption
  RPC happy path + each rejection (revoked, expired, max-uses-hit), tool
  state CRUD per migrated tool.

- **e2e (playwright)** — the existing two-campaign localStorage isolation
  test will need to be rewritten or retired (since we're moving off
  `localStorage`). New e2e: DM creates invite → second browser session
  joins → both browsers see each other in the Party list. Combat e2e:
  DM opens initiative → both online players appear → DM advances round
  → second browser sees the round increment.

- **Manual on the Vercel preview** — once the audio sync is live,
  open the Audio Library on the DM browser, hit play, confirm the
  player browser starts playing the same track. Check the "tap to
  follow" gate on a fresh player browser.

## Open risks

- **Browser autoplay edge cases** — Some browsers (older Safari) may
  re-block autoplay across navigations even after a tap. We'll know more
  once we test; mitigation is to re-show the toast if `audio.play()` is
  rejected.

- **Realtime RLS performance** — Postgres RLS is evaluated on every
  Realtime broadcast. The `is_campaign_member` function is `stable` and
  should be fast, but if the per-campaign membership grows large (>20)
  we may want to materialize membership into a Realtime-cheap form.
  Not a concern for friend-group sizes.

- **Battle Map payload size** — token positions can change rapidly during
  drag interactions. Without debouncing or batching, Realtime can flood.
  The plan calls out debouncing in step 8; if we still see issues, we
  switch to broadcast-only (no DB write per tick) with periodic snapshots.

- **Migration of existing localStorage state** — out of scope by
  design. Anyone with current `localStorage` state in their browser
  loses it on cutover. Per the brainstorm, this is acceptable because
  the user is the only person currently using the app.
