import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildSectionFilterDefinitions, navigationContextForPath, SITE_SECTIONS } from "../js/site-navigation.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const expectedSections = ["rules", "compendium", "creation", "universe", "table"];

function links() {
  return SITE_SECTIONS.flatMap((section) => section.links.map((entry) => ({ section, entry })));
}

test("canonical navigation exposes exactly five sections and unique links", async () => {
  assert.deepEqual(SITE_SECTIONS.map(({ id }) => id), expectedSections);
  assert.equal(new Set(SITE_SECTIONS.map(({ id }) => id)).size, SITE_SECTIONS.length);

  const urls = links().map(({ entry }) => entry.url);
  assert.equal(new Set(urls).size, urls.length);
  for (const { section, entry } of links()) {
    await access(resolve(root, entry.url.split(/[?#]/, 1)[0]));
    assert.ok(section.links.some((candidate) => candidate.url === section.landing), `${section.id} landing is not declared`);
    assert.ok(entry.matches.includes(entry.url), `${section.id}/${entry.id} does not match its URL`);
    assert.ok(entry.category && entry.type, `${section.id}/${entry.id} is missing metadata`);
    assert.equal(entry.type, "page", `${section.id}/${entry.id} navigation entries must remain pages`);
    for (const matcher of entry.matches.slice(1)) {
      await access(resolve(root, matcher.replace(/\/+$/, "")));
    }
  }
});

test("canonical sections expose their illustrated visual identity", async () => {
  const expected = {
    rules: ["assets/images/rules-game-table.webp", "#6f91aa"],
    compendium: ["assets/images/compendium-library.webp", "#809b65"],
    creation: ["assets/images/creation-hero.webp", "#b38a45"],
    universe: ["assets/images/faerun-city.webp", "#98778f"],
    table: ["assets/images/table-adventurers.webp", "#a14b42"],
  };

  for (const section of SITE_SECTIONS) {
    assert.deepEqual([section.artwork.src, section.accent], expected[section.id]);
    assert.ok(section.artwork.position);
    assert.ok(section.actionLabel);
    await access(resolve(root, section.artwork.src));
    const hub = await readFile(resolve(root, section.landing), "utf8");
    assert.match(hub, new RegExp(`data-category-hub="${section.id}"`));
  }
});

test("section filters stay canonical, ordered, and visible when a section is empty", () => {
  const groups = SITE_SECTIONS.map(({ label }) => ({ label }));
  const allMatches = [
    ...Array.from({ length: 31 }, (_, index) => ({ id: `rule-${index}`, section: "Règles" })),
    { id: "table-1", section: "Ma table" },
  ];
  const displayedWindow = allMatches.slice(0, 30);
  assert.equal(displayedWindow.some(({ section }) => section === "Ma table"), false);

  assert.deepEqual(buildSectionFilterDefinitions(groups, allMatches), [
    { value: "", label: "Tout", count: 32, disabled: false },
    { value: "Règles", label: "Règles", count: 31, disabled: false },
    { value: "Compendium", label: "Compendium", count: 0, disabled: true },
    { value: "Création", label: "Création", count: 0, disabled: true },
    { value: "Univers", label: "Univers", count: 0, disabled: true },
    { value: "Ma table", label: "Ma table", count: 1, disabled: false },
  ]);
});

test("creation keeps its two visual groups and Ma table has no duplicate character sheet", () => {
  const creation = SITE_SECTIONS.find(({ id }) => id === "creation");
  assert.deepEqual(creation.groups.map(({ id }) => id), ["create", "options"]);
  assert.deepEqual(creation.links.filter((entry) => entry.group === "create").map((entry) => entry.id), ["creator", "creation", "compare", "sheet"]);
  assert.deepEqual(creation.links.filter((entry) => entry.group === "options").map((entry) => entry.id), ["classes", "species", "backgrounds", "feats"]);

  const table = SITE_SECTIONS.find(({ id }) => id === "table");
  assert.equal(table.links.some((entry) => entry.url === "character-sheet-standalone.html"), false);
});

test("canonical resolution covers exact paths, child pages, and query strings", () => {
  const expected = [
    ["regles.html", "rules", "rules-hub"],
    ["rules-2024.html", "rules", "rules"],
    ["quickref.html", "rules", "quickref"],
    ["spells.html?q=fireball", "compendium", "spells"],
    ["outils-aventurier.html", "compendium", "adventuring-gear"],
    ["classes/index.html", "creation", "classes"],
    ["classes/class-barbarian.html", "creation", "classes"],
    ["classes/class-wizard.html", "creation", "classes"],
    ["races/index.html", "creation", "species"],
    ["races/race-aasimar.html", "creation", "species"],
    ["races/race-tieffelin.html", "creation", "species"],
    ["html/characters.html", "table", "characters"],
    ["html/character.html?c=corvum", "table", "characters"],
    ["html/character-profile.html", "table", "characters"],
    ["regles-campagne.html", "table", "campaign-rules"],
  ];

  for (const [path, sectionId, entryId] of expected) {
    const context = navigationContextForPath(path);
    assert.equal(context?.section.id, sectionId, path);
    assert.equal(context?.entry.id, entryId, path);
  }
  assert.equal(navigationContextForPath("not-declared.html"), null);
});

test("declared HTML active identifiers agree with the canonical resolver", async () => {
  const candidates = [
    ...(await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) => entry.name),
    ...(await Promise.all(["classes", "races", "html"].map(async (directory) => (
      (await readdir(resolve(root, directory), { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
        .map((entry) => `${directory}/${entry.name}`)
    )))).flat(),
  ];

  for (const relativePath of candidates) {
    const source = await readFile(resolve(root, relativePath), "utf8");
    const active = source.match(/data-site-header[^>]*\bdata-active="([^"]+)"/)?.[1];
    const context = navigationContextForPath(relativePath);
    if (!active || !context) continue;
    assert.equal(active, context.entry.id, `${relativePath}: legacy data-active diverges from canonical navigation`);
  }
});

test("home, hubs, inventory, and offline cache expose the architecture", async () => {
  const home = await readFile(resolve(root, "index.html"), "utf8");
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  const componentStyles = await readFile(resolve(root, "css/components.css"), "utf8");
  const inventory = JSON.parse(await readFile(resolve(root, "data/content-inventory.json"), "utf8"));
  const search = JSON.parse(await readFile(resolve(root, "data/search-index.json"), "utf8"));
  const worker = await readFile(resolve(root, "service-worker.js"), "utf8");

  assert.match(home, /data-site-explorer/);
  assert.match(shell, /section-visual/);
  assert.doesNotMatch(shell, /section\.id === "rules"/);
  assert.match(componentStyles, /--section-artwork-position/);
  assert.match(componentStyles, /prefers-reduced-motion/);
  assert.equal([...home.matchAll(/class="quick-access-card\s/g)].length, 5);
  assert.match(home, /data-site-explorer/);
  assert.deepEqual(inventory.navigation.sections.map(({ id }) => id), expectedSections);
  assert.deepEqual(Object.keys(inventory.bySection), ["Règles", "Compendium", "Création", "Univers", "Ma table"]);
  assert.deepEqual(inventory.quality, { duplicateIds: [], invalidUrls: [], incompleteEntries: [] });
  const spells = search.entries.find(({ url }) => url === "spells.html");
  assert.deepEqual({ section: spells.section, category: spells.category, type: spells.type }, { section: "Compendium", category: "Sort", type: "page" });
  for (const section of SITE_SECTIONS) {
    const source = await readFile(resolve(root, section.landing), "utf8");
    assert.match(source, new RegExp(`data-category-hub="${section.id}"`));
    assert.match(worker, new RegExp(`\\./${section.landing.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`));
    assert.match(worker, new RegExp(`\\./${section.artwork.src.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`));
  }
});

