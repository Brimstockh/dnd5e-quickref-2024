import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PRECACHE_BUDGET_BYTES } from "../scripts/pwa-budget.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("catalog data stays within its transfer budget", async () => {
  const budgets = [
    ["data/monsters_2024.json", 250_000],
    ["data/monster-names-fr.json", 25_000],
    ["data/feats_2024.json", 55_000],
    ["data/spells_2024.json", 800_000],
    ["data/search-index.json", 510_000],
    ["data/search-index-deep.json", 620_000],
    ["data/magic-items.json", 620_000],
    ["data/content-relations.json", 150_000],
    ["data/content-id-aliases.json", 60_000],
    ["data/glossary.json", 65_000],
    ["data/character-creation.json", 15_000],
    ["data/content-inventory.json", 3_000],
    ["data/local-storage-contracts.json", 2_000],
  ];

  for (const [path, maximum] of budgets) {
    const { size } = await stat(resolve(root, path));
    assert.ok(size <= maximum, `${path}: ${size} octets dépasse le budget de ${maximum}`);
  }
});

test("initial document, shell and app shell stay within measured budgets", async () => {
  const budgets = [
    ["index.html", 12_000],
    ["css/theme.css", 6_500],
    ["css/components.css", 52_000],
    ["css/home.css", 16_000],
    ["js/user-library.js", 22_000],
    ["js/site-shell.js", 60_000],
  ];
  for (const [path, maximum] of budgets) {
    const { size } = await stat(resolve(root, path));
    assert.ok(size <= maximum, `${path}: ${size} octets dépasse le budget de ${maximum}`);
  }

  const coreStyles = await Promise.all(["css/theme.css", "css/components.css", "css/home.css"]
    .map((path) => stat(resolve(root, path)).then(({ size }) => size)));
  assert.ok(coreStyles.reduce((total, size) => total + size, 0) <= 75_000, "CSS initial dépasse le budget de 75000 octets");

  const worker = await readFile(resolve(root, "service-worker.js"), "utf8");
  const coreBlock = worker.slice(worker.indexOf("const CORE_ASSETS"), worker.indexOf("]);", worker.indexOf("const CORE_ASSETS")));
  const coreAssets = [...coreBlock.matchAll(/\"([^\"]+)\"/g)].map((match) => match[1]);
  const coreSizes = await Promise.all(coreAssets.map((path) => stat(resolve(root, path)).then(({ size }) => size)));
  assert.ok(coreSizes.reduce((total, size) => total + size, 0) <= PRECACHE_BUDGET_BYTES, `précache PWA dépasse le budget de ${PRECACHE_BUDGET_BYTES} octets`);
});

test("secondary shell clients are loaded during idle time", async () => {
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  assert.match(shell, /requestIdleCallback/);
  assert.match(shell, /js\/github-report\.js/);
  assert.match(shell, /js\/glossary-client\.js/);
});

test("personal and creation tools stay lightweight and preload shared data", async () => {
  const budgets = [
    ["js/user-library.js", 25_000],
    ["js/creation-wizard.js", 30_000],
    ["js/comparator.js", 10_000],
    ["js/dice-stats.js", 22_100],
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
  const magicPage = await readFile(resolve(root, "objets-magiques.html"), "utf8");
  assert.match(magicPage, /rel="preload" href="data\/magic-items\.json" as="fetch"/);
  assert.match(magicPage, /src="js\/progressive-list\.js" defer/);
  assert.match(magicPage, /id="loadMoreBtn"/);
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
