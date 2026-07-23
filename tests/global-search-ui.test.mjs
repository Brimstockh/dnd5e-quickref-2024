import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("global search UI exposes commands, match reasons and recent content", async () => {
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  const styles = await readFile(resolve(root, "css/components.css"), "utf8");

  for (const command of ["@sort", "@règle", "@classe", "@don", "@équipement"]) {
    assert.match(shell, new RegExp(command));
  }
  assert.match(shell, /window\.DndLibrary/);
  assert.match(shell, /getRecent/);
  assert.match(shell, /matchReason/);
  assert.match(shell, /highlightSearchText/);
  assert.match(shell, /doc\.createElement\("mark"\)/);
  assert.match(styles, /\.search-dialog__commands/);
  assert.match(styles, /\.search-result__reason/);
  assert.match(styles, /\.search-results mark/);
});

test("search aliases are explicit and target canonical content IDs", async () => {
  const source = JSON.parse(await readFile(resolve(root, "data/search-aliases.source.json"), "utf8"));
  const index = JSON.parse(await readFile(resolve(root, "data/search-index.json"), "utf8"));
  const ids = new Set(index.entries.map(({ id }) => id));

  assert.equal(source.schemaVersion, 1);
  assert.ok(Object.keys(source.aliases).length >= 30);
  for (const [id, aliases] of Object.entries(source.aliases)) {
    assert.ok(ids.has(id), id);
    assert.ok(Array.isArray(aliases) && aliases.length);
  }
});
