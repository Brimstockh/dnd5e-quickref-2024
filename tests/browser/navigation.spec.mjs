import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, expectNoPageErrors, loadPage } from "./helpers.mjs";

const hubs = [
    ["regles.html", "Règles"],
    ["compendium.html", "Compendium"],
    ["creation.html", "Création"],
    ["univers.html", "Univers"],
    ["ma-table.html", "Ma table"],
];

test("home navigation reaches each canonical space", async ({ page }) => {
    const pageErrors = await loadPage(page, "index.html");
    expectNoPageErrors(pageErrors);
    const mobileMenu = page.locator(".mobile-navigation-toggle");
    if (await mobileMenu.isVisible()) await mobileMenu.click();
    const navigation = page.locator(".mobile-navigation.is-open, header[data-site-header]").last();
    for (const [href, label] of hubs) {
        const dropdown = navigation.locator("details.nav-dropdown").filter({ hasText: label }).first();
        await expect(dropdown, `${label} navigation group`).toBeAttached();
        await dropdown.locator("summary").click();
        const link = dropdown.locator(`a[href$="${href}"]`).first();
        await expect(link, `${label} navigation link`).toBeVisible();
        await expect(link).toContainText(new RegExp(label, "i"));
    }
});

test("canonical section state and deep navigation remain coherent", async ({ page }) => {
    const pageErrors = await loadPage(page, "regles.html");
    expectNoPageErrors(pageErrors);
    await expect(page.locator('header[data-site-header] details.nav-dropdown.is-active')).toContainText("Règles");

    const child = page.locator('main a[href$="rules-2024.html"]').first();
    await expect(child).toBeVisible();
    await child.click();
    await expect(page).toHaveURL(/\/rules-2024\.html$/);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('header[data-site-header] nav a[aria-current="page"]').first()).toHaveAttribute("href", /rules-2024\.html$/);
    await expectNoHorizontalOverflow(page);
});
