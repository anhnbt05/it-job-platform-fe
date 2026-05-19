import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("candidate can log in and filter jobs", async ({ page }) => {
  await loginAs(page, "candidate");

  await expect(page.getByTestId("candidate-find-jobs-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /khám phá việc làm phù hợp/i }),
  ).toBeVisible();

  await page.getByTestId("candidate-job-search-input").fill("Backend");
  await page.getByTestId("candidate-job-location-input").fill("Ho Chi Minh");

  await expect(page).toHaveURL(/q=Backend/i);
  await expect(page).toHaveURL(/location=Ho\+Chi\+Minh|location=Ho%20Chi%20Minh/i);

  await expect(page.getByText(/tìm thấy/i)).toBeVisible();
});
