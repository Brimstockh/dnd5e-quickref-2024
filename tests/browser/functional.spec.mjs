import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, expectNoPageErrors, loadPage } from "./helpers.mjs";

test("global search finds an accented deep result and handles empty state", async ({ page }) => {
    const pageErrors = await loadPage(page, "index.html");
    expectNoPageErrors(pageErrors);
    const searchTrigger = page.locator("[data-open-site-search]").first();
    await searchTrigger.focus();
    const deepRequests = [];
    page.on("request", (request) => {
        if (request.url().endsWith("/data/search-index-deep.json")) deepRequests.push(request);
    });
    await searchTrigger.click();
    const dialog = page.locator(".search-dialog");
    await expect(dialog).toBeVisible();
    await expect.poll(() => deepRequests.length).toBe(0);
    const input = dialog.locator('input[type="search"]');
    await input.fill("boule de feu");
    await expect.poll(() => deepRequests.length).toBe(1);
    await expect(dialog.locator(".search-results a").first()).toContainText(/boule de feu/i);
    await input.fill("zzzz-terme-inexistant");
    await expect(dialog.locator(".search-empty")).toContainText("Aucun résultat");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(searchTrigger).toBeFocused();
});

test("global search expands D&D abbreviations and supports keyboard selection", async ({ page }) => {
    const pageErrors = await loadPage(page, "index.html");
    expectNoPageErrors(pageErrors);
    await page.locator("[data-open-site-search]").first().click();
    const dialog = page.locator(".search-dialog");
    const input = dialog.locator('input[type="search"]');
    await input.fill("CA");
    const firstResult = dialog.locator(".search-results a").first();
    await expect(firstResult).toContainText(/classe d.?armure/i);
    await expect(firstResult.locator(".search-result__category")).toContainText("Règles");
    await expect(input).toHaveAttribute("aria-activedescendant", "site-search-result-0");
    await input.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", "site-search-result-1");
    await input.press("Home");
    await expect(input).toHaveAttribute("aria-activedescendant", "site-search-result-0");
    await input.press("Escape");
    await expect(dialog).toBeHidden();
});

test("content pages expose provenance details", async ({ page }) => {
    const pageErrors = await loadPage(page, "lore.html");
    expectNoPageErrors(pageErrors);
    const sourceMeta = page.locator(".source-meta");
    await expect(sourceMeta).toContainText("Version des règles");
    await expect(sourceMeta).toContainText("Dernière vérification");
    await expect(page.locator(".lore-entry__source").first()).toContainText("Dungeon Master's Guide 2024");
});

test("spells catalogue supports search, details, reset and mobile-safe layout", async ({ page }) => {
    const pageErrors = await loadPage(page, "spells.html");
    expectNoPageErrors(pageErrors);
    await expect(page.locator("#spellsGrid .spell").first()).toBeVisible();
    const initialSummary = await page.locator("#summary").textContent();
    await page.locator("#searchInput").fill("boule de feu");
    await expect(page.locator("#spellsGrid .spell").first()).toContainText(/Boule de feu/i);
    await page.locator("#spellsGrid .spell").first().locator("summary").click();
    await expect(page.locator("#spellsGrid .spell").first()).toHaveAttribute("open", "");
    const filterToggle = page.locator("#openFiltersBtn");
    if (await filterToggle.isVisible()) await filterToggle.click();
    await page.locator("#resetFiltersBtn").click();
    await expect(page.locator("#searchInput")).toHaveValue("");
    await expect(page.locator("#summary")).toHaveText(initialSummary || "");
    await expectNoHorizontalOverflow(page);
});

test("combat calculator updates its result", async ({ page }) => {
    const pageErrors = await loadPage(page, "combat-2024.html");
    expectNoPageErrors(pageErrors);
    const output = page.locator("[data-encounter-output]");
    const before = await output.textContent();
    await page.locator("[data-player-count]").fill("5");
    await expect(output).not.toHaveText(before || "");
    await expect(page.locator("[data-encounter-breakdown]")).not.toBeEmpty();
    await expectNoHorizontalOverflow(page);
});

test("dice statistics render a chart and update controls", async ({ page }) => {
    const pageErrors = await loadPage(page, "dice-stats.html");
    expectNoPageErrors(pageErrors);
    await expect(page.locator("#diceHistogram")).toBeVisible();
    await expect(page.locator("#diceHistogram .dice-chart__bar-hit").first()).toBeVisible();
    await page.locator("#diceCount").fill("3");
    await expect(page.locator("#diceNotation")).toHaveText("3d6");
    await expect(page.locator("#histogramSummary")).toContainText("3d6");
    await expectNoHorizontalOverflow(page);
});
