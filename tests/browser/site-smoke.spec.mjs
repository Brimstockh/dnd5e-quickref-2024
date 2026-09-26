import { test } from "@playwright/test";
import { REPRESENTATIVE_PAGES, expectNoHorizontalOverflow, expectNoPageErrors, loadPage } from "./helpers.mjs";

for (const path of REPRESENTATIVE_PAGES) {
    test(`loads ${path} without critical errors`, async ({ page }) => {
        const pageErrors = await loadPage(page, path);
        expectNoPageErrors(pageErrors);
        await expectNoHorizontalOverflow(page);
        await test.step("global interactive shell is available", async () => {
            await page.locator("header[data-site-header] a, header[data-site-header] button").first().isVisible();
        });
    });
}
