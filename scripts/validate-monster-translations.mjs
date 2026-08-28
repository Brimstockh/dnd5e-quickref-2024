import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const monsters = JSON.parse(await readFile(resolve(root, "data/monsters_2024.json"), "utf8")).monsters;
const translationData = JSON.parse(await readFile(resolve(root, "data/monster-names-fr.json"), "utf8"));
const names = translationData.monsterNamesFr || {};
const unresolved = translationData.unresolvedMonsterTranslations || [];
const monsterNames = monsters.map((monster) => monster.name);
const monsterNameSet = new Set(monsterNames);
const errors = [];

if (new Set(monsterNames).size !== monsters.length) errors.push("Duplicate English monster names");
if (new Set(monsters.map((monster) => monster.id)).size !== monsters.length) errors.push("Duplicate monster IDs");
if (new Set(monsters.map((monster) => monster.slug)).size !== monsters.length) errors.push("Duplicate monster slugs");

const missing = monsterNames.filter((name) => !names[name] && !unresolved.some((entry) => entry.en === name));
const unknown = Object.keys(names).filter((name) => !monsterNameSet.has(name));
const unresolvedUnknown = unresolved.filter((entry) => !monsterNameSet.has(entry.en));
const overlap = unresolved.filter((entry) => Object.hasOwn(names, entry.en));
const duplicateFrenchNames = Object.entries(names).reduce((duplicates, [english, french]) => {
  const previous = duplicates.get(french) || [];
  previous.push(english);
  duplicates.set(french, previous);
  return duplicates;
}, new Map());

if (missing.length) errors.push(`Missing translations: ${missing.join(", ")}`);
if (unknown.length) errors.push(`Unknown mapping keys: ${unknown.join(", ")}`);
if (unresolvedUnknown.length) errors.push(`Unknown unresolved entries: ${unresolvedUnknown.map((entry) => entry.en).join(", ")}`);
if (overlap.length) errors.push(`Entries both resolved and unresolved: ${overlap.map((entry) => entry.en).join(", ")}`);
for (const [french, entries] of duplicateFrenchNames) {
  if (entries.length > 1) errors.push(`Duplicate French label "${french}": ${entries.join(", ")}`);
}
for (const entry of unresolved) {
  if (!Array.isArray(entry.candidates) || !entry.reason) errors.push(`Incomplete unresolved entry: ${entry.en}`);
}

if (translationData.count !== monsters.length) errors.push(`Count mismatch: mapping=${translationData.count}, monsters=${monsters.length}`);
if (translationData.resolvedCount !== Object.keys(names).length) errors.push("Resolved count metadata is stale");
if (translationData.unresolvedCount !== unresolved.length) errors.push("Unresolved count metadata is stale");

if (errors.length) throw new Error(errors.join("\n"));

console.log(`Verified ${monsters.length} monsters: ${Object.keys(names).length} French translations, ${unresolved.length} unresolved.`);
