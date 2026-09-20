import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { filterLoreEntries, loreEntryUrl, readLoreState } from "../js/lore-page.js";

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

test("lore entries prefer their specialized page and keep a temporary fallback", () => {
  assert.equal(loreEntryUrl(lore.entries.find((entry) => entry.id === "lore-waterdeep")), "faerun.html#waterdeep");
  assert.equal(loreEntryUrl(lore.entries.find((entry) => entry.id === "lore-acererak")), "lore.html?term=acererak");
});
