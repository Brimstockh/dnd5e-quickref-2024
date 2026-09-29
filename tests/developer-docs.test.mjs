import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const documents = [
  "architecture.md",
  "content-model.md",
  "testing.md",
  "pwa.md",
  "storage.md",
  "contributing.md",
].map((name) => resolve(root, "docs", name));
const usabilityDocuments = ["usability-test-plan.md", "usability-test-results-template.md"]
  .map((name) => resolve(root, "docs", name));
const consolidationReport = resolve(root, "docs", "refacto-consolidation-report.md");

test("developer documentation covers the current contracts", async () => {
  await Promise.all([...documents, ...usabilityDocuments, consolidationReport].map((path) => access(path)));
  const [architecture, content, testing, pwa, storage, contributing] = await Promise.all(
    documents.map((path) => readFile(path, "utf8")),
  );

  assert.match(architecture, /js\/site-navigation\.js/);
  assert.match(architecture, /build-search-index\.mjs/);
  assert.match(content, /js\/content-ids\.js/);
  assert.match(content, /data\/content-sources\.json/);
  assert.match(testing, /npm run recette/);
  assert.match(testing, /tests\/browser\/journeys\.spec\.mjs/);
  assert.match(pwa, /CORE_ASSETS/);
  assert.match(storage, /data\/local-storage-contracts\.json/);
  assert.match(storage, /migrateJson/);
  assert.match(contributing, /navigation mise à jour/);
  assert.match(contributing, /recette et audit verts/);
});
