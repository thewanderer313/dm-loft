import { Page } from "@playwright/test";

export async function signIn(page: Page) {
  const email = process.env.E2E_USER_EMAIL!;
  const password = process.env.E2E_USER_PASSWORD!;
  await page.goto("/login");
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
