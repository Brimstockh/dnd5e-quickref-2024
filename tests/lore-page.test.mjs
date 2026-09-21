import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { filterLoreEntries, loadLoreResources, loreCategoryLabel, loreEntryUrl, readLoreState } from "../js/lore-page.js";

const lore = JSON.parse(await readFile(new URL("../data/lore.json", import.meta.url), "utf8"));

test("lore URL state supports direct terms and combined filters", () => {
  assert.deepEqual(readLoreState("?term=waterdeep&category=place&setting=Forgotten%20Realms&letter=W"), {
    query: "",
    category: "place",
    setting: "Forgotten Realms",
    letter: "W",
    term: "waterdeep",
  });
});

test("lore filtering searches English and French aliases", () => {
  const waterdeep = filterLoreEntries(lore.entries, { query: "Eauprofonde", category: "", setting: "", letter: "", term: "" });
  assert.ok(waterdeep.some((entry) => entry.id === "lore-waterdeep"));
  const greyhawk = filterLoreEntries(lore.entries, { query: "", category: "person", setting: "Greyhawk", letter: "", term: "" });
  assert.ok(greyhawk.some((entry) => entry.id === "lore-bigby"));
});

test("lore entries prefer their specialized page and keep a local fallback", () => {
  assert.equal(loreEntryUrl(lore.entries.find((entry) => entry.id === "lore-waterdeep")), "lore.html?term=waterdeep");
  assert.equal(loreEntryUrl(lore.entries.find((entry) => entry.id === "lore-acererak")), "lore.html?term=acererak");
});

test("lore category labels stay user-facing while internal values remain stable", () => {
  assert.equal(loreCategoryLabel("person"), "Personnage");
  assert.equal(loreCategoryLabel("deity"), "Divinité");
  assert.equal(loreCategoryLabel("unknown"), "Autre");
});

test("lore resource loading keeps the primary catalog available without secondary relations", async () => {
  const calls = [];
  const result = await loadLoreResources({
    lorePath: "lore.json",
    relationsPath: "relations.json",
    fetchImpl: async (path) => {
      calls.push(String(path));
      if (String(path) === "lore.json") return { ok: true, json: async () => lore };
      return { ok: false, status: 503 };
    },
  });
  assert.equal(result.primaryError, null);
  assert.ok(result.relationsError);
  assert.equal(result.data.entries.length, 74);
  assert.deepEqual(result.relationIndex, { targets: {} });
  assert.deepEqual(calls, ["lore.json", "relations.json"]);
});

test("lore resource loading reports invalid or unavailable primary data", async () => {
  const invalid = await loadLoreResources({ fetchImpl: async () => ({ ok: true, json: async () => ({}) }) });
  assert.ok(invalid.primaryError);
  const unavailable = await loadLoreResources({ fetchImpl: async () => ({ ok: false, status: 404 }) });
  assert.ok(unavailable.primaryError);
});
