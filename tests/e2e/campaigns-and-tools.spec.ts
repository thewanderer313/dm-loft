import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

test("create two campaigns and verify per-campaign localStorage isolation", async ({ page }) => {
  await signIn(page);

  // Create campaign A
  await page.goto("/campaigns/new");
  await page.getByLabel("Name").fill("E2E Alpha");
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/c\/.+/);
  const urlA = page.url();
  const campaignA = urlA.split("/c/")[1];

  // Open Initiative tool, write to localStorage inside the iframe
  await page.goto(`/c/${campaignA}/t/initiative`);
  const frameA = page.frameLocator("iframe");
  await frameA.locator("body").waitFor();
  await page.evaluate(() => {
    const f = document.querySelector("iframe") as HTMLIFrameElement;
    f.contentWindow!.localStorage.setItem("dm-loft-test-key", "alpha-value");
  });

  // Create campaign B
  await page.goto("/campaigns/new");
  await page.getByLabel("Name").fill("E2E Bravo");
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/c\/.+/);
  const urlB = page.url();
  const campaignB = urlB.split("/c/")[1];

  // Open same tool under campaign B; should NOT see alpha-value
  await page.goto(`/c/${campaignB}/t/initiative`);
  await page.frameLocator("iframe").locator("body").waitFor();
  const seenInB = await page.evaluate(() => {
    const f = document.querySelector("iframe") as HTMLIFrameElement;
    return f.contentWindow!.localStorage.getItem("dm-loft-test-key");
  });
  expect(seenInB).toBeNull();

  // Cleanup
  for (const id of [campaignA, campaignB]) {
    await page.goto(`/campaigns/${id}/edit`);
    page.once("dialog", d => d.accept());
    await page.getByRole("button", { name: /delete this campaign/i }).click();
    await page.waitForURL(/\/campaigns$/);
  }
});
