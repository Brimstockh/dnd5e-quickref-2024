import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildContextUrl,
  ROUTE_SELECTION_TYPES,
} from "../js/context-share.js";

const root = resolve(import.meta.dirname, "..");
const baseUrl = "https://dnd.local/";
const queryParameters = Object.freeze({
  "armes-armures.html": new Set(["q", "sort", "type", "category", "mastery", "equipment"]),
  "dons.html": new Set(["q", "category", "prereq", "repeatable", "sort", "feat"]),
  "glossaire.html": new Set(["q", "category", "letter", "term"]),
  "historique.html": new Set(["q", "sort", "ability", "feat", "background"]),
  "monstres.html": new Set(["q", "cr", "type", "alignment", "size", "sort", "monster"]),
  "quickref.html": new Set(["q", "movement", "action", "bonus", "reaction", "condition", "environment"]),
  "spells.html": new Set(["q", "level", "school", "class", "sort", "spell"]),
  "dice-stats.html": new Set(["count", "sides", "threshold"]),
});

export function inspectNavigationUrl(rawUrl, knownIds = new Set()) {
  const errors = [];
  const value = String(rawUrl || "").trim();
  if (!value) return ["URL vide"];
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) errors.push("URL externe");
  if (value.startsWith("/") || value.includes("\\")) errors.push("URL non relative au site");

  let decodedPath = "";
  try {
    decodedPath = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  } catch {
    errors.push("encodage invalide");
  }
  if (decodedPath.split("/").includes("..")) errors.push("traversée de chemin");

  let url;
  try {
    url = new URL(value, baseUrl);
  } catch {
    return [...errors, "URL illisible"];
  }
  if (url.origin !== new URL(baseUrl).origin) errors.push("origine externe");

  const page = decodeURIComponent(url.pathname.replace(/^\//, "")) || "index.html";
  const allowed = queryParameters[page];
  for (const [parameter, parameterValue] of url.searchParams) {
    if (!allowed?.has(parameter)) errors.push(`paramètre « ${parameter} » interdit pour ${page}`);
    if (!parameterValue.trim()) errors.push(`paramètre « ${parameter} » vide`);
  }

  const selections = ROUTE_SELECTION_TYPES[page] || {};
  const activeSelections = Object.keys(selections).filter((parameter) => url.searchParams.has(parameter));
  if (activeSelections.length > 1) errors.push("plusieurs sélections contextuelles");
  for (const parameter of activeSelections) {
    const type = selections[parameter];
    const selection = url.searchParams.get(parameter);
    if (url.searchParams.getAll(parameter).length > 1) errors.push(`sélection « ${parameter} » répétée`);
    if (knownIds.size && !knownIds.has(`${type}-${selection}`)) {
      errors.push(`sélection inconnue « ${type}-${selection} »`);
    }
  }

  return errors;
}

export function contextualUrlForEntry(entry) {
  const url = new URL(entry.url, baseUrl);
  const page = url.pathname.split("/").pop();
  const route = ROUTE_SELECTION_TYPES[page] || {};
  const parameter = Object.entries(route).find(([, type]) => type === entry.type)?.[0];
  if (!parameter) return "";
  const prefix = `${entry.type}-`;
  if (!entry.id.startsWith(prefix)) return "";
  const contextual = new URL(buildContextUrl(url.href, {
    parameter,
    value: entry.id.slice(prefix.length),
  }));
  return `${contextual.pathname.replace(/^\//, "")}${contextual.search}${contextual.hash}`;
}

async function main() {
  const searchIndex = JSON.parse(await readFile(resolve(root, "data/search-index.json"), "utf8"));
  const relationIndex = JSON.parse(await readFile(resolve(root, "data/content-relations.json"), "utf8"));
  const glossary = JSON.parse(await readFile(resolve(root, "data/glossary.json"), "utf8"));
  const knownIds = new Set(searchIndex.entries.map((entry) => entry.id));
  const candidates = [];

  for (const entry of searchIndex.entries) {
    candidates.push({ context: `recherche ${entry.id}`, url: entry.url });
    const contextualUrl = contextualUrlForEntry(entry);
    if (contextualUrl) candidates.push({ context: `permalien ${entry.id}`, url: contextualUrl });
  }
  for (const [id, target] of Object.entries(relationIndex.targets || {})) {
    candidates.push({ context: `cible de relation ${id}`, url: target.url });
  }
  for (const [sourceId, source] of Object.entries(relationIndex.sources || {})) {
    candidates.push({ context: `source de relation ${sourceId}`, url: source.url });
    for (const relation of source.relations || []) {
      if (relation.url) candidates.push({ context: `relation ${sourceId} → ${relation.target}`, url: relation.url });
    }
  }
  for (const entry of glossary.entries) {
    candidates.push({ context: `glossaire ${entry.id}`, url: entry.url });
  }

  const errors = [];
  const pageSources = new Map();
  const checkedFiles = new Set();
  const uniqueCandidates = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.context}|${candidate.url}`;
    uniqueCandidates.set(key, candidate);
  }

  for (const { context, url: rawUrl } of uniqueCandidates.values()) {
    const urlErrors = inspectNavigationUrl(rawUrl, knownIds);
    for (const error of urlErrors) errors.push(`${context}: ${error} (${rawUrl})`);

    let url;
    try {
      url = new URL(rawUrl, baseUrl);
    } catch {
      continue;
    }
    if (url.origin !== new URL(baseUrl).origin) continue;
    const page = decodeURIComponent(url.pathname.replace(/^\//, "")) || "index.html";
    const file = resolve(root, page);
    if (!checkedFiles.has(page)) {
      checkedFiles.add(page);
      try {
        await access(file);
      } catch {
        errors.push(`${context}: fichier cible absent (${page})`);
        continue;
      }
    }
    if (!url.hash) continue;
    if (!pageSources.has(page)) pageSources.set(page, await readFile(file, "utf8"));
    let anchor;
    try {
      anchor = decodeURIComponent(url.hash.slice(1));
    } catch {
      errors.push(`${context}: encodage d’ancre invalide (${rawUrl})`);
      continue;
    }
    const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`\\b(?:id|name)=["']${escaped}["']`).test(pageSources.get(page))) {
      errors.push(`${context}: ancre absente (${page}#${anchor})`);
    }
  }

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${uniqueCandidates.size} navigation targets across ${checkedFiles.size} pages.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
