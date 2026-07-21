import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname.slice(1));

test("catalog data stays within its transfer budget", async () => {
  const budgets = [
    ["data/monsters_2024.json", 250_000],
    ["data/feats_2024.json", 55_000],
    ["data/spells_2024.json", 800_000],
    ["data/search-index.json", 450_000],
  ];

  for (const [path, maximum] of budgets) {
    const { size } = await stat(resolve(root, path));
    assert.ok(size <= maximum, `${path}: ${size} octets dépasse le budget de ${maximum}`);
  }
});

test("large catalogs preload JSON and use progressive rendering", async () => {
  for (const [page, data] of [
    ["monstres.html", "monsters_2024.json"],
    ["spells.html", "spells_2024.json"],
  ]) {
    const source = await readFile(resolve(root, page), "utf8");
    assert.match(source, new RegExp(`rel="preload" href="data/${data}" as="fetch"`));
    assert.match(source, /src="js\/progressive-list\.js" defer/);
    assert.match(source, /id="loadMoreBtn"/);
  }
});
