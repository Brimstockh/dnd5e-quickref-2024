import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const report = JSON.parse(await readFile(new URL("../reports/quality.json", import.meta.url), "utf8"));

test("quality report is deterministic and exposes the expected metrics", () => {
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.pages.html, 63);
  assert.equal(report.content.indexed, 2483);
  assert.equal(report.links.broken, 0);
  assert.equal(report.assets.unreferenced, 0);
  assert.equal(report.sources.coveragePercent, 75.03);
  assert.equal(report.sources.indexedByType.spell.withSourceRef, 391);
  assert.equal(report.sources.indexedByType.spell.withoutSourceRef, 0);
  assert.equal(report.sources.indexedByType.spell.coveragePercent, 100);
  assert.equal(report.sources.indexedByType["class-feature"].withSourceRef, 454);
  assert.equal(report.pwa.precache.entries, 42);
  assert.equal(report.pwa.precache.budget, 1_500_000);
  assert.ok(report.pwa.budgetUsage <= 0.9);
  assert.equal(report.performance.lowestPerformancePage, "index.html");
  assert.equal(report.performance.highestClsPage, "html/characters.html");
  assert.equal(report.criticalErrors.length, 0);
  assert.ok(report.tests.node > 200);
  assert.ok(report.tests.browser >= 19);
  assert.equal(report.lighthouse.tool.name, "lighthouse");
  assert.equal(report.lighthouse.pages.length, 6);
});
