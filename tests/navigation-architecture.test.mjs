import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { SITE_SECTIONS } from "../js/site-navigation.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const expectedSections = ["rules", "compendium", "creation", "universe", "table"];

function links() {
  return SITE_SECTIONS.flatMap((section) => section.links.map((entry) => ({ section, entry })));
}

test("canonical navigation exposes exactly five sections and unique links", async () => {
  assert.deepEqual(SITE_SECTIONS.map(({ id }) => id), expectedSections);
  assert.equal(new Set(SITE_SECTIONS.map(({ id }) => id)).size, SITE_SECTIONS.length);

  const urls = links().map(({ entry }) => entry[2]);
  assert.equal(new Set(urls).size, urls.length);
  for (const { section, entry } of links()) {
    await access(resolve(root, entry[2].split(/[?#]/, 1)[0]));
    assert.ok(section.links.some((candidate) => candidate[2] === section.landing), `${section.id} landing is not declared`);
  }
});

test("creation keeps its two visual groups and Ma table has no duplicate character sheet", () => {
  const creation = SITE_SECTIONS.find(({ id }) => id === "creation");
  assert.deepEqual(creation.groups.map(({ id }) => id), ["create", "options"]);
  assert.deepEqual(creation.links.filter((entry) => entry[4] === "create").map((entry) => entry[0]), ["creator", "creation", "compare", "sheet"]);
  assert.deepEqual(creation.links.filter((entry) => entry[4] === "options").map((entry) => entry[0]), ["classes", "species", "backgrounds", "feats"]);

  const table = SITE_SECTIONS.find(({ id }) => id === "table");
  assert.equal(table.links.some((entry) => entry[2] === "character-sheet-standalone.html"), false);
});

test("home, hubs, inventory, and offline cache expose the architecture", async () => {
  const home = await readFile(resolve(root, "index.html"), "utf8");
  const inventory = JSON.parse(await readFile(resolve(root, "data/content-inventory.json"), "utf8"));
  const worker = await readFile(resolve(root, "service-worker.js"), "utf8");

  assert.match(home, /data-site-explorer/);
  assert.deepEqual(inventory.navigation.sections.map(({ id }) => id), expectedSections);
  for (const section of SITE_SECTIONS) {
    const source = await readFile(resolve(root, section.landing), "utf8");
    assert.match(source, new RegExp(`data-category-hub="${section.id}"`));
    assert.match(worker, new RegExp(`\\./${section.landing.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`));
  }
});

