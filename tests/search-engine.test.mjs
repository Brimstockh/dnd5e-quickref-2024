import assert from "node:assert/strict";
import test from "node:test";

import {
  countSearchCategories,
  highlightSearchText,
  normalizeSearch,
  parseSearchQuery,
  searchEntries,
} from "../js/search-engine.js";

const entries = [
  { id: "spell-boule-de-feu", title: "Boule de feu", category: "Sort", aliases: ["Fireball"], keywords: ["Évocation", "niveau 3"], excerpt: "Une explosion de flammes.", url: "spells.html?q=Boule" },
  { title: "Feuille morte", category: "Sort", keywords: ["Transmutation"], excerpt: "Une chute ralentie." },
  { title: "Élémentaire du feu", category: "Monstre", keywords: ["Élémentaire", "FP 5"], excerpt: "Une créature de feu." },
  { title: "Résistance au feu", category: "Règle", keywords: ["dégâts"], excerpt: "Réduit les dégâts de feu." },
];

test("normalizeSearch ignores accents, case, punctuation, and apostrophes", () => {
  assert.equal(normalizeSearch("  L’ÉPÉE-d'Argent  "), "l epee d argent");
});

test("searchEntries supports unordered multi-word queries", () => {
  const results = searchEntries(entries, "feu boule");
  assert.equal(results[0].entry.title, "Boule de feu");
  assert.equal(results.length, 1);
});

test("searchEntries tolerates a small typo in a meaningful token", () => {
  const results = searchEntries(entries, "boulle feu");
  assert.equal(results[0].entry.title, "Boule de feu");
});

test("searchEntries prioritizes title matches and filters categories", () => {
  const all = searchEntries(entries, "feu");
  const monsters = searchEntries(entries, "feu", { category: "Monstre" });
  assert.equal(all[0].entry.title, "Boule de feu");
  assert.deepEqual(monsters.map((result) => result.entry.title), ["Élémentaire du feu"]);
});

test("countSearchCategories reports the available result facets", () => {
  const counts = countSearchCategories(searchEntries(entries, "feu"));
  assert.equal(counts.get("Sort"), 2);
  assert.equal(counts.get("Monstre"), 1);
  assert.equal(counts.get("Règle"), 1);
});

test("commands constrain search to the requested content family", () => {
  assert.deepEqual(parseSearchQuery("@sort fireball"), {
    raw: "@sort fireball",
    query: "fireball",
    command: "@sort",
    category: "Sort",
    label: "Sorts",
  });
  const results = searchEntries(entries, "@sort fireball");
  assert.equal(results.length, 1);
  assert.equal(results[0].entry.title, "Boule de feu");
  assert.equal(results[0].reason, "Alias : Fireball");
});

test("recent and profile context provide bounded ranking boosts", () => {
  const base = searchEntries(entries, "feu");
  const boosted = searchEntries(entries, "feu", {
    boostIds: ["rule-resistance-feu"],
    recentUrls: ["spells.html?q=Boule"],
  });
  assert.equal(base[0].entry.title, "Boule de feu");
  assert.equal(boosted[0].entry.title, "Boule de feu");
  assert.ok(boosted[0].score > base[0].score);
});

test("highlightSearchText preserves accents while marking normalized tokens", () => {
  assert.deepEqual(highlightSearchText("Équipement héroïque", "equipement"), [
    { text: "Équipement", match: true },
    { text: " héroïque", match: false },
  ]);
  assert.deepEqual(highlightSearchText("Boule de feu", "@sort feu"), [
    { text: "Boule de ", match: false },
    { text: "feu", match: true },
  ]);
});
