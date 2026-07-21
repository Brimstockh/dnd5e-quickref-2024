import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("modernized pages do not reintroduce historical inline assets", async () => {
  for (const page of ["character-sheet-standalone.html", "monstres.html", "dons.html"]) {
    const source = await readFile(resolve(root, page), "utf8");
    assert.doesNotMatch(source, /<style[\s>]/i, page);
    assert.doesNotMatch(source, /<script(?![^>]*\bsrc=)[^>]*>(?:\s|\S)*?<\/script>/i, page);
  }
});

test("retired character templates preserve their URLs without duplicate implementations", async () => {
  for (const page of ["character-template.html", "character-template-v2.html"]) {
    const source = await readFile(resolve(root, page), "utf8");
    assert.match(source, /rel="canonical" href="character-sheet-standalone\.html"/);
    assert.match(source, /href="character-sheet-standalone\.html"/);
    assert.doesNotMatch(source, /data-field=/);
    assert.doesNotMatch(source, /data-quicklinks/);
  }
});

test("obsolete Web Components v0 and orphan quick-reference data stay removed", () => {
  assert.equal(existsSync(resolve(root, "html/quickref-item.html")), false);
  assert.equal(existsSync(resolve(root, "js/data_hazards.js")), false);
});

test("the search build consumes the current JSON catalogs", async () => {
  const source = await readFile(resolve(root, "scripts/build-search-index.mjs"), "utf8");
  assert.match(source, /data\/monsters_2024\.json/);
  assert.match(source, /data\/feats_2024\.json/);
  assert.doesNotMatch(source, /data\/(?:monsters|feats)_2024\.js["']/);
});
