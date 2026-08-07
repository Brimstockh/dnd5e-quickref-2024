import assert from "node:assert/strict";
import test from "node:test";

import { loadClassicScript } from "./load-classic-script.mjs";

const { buildMonsterExportJson, monsterExportFilename } = loadClassicScript("../js/monster-export.js").DndMonsterExport;

test("buildMonsterExportJson preserves one complete monster object", () => {
  const monster = {
    name: "Aboleth",
    slug: "aboleth",
    abilities: { STR: { score: 21, modifier: "+5", save: "+9" } },
    actions: [{ name: "Tentacle", description: "A detailed action." }],
  };

  assert.deepEqual(JSON.parse(buildMonsterExportJson(monster)), monster);
  assert.match(buildMonsterExportJson(monster), /\n\s+"abilities"/);
  assert.equal(monsterExportFilename(monster), "aboleth.json");
});

test("monsterExportFilename falls back to a safe monster filename", () => {
  assert.equal(monsterExportFilename({ name: "Bête / spéciale" }), "bete-speciale.json");
  assert.equal(monsterExportFilename({}), "monstre.json");
});
