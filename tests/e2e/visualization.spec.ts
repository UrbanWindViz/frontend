import { test, expect } from "@playwright/test";

/**
 * E2E tests for visualization functionality
 * Generates screenshots for thesis documentation
 */

test.describe("Wind Visualization", () => {
  test("should load the application and display map", async ({ page }) => {
    await page.goto("/");

    // Wait for map to initialize
    await page.waitForSelector(".map-container", { timeout: 10000 });

    // Take screenshot for thesis: Main application view
    await page.screenshot({
      path: "test-results/screenshots/thesis-01-main-view.png",
      fullPage: true,
    });

    // Verify map loaded
    const mapContainer = await page.locator(".map-container");
    await expect(mapContainer).toBeVisible();
  });

  test("should display controls panel", async ({ page }) => {
    await page.goto("/");

    // Wait for controls to load
    await page.waitForSelector(".controls", { timeout: 10000 });

    // Take screenshot for thesis: Controls panel
    await page.screenshot({
      path: "test-results/screenshots/thesis-02-controls.png",
    });

    // Verify controls are visible
    const controls = await page.locator(".controls");
    await expect(controls).toBeVisible();
  });

  test("should open visualization settings", async ({ page }) => {
    await page.goto("/");

    // Wait for map to load
    await page.waitForSelector(".map-container");

    // Click settings button (gear icon)
    const settingsButton = page.locator('button[title="Darstellungseinstellungen"]');
    await settingsButton.click();

    // Wait for settings panel to appear
    await page.waitForTimeout(500);

    // Take screenshot for thesis: Settings panel
    await page.screenshot({
      path: "test-results/screenshots/thesis-03-settings.png",
    });

    // Verify settings panel is visible
    const settingsPanel = page.locator('select').first();
    await expect(settingsPanel).toBeVisible();
  });

  test("should switch between arrow and heatmap visualization", async ({
    page,
  }) => {
    await page.goto("/");

    await page.waitForSelector(".map-container");

    // Open settings
    const settingsButton = page.locator('button[title="Darstellungseinstellungen"]');
    await settingsButton.click();

    // Get visualization type selector
    const vizTypeSelector = page.locator("select").first();

    // Take screenshot: Arrow visualization
    await page.screenshot({
      path: "test-results/screenshots/thesis-04-arrows.png",
      fullPage: true,
    });

    // Switch to heatmap
    await vizTypeSelector.selectOption("heatmap");
    await page.waitForTimeout(1000); // Wait for rendering

    // Take screenshot: Heatmap visualization
    await page.screenshot({
      path: "test-results/screenshots/thesis-05-heatmap.png",
      fullPage: true,
    });

    // Verify selection changed
    const selectedValue = await vizTypeSelector.inputValue();
    expect(selectedValue).toBe("heatmap");
  });

  test("should adjust resolution setting", async ({ page }) => {
    await page.goto("/");

    await page.waitForSelector(".map-container");

    // Open settings
    const settingsButton = page.locator('button[title="Darstellungseinstellungen"]');
    await settingsButton.click();

    // Get resolution selector (second select)
    const resolutionSelector = page.locator("select").nth(1);

    // Change resolution
    await resolutionSelector.selectOption("Hoch (200×200)");
    await page.waitForTimeout(2000); // Wait for new data to load

    // Take screenshot: High resolution visualization
    await page.screenshot({
      path: "test-results/screenshots/thesis-06-high-resolution.png",
      fullPage: true,
    });

    // Verify resolution changed
    const selectedValue = await resolutionSelector.inputValue();
    expect(selectedValue).toContain("200×200");
  });

  test("should display footer with backend status", async ({ page }) => {
    await page.goto("/");

    // Wait for footer
    await page.waitForSelector(".app-footer");

    // Take screenshot of footer
    const footer = await page.locator(".app-footer");
    await footer.screenshot({
      path: "test-results/screenshots/thesis-07-footer.png",
    });

    // Verify footer content
    await expect(footer).toBeVisible();
    await expect(page.locator(".footer-attribution")).toBeVisible();
    await expect(page.locator(".footer-status")).toBeVisible();
  });
});
