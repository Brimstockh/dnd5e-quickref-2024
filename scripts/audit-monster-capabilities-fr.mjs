import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [catalog, detailsData, translations] = await Promise.all([
  readJson("data/monsters_2024.json"),
  readJson("data/monsters_2024_details.json"),
  readJson("data/monster-capabilities-fr.json"),
]);

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

const categories = ["traits", "actions", "bonus_actions", "reactions", "legendary_actions"];
const sourceMonsters = new Map(catalog.monsters.map((monster) => [monster.slug, monster]));
const translatedMonsters = translations.monsters || {};
const errors = [];
let translatedAbilities = 0;
let sourceAbilities = 0;
const numberTokens = (value) => [...String(value).matchAll(/\d+d\d+|\d+(?:[ ,]\d{3})*(?:\.\d+)?/g)].map(([token]) => token.replace(/[ ,]/g, ""));

if (translations.schemaVersion !== 1) errors.push("unexpected translation schemaVersion");
if (translations.language !== "fr") errors.push("localization language must be fr");
if (translations.source !== "data/monsters_2024_details.json") errors.push("localization source must identify the original detail catalog");
if (translations.count !== catalog.monsters.length) errors.push("localization count does not match the monster catalog");
if (detailsData.count !== catalog.monsters.length) errors.push("detail count does not match the monster catalog");

for (const [slug, translatedMonster] of Object.entries(translatedMonsters)) {
  if (!sourceMonsters.has(slug) || !detailsData.monsters?.[slug]) {
    errors.push(`unknown monster slug ${slug}`);
    continue;
  }
  const sourceMonster = detailsData.monsters[slug];
  for (const category of categories) {
    const sourceEntries = sourceMonster[category] || [];
    const translatedEntries = translatedMonster[category] || [];
    if (translatedEntries.length > sourceEntries.length) errors.push(`${slug}.${category} has extra translations`);
    for (const [index, translated] of translatedEntries.entries()) {
      const source = sourceEntries[index];
      if (!source) continue;
      if (!String(translated.nameFr || "").trim()) errors.push(`${slug}.${category}[${index}] is missing nameFr`);
      if (!String(translated.descriptionFr || "").trim()) errors.push(`${slug}.${category}[${index}] is missing descriptionFr`);
      if (translated.nameFr && translated.descriptionFr) translatedAbilities += 1;
      if (translated.descriptionFr && JSON.stringify(numberTokens(source.description)) !== JSON.stringify(numberTokens(translated.descriptionFr))) {
        errors.push(`${slug}.${category}[${index}] has different numeric tokens`);
      }
    }
  }
}

for (const monster of catalog.monsters) {
  const source = detailsData.monsters?.[monster.slug];
  if (!source) {
    errors.push(`${monster.slug} has no source detail record`);
    continue;
  }
  for (const category of categories) sourceAbilities += (source[category] || []).length;
}

for (const [name, actual, expected] of [
  ["monsters", Object.keys(translatedMonsters).length, catalog.monsters.length],
  ["abilities", translatedAbilities, sourceAbilities],
]) console.log(`${name}: ${actual}/${expected}`);
console.log(`remaining abilities: ${Math.max(0, sourceAbilities - translatedAbilities)}`);

if (process.argv.includes("--strict")) {
  for (const monster of catalog.monsters) {
    const source = detailsData.monsters?.[monster.slug] || {};
    const translated = translatedMonsters[monster.slug] || {};
    for (const category of categories) {
      if ((translated[category] || []).length !== (source[category] || []).length) {
        errors.push(`${monster.slug}.${category} translation count differs from source`);
      }
    }
  }
  if (translatedAbilities !== sourceAbilities) errors.push(`missing French translations for ${sourceAbilities - translatedAbilities} abilities`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("French monster ability localization is structurally valid.");
}
