import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, expectNoPageErrors, loadPage } from "./helpers.mjs";

async function resetBrowserState(page) {
    await page.addInitScript(() => {
        if (window.name === "dnd-journey-state-reset") return;
        window.localStorage.clear();
        window.name = "dnd-journey-state-reset";
    });
}

async function advanceWizard(page, label = "Suivant", expectedHeading) {
    await page.getByRole("button", { name: label, exact: true }).click();
    if (expectedHeading) await expect(page.locator("#wizardPanel h2")).toHaveText(expectedHeading);
}

async function activateSession(page) {
    const sessionToggle = page.locator(".session-toggle");
    if (await sessionToggle.isVisible()) await sessionToggle.click();
    else {
        await page.locator(".mobile-navigation-toggle").click();
        await page.locator(".mobile-navigation__session-toggle").click();
    }
}

async function openSessionPanel(page) {
    const panel = page.locator("#sessionPanel");
    if (await panel.evaluate((element) => element.classList.contains("is-open"))) return;
    const panelToggle = page.locator(".session-panel-toggle");
    if (!(await panelToggle.isVisible())) await page.locator(".mobile-navigation-toggle").click();
    await panelToggle.click();
}

async function openPersonalSpace(page) {
    const personalLink = page.locator("a.personal-space-link");
    if (await personalLink.isVisible()) await personalLink.click();
    else {
        await page.locator(".mobile-navigation-toggle").click();
        await page.locator(".mobile-navigation__personal-link").click();
    }
}

test("parcours session : chercher, identifier, lire puis revenir à la session", async ({ page }) => {
    await resetBrowserState(page);
    const pageErrors = await loadPage(page, "index.html");
    expectNoPageErrors(pageErrors);

    await page.locator("[data-open-site-search]").first().click();
    const dialog = page.locator(".search-dialog");
    const search = dialog.locator('input[type="search"]');
    await search.fill("boule de feu");
    const result = dialog.locator(".search-results a").filter({ hasText: "Boule de feu" }).first();
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(/spells\.html\?q=Boule(?:%20|\+)de(?:%20|\+)feu/);
    await expect(page.locator("#searchInput")).toHaveValue("Boule de feu");
    await expect(page.locator("#spellsGrid .spell").filter({ hasText: "Boule de feu" }).first()).toBeVisible();

    const favorite = page.locator(".favorite-current");
    await expect(favorite).toHaveAttribute("aria-label", /Ajouter aux favoris/);
    await favorite.click();
    await expect(favorite).toHaveAttribute("aria-pressed", "true");

    await page.locator(".note-current").click();
    const noteDialog = page.locator("dialog.personal-note-dialog");
    await expect(noteDialog).toBeVisible();
    await noteDialog.locator("textarea").fill("À vérifier pendant la prochaine rencontre.");
    await noteDialog.getByRole("button", { name: "Fermer" }).click();
    await expect(noteDialog).toBeHidden();

    await activateSession(page);
    await expect(page.locator(".session-toggle")).toHaveAttribute("aria-label", "Désactiver le mode session");
    const sessionPanel = page.locator("#sessionPanel");
    await expect(sessionPanel).toHaveClass(/is-open/);
    await expect(sessionPanel).toContainText("Sorts D&D 2024");
    await page.locator(".session-panel__close").click();

    await page.goto("index.html");
    await expect(page.locator(".session-toggle")).toHaveAttribute("aria-label", "Désactiver le mode session");
    await openSessionPanel(page);
    await expect(page.locator("#sessionPanel")).toContainText("Sorts D&D 2024");
    await expectNoHorizontalOverflow(page);
});

