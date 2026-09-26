import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export const REPRESENTATIVE_PAGES = [
    "index.html",
    "regles.html",
    "compendium.html",
    "creation.html",
    "univers.html",
    "ma-table.html",
    "spells.html",
    "monstres.html",
    "armes-armures.html",
    "rules-2024.html",
    "combat-2024.html",
    "personnages-royaumes.html",
    "faerun.html",
    "html/characters.html",
    "dice-stats.html",
];

export async function loadPage(page, path) {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("header[data-site-header] .site-header__inner")).toBeVisible();
    await expect(page.locator("header[data-site-header] nav").first()).toBeAttached();
    await expect(page.locator("main, #main-content").first()).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    if (await page.locator("body.content-page").count()) {
        await expect(page.locator("body.content-page")).toHaveCSS("display", "block");
    }
    await page.waitForTimeout(200);
    return pageErrors;
}

export async function expectNoPageErrors(pageErrors) {
    expect(pageErrors, "JavaScript exceptions during page load").toEqual([]);
}

export async function expectNoHorizontalOverflow(page) {
    const overflow = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
    }));
    expect(overflow.documentWidth, "global horizontal overflow").toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

export async function runAxe(page) {
    return new AxeBuilder({ page }).analyze();
}
