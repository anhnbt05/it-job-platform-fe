import { expect, type Page } from "@playwright/test";
import { demoAccounts } from "../fixtures/accounts";

type DemoRole = keyof typeof demoAccounts;

export async function loginAs(page: Page, role: DemoRole) {
  const account = demoAccounts[role];

  await page.goto("/login");
  await expect(page.getByTestId("login-form")).toBeVisible();

  await page.getByTestId("login-email").fill(account.email);
  await page.getByTestId("login-password").fill(account.password);
  await page.getByTestId("login-submit").click();

  await page.waitForURL(`**${account.redirectPath}`);
  await expect(page).toHaveURL(new RegExp(`${account.redirectPath.replace(/\//g, "\\/")}$`));
}
