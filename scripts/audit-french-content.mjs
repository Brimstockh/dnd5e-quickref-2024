import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [spellsData, featsData, magicItemsData, magicItemsFr, monstersData, monsterNamesData, monsterCapabilities, loreData, glossaryData, searchPrimary, searchDeep] = await Promise.all([
  readJson("data/spells_2024.json"),
  readJson("data/feats_2024.json"),
  readJson("data/magic-items.json"),
  readJson("data/magic-items-fr.json"),
  readJson("data/monsters_2024.json"),
  readJson("data/monster-names-fr.json"),
  readJson("data/monster-capabilities-fr.json"),
  readJson("data/lore.json"),
  readJson("data/glossary.json"),
  readJson("data/search-index.json"),
  readJson("data/search-index-deep.json"),
]);

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

const errors = [];
const candidates = [];
const knownSourceTruncations = [];
const englishFunctionWords = new Set("an and are as at be been being before between both but by can could did do does doing each either for from had has have he her hers him his how i if in into is it its may might must no nor not of on once one or our she should so than that the their theirs them then there these they this those through to under until up was we were what when where which while who why will with would you your yours".split(" "));
const frenchFunctionWords = new Set("à au aux avec ce ces chaque comme dans de des du elle en et eux il ils je la le les leur lui mais me mes moi ni nos notre nous ou par pas pour que qui sa se ses son sous sur ta te tes toi ton tu un une vos votre vous y".split(" "));
const englishRulePhrases = [
  /\b(?:melee|ranged) attack roll\b/i,
  /\bsaving throw\b/i,
  /\bhit points?\b/i,
  /\b(?:long|short) rest\b/i,
  /\bbonus action\b/i,
  /\blegendary action\b/i,
  /\bspellcasting ability\b/i,
  /\b(?:bludgeoning|piercing|slashing|radiant|necrotic|lightning|thunder) damage\b/i,
  /\b(?:the target|each creature|one creature|you can|you must|at the start|at the end)\b/i,
];
const englishSingleTerms = new Set(["lich", "lore"]);

function normalize(value) {
  return String(value || "")
    .normalize("NFC")
    .toLocaleLowerCase("fr");
}

function isEnglishCandidate(value, includeSingleTerms = false) {
  const normalized = normalize(value);
  const words = normalized.match(/[\p{L}]+/gu) || [];
  if (!words.length) return false;
  if (includeSingleTerms && words.some((word) => englishSingleTerms.has(word))) return true;
  if (englishRulePhrases.some((pattern) => pattern.test(normalized))) return true;
  const englishCount = words.filter((word) => englishFunctionWords.has(word)).length;
  const frenchCount = words.filter((word) => frenchFunctionWords.has(word)).length;
  if (words.length >= 4 && englishCount >= 2 && frenchCount <= 1) return true;
  return words.length >= 8 && englishCount >= 3 && englishCount > frenchCount;
}

function addCandidate(path, id, field, value, includeSingleTerms = false) {
  if (typeof value !== "string" || !value.trim() || !isEnglishCandidate(value, includeSingleTerms)) return;
  candidates.push({ path, id, field, value: value.trim().replace(/\s+/g, " ").slice(0, 180) });
}

function collectStrings(path, id, value, skippedKeys = new Set(["id", "slug", "name", "nameEn", "descriptionEn", "descriptionOriginal", "aliases", "related", "target", "url", "anchor", "path", "source", "sourceRef", "sourcePage"])) {
  if (typeof value === "string") {
    addCandidate(path, id, "text", value, true);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => collectStrings(path, `${id}[${index}]`, child, skippedKeys));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (!skippedKeys.has(key)) collectStrings(path, id ? `${id}.${key}` : key, child, skippedKeys);
    }
  }
}

function addCoverage(label, actual, expected) {
  console.log(`${label}: ${actual}/${expected}`);
  if (actual !== expected) errors.push(`${label} coverage differs from ${expected}`);
}

