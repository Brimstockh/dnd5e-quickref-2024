import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { filterGlossaryEntries } from "../js/glossary-page.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const ph2024Terms = [
  "Ability Check", "Ability Score and Modifier", "Action", "Advantage", "Adventure", "Alignment",
  "Ally", "Area of Effect", "Armor Class", "Armor Training", "Attitude", "Attunement",
  "Attack", "Attack Roll", "Blinded", "Blindsight", "Bloodied", "Bonus Action",
  "Breaking Objects", "Bright Light", "Burning", "Burrow Speed", "Campaign", "Cantrip",
  "Carrying Capacity", "Challenge Rating", "Character Sheet", "Charmed", "Climbing", "Climb Speed",
  "Concentration", "Condition", "Cone", "Cover", "Crawling", "Creature", "Creature Type",
  "Critical Hit", "Cube", "Curses", "Cylinder", "D20 Test", "Damage", "Damage Roll",
  "Damage Threshold", "Damage Types", "Darkness", "Darkvision", "Dash", "Dead", "Deafened",
  "Death Saving Throw", "Dehydration", "Difficult Terrain", "Difficulty Class", "Dim Light",
  "Disadvantage", "Disengage", "Dodge", "Emanation", "Encounter", "Enemy", "Exhaustion",
  "Experience Points", "Expertise", "Falling", "Flying", "Fly Speed", "Frightened", "Friendly",
  "Grappled", "Grappling", "Hazard", "Healing", "Heavily Obscured", "Help", "Heroic Inspiration",
  "Hide", "High Jump", "Hit Point Dice", "Hit Points", "Hostile", "Hover", "Illusions", "Immunity",
  "Improvised Weapons", "Incapacitated", "Indifferent", "Influence", "Initiative", "Invisible",
  "Jumping", "Knocking Out a Creature", "Lightly Obscured", "Line", "Long Jump", "Long Rest", "Magic",
  "Magical Effect", "Malnutrition", "Monster", "Nonplayer Character", "Object", "Occupied Space",
  "Opportunity Attacks", "Paralyzed", "Passive Perception", "Per Day", "Petrified", "Player Character",
  "Poisoned", "Possession", "Proficiency", "Prone", "Reaction", "Ready", "Resistance", "Restrained",
  "Ritual", "Round Down", "Save", "Saving Throw", "Search", "Shape-Shifting", "Short Rest",
  "Simultaneous Effects", "Size", "Skill", "Speed", "Spell", "Spell Attack", "Spellcasting Focus",
  "Sphere", "Stable", "Stat Block", "Study", "Stunned", "Suffocation", "Surprise", "Swimming",
  "Swim Speed", "Target", "Telepathy", "Teleportation", "Temporary Hit Points", "Tremorsense", "Truesight",
  "Unarmed Strike", "Unconscious", "Unoccupied Space", "Utilize", "Vulnerability", "Weapon", "Weapon Attack",
];

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function plainHeading(value) {
  return normalize(String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s*\[[^\]]+\]\s*$/, ""));
}

test("every PH2024 Rules Glossary entry is represented by a French entry", async () => {
  const glossary = JSON.parse(await readFile(resolve(root, "data/glossary.json"), "utf8"));
  const html = await readFile(resolve(root, "glossaire.html"), "utf8");
  const searchable = new Map(glossary.entries.flatMap((entry) => (
    [entry.label, ...entry.aliases].map((term) => [normalize(term), entry])
  )));
  const missing = ph2024Terms.filter((term) => !searchable.has(normalize(term)));
  assert.deepEqual(missing, [], `PH2024 terms without a mapped entry: ${missing.join(", ")}`);

  const headings = new Set([...html.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi)].map((match) => plainHeading(match[1])));
  const missingDefinitions = glossary.entries
    .filter((entry) => !headings.has(normalize(entry.label)))
    .map((entry) => entry.label);
  assert.deepEqual(missingDefinitions, []);
  assert.equal(new Set(glossary.entries.map((entry) => entry.id)).size, glossary.entries.length);
  assert.equal(new Set(glossary.entries.map((entry) => entry.anchor)).size, glossary.entries.length);
  assert.ok(glossary.entries.every((entry) => ["Termes", "Actions", "États"].includes(entry.category)));

  const labels = new Map();
  for (const entry of glossary.entries) {
    for (const term of [entry.label, ...entry.aliases]) {
      const key = normalize(term);
      assert.equal(labels.has(key), false, `duplicate glossary term: ${term}`);
      labels.set(key, entry.id);
    }
  }

  const anchors = new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]));
  for (const match of html.matchAll(/href=["']#([^"']+)["']/gi)) {
    assert.ok(anchors.has(match[1]) || glossary.entries.some((entry) => entry.anchor === match[1]), `missing glossary anchor: #${match[1]}`);
  }
});

test("glossary search retrieves the important English aliases", async () => {
  const glossary = JSON.parse(await readFile(resolve(root, "data/glossary.json"), "utf8"));
  const cases = [
    ["Grappling", "Agripper"],
    ["Truesight", "Vision véritable"],
    ["Tremorsense", "Perception des vibrations"],
    ["Teleportation", "Téléportation"],
    ["Hazard", "Danger"],
    ["Weapon Attack", "Attaque avec arme"],
  ];
  for (const [query, label] of cases) {
    const matches = filterGlossaryEntries(glossary.entries, { query, category: "", letter: "", term: "" });
    assert.ok(matches.some((entry) => entry.label === label), `${query} should find ${label}`);
  }
});

test("editorial pages expose bounded rich-text glossary scopes", async () => {
  const paths = [
    "creation-personnage-2024.html",
    "historique.html",
    "armes-armures.html",
    "classes/class-barbarian.html",
    "classes/class-wizard.html",
    "races/race-aasimar.html",
    "races/race-human.html",
  ];
  for (const path of paths) {
    assert.match(await readFile(resolve(root, path), "utf8"), /data-glossary-richtext/, path);
  }
});

test("dynamic catalog renderers mark their user-authored text", async () => {
  for (const path of ["js/magic-items-page.js", "js/campaign-rules-page.js"]) {
    assert.match(await readFile(resolve(root, path), "utf8"), /data-glossary-richtext/, path);
  }
});
