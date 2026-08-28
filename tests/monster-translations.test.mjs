import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const monsters = JSON.parse(await readFile(new URL("../data/monsters_2024.json", import.meta.url), "utf8")).monsters;
const translationData = JSON.parse(await readFile(new URL("../data/monster-names-fr.json", import.meta.url), "utf8"));
const names = translationData.monsterNamesFr;
const unresolved = translationData.unresolvedMonsterTranslations;

test("monster translations cover every dataset entry without touching technical identifiers", () => {
  const monsterNames = new Set(monsters.map((monster) => monster.name));
  const resolvedNames = Object.keys(names);
  const unresolvedNames = unresolved.map((entry) => entry.en);

  assert.equal(translationData.count, monsters.length);
  assert.equal(translationData.resolvedCount, resolvedNames.length);
  assert.equal(translationData.unresolvedCount, unresolved.length);
  assert.equal(new Set([...resolvedNames, ...unresolvedNames]).size, monsters.length);
  assert.deepEqual(resolvedNames.filter((name) => !monsterNames.has(name)), []);
  assert.deepEqual(unresolvedNames.filter((name) => !monsterNames.has(name)), []);
  assert.deepEqual(resolvedNames.filter((name) => unresolvedNames.includes(name)), []);
  assert.equal(new Set(Object.values(names)).size, resolvedNames.length);
  assert.ok(monsters.every((monster) => monster.id !== undefined && monster.slug));
});

test("sensitive monster variants retain distinct photographed names", () => {
  assert.equal(names["Mind Flayer"], "Flagelleur mental");
  assert.equal(names["Intellect Devourer"], "Dévoreur d'intellect");
  assert.equal(names["Rust Monster"], "Oxydeur");
  assert.equal(names["Displacer Beast"], "Bête éclipsante");
  assert.equal(names["Owlbear"], "Hibours");
  assert.equal(names["Beholder"], "Tyrannœil");
  assert.equal(names["Adult Black Dragon"], "Dragon noir adulte");
  assert.equal(names["Ancient Black Dragon"], "Dragon noir vénérable");
  assert.equal(names["Black Dragon Wyrmling"], "Dragonnet noir");
  assert.equal(names["Young Black Dragon"], "Jeune dragon noir");
  assert.equal(names["Giant Elk"], "Cervidé géant");
  assert.equal(names["Elk"], "Grand cervidé");
  assert.equal(names["Grick"], "Grick");
  assert.equal(names["Grick Ancient"], "Grick vénérable");
});
