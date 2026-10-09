import assert from "node:assert/strict";
import test from "node:test";
import { isPublishedPath } from "../scripts/build-pages-artifact.mjs";

test("Pages artifact excludes repository internals but keeps published support files", () => {
    for (const path of [
        ".github/workflows/pages.yml",
        ".gitignore",
        ".gitattributes",
        ".node-version",
        "package.json",
        "package-lock.json",
        "playwright.config.mjs",
        "scripts/audit-icons.mjs",
        "tests/pages-artifact.test.mjs",
        "reports/quality.json",
        "schemas/content.schema.json",
    ]) assert.equal(isPublishedPath(path), false, path);

    for (const path of [
        "README.md",
        "docs/cleanup-final-report.md",
        "data/content-inventory.json",
        "index.html",
        "service-worker.js",
        "assets/images/faerun-city.webp",
    ]) assert.equal(isPublishedPath(path), true, path);
});
