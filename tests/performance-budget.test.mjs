import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("catalog data stays within its transfer budget", async () => {
  const budgets = [
    ["data/monsters_2024.json", 250_000],
    ["data/feats_2024.json", 55_000],
    ["data/spells_2024.json", 800_000],
    ["data/search-index.json", 455_000],
    ["data/content-relations.json", 150_000],
    ["data/content-id-aliases.json", 60_000],
    ["data/glossary.json", 40_000],
    ["data/character-creation.json", 15_000],
    ["data/content-inventory.json", 3_000],
    ["data/local-storage-contracts.json", 2_000],
  ];

  for (const [path, maximum] of budgets) {
    const { size } = await stat(resolve(root, path));
    assert.ok(size <= maximum, `${path}: ${size} octets dépasse le budget de ${maximum}`);
  }
});

test("personal and creation tools stay lightweight and preload shared data", async () => {
  const budgets = [
    ["js/user-library.js", 25_000],
    ["js/creation-wizard.js", 30_000],
    ["js/comparator.js", 10_000],
    ["js/session-tools.js", 30_000],
    ["js/personal-space.js", 30_000],
  ];
  for (const [path, maximum] of budgets) {
    const { size } = await stat(resolve(root, path));
    assert.ok(size <= maximum, `${path}: ${size} octets dépasse le budget de ${maximum}`);
  }
  const wizard = await readFile(resolve(root, "assistant-creation.html"), "utf8");
  const comparator = await readFile(resolve(root, "comparateur.html"), "utf8");
  assert.match(wizard, /rel="preload" href="data\/character-creation\.json" as="fetch"/);
  assert.match(wizard, /rel="preload" href="data\/spells_2024\.json" as="fetch"/);
  assert.match(comparator, /rel="preload" href="data\/search-index\.json" as="fetch"/);
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

test("editorial hero images stay within their transfer budget", async () => {
  for (const path of [
    "assets/images/classes-heroes.webp",
    "assets/images/rules-game-table.webp",
  ]) {
    const { size } = await stat(resolve(root, path));
    assert.ok(size <= 300_000, `${path}: ${size} octets dépasse le budget de 300000`);
  }
});
