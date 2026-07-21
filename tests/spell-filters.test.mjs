import assert from "node:assert/strict";
import test from "node:test";

import { loadClassicScript } from "./load-classic-script.mjs";

const { filterAndSortSpells } = loadClassicScript("../js/spell-filters.js").DndSpellFilters;

const spells = [
  { name: "Lumière", level: 0, school: "Évocation", classes: ["Clerc"], description: "Lumière vive." },
  { name: "Boule de feu", level: 3, school: "Évocation", classes: ["Magicien"], description: "Explosion de flammes." },
  { name: "Aide", level: 2, school: "Abjuration", classes: ["Clerc", "Paladin"], description: "Renforce les alliés." },
];

test("filterAndSortSpells filters the cached searchable text", () => {
  assert.deepEqual(
    filterAndSortSpells(spells, { query: "FLAMMES" }).map((spell) => spell.name),
    ["Boule de feu"],
  );
  assert.deepEqual(
    filterAndSortSpells(spells, { query: "abjuration" }).map((spell) => spell.name),
    ["Aide"],
  );
  assert.deepEqual(
    filterAndSortSpells([
      { name: "Rayon", level: 1, school: "\u00c9vocation", classes: [], description: "" },
    ], { query: "evocation" }).map((spell) => spell.name),
    ["Rayon"],
  );
});

test("filterAndSortSpells combines level and class filters", () => {
  assert.deepEqual(
    filterAndSortSpells(spells, {
      level: 2,
      selectedClasses: new Set(["Clerc"]),
    }).map((spell) => spell.name),
    ["Aide"],
  );
});

test("filterAndSortSpells supports every current sort mode without mutating input", () => {
  const originalOrder = spells.map((spell) => spell.name);

  assert.deepEqual(
    filterAndSortSpells(spells, { sort: "level_desc" }).map((spell) => spell.name),
    ["Boule de feu", "Aide", "Lumière"],
  );
  assert.deepEqual(
    filterAndSortSpells(spells, { sort: "name_desc" }).map((spell) => spell.name),
    ["Lumière", "Boule de feu", "Aide"],
  );
  assert.deepEqual(spells.map((spell) => spell.name), originalOrder);
});
