import { expect, test } from "@playwright/test";

test("service worker installs and serves a cached page offline", async ({ page, context }) => {
    test.skip(test.info().project.name === "chromium-mobile", "Le contrôle PWA est exécuté une fois sur Chromium desktop.");
    await page.goto("index.html");
    await page.evaluate(async () => {
        if (!("serviceWorker" in navigator)) throw new Error("Service worker indisponible");
        await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    try {
        await page.goto("rules-2024.html", { waitUntil: "domcontentloaded" });
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.locator("body")).not.toContainText("Hors connexion");
    } finally {
        await context.setOffline(false);
    }
});

test("PWA update prompt asks the waiting worker to activate", async ({ page }) => {
    test.skip(test.info().project.name === "chromium-mobile", "Le contrôle PWA est exécuté une fois sur Chromium desktop.");
    await page.goto("index.html");
    await page.waitForFunction(() => Boolean(window.DndPwa));

    await page.evaluate(() => {
        window.__postedPwaMessages = [];
        window.DndPwa.showUpdatePrompt({
            postMessage(message) {
                window.__postedPwaMessages.push(message);
            },
        });
    });

    await expect(page.locator(".pwa-update")).toContainText("Une nouvelle version est disponible.");
    await page.getByRole("button", { name: "Mettre à jour" }).click();
    await expect.poll(() => page.evaluate(() => window.__postedPwaMessages)).toEqual([{ type: "SKIP_WAITING" }]);
});
