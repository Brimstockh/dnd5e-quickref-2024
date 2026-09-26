import { expect, test } from "@playwright/test";
import { REPRESENTATIVE_PAGES, expectNoPageErrors, loadPage, runAxe } from "./helpers.mjs";

for (const path of REPRESENTATIVE_PAGES) {
    test(`axe audit: ${path}`, async ({ page }) => {
        const pageErrors = await loadPage(page, path);
        expectNoPageErrors(pageErrors);
        const results = await runAxe(page);
        const serious = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
        const failures = serious.flatMap((violation) => violation.nodes.slice(0, 5).map((node) => `${violation.id}: ${node.target.join(" ")}`));
        expect(failures, failures.join("\n")).toEqual([]);
    });
}
