import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const imageRoot = fileURLToPath(new URL("../img/enemies/", import.meta.url));
const catalogue = JSON.parse(await readFile(new URL("../data/monsters_2024.json", import.meta.url), "utf8"));
const details = JSON.parse(await readFile(new URL("../data/monsters_2024_details.json", import.meta.url), "utf8"));
const translations = JSON.parse(await readFile(new URL("../data/monster-names-fr.json", import.meta.url), "utf8"));
const removedIds = new Set([4, 33, 62, 63, 64, 70, 96, 111, 139, 152, 162, 164, 198, 340, 448]);
const removedNames = [
  "Aberrant Spirit", "Animated Object", "Beast Of the Land", "Beast Of the Sea", "Beast Of the Sky",
  "Bestial Spirit", "Celestial Spirit", "Construct Spirit", "Draconic Spirit", "Elemental Spirit",
  "Fey Spirit", "Fiendish Spirit", "Giant Insect", "Otherworldly Steed", "Undead Spirit",
];

test("monster catalogue keeps historical identifiers while removing unresolved entries", () => {
  assert.equal(catalogue.count, 488);
  assert.equal(catalogue.monsters.length, 488);
  assert.deepEqual(catalogue.monsters.map((monster) => monster.id), Array.from({ length: 503 }, (_, index) => index + 1).filter((id) => !removedIds.has(id)));
  assert.deepEqual(catalogue.monsters.filter((monster) => removedNames.includes(monster.name)), []);
});

test("monster data, details and translations have matching complete coverage", () => {
  const slugs = new Set(catalogue.monsters.map((monster) => monster.slug));
  assert.equal(details.count, 488);
  assert.deepEqual(Object.keys(details.monsters).sort(), [...slugs].sort());
  assert.equal(translations.count, 488);
  assert.equal(translations.resolvedCount, 488);
  assert.equal(translations.unresolvedCount, 0);
  assert.deepEqual(translations.unresolvedMonsterTranslations, []);
});

test("monster ability modifiers, saves and portrait paths are deterministic", async () => {
  for (const monster of catalogue.monsters) {
    const data = details.monsters[monster.slug];
    const proficiency = Number(monster.pb);
    for (const ability of Object.values(data.abilities)) {
      const expected = Math.floor((ability.score - 10) / 2);
      assert.equal(Number(ability.modifier), expected, `${monster.name} modifier`);
      assert.ok([expected, expected + proficiency].includes(Number(ability.save)), `${monster.name} save`);
    }
    await access(join(imageRoot, monster.type, `${monster.name}.webp`));
  }
});

test("monster CI audit passes with only documented warnings", async () => {
  await run("node", ["scripts/audit-monsters.mjs", "--check"], { cwd: root, windowsHide: true });
});
