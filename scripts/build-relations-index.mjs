import { readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import { resolve } from "node:path";
import { createContentId, slugifyContent } from "../js/content-ids.js";

const root = resolve(import.meta.dirname, "..");
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const [primaryIndex, deepIndex] = await Promise.all([
  readJson("data/search-index.json"),
  readJson("data/search-index-deep.json"),
]);
const searchIndex = {
  ...primaryIndex,
  entries: [...(primaryIndex.entries || []), ...(deepIndex.entries || [])],
};
const source = await readJson("data/content-relations.source.json");
const spells = (await readJson("data/spells_2024.json")).spells;
const feats = (await readJson("data/feats_2024.json")).feats;
const campaignRules = (await readJson("data/campaign-rules.json")).entries;
const entries = new Map(searchIndex.entries.map((entry) => [entry.id, entry]));
const relations = [];
const relationKeys = new Set();
const glossaryConditionAnchors = Object.freeze({
  "condition-incapacite": "neutralise",
  "condition-mourant": "etats",
});

function addRelation(definition) {
  const sourceEntry = entries.get(definition.source);
  const targetEntry = entries.get(definition.target);
  if (!sourceEntry) throw new Error(`Unknown relation source: ${definition.source}`);
  if (!targetEntry) throw new Error(`Unknown relation target: ${definition.target}`);
  if (definition.source === definition.target) throw new Error(`Self relation is not allowed: ${definition.source}`);

  const url = String(definition.url || targetEntry.url);
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) throw new Error(`Relation URL must stay local: ${url}`);
  const key = [definition.source, definition.target, definition.type, url].join("|");
  if (relationKeys.has(key)) return;
  relationKeys.add(key);
  relations.push({
    source: definition.source,
    target: definition.target,
    type: definition.type,
    label: String(definition.label || targetEntry.title),
    url,
    category: targetEntry.category,
    order: Number.isInteger(definition.order) ? definition.order : 100,
    sourceTitle: sourceEntry.title,
    sourceUrl: sourceEntry.url,
  });
}

for (const definition of source.relations || []) addRelation(definition);

for (const rule of campaignRules || []) {
  for (const target of rule.related || []) {
    addRelation({
      source: rule.id,
      target,
      type: "related-rule",
      label: "Contenu associé",
    });
  }
}

for (const spell of spells) {
  const spellId = createContentId("spell", spell.slug || spell.name);
  for (const className of spell.classes || []) {
    addRelation({
      source: spellId,
      target: createContentId("class", className),
      type: "available-for",
    });
  }
}

for (const classEntry of searchIndex.entries.filter((entry) => entry.type === "class")) {
  addRelation({
    source: classEntry.id,
    target: "page-sorts",
    type: "see-also",
    label: `Sorts de ${classEntry.title}`,
    url: `spells.html?class=${encodeURIComponent(classEntry.title)}`,
    order: 10,
  });
  addRelation({
    source: classEntry.id,
    target: "page-equipement",
    type: "see-also",
    label: "Armes et armures",
    order: 20,
  });
}

for (const speciesEntry of searchIndex.entries.filter((entry) => entry.type === "species")) {
  addRelation({
    source: speciesEntry.id,
    target: "page-creation-de-personnage",
    type: "see-also",
  });
}

for (const conditionEntry of searchIndex.entries.filter((entry) => entry.type === "condition")) {
  const anchor = glossaryConditionAnchors[conditionEntry.id] || slugifyContent(conditionEntry.title);
  addRelation({
    source: conditionEntry.id,
    target: "page-glossaire",
    type: "see-also",
    label: conditionEntry.id === "condition-mourant"
      ? "États dans le glossaire"
      : `${conditionEntry.title} dans le glossaire`,
    url: `glossaire.html#${anchor}`,
    order: 90,
  });
}

for (const equipmentEntry of searchIndex.entries.filter((entry) => entry.type === "equipment")) {
  const equipmentKind = String(equipmentEntry.keywords?.[0] || "").toLocaleLowerCase("fr");
  if (equipmentKind !== "arme") continue;
  addRelation({
    source: equipmentEntry.id,
    target: "page-maitrises-d-armes",
    type: "related-rule",
  });
}

const classEntries = searchIndex.entries.filter((entry) => entry.type === "class");
for (const feat of feats) {
  const featId = createContentId("feat", feat.slug || feat.name);
  const category = String(feat.category || "");
  const prerequisite = String(feat.prerequis || "");
  if (/origine/i.test(category)) {
    addRelation({ source: featId, target: "page-historiques", type: "see-also" });
  }
  if (/\bSorts\b|Magie de pacte/i.test(prerequisite)) {
    addRelation({
      source: featId,
      target: "page-sorts",
      type: "prerequisite",
      label: "Capacité Sorts ou Magie de pacte",
    });
  }
  for (const classEntry of classEntries) {
    if (new RegExp(`\\b${classEntry.title}\\b`, "i").test(prerequisite)) {
      addRelation({ source: featId, target: classEntry.id, type: "prerequisite" });
    }
  }
}

for (const backgroundEntry of searchIndex.entries.filter((entry) => entry.type === "background")) {
  const text = (backgroundEntry.keywords || []).join(" ");
  const featName = text.match(/\bDon\s*\.\s*(.*?)\s+Maîtrises? de compétence\b/i)?.[1]?.trim();
  if (!featName) continue;
  const featId = createContentId("feat", featName);
  if (entries.has(featId)) {
    addRelation({
      source: backgroundEntry.id,
      target: featId,
      type: "see-also",
      label: `Don d’origine : ${featName}`,
      order: 10,
    });
  }
}

relations.sort((first, second) => (
  first.source.localeCompare(second.source, "fr")
  || first.type.localeCompare(second.type, "fr")
  || first.order - second.order
  || first.label.localeCompare(second.label, "fr")
));

const targets = {};
const sources = {};
for (const relation of relations) {
  const targetEntry = entries.get(relation.target);
  targets[relation.target] ||= {
    title: targetEntry.title,
    url: targetEntry.url,
    category: targetEntry.category,
  };
  sources[relation.source] ||= {
    title: relation.sourceTitle,
    url: relation.sourceUrl,
    relations: [],
  };
  sources[relation.source].relations.push({
    target: relation.target,
    type: relation.type,
    ...(relation.label !== targetEntry.title ? { label: relation.label } : {}),
    ...(relation.url !== targetEntry.url ? { url: relation.url } : {}),
    ...(relation.order !== 100 ? { order: relation.order } : {}),
  });
}

const output = `${JSON.stringify({
  schemaVersion: 1,
  count: relations.length,
  targets,
  sources,
})}${EOL}`;
const outputPath = resolve(root, "data/content-relations.json");

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) throw new Error("Generated relation index is stale: data/content-relations.json");
  console.log(`Verified ${relations.length} contextual relations.`);
} else {
  await writeFile(outputPath, output, "utf8");
  console.log(`Generated ${relations.length} contextual relations.`);
}
