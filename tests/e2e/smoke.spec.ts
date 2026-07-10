import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home loads with landing CTA", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("button", { name: /tap to enter|enter app/i })).toBeVisible();
  });

  test("feed page responds", async ({ page }) => {
    const response = await page.goto("/feed");
    expect(response?.status()).toBe(200);
  });

  test("shop page shows sign-in gate", async ({ page }) => {
    const response = await page.goto("/shop");
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Sign in to NexSocio")).toBeVisible();
  });

  test("corporate page shows sign-in gate", async ({ page }) => {
    const response = await page.goto("/corporate");
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Sign in to NexSocio")).toBeVisible();
  });
});