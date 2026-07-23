import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  CONTENT_TYPES,
  isContentId,
} from "../js/content-ids.js";

const root = resolve(import.meta.dirname, "..");
const index = JSON.parse(await readFile(resolve(root, "data/search-index.json"), "utf8"));
const aliasRegistry = JSON.parse(await readFile(resolve(root, "data/content-id-aliases.json"), "utf8"));
const relationIndex = JSON.parse(await readFile(resolve(root, "data/content-relations.json"), "utf8"));
const glossary = JSON.parse(await readFile(resolve(root, "data/glossary.json"), "utf8"));
const searchAliasSource = JSON.parse(await readFile(resolve(root, "data/search-aliases.source.json"), "utf8"));
const errors = [];

if (index.schemaVersion !== 1) errors.push("search index schemaVersion must be 1");
if (index.version !== 4) errors.push("search index version must be 4");
if (!Array.isArray(index.entries)) errors.push("search index entries must be an array");
if (index.count !== index.entries?.length) errors.push("search index count does not match entries");

const ids = new Set();
for (const [position, entry] of (index.entries || []).entries()) {
  const context = `entry ${position + 1}`;
  if (!isContentId(entry.id)) errors.push(`${context} has an invalid ID: ${entry.id}`);
  if (ids.has(entry.id)) errors.push(`${context} duplicates ID: ${entry.id}`);
  ids.add(entry.id);
  if (!CONTENT_TYPES.includes(entry.type)) errors.push(`${context} has an unknown type: ${entry.type}`);
  if (!entry.id?.startsWith(`${entry.type}-`)) errors.push(`${context} ID does not match type: ${entry.id}`);
  if (!String(entry.title || "").trim()) errors.push(`${context} has no title`);
  if (!String(entry.category || "").trim()) errors.push(`${context} has no category`);
  if (!String(entry.url || "").trim() || /^(?:javascript|data):/i.test(entry.url)) {
    errors.push(`${context} has an invalid URL`);
  }
  if (!Array.isArray(entry.keywords)) errors.push(`${context} keywords must be an array`);
  if (!Array.isArray(entry.aliases)) errors.push(`${context} aliases must be an array`);
  if (new Set(entry.aliases || []).size !== entry.aliases?.length) errors.push(`${context} aliases contain duplicates`);
  if (typeof entry.excerpt !== "string") errors.push(`${context} excerpt must be a string`);
}

if (searchAliasSource.schemaVersion !== 1) errors.push("search alias schemaVersion must be 1");
for (const [id, entryAliases] of Object.entries(searchAliasSource.aliases || {})) {
  if (!ids.has(id)) errors.push(`search aliases target an unknown ID: ${id}`);
  if (!Array.isArray(entryAliases) || !entryAliases.length) errors.push(`search aliases must be a non-empty array: ${id}`);
  if (new Set(entryAliases || []).size !== entryAliases?.length) errors.push(`search aliases contain duplicates: ${id}`);
}

if (aliasRegistry.schemaVersion !== 1) errors.push("content alias schemaVersion must be 1");
if (aliasRegistry.count !== Object.keys(aliasRegistry.aliases || {}).length) {
  errors.push("content alias count does not match aliases");
}
for (const [alias, canonicalId] of Object.entries(aliasRegistry.aliases || {})) {
  if (!alias.trim()) errors.push("content alias cannot be empty");
  if (!ids.has(canonicalId)) errors.push(`content alias targets an unknown ID: ${alias}`);
}

const relationTypes = new Set(["available-for", "prerequisite", "related-rule", "see-also"]);
const relationKeys = new Set();
let relationCount = 0;
if (relationIndex.schemaVersion !== 1) errors.push("relation index schemaVersion must be 1");
for (const [sourceId, source] of Object.entries(relationIndex.sources || {})) {
  if (!ids.has(sourceId)) errors.push(`relation source is unknown: ${sourceId}`);
  if (!Array.isArray(source.relations)) errors.push(`relations must be an array: ${sourceId}`);
  for (const relation of source.relations || []) {
    relationCount += 1;
    if (!ids.has(relation.target)) errors.push(`relation target is unknown: ${relation.target}`);
    if (!relationIndex.targets?.[relation.target]) errors.push(`relation target metadata is missing: ${relation.target}`);
    if (!relationTypes.has(relation.type)) errors.push(`relation type is unknown: ${relation.type}`);
    const url = String(relation.url || relationIndex.targets?.[relation.target]?.url || "");
    if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url)) errors.push(`relation URL must stay local: ${url}`);
    const key = [sourceId, relation.target, relation.type, url].join("|");
    if (relationKeys.has(key)) errors.push(`relation is duplicated: ${key}`);
    relationKeys.add(key);
  }
}
if (relationIndex.count !== relationCount) errors.push("relation index count does not match relations");

const glossaryIds = new Set();
const glossaryAnchors = new Set();
if (glossary.schemaVersion !== 1) errors.push("glossary schemaVersion must be 1");
if (glossary.count !== glossary.entries?.length) errors.push("glossary count does not match entries");
for (const [position, entry] of (glossary.entries || []).entries()) {
  const context = `glossary entry ${position + 1}`;
  if (!isContentId(entry.id) || !entry.id.startsWith("glossary-")) errors.push(`${context} has an invalid ID`);
  if (glossaryIds.has(entry.id)) errors.push(`${context} duplicates ID: ${entry.id}`);
  glossaryIds.add(entry.id);
  if (!String(entry.label || "").trim()) errors.push(`${context} has no label`);
  if (!String(entry.summary || "").trim()) errors.push(`${context} has no summary`);
  if (!["Actions", "États", "Termes"].includes(entry.category)) errors.push(`${context} has an invalid category`);
  if (!Array.isArray(entry.aliases)) errors.push(`${context} aliases must be an array`);
  if (!Array.isArray(entry.related)) errors.push(`${context} related must be an array`);
  if (glossaryAnchors.has(entry.anchor)) errors.push(`${context} duplicates anchor: ${entry.anchor}`);
  glossaryAnchors.add(entry.anchor);
  for (const relatedId of entry.related || []) {
    if (!ids.has(relatedId)) errors.push(`${context} references an unknown content ID: ${relatedId}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${index.entries.length} content IDs, ${aliasRegistry.count} aliases, ${relationCount} relations, and ${glossary.count} glossary entries.`);
}
