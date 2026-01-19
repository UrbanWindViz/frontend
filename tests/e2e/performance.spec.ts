import { test, expect } from "@playwright/test";

/**
 * Performance tests for thesis evaluation
 * Measures visualization rendering time and data loading time
 */

test.describe("Performance Metrics", () => {
  test("should measure initial page load time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    console.log(`📊 Page load time: ${loadTime}ms`);

    // For thesis: Log performance metrics
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
  });

  test("should measure wind data fetch and render time", async ({ page }) => {
    await page.goto("/");

    // Wait for map to be ready
    await page.waitForSelector(".map-container");

    // Start performance measurement
    const startTime = Date.now();

    // Trigger a new wind data fetch by moving the map
    await page.evaluate(() => {
      const mapContainer = document.querySelector(".map-container");
      if (mapContainer) {
        // Dispatch a map move event to trigger data reload
        mapContainer.dispatchEvent(new Event("moveend"));
      }
    });

    // Wait for network to be idle (data loaded)
    await page.waitForLoadState("networkidle");

    // Wait a bit more for rendering
    await page.waitForTimeout(500);

    const totalTime = Date.now() - startTime;

    console.log(`📊 Wind data fetch + render time: ${totalTime}ms`);

    // For thesis: Document this metric
    expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  test("should measure visualization type switch performance", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector(".map-container");

    // Open settings
    const settingsButton = page.locator('button[title="Darstellungseinstellungen"]');
    await settingsButton.click();

    const vizTypeSelector = page.locator("select").first();

    // Measure arrow to heatmap switch
    const startTime = Date.now();

    await vizTypeSelector.selectOption("heatmap");

    // Wait for visual change (layer update)
    await page.waitForTimeout(1000);

    const switchTime = Date.now() - startTime;

    console.log(`📊 Visualization switch time (arrow → heatmap): ${switchTime}ms`);

    expect(switchTime).toBeLessThan(2000); // Should switch within 2 seconds
  });

  test("should measure resolution change performance", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".map-container");

    // Open settings
    const settingsButton = page.locator('button[title="Darstellungseinstellungen"]');
    await settingsButton.click();

    const resolutionSelector = page.locator("select").nth(1);

    // Measure low to high resolution switch
    const startTime = Date.now();

    await resolutionSelector.selectOption("Hoch (200×200)");

    // Wait for new data to load and render
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const resolutionChangeTime = Date.now() - startTime;

    console.log(`📊 Resolution change time (100×100 → 200×200): ${resolutionChangeTime}ms`);

    expect(resolutionChangeTime).toBeLessThan(8000); // Higher resolution takes longer
  });

  test("should measure paint performance for different grid sizes", async ({
    page,
  }) => {
    const results: Array<{ resolution: string; paintTime: number }> = [];

    await page.goto("/");
    await page.waitForSelector(".map-container");

    const settingsButton = page.locator('button[title="Darstellungseinstellungen"]');
    await settingsButton.click();

    const resolutionSelector = page.locator("select").nth(1);

    // Test different resolutions
    const resolutions = [
      "Niedrig (50×50)",
      "Mittel (100×100)",
      "Hoch (200×200)",
    ];

    for (const resolution of resolutions) {
      const startTime = Date.now();

      await resolutionSelector.selectOption(resolution);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const paintTime = Date.now() - startTime;
      results.push({ resolution, paintTime });

      console.log(`📊 Paint time for ${resolution}: ${paintTime}ms`);
    }

    // For thesis: Verify performance degrades with higher resolution
    // (but should still be reasonable)
    expect(results[0].paintTime).toBeLessThan(results[2].paintTime);

    console.log("\n📊 Performance Summary:");
    results.forEach(({ resolution, paintTime }) => {
      console.log(`  ${resolution}: ${paintTime}ms`);
    });
  });

  test("should measure time control animation performance", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".map-container");

    // Wait for weather data to load
    await page.waitForTimeout(2000);

    // Find and click play button
    const playButton = page.locator('button').filter({ hasText: "▶" }).or(
      page.locator('button').filter({ hasText: "⏸" })
    ).first();

    const startTime = Date.now();

    // Start animation
    await playButton.click();

    // Let it run for 3 seconds
    await page.waitForTimeout(3000);

    // Stop animation
    await playButton.click();

    const animationDuration = Date.now() - startTime;

    console.log(`📊 Animation ran for: ${animationDuration}ms`);

    // Verify animation performance
    expect(animationDuration).toBeGreaterThan(2900);
    expect(animationDuration).toBeLessThan(3500);
  });
});
