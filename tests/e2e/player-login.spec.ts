import { test, expect } from "@playwright/test";
import { signIn, signInAs } from "./helpers/auth";

const CAMPAIGN_NAME = "E2E Player-Login";
const PLAYER_NAME = "Vex the Wry";

// Uses the primary E2E_USER for the DM and a secondary E2E_USER_2 for the
// player. If E2E_USER_2_* aren't configured, the test is skipped.
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

    // Read the first invite URL out of the rendered list. The InviteManager
    // renders the URL in a monospace span; grab the first match.
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

    // Player should see the party with their own character name visible.
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
