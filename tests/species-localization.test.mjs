import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const raceFiles = (await readdir(new URL("../races/", import.meta.url)))
  .filter((file) => /^race-.*\.html$/i.test(file));
const pages = await Promise.all(raceFiles.map(async (file) => [
  file,
  await readFile(new URL(`../races/${file}`, import.meta.url), "utf8"),
]));

test("species pages use metric distances and French ability and spell names", () => {
  for (const [file, source] of pages) {
    assert.doesNotMatch(source, /\b(?:feet|foot)\b/i, `${file} still contains an imperial distance`);
    assert.match(source, /href="index\.html">Espèces<\/a>/, `${file} still labels the species index in English`);
  }

  const combined = pages.map(([, source]) => source).join("\n");
  for (const untranslated of [
    "Gnomish Cunning", "Gnomish Lineage", "Forest Gnome", "Rock Gnome", "Minor Illusion",
    "Speak with Animals", "Mending", "Dwarven Resilience", "Dwarven Toughness", "Stonecunning",
    "Dancing Lights", "Faerie Fire", "Darkness", "Detect Magic", "Misty Step", "Druidcraft", "Longstrider",
    "Pass without Trace", "Adrenaline Rush", "Relentless Endurance", "Poison Spray", "Ray of Sickness",
    "Hold Person", "Chill Touch", "False Life", "Ray of Enfeeblement", "Fire Bolt", "Hellish Rebuke", "Thaumaturgy",
  ]) assert.ok(!combined.includes(untranslated), `untranslated species label remains: ${untranslated}`);
});

test("gnome mechanics remain intact after translating their labels", () => {
  const gnome = pages.find(([file]) => file === "race-gnome.html")?.[1] || "";
  assert.match(gnome, /Ruse gnome :<\/strong> avantage aux jets de sauvegarde d'Intelligence, de Sagesse et de Charisme/);
  assert.match(gnome, /Gnome des forêts :<\/strong>[\s\S]*toujours le sort <em>Communication avec les animaux<\/em> préparé/);
  assert.match(gnome, /Gnome des roches :<\/strong>[\s\S]*<em>Réparation<\/em> et <em>Prestidigitation<\/em>/);
});

test("Merric's character note is in French", async () => {
  const source = await readFile(new URL("../data/characters/merric-thorngage.json", import.meta.url), "utf8");
  const character = JSON.parse(source.replace(/^\uFEFF/, ""));
  assert.equal(character.notes, "Action bonus : Combat à deux armes.");
});

test("character model placeholder text is in French", async () => {
  const source = await readFile(new URL("../data/characters/character-template.story.json", import.meta.url), "utf8");
  const template = JSON.parse(source.replace(/^\uFEFF/, ""));
  assert.equal(template.background.feature.text, "Texte de la capacité (ce que cela apporte en RP ou en jeu).");
});
