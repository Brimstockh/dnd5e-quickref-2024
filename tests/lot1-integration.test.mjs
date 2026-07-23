import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("Lot 1 shared clients are GitHub Pages aware and available offline", async () => {
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  const pwa = await readFile(resolve(root, "js/pwa-client.js"), "utf8");
  const sourceMeta = await readFile(resolve(root, "js/source-meta.js"), "utf8");
  const report = await readFile(resolve(root, "js/github-report.js"), "utf8");
  const worker = await readFile(resolve(root, "service-worker.js"), "utf8");

  for (const [path, source] of [
    ["js/pwa-client.js", pwa],
    ["js/source-meta.js", sourceMeta],
    ["js/github-report.js", report],
  ]) {
    assert.match(source, /new URL\("\.\.\/", script/);
    assert.match(shell, new RegExp(path.replace(".", "\\.")), path);
    assert.match(worker, new RegExp(`\\.\\/${path.replace(".", "\\.")}`), path);
  }

  for (const asset of [
    "manifest.webmanifest",
    "offline.html",
    "data/search-index.json",
    "data/source-metadata.json",
    "js/user-library.js",
  ]) {
    assert.match(worker, new RegExp(`\\.\\/${asset.replace(".", "\\.")}`), asset);
  }
});

test("Lot 1 preserves URL context through sharing and reporting", async () => {
  const catalog = await readFile(resolve(root, "js/catalog-ui.js"), "utf8");
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  const report = await readFile(resolve(root, "js/github-report.js"), "utf8");

  assert.match(catalog, /historyValue\.replaceState/);
  assert.match(catalog, /var mode = options\.mode === "replace" \? "replaceState" : "pushState"/);
  assert.match(shell, /shareLink\(window\.location\.href/);
  assert.match(shell, /copyLink\(window\.location\.href/);
  assert.match(report, /url: window\.location\.href/);
  assert.match(report, /contentId: selectedContent\(window\.location\.href, path\)/);
});

test("continuous integration runs the complete recipe before publication", async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const testsWorkflow = await readFile(resolve(root, ".github/workflows/tests.yml"), "utf8");
  const pagesWorkflow = await readFile(resolve(root, ".github/workflows/pages.yml"), "utf8");

  assert.match(packageJson.scripts["check:search"], /build-search-index\.mjs --check/);
  assert.match(packageJson.scripts["check:navigation"], /validate-navigation\.mjs/);
  assert.match(packageJson.scripts.recette, /^npm run check:search\b/);
  assert.match(packageJson.scripts.recette, /\bcheck:navigation\b/);
  assert.match(packageJson.scripts.recette, /\bnpm test$/);
  assert.match(testsWorkflow, /npm run recette/);
  assert.match(pagesWorkflow, /npm run recette/);
  assert.match(pagesWorkflow, /actions\/configure-pages@/);
  assert.match(pagesWorkflow, /actions\/upload-pages-artifact@/);
  assert.match(pagesWorkflow, /actions\/deploy-pages@/);
});