function requireText(label, value) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${label} is empty`);
}

const spells = spellsData.spells || [];
const feats = featsData.feats || [];
const items = magicItemsData.items || [];
const itemTranslations = magicItemsFr.items || [];
const monsters = monstersData.monsters || [];
const monsterNamesFr = monsterNamesData.monsterNamesFr || {};
const abilityTranslations = monsterCapabilities.monsters || {};
const primaryEntries = searchPrimary.entries || [];
const deepEntries = searchDeep.entries || [];
const entriesByType = (entries, type) => entries.filter((entry) => entry.type === type);

addCoverage("Sorts", spells.length, 391);
addCoverage("Dons", feats.length, 75);
addCoverage("Objets magiques", itemTranslations.length, 347);
addCoverage("Noms de monstres", Object.keys(monsterNamesFr).length, monsters.length);
addCoverage("Capacités de monstres", Object.values(abilityTranslations).reduce((sum, monster) => sum + Object.values(monster).reduce((subtotal, entries) => subtotal + entries.length, 0), 0), 2093);
addCoverage("Capacités de classe", entriesByType(deepEntries, "class-feature").length, 454);
addCoverage("Capacités d’espèce", entriesByType(deepEntries, "species-feature").length, 70);
addCoverage("Glossaire", (glossaryData.entries || []).length, 167);
addCoverage("Lore", (loreData.entries || []).length, 74);

for (const spell of spells) {
  for (const field of ["name", "casting_time", "range", "components", "duration", "description", "description_html"]) requireText(`spell ${spell.slug}.${field}`, spell[field]);
  if (/(?:['’]|\.\.\.|…)\s*$/.test(spell.description || "")) errors.push(`spell ${spell.slug} has a truncated or stray final marker`);
  for (const field of ["name", "school", "classes", "casting_time", "range", "components", "duration", "description"]) {
    const value = spell[field];
    if (Array.isArray(value)) value.forEach((item) => addCandidate("data/spells_2024.json", spell.slug, field, item, true));
    else addCandidate("data/spells_2024.json", spell.slug, field, value, true);
  }
}
for (const feat of feats) {
  requireText(`feat ${feat.name}.description`, feat.description);
  for (const field of ["name", "category", "prerequis", "description"]) addCandidate("data/feats_2024.json", feat.name, field, feat[field], true);
}
for (const item of itemTranslations) {
  requireText(`magic item ${item.id}.nameFr`, item.nameFr);
  requireText(`magic item ${item.id}.descriptionFr`, item.descriptionFr);
  collectStrings("data/magic-items-fr.json", item.id, item);
  if (/(?:\.\.\.|…)\s*$/.test(item.descriptionFr || "")) errors.push(`magic item ${item.id} has a truncated French description`);
}
for (const [name, translated] of Object.entries(monsterNamesFr)) addCandidate("data/monster-names-fr.json", name, "nameFr", translated, true);
collectStrings("data/monster-capabilities-fr.json", "fieldsFr", monsterCapabilities.fieldsFr);
for (const [slug, translated] of Object.entries(abilityTranslations)) {
  collectStrings("data/monster-capabilities-fr.json", slug, translated);
  for (const [category, entries] of Object.entries(translated)) {
    for (const [index, ability] of entries.entries()) {
      requireText(`monster ${slug}.${category}[${index}].nameFr`, ability.nameFr);
      requireText(`monster ${slug}.${category}[${index}].descriptionFr`, ability.descriptionFr);
      if (/…\s*$/.test(ability.descriptionFr || "")) knownSourceTruncations.push(`${slug}.${category}[${index}] (${ability.nameFr})`);
      else if (/\.\.\.\s*$/.test(ability.descriptionFr || "")) errors.push(`monster ${slug}.${category}[${index}] has a truncated French description`);
    }
  }
}
for (const entry of loreData.entries || []) {
  requireText(`lore ${entry.id}.summary`, entry.summary);
  addCandidate("data/lore.json", entry.id, "display name", entry.nameFr || entry.name, true);
  collectStrings("data/lore.json", entry.id, { summary: entry.summary, details: entry.details });
}
for (const entry of glossaryData.entries || []) {
  requireText(`glossary ${entry.id}.label`, entry.label);
  collectStrings("data/glossary.json", entry.id, entry);
}
for (const entry of [...primaryEntries, ...deepEntries]) {
  for (const field of ["title", "category", "section", "excerpt"]) addCandidate("generated search index", entry.id, field, entry[field], true);
}

async function walk(directory, extension, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if ([".git", "node_modules", "_site"].includes(entry.name)) continue;
      await walk(resolve(directory, entry.name), extension, files);
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(resolve(directory, entry.name));
    }
  }
  return files;
}

const excludedJson = new Set([
  "data/magic-items.json",
  "data/monsters_2024.json",
  "data/monsters_2024_details.json",
  "data/search-index.json",
  "data/search-index-deep.json",
  "data/content-relations.source.json",
  "data/content-relations.json",
  "data/content-inventory.json",
  "data/content-id-aliases.json",
  "data/glossary-aliases.source.json",
  "data/search-aliases.source.json",
  "data/source-metadata.json",
  "data/content-sources.json",
  "data/assets-report.json",
]);
for (const path of await walk(resolve(root, "data"), ".json")) {
  const relativePath = path.slice(root.length + 1).replaceAll("\\", "/");
  if (excludedJson.has(relativePath)) continue;
  const jsonText = (await readFile(path, "utf8")).replace(/^\uFEFF/, "");
  collectStrings(relativePath, "", JSON.parse(jsonText));
}

const htmlFiles = (await walk(root, ".html")).filter((path) => !path.includes(`${resolve(root, "node_modules")}/`) && !path.includes(`${resolve(root, "_site")}/`));
for (const path of htmlFiles) {
  const relativePath = path.slice(root.length + 1).replaceAll("\\", "/");
  const source = await readFile(path, "utf8");
  const clean = source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  for (const [index, match] of [...clean.matchAll(/>([^<>]+)</g)].entries()) addCandidate(relativePath, `text-${index + 1}`, "visible text", match[1], true);
  for (const [index, match] of [...clean.matchAll(/\b(?:aria-label|placeholder|title|alt)\s*=\s*(["'])(.*?)\1/gi)].entries()) addCandidate(relativePath, `attribute-${index + 1}`, "accessible label", match[2], true);
}

const jsRoot = resolve(root, "js");
for (const path of await walk(jsRoot, ".js")) {
  const relativePath = path.slice(root.length + 1).replaceAll("\\", "/");
  const source = await readFile(path, "utf8");
  const literals = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g;
  for (const [index, match] of [...source.matchAll(literals)].entries()) {
    let value = match[0].slice(1, -1);
    if (value.length > 180 || (match[0][0] === "`" && value.includes("${"))) continue;
    if (/[{};]|=>|\b(?:function|return|const|let|var|document|window|event|response|text)\b|\b(?:match|replace|split|join)\s*\(/.test(value)) continue;
    value = value.replace(/<[^>]*>/g, " ").replace(/&(?:amp|lt|gt|quot|#39);/g, " ");
    if (/^\s*[\w\s.#,:>+\[\]='"-]*:not\(|\[tabindex/i.test(value) || value.length < 18) continue;
    addCandidate(relativePath, `string-${index + 1}`, "UI string", value, false);
  }
}

console.log(`Résidus anglais probables : ${candidates.length}`);
for (const candidate of candidates.slice(0, 100)) {
  console.log(`- ${candidate.path} ${candidate.id} (${candidate.field}) : ${candidate.value}`);
}
console.log(`Descriptions de capacités tronquées dans la source : ${knownSourceTruncations.length}`);
for (const entry of knownSourceTruncations) console.log(`- ${entry}`);
if (knownSourceTruncations.length) console.log("Ces traductions s’arrêtent au même point que leur texte source ; les passages absents restent à vérifier dans une source complète.");

if (process.argv.includes("--check") && (errors.length || candidates.length)) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  if (!errors.length) console.error("Des textes anglais probables nécessitent une vérification manuelle.");
  process.exitCode = 1;
} else if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Audit de couverture et de langue française réussi.");
}
