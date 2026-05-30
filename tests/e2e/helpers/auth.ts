import { Page } from "@playwright/test";

async function signInWith(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  // The email form has TWO submit buttons (sign in via formAction=signInWithEmail
  // and create-account via formAction=signUpWithEmail). The sign-in button text
  // is "Enter the Loft >". Match it case-insensitively against either submit
  // mechanism.
  await page.locator(
    'button[formaction], button[type="submit"]',
    { hasText: /enter the loft/i }
  ).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

export async function signIn(page: Page) {
  const email = process.env.E2E_USER_EMAIL!;
  const password = process.env.E2E_USER_PASSWORD!;
  await signInWith(page, email, password);
}

export async function signInAs(page: Page, email: string, password: string) {
  await signInWith(page, email, password);
}
