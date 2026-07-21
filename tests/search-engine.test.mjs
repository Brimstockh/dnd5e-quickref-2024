import assert from "node:assert/strict";
import test from "node:test";

import {
  countSearchCategories,
  normalizeSearch,
  searchEntries,
} from "../js/search-engine.js";

const entries = [
  { title: "Boule de feu", category: "Sort", keywords: ["Évocation", "niveau 3"], excerpt: "Une explosion de flammes." },
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
