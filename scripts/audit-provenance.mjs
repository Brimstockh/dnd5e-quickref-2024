import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
const today = new Date().toISOString().slice(0, 10);
const errors = [];

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

function checkDate(value, context) {
  if (!ISO_DATE.test(String(value || ""))) {
    errors.push(`${context} has an invalid ISO date: ${value || "(missing)"}`);
    return;
  }
  if (value > today) errors.push(`${context} is in the future: ${value}`);
}

function checkRequired(value, field, context) {
  if (!String(value || "").trim()) errors.push(`${context} is missing ${field}`);
}

const [contentSources, sourceMetadata, primaryIndex, deepIndex, magicItems, campaignRules, proficiency, lore, creation] = await Promise.all([
  readJson("data/content-sources.json"),
  readJson("data/source-metadata.json"),
  readJson("data/search-index.json"),
  readJson("data/search-index-deep.json"),
  readJson("data/magic-items.json"),
  readJson("data/campaign-rules.json"),
  readJson("data/proficiency-bonus.json"),
  readJson("data/lore.json"),
  readJson("data/character-creation.json"),
]);

const sources = contentSources.sources || [];
const sourceIds = new Set(sources.map((source) => source.id));
checkRequired(contentSources.defaults?.rulesVersion, "rulesVersion", "content source defaults");
checkRequired(contentSources.defaults?.verifiedAt, "verifiedAt", "content source defaults");
checkDate(contentSources.defaults?.verifiedAt, "content source defaults.verifiedAt");

for (const source of sources) {
  const context = `source ${source.id || "(missing)"}`;
  for (const field of ["id", "ruleset", "rulesVersion", "verifiedAt", "source", "sourceSection", "license"]) {
    checkRequired(source[field], field, context);
  }
  checkDate(source.verifiedAt, `${context}.verifiedAt`);
  if (source.rulesVersion !== contentSources.defaults?.rulesVersion) errors.push(`${context} has a rulesVersion different from defaults`);
}

const pageEntries = sourceMetadata.entries || [];
const pagePaths = new Set();
const pageDefaults = sourceMetadata.defaults || {};
for (const field of ["edition", "rulesVersion", "language", "updated", "verifiedAt", "status"]) checkRequired(pageDefaults[field], field, "source metadata defaults");
checkDate(pageDefaults.updated, "source metadata defaults.updated");
checkDate(pageDefaults.verifiedAt, "source metadata defaults.verifiedAt");
for (const entry of pageEntries) {
  const context = `page metadata ${entry.path || entry.prefix || "(missing)"}`;
  const key = entry.path || `prefix:${entry.prefix}`;
  if (pagePaths.has(key)) errors.push(`${context} is duplicated`);
  pagePaths.add(key);
  const metadata = { ...pageDefaults, ...entry };
  for (const field of ["rulesVersion", "updated", "verifiedAt"]) checkRequired(metadata[field], field, context);
  checkDate(metadata.updated, `${context}.updated`);
  checkDate(metadata.verifiedAt, `${context}.verifiedAt`);
  if (metadata.verifiedAt > metadata.updated) errors.push(`${context} was verified after its revision date`);
}

const indexedEntries = [...(primaryIndex.entries || []), ...(deepIndex.entries || [])];
const sourceRefsByType = {
  ...(primaryIndex.sourceRefsByType || {}),
  ...(deepIndex.sourceRefsByType || {}),
};
for (const [type, sourceRef] of Object.entries(sourceRefsByType)) {
  if (!sourceIds.has(sourceRef)) errors.push(`search source mapping ${type} references an unknown source: ${sourceRef}`);
}
let indexedWithSource = 0;
const indexedByType = new Map();
for (const entry of indexedEntries) {
  const type = String(entry.type || "unknown");
  const sourceRef = entry.sourceRef || sourceRefsByType[type];
  const coverage = indexedByType.get(type) || { total: 0, withSourceRef: 0, withoutSourceRef: 0 };
  coverage.total += 1;
  if (sourceRef) {
    coverage.withSourceRef += 1;
    indexedWithSource += 1;
    if (!sourceIds.has(sourceRef)) errors.push(`search entry ${entry.id} references an unknown source: ${sourceRef}`);
  } else {
    coverage.withoutSourceRef += 1;
  }
  indexedByType.set(type, coverage);
}

for (const item of magicItems.items || []) {
  const context = `magic item ${item.id || "(missing)"}`;
  if (!sourceIds.has(item.sourceRef)) errors.push(`${context} references an unknown source: ${item.sourceRef || "(missing)"}`);
  if (!Number.isInteger(item.sourcePage)) errors.push(`${context} is missing sourcePage`);
}

for (const rule of campaignRules.entries || []) {
  const sourceRef = rule.sourceRef || campaignRules.sourceRef;
  if (!sourceIds.has(sourceRef)) errors.push(`campaign rule ${rule.id || "(missing)"} references an unknown source: ${sourceRef || "(missing)"}`);
}
if (!sourceIds.has(proficiency.sourceRef)) errors.push(`proficiency bonus references an unknown source: ${proficiency.sourceRef || "(missing)"}`);

let loreWithSource = 0;
for (const entry of lore.entries || []) {
  const context = `lore entry ${entry.id || "(missing)"}`;
  const source = entry.source || {};
  for (const field of ["book", "section", "pages"]) checkRequired(source[field], field, context);
  if (source.book && sources.some((candidate) => String(candidate.source || "").startsWith(source.book))) loreWithSource += 1;
  else errors.push(`${context} has no registered source for ${source.book || "(missing)"}`);
}

const creationSource = creation.source || {};
for (const field of ["edition", "document", "updated", "language", "status"]) checkRequired(creationSource[field], field, "character creation source");
checkDate(creationSource.updated, "character creation source.updated");

console.log("Provenance audit");
console.log("-----------------");
console.log(`Sources enregistrées : ${sources.length}`);
console.log(`Pages couvertes : ${pageEntries.length}`);
console.log(`Entrées indexées avec sourceRef : ${indexedWithSource}/${indexedEntries.length}`);
const indexedCoverage = Object.fromEntries([...indexedByType.entries()].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
console.log(`Couverture par type : ${JSON.stringify(indexedCoverage)}`);
console.log(`Objets magiques contrôlés : ${(magicItems.items || []).length}`);
console.log(`Entrées Lore contrôlées : ${loreWithSource}/${(lore.entries || []).length}`);
console.log(`Erreurs critiques : ${errors.length}`);

if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Audit de provenance réussi.");
}
