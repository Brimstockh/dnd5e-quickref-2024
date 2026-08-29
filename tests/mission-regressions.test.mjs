import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveCharacterReferences } from "../js/character-references.js";
import { searchEntries } from "../js/search-engine.js";

const loadJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const [primary, deep, proficiency, magicItems, campaignRules, relations] = await Promise.all([
  loadJson("../data/search-index.json"),
  loadJson("../data/search-index-deep.json"),
  loadJson("../data/proficiency-bonus.json"),
  loadJson("../data/magic-items.json"),
  loadJson("../data/campaign-rules.json"),
  loadJson("../data/content-relations.json"),
]);
const entries = [...primary.entries, ...deep.entries];

test("the 2024 proficiency contract keeps the final tier coherent", async () => {
  assert.deepEqual(proficiency.table, [
    { min: 1, max: 4, bonus: 2 },
    { min: 5, max: 8, bonus: 3 },
    { min: 9, max: 12, bonus: 4 },
    { min: 13, max: 16, bonus: 5 },
    { min: 17, max: 20, bonus: 6 },
    { min: 21, max: 24, bonus: 7 },
    { min: 25, max: 28, bonus: 8 },
    { min: 29, max: 30, bonus: 9 },
  ]);
  const mastery = await readFile(new URL("../mastery-2024.html", import.meta.url), "utf8");
  assert.match(mastery, /29-30[\s\S]*\+9/);
  assert.doesNotMatch(mastery, /20-30/);
});

test("deep search reaches class features, tools, rules, and aliases directly", () => {
  for (const [query, expectedTitle, expectedType] of [
    ["Décharge agonisante", "Décharge agonisante", "class-feature"],
    ["Action impétueuse", "Fougue", "class-feature"],
    ["Forme sauvage", "Forme sauvage", "class-feature"],
    ["Outils de forgeron", "Outils de forgeron", "tool"],
    ["Concentration", "Concentration", "glossary"],
    ["Agripper", "Agripper", "action"],
  ]) {
    const result = searchEntries(entries, query, { limit: 1 })[0]?.entry;
    assert.equal(result?.title, expectedTitle, query);
    assert.equal(result?.type, expectedType, query);
    assert.match(result.url, /\.html(?:[?#]|$)/, query);
  }
});

test("campaign data stays explicit and character references degrade safely", () => {
  assert.equal(magicItems.items[0].sourceRef, "srd-5.2.1-fr");
  assert.equal(campaignRules.entries[0].status, "house-rule");
  assert.deepEqual(
    relations.sources["campaign-rule-potion"].relations.map(({ target }) => target).sort(),
    ["action-utiliser", "magic-item-potion-de-guerison"],
  );
  const groups = resolveCharacterReferences({ class: "Barde", species: "Demi-elfe", level: 1 }, { entries });
  const featureGroup = groups.find(({ key }) => key === "features");
  assert.ok(featureGroup?.items.some(({ entry }) => entry?.title === "Inspiration bardique"));
  assert.ok(groups.some(({ key }) => key === "shortcuts"));
  const itemGroup = resolveCharacterReferences({ items: ["Potion de guérison"] }, { entries })
    .find(({ key }) => key === "items");
  assert.equal(itemGroup?.items[0]?.entry?.id, "magic-item-potion-de-guerison");
});
