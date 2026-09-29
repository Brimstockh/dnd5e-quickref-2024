import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildAssetReport, firstDifference } from "../scripts/audit-assets.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("asset audit is deterministic and covers the published image families", async () => {
  const report = JSON.parse(await readFile(resolve(root, "data/assets-report.json"), "utf8"));
  const first = await buildAssetReport(root);
  const second = await buildAssetReport(root);
  assert.deepEqual(second, first);
  assert.equal(firstDifference(first, second), null);
  assert.equal(report.schemaVersion, 1);
  assert.ok(report.summary.files >= 2_000);
  assert.equal(report.summary.files, report.assets.length);
  assert.equal(report.summary.bytes, report.assets.reduce((total, asset) => total + asset.bytes, 0));
  assert.ok(report.assets.some((asset) => asset.path === "img/map/faerun-map.jpg"));
  assert.ok(report.assets.some((asset) => asset.path === "img/map/faerun-map.webp"));
  assert.ok(report.summary.pngWithModernVariant >= 40);
  assert.equal(report.summary.largePngWithoutModernVariant, 0);
  assert.ok(report.assets.some((asset) => asset.recommendation === "review-unreferenced"));
  for (const asset of report.assets) {
    assert.ok(["exact", "inferred", "exact+inferred", "none"].includes(asset.referenceMode), asset.path);
  }
});
