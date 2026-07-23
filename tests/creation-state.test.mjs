import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function loadState() {
  const window = {};
  const context = vm.createContext({ window, Date });
  vm.runInContext(await readFile(resolve(root, "js/creation-state.js"), "utf8"), context);
  return window.DndCreationState;
}

test("creation calculations follow the level and ability formulas", async () => {
  const state = await loadState();
  assert.equal(state.modifier(8), -1);
  assert.equal(state.modifier(15), 2);
  assert.equal(state.proficiency(1), 2);
  assert.equal(state.proficiency(5), 3);
  assert.equal(state.proficiency(17), 6);
});

test("creation draft validation detects required guided choices", async () => {
  const state = await loadState();
  const draft = state.createDraft();
  assert.deepEqual([...state.validateStep(draft, 0)], ["Indiquez un nom ou un concept."]);
  assert.equal(state.validateStep(draft, 2).length, 1);
  draft.name = "Lyria";
  draft.classId = "paladin";
  assert.equal(state.validateStep(draft, 0).length, 0);
  assert.equal(state.validateStep(draft, 2).length, 0);
});

test("generated payload fills the standalone sheet and selected spells", async () => {
  const state = await loadState();
  const model = JSON.parse(await readFile(resolve(root, "data/character-creation.json"), "utf8"));
  const spellData = JSON.parse(await readFile(resolve(root, "data/spells_2024.json"), "utf8"));
  const spell = spellData.spells.find(({ classes, level }) => classes.includes("Paladin") && level <= 1);
  const draft = {
    ...state.createDraft(),
    name: "Lyria",
    level: 3,
    classId: "paladin",
    speciesId: "aasimar",
    backgroundId: "acolyte",
    abilities: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
    skills: ["Intuition"],
    spells: [spell.slug],
  };
  const derived = state.derived(draft, model);
  const payload = state.sheetPayload(draft, model, spellData.spells);

  assert.equal(derived.hp, 25);
  assert.equal(payload.version, "standalone_v2");
  assert.equal(payload.data.name, "Lyria");
  assert.equal(payload.data.class_level, "Paladin 3");
  assert.equal(payload.data.species, "Aasimar");
  assert.equal(payload.data.hp_max, "25");
  assert.equal(payload.data.spell_1_name, spell.name);
  assert.equal(payload.data.skill_intuition_prof, true);
});

test("creation catalog provides stable unique references", async () => {
  const model = JSON.parse(await readFile(resolve(root, "data/character-creation.json"), "utf8"));
  assert.equal(model.schemaVersion, 1);
  assert.equal(model.classes.length, 12);
  assert.equal(model.species.length, 10);
  assert.equal(model.backgrounds.length, 16);
  for (const collection of [model.classes, model.species, model.backgrounds]) {
    assert.equal(new Set(collection.map(({ id }) => id)).size, collection.length);
  }
  assert.deepEqual(model.standardArray, [15, 14, 13, 12, 10, 8]);
});

test("wizard exposes all eleven stages and generation outputs", async () => {
  const html = await readFile(resolve(root, "assistant-creation.html"), "utf8");
  const script = await readFile(resolve(root, "js/creation-wizard.js"), "utf8");
  assert.match(html, /id="expertMode"/);
  assert.match(html, /id="resetDraft"/);
  assert.match(script, /"Concept", "Niveau", "Classe", "Espèce", "Historique", "Caractéristiques"/);
  assert.match(script, /"Compétences", "Équipement", "Sorts", "Récapitulatif", "Créer la fiche"/);
  assert.match(script, /dnd_character_creator_draft_v1/);
  assert.match(script, /dnd_character_sheet_standalone_v2/);
  assert.match(script, /DndProfiles\.save/);
});

test("comparator keeps its category and selections in the URL", async () => {
  const html = await readFile(resolve(root, "comparateur.html"), "utf8");
  const script = await readFile(resolve(root, "js/comparator.js"), "utf8");
  assert.match(html, /value="classes"/);
  assert.match(html, /value="species"/);
  assert.match(html, /value="backgrounds"/);
  assert.match(html, /value="feat"/);
  assert.match(html, /value="spell"/);
  assert.match(html, /value="equipment"/);
  assert.match(script, /history\.replaceState/);
  assert.match(script, /params\.set\("compare"/);
});