test("parcours création : assistant, feuille puis profil", async ({ page }) => {
    await resetBrowserState(page);
    const pageErrors = await loadPage(page, "assistant-creation.html");
    expectNoPageErrors(pageErrors);
    await expect(page.locator("#wizardPanel h2")).toHaveText("1. Concept");

    await page.locator('input[name="name"]').fill("Ariane");
    await advanceWizard(page, "Suivant", "2. Niveau");
    await page.locator('input[name="level"]').fill("3");
    await page.locator('input[name="level"]').press("Tab");
    await page.getByRole("button", { name: "3. Classe", exact: true }).click();
    await expect(page.locator("#wizardPanel h2")).toHaveText("3. Classe");

    await page.locator('input[name="classId"]').first().check();
    await advanceWizard(page, "Suivant", "4. Espèce");
    await page.locator('input[name="speciesId"]').first().check();
    await advanceWizard(page, "Suivant", "5. Historique");
    await page.locator('input[name="backgroundId"]').first().check();

    await advanceWizard(page, "Suivant", "6. Caractéristiques");
    await advanceWizard(page, "Suivant", "7. Compétences");
    await advanceWizard(page, "Suivant", "8. Équipement");
    await page.locator('textarea[name="equipment"]').fill("Épée longue et bouclier");
    await advanceWizard(page, "Suivant", "9. Sorts");
    await advanceWizard(page, "Suivant", "10. Récapitulatif");

    await advanceWizard(page, "Passer à la création", "11. Créer la fiche");
    await expect(page.locator("#wizardPanel h2")).toHaveText("11. Créer la fiche");

    await page.getByRole("button", { name: "Générer la fiche", exact: true }).click();
    const sheetLink = page.getByRole("link", { name: "Ouvrir la fiche de personnage" });
    await expect(sheetLink).toBeVisible();
    await sheetLink.click();
    await expect(page).toHaveURL(/character-sheet-standalone\.html$/);
    await expect(page.locator('[data-field="name"]')).toHaveValue("Ariane");
    await expect(page.locator('[data-level-input]')).toHaveValue("3");

    await page.goto("assistant-creation.html");
    await expect(page.getByRole("button", { name: "Créer le profil", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Créer le profil", exact: true }).click();
    await expect(page.locator("#wizardStatus")).toContainText("Profil créé");
    await openPersonalSpace(page);
    await expect(page).toHaveURL(/espace-personnel\.html$/);
    await expect(page.locator("#activeProfileSelect option").filter({ hasText: "Ariane" })).toHaveCount(1);
    await expect(page.locator("#profileName")).toHaveValue("Ariane");
    await expectNoHorizontalOverflow(page);
});

test("parcours préparation MJ : favoriser, annoter, classer puis retrouver", async ({ page }) => {
    await resetBrowserState(page);
    const pageErrors = await loadPage(page, "index.html");
    expectNoPageErrors(pageErrors);

    const monstersCard = page.locator('.home-quick-access [data-library-item][data-library-title="Monstres"]');
    await monstersCard.locator("[data-favorite-button]").click();
    await expect(monstersCard.locator("[data-favorite-button]")).toHaveAttribute("aria-pressed", "true");
    await monstersCard.locator("a").click();
    await expect(page).toHaveURL(/monstres\.html$/);

    const catalogSearch = page.locator("#searchInput");
    if (!(await catalogSearch.isVisible())) await page.locator(".legacy-filter-toggle").click();
    await catalogSearch.fill("dragon");
    await expect(page.locator("#monstersGrid .monster-card").first()).toBeVisible();
    const closeFilters = page.getByRole("button", { name: "Fermer les filtres" }).first();
    if (await closeFilters.isVisible()) await closeFilters.click();
    await page.locator(".note-current").click();
    const noteDialog = page.locator("dialog.personal-note-dialog");
    await noteDialog.locator("textarea").fill("Préparer une rencontre avec un dragon.");
    await noteDialog.getByRole("button", { name: "Fermer" }).click();

    await openPersonalSpace(page);
    await expect(page).toHaveURL(/espace-personnel\.html$/);
    const favorites = page.locator(".personal-list").filter({ hasText: "Favoris globaux" });
    await expect(favorites).toContainText("Monstres");
    await expect(page.locator(".personal-note")).toContainText("Préparer une rencontre");

    await page.locator("#newListBtn").click();
    const prompt = page.locator("#personalPromptDialog");
    await expect(prompt).toBeVisible();
    await prompt.locator("#personalPromptInput").fill("Session forêt");
    await prompt.getByRole("button", { name: "Valider" }).click();
    await expect(page.locator(".personal-list h3").filter({ hasText: "Session forêt" })).toHaveCount(1);

    const monsterItem = favorites.locator(".personal-item").filter({ hasText: "Monstres" });
    await monsterItem.getByRole("button", { name: /Ajouter à une liste/ }).click();
    await expect(prompt).toBeVisible();
    await prompt.locator("#personalPromptInput").fill("1");
    await prompt.getByRole("button", { name: "Valider" }).click();
    const preparedList = page.locator(".personal-list").filter({ hasText: "Session forêt" });
    await expect(preparedList).toContainText("Monstres");

    await activateSession(page);
    await expect(page.locator("#sessionPanel")).toContainText("Monstres");
    await expectNoHorizontalOverflow(page);
});
