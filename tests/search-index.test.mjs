import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SITE_SECTIONS } from "../js/site-navigation.js";

const [primaryIndex, deepIndex] = await Promise.all([
  readFile(new URL("../data/search-index.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/search-index-deep.json", import.meta.url), "utf8").then(JSON.parse),
]);
const index = {
  ...primaryIndex,
  entries: [...(primaryIndex.entries || []), ...(deepIndex.entries || [])],
};
index.count = index.entries.length;

test("global search index covers every major content family", () => {
  const categories = new Set(index.entries.map((entry) => entry.category));
  for (const category of ["Sort", "Monstre", "Don", "État", "Classe", "Espèce", "Objet", "Historique", "Règle", "Action", "Univers", "Lore"]) {
    assert.equal(categories.has(category), true, category);
  }
  assert.equal(index.schemaVersion, 1);
  assert.equal(index.version, 4);
  assert.equal(index.count, index.entries.length);
  assert.ok(index.entries.length > 1200);
});

test("global search entries expose stable canonical IDs and compatibility aliases", () => {
  const ids = new Set(index.entries.map((entry) => entry.id));
  assert.equal(ids.size, index.entries.length);
  for (const entry of index.entries) {
    assert.match(entry.id, new RegExp(`^${entry.type}-[a-z0-9]`));
    assert.ok(["Règles", "Compendium", "Création", "Univers", "Ma table"].includes(entry.section));
    assert.equal(typeof entry.category, "string");
    assert.equal(Array.isArray(entry.aliases), true);
    assert.equal(Array.isArray(entry.keywords), true);
  }

  const fireball = index.entries.find((entry) => entry.title === "Boule de feu" && entry.category === "Sort");
  assert.equal(fireball.id, "spell-boule-de-feu");
  assert.equal(fireball.section, "Compendium");
  assert.ok(fireball.aliases.includes("Fireball"));
});

test("navigation pages use page metadata while deep contents keep specialized types", () => {
  const entryForUrl = (url) => index.entries.find((entry) => entry.url === url);
  const pageExpectations = [
    ["spells.html", "Compendium", "Sort"],
    ["glossaire.html", "Règles", "Glossaire"],
    ["classes/index.html", "Création", "Classe"],
    ["monstres.html", "Compendium", "Monstre"],
    ["regles-campagne.html", "Ma table", "Règle de campagne"],
    ["html/characters.html", "Ma table", "Personnage"],
  ];

  for (const [url, section, category] of pageExpectations) {
    assert.deepEqual(
      (({ section: actualSection, category: actualCategory, type }) => ({ section: actualSection, category: actualCategory, type }))(entryForUrl(url)),
      { section, category, type: "page" },
      url,
    );
  }

  const navigationUrls = new Set(SITE_SECTIONS.flatMap(({ links }) => links.map(({ url }) => url)));
  for (const entry of index.entries.filter(({ url }) => navigationUrls.has(url))) {
    assert.equal(entry.type, "page", entry.url);
  }

  const deepExpectations = [
    ["spell-boule-de-feu", "Compendium", "Sort", "spell"],
    ["glossary-jet-de-sauvegarde", "Règles", "Glossaire", "glossary"],
    ["class-magicien", "Création", "Classe", "class"],
    ["monster-mind-flayer", "Compendium", "Monstre", "monster"],
    ["lore-waterdeep", "Univers", "Lore", "lore"],
  ];
  for (const [id, section, category, type] of deepExpectations) {
    const entry = index.entries.find((candidate) => candidate.id === id);
    assert.deepEqual({ section: entry.section, category: entry.category, type: entry.type }, { section, category, type }, id);
  }
  assert.ok(index.entries.some(({ type, category, section }) => type === "campaign-rule" && category === "Règle de campagne" && section === "Ma table"));
});

test("global search includes glossary terms and bilingual aliases", () => {
  const glossary = index.entries.find((entry) => entry.id === "glossary-jet-de-sauvegarde");
  const wizard = index.entries.find((entry) => entry.id === "class-magicien");
  assert.equal(glossary.category, "Glossaire");
  assert.ok(glossary.aliases.includes("Saving Throw"));
  assert.ok(wizard.aliases.includes("Wizard"));
  assert.match(glossary.url, /^glossaire\.html\?term=/);
});

test("global search includes lore entries and bilingual setting aliases", () => {
  const waterdeep = index.entries.find((entry) => entry.id === "lore-waterdeep");
  const acereraK = index.entries.find((entry) => entry.id === "lore-acererak");
  assert.equal(waterdeep.type, "lore");
  assert.equal(waterdeep.category, "Lore");
  assert.ok(waterdeep.aliases.includes("Eauprofonde"));
  assert.equal(waterdeep.url, "lore.html?term=waterdeep");
  assert.match(acereraK.url, /^lore\.html\?term=/);
  assert.equal(acereraK.type, "lore");
});

test("global monster search exposes French labels and English aliases", () => {
  const monster = index.entries.find((entry) => entry.id === "monster-mind-flayer");
  assert.equal(monster.title, "Flagelleur mental");
  assert.ok(monster.aliases.includes("Mind Flayer"));
  assert.match(monster.url, /^monstres\.html\?q=/);
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
