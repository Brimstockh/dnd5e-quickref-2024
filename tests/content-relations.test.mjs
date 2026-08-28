import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const loadJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const [primaryIndex, deepIndex] = await Promise.all([
  loadJson("../data/search-index.json"),
  loadJson("../data/search-index-deep.json"),
]);
const relationIndex = await loadJson("../data/content-relations.json");
const searchIds = new Set([
  ...(primaryIndex.entries || []),
  ...(deepIndex.entries || []),
].map((entry) => entry.id));

function relationsFor(contentId) {
  return relationIndex.sources[contentId]?.relations || [];
}

test("contextual relation index contains only valid canonical references", () => {
  let count = 0;
  const keys = new Set();
  for (const [sourceId, source] of Object.entries(relationIndex.sources)) {
    assert.equal(searchIds.has(sourceId), true, sourceId);
    assert.ok(source.title);
    assert.ok(source.url);
    for (const relation of source.relations) {
      count += 1;
      assert.equal(searchIds.has(relation.target), true, relation.target);
      assert.ok(relationIndex.targets[relation.target]);
      assert.notEqual(sourceId, relation.target);
      const key = [sourceId, relation.target, relation.type, relation.url || ""].join("|");
      assert.equal(keys.has(key), false, key);
      keys.add(key);
    }
  }
  assert.equal(relationIndex.schemaVersion, 1);
  assert.equal(relationIndex.count, count);
  assert.ok(count > 1000);
});

test("relations cover spells, classes, species, equipment, feats, backgrounds, and conditions", () => {
  assert.deepEqual(
    relationsFor("spell-boule-de-feu")
      .filter((relation) => relation.type === "available-for")
      .map((relation) => relation.target)
      .sort(),
    ["class-ensorceleur", "class-magicien"],
  );
  assert.ok(relationsFor("class-paladin").some((relation) => (
    relation.target === "page-sorts" && relation.url === "spells.html?class=Paladin"
  )));
  assert.ok(relationsFor("species-aasimar").some((relation) => relation.target === "page-creation-de-personnage"));
  assert.ok(relationsFor("equipment-rapiere").some((relation) => relation.target === "page-maitrises-d-armes"));
  assert.ok(relationsFor("feat-robuste").some((relation) => relation.target === "page-historiques"));
  assert.ok(relationsFor("background-soldat").some((relation) => relation.target.startsWith("feat-")));
  assert.ok(relationsFor("condition-a-terre").some((relation) => relation.target === "movement-se-relever"));
});

test("page-level relations provide a useful fallback without an open catalog item", () => {
  for (const id of ["page-regles-du-jeu", "page-combat", "page-sorts", "page-dons", "page-classes", "page-especes"]) {
    assert.ok(relationsFor(id).length > 0, id);
  }
});

test("contextual links with fragments target existing anchors", async () => {
  const pages = new Map();
  for (const source of Object.values(relationIndex.sources)) {
    for (const relation of source.relations) {
      const target = relationIndex.targets[relation.target];
      const url = new URL(relation.url || target.url, "https://dnd.local/");
      if (!url.hash) continue;
      const path = url.pathname.replace(/^\//, "");
      if (!pages.has(path)) pages.set(path, await readFile(resolve(root, path), "utf8"));
      assert.match(
        pages.get(path),
        new RegExp(`\\bid=["']${url.hash.slice(1)}["']`),
        `${path}${url.hash}`,
      );
    }
  }
});
