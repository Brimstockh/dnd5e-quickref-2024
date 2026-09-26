import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, expectNoPageErrors, loadPage } from "./helpers.mjs";

test("monsters catalogue supports search, filters and an opened statblock", async ({ page }) => {
    const pageErrors = await loadPage(page, "monstres.html");
    expectNoPageErrors(pageErrors);
    await expect(page.locator("#monstersGrid .monster-card").first()).toBeVisible();
    await expect(page.locator("#exportJsonBtn")).toBeEnabled();
    const initialCount = await page.locator("#monstersGrid .monster-card").count();
    const filterToggle = page.locator(".legacy-filter-toggle");
    if (await filterToggle.isVisible()) await filterToggle.click();
    await page.locator("#searchInput").fill("dragon");
    await expect(page.locator("#monstersGrid .monster-card").first()).toBeVisible();
    expect(await page.locator("#monstersGrid .monster-card").count()).toBeLessThan(initialCount);
    await page.locator("#monstersGrid details.monster summary").first().dispatchEvent("click");
    await expect(page.locator("#monstersGrid details.monster[open]").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
});

test("equipment remains a desktop table with localised horizontal overflow", async ({ page }) => {
    const pageErrors = await loadPage(page, "armes-armures.html");
    expectNoPageErrors(pageErrors);
    await expect(page.locator(".equipment-table")).toHaveCount(2);
    await expect(page.locator(".equipment-table").first().locator("tbody tr").first()).toBeVisible();
    await expect(page.locator(".table-scroll").first()).toHaveCSS("overflow-x", "auto");
    await expectNoHorizontalOverflow(page);
});

test("Ma table characters can be searched and exposes actions", async ({ page }) => {
    const pageErrors = await loadPage(page, "html/characters.html");
    expectNoPageErrors(pageErrors);
    await expect(page.locator("#list .char-card").first()).toBeVisible();
    const name = (await page.locator("#list .char-card strong").first().textContent())?.trim();
    expect(name).toBeTruthy();
    await page.locator("#q").fill(name || "");
    await expect(page.locator("#list .char-card:visible").first()).toBeVisible();
    await expect(page.locator("#list .char-card:visible a").first()).toBeVisible();
});
