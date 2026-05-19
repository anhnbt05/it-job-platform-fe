import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("recruiter can open manage jobs page", async ({ page }) => {
  await loginAs(page, "recruiter");

  await expect(page.getByTestId("recruiter-manage-jobs-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /quản lý bài đăng/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /thêm tin tuyển dụng/i }),
  ).toBeVisible();
});

test("admin can open dashboard and see summary cards", async ({ page }) => {
  await loginAs(page, "admin");

  await expect(page.getByTestId("admin-dashboard-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /bảng điều khiển hệ thống/i }),
  ).toBeVisible();
  await expect(page.getByText(/tổng công việc/i).first()).toBeVisible();
  await expect(page.getByText(/đơn ứng tuyển/i).first()).toBeVisible();
});
