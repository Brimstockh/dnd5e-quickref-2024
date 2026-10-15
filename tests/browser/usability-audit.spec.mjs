import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, expectNoPageErrors, loadPage } from "./helpers.mjs";

async function resetBrowserState(page) {
    await page.addInitScript(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
    });
}

async function openSearch(page, query) {
    await page.locator("[data-open-site-search]").first().click();
    const dialog = page.locator(".search-dialog");
    await dialog.locator('input[type="search"]').fill(query);
    return dialog;
}

test("UX-01 : la recherche globale ouvre le détail d'un sort", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "index.html");
    expectNoPageErrors(errors);
    const dialog = await openSearch(page, "boule de feu");
    const result = dialog.locator(".search-results a").filter({ hasText: "Boule de feu" }).first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page).toHaveURL(/spells\.html\?q=Boule(?:%20|\+)de(?:%20|\+)feu/);
    await expect(page.locator("#spellsGrid .spell").filter({ hasText: "Boule de feu" }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
});

test("UX-02 : le catalogue des monstres ouvre un statblock", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "monstres.html");
    expectNoPageErrors(errors);
    const filterToggle = page.locator(".legacy-filter-toggle");
    if (await filterToggle.isVisible()) await filterToggle.click();
    await page.locator("#searchInput").fill("dragon");
    const card = page.locator("#monstersGrid .monster-card").first();
    await expect(card).toBeVisible();
    await card.locator("details.monster summary").dispatchEvent("click");
    await expect(card.locator("details.monster")).toHaveAttribute("open", "");
    await expect(card.locator(".stat-grid .stat").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
});

test("UX-03 : la référence rapide ouvre une règle de combat", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "quickref.html");
    expectNoPageErrors(errors);
    await page.locator("#quickref-search").fill("attaquer");
    const item = page.locator(".quickref-grid .item").filter({ hasText: "Attaquer" }).first();
    await expect(item).toBeVisible();
    await item.click();
    await expect(page.locator("#quickref-detail-layer")).toHaveClass(/is-open/);
    await expect(page.locator("#quickref-detail-title")).not.toBeEmpty();
    await page.locator("#quickref-detail-close").click();
    await expect(page.locator("#quickref-detail-layer")).not.toHaveClass(/is-open/);
    await expectNoHorizontalOverflow(page);
});

test("UX-04 : le comparateur produit un tableau pour deux options", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "comparateur.html");
    expectNoPageErrors(errors);
    const options = page.locator("#comparePicker input[type='checkbox']");
    await expect(options.first()).toBeVisible();
    await options.nth(0).check();
    await options.nth(1).check();
    await expect(page.locator("#compareStatus")).toContainText("2 éléments comparés");
    await expect(page.locator("#compareTable tbody tr").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
});

test("UX-05 : le catalogue des équipements expose les propriétés d'une arme", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "armes-armures.html");
    expectNoPageErrors(errors);
    await expect(page.locator(".equipment-table").first().locator("tbody tr").first()).toBeVisible();
    await expect(page.getByText("Propriétés", { exact: true }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
});

test("UX-06 : le catalogue des dons ouvre le détail d'un don", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "dons.html");
    expectNoPageErrors(errors);
    await page.locator("#searchInput").fill("Athlète");
    const card = page.locator("#featsGrid .catalog-card").filter({ hasText: "Athlète" }).first();
    await expect(card).toBeVisible();
    await card.locator("summary").dispatchEvent("click");
    await expect(card).toHaveAttribute("open", "");
    await expect(card).toContainText("niveau 4");
    await expectNoHorizontalOverflow(page);
});

test("UX-07 : la page Lore charge une entrée et sa recherche", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "lore.html");
    expectNoPageErrors(errors);
    const search = page.locator(".lore-browser__search");
    await expect(search).toBeVisible();
    await search.fill("Faerûn");
    await expect(page.locator(".lore-entry").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
});

test("UX-08 : Ma table expose profils, bibliothèque et outils de session", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "espace-personnel.html");
    expectNoPageErrors(errors);
    await expect(page.locator("#activeProfileSelect")).toBeVisible();
    await expect(page.locator("#personalLists")).toBeVisible();
    await expect(page.locator("#pageNoteForm")).toBeVisible();
    await expect(page.locator("#exportBackupBtn")).toBeVisible();
    await expectNoHorizontalOverflow(page);
});

test("UX-09 : l'assistant expose les onze étapes de création", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "assistant-creation.html");
    expectNoPageErrors(errors);
    await expect(page.locator("#wizardPanel h2")).toHaveText("1. Concept");
    await expect(page.locator("#wizardSteps")).toContainText("Récapitulatif");
    await expect(page.locator("#wizardProgress")).toHaveAttribute("max", "11");
    await expectNoHorizontalOverflow(page);
});

test("UX-10 : deux profils gardent deux liens de fiche distincts", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "espace-personnel.html");
    expectNoPageErrors(errors);

    for (const name of ["Ariane test", "Borin test"]) {
        await page.locator("#newProfileBtn").click();
        await page.locator("#profileName").fill(name);
        await page.locator("#profileForm button[type='submit']").click();
    }

    const profiles = page.locator("#activeProfileSelect option").filter({ hasNotText: "Aucun profil" });
    await expect(profiles).toHaveCount(2);
    const ids = await profiles.evaluateAll((items) => items.map((item) => item.value));
    expect(ids[0]).not.toBe(ids[1]);
    await page.locator("#activeProfileSelect").selectOption(ids[0]);
    await expect(page.locator("#profileSheetLink")).toHaveAttribute("href", new RegExp(`profile=${ids[0]}`));
    await page.locator("#activeProfileSelect").selectOption(ids[1]);
    await expect(page.locator("#profileSheetLink")).toHaveAttribute("href", new RegExp(`profile=${ids[1]}`));
    await expectNoHorizontalOverflow(page);
});

test("UX-11 : l'espace personnel exporte puis réimporte une sauvegarde", async ({ page }) => {
    await resetBrowserState(page);
    const errors = await loadPage(page, "espace-personnel.html");
    expectNoPageErrors(errors);
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#exportBackupBtn").click();
    const download = await downloadPromise;
    expect(await download.path()).toBeTruthy();

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("#importBackupInput").setInputFiles(await download.path());
    await expect(page.locator("#personalStatus")).toContainText("Sauvegarde importée");
    await expectNoHorizontalOverflow(page);
});
