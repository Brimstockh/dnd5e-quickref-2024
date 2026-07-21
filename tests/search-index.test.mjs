import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const index = JSON.parse(await readFile(new URL("../data/search-index.json", import.meta.url), "utf8"));

test("global search index covers every major content family", () => {
  const categories = new Set(index.entries.map((entry) => entry.category));
  for (const category of ["Sort", "Monstre", "Don", "État", "Classe", "Espèce", "Objet", "Historique", "Règle", "Action", "Univers"]) {
    assert.equal(categories.has(category), true, category);
  }
  assert.equal(index.version, 2);
  assert.equal(index.count, index.entries.length);
  assert.ok(index.entries.length > 1100);
});

test("global search results link to focused catalog queries", () => {
  const spell = index.entries.find((entry) => entry.category === "Sort" && entry.title === "Boule de feu");
  const monster = index.entries.find((entry) => entry.category === "Monstre");
  const feat = index.entries.find((entry) => entry.category === "Don");
  assert.match(spell.url, /^spells\.html\?q=/);
  assert.match(monster.url, /^monstres\.html\?q=/);
  assert.match(feat.url, /^dons\.html\?q=/);
});

test("global search index links directly to equipment, backgrounds, and rule sections", () => {
  const equipment = index.entries.find((entry) => entry.category === "Objet" && entry.title === "Rapière");
  const background = index.entries.find((entry) => entry.category === "Historique" && entry.title === "Soldat");
  const rule = index.entries.find((entry) => entry.category === "Règle" && entry.url.includes("#"));
  assert.match(equipment.url, /^armes-armures\.html\?q=/);
  assert.match(background.url, /^historique\.html\?q=/);
  assert.match(rule.url, /\.html#/);
});
