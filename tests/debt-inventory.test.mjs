import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("final debt inventory accounts for current legacy contracts and unreferenced assets", async () => {
  const inventory = await readFile(resolve(root, "docs/debt-inventory.md"), "utf8");
  const assets = JSON.parse(await readFile(resolve(root, "data/assets-report.json"), "utf8"));
  const unreferenced = assets.assets.filter((asset) => !asset.referenced);

  assert.match(inventory, /css\/legacy-catalog\.css/);
  assert.match(inventory, /js\/legacy-catalog-ui\.js/);
  assert.match(inventory, /character-template-v2\.html/);
  assert.match(inventory, /sw\.js/);
  assert.equal(unreferenced.length, 0);
  assert.match(inventory, /24 fichiers ci-dessous\. Ils ont été supprimés/i);
});
