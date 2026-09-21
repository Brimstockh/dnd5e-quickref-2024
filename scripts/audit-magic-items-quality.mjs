import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(await readFile(resolve(root, "data/magic-items.json"), "utf8"));
const validStatuses = new Set(["raw-transcription", "cleaned", "verified", "needs-verification"]);
const anomalies = [];

function add(item, category, detail) {
  anomalies.push({ id: item.id || "(missing)", name: item.officialName || item.name || "(sans nom)", category, detail });
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function hasRepeatedNgram(left, right, size = 6) {
  const rightNgrams = new Set();
  const rightWords = words(right);
  for (let index = 0; index <= rightWords.length - size; index += 1) {
    rightNgrams.add(rightWords.slice(index, index + size).join(" "));
  }
  const leftWords = words(left);
  for (let index = 0; index <= leftWords.length - size; index += 1) {
    if (rightNgrams.has(leftWords.slice(index, index + size).join(" "))) return true;
  }
  return false;
}

function similarity(left, right) {
  const leftWords = new Set(words(left));
  const rightWords = new Set(words(right));
  if (!leftWords.size || !rightWords.size) return 0;
  let common = 0;
  for (const word of leftWords) if (rightWords.has(word)) common += 1;
  return common / (leftWords.size + rightWords.size - common);
}

const items = Array.isArray(catalog.items) ? catalog.items : [];
for (const item of items) {
  const description = String(item.description || "");
  const searchable = description;
  if (!validStatuses.has(item.verificationStatus)) add(item, "unknown-status", `statut inconnu: ${item.verificationStatus || "(absent)"}`);
  if (/\b[\p{L}]{1,5}-\s+[\p{L}]{2,}\b/u.test(searchable)) add(item, "broken-word", "césure de mot détectée");
  if (/(?:-{3,}|_{3,}|={3,}|\*{4,})/.test(searchable)) add(item, "symbol-run", "longue suite de tirets ou symboles");
  if (/[\\¥�£¤§]/.test(searchable)) add(item, "stray-character", "caractère parasite détecté");
  if (/\b(?:apparatus|lever|shutter|retract(?:ed|s)?|grappled|hatch)\b/i.test(description) && !/^APPARATUS OF KWALISH$/i.test(item.officialName || "")) {
    add(item, "possible-neighbor-content", "vocabulaire d'un bloc voisin potentiellement fusionné");
  }
  if (/SPICE POUCH/i.test(item.officialName || "") && /\bhaversack\b/i.test(description)) {
    add(item, "name-description-mismatch", "le titre indique Spice Pouch mais la description parle d'un haversack");
  }
  if (description.length < 120) add(item, "short-description", `${description.length} caractères`);
  if (/\b(?:the|a|an|of|to|with|and|or|its|this|that|as|for|on|in|from|when|if|which|while|you|can|your|it|is|are)\.?$/i.test(description.trim())) {
    add(item, "truncated-sentence", "description terminée par un fragment grammatical");
  }
  const rangeCount = (description.match(/\b(?:0?\d{1,2}|100)\s*[-–]\s*\d{1,3}\b/g) || []).length;
  const dieCount = (description.match(/\b\d+d\d+\b/gi) || []).length;
  if ((rangeCount >= 2 && dieCount >= 1) || (/\btable\b/i.test(description) && rangeCount >= 2)) {
    add(item, "unstructured-table", "tableau probablement absorbé dans la description");
  }
  if (item.requiresAttunement !== item.attunement?.required) add(item, "attunement-mismatch", "requiresAttunement et attunement.required divergent");
  if (!String(item.sourceRef || catalog.sourceRef || "").trim() || !Number.isInteger(item.sourcePage)) add(item, "missing-source", "source ou numéro de page absent");
  if (Array.isArray(item.variants) && item.variants.length && item.rarity !== "varies" && item.variants[0]?.rarity !== item.rarity) {
    add(item, "rarity-variant-mismatch", `rareté ${item.rarity}, première variante ${item.variants[0]?.rarity || "(absente)"}`);
  }
  if (Array.isArray(item.tables) && item.tables.some((table) => !table.columns?.length && table.rows?.some((row) => row?.source === "Transcription intégrée dans la description"))) {
    add(item, "empty-structured-field", "table structurée sans colonnes récupérées");
  }
  if (Array.isArray(item.tables) && item.tables.some((table) => /INSTRUMENTS OF THE BARDS/i.test(table.title || "") && table.rows?.some((row) => /\bControl\.$/i.test(row?.Spells || "")))) {
    add(item, "incomplete-table", "ligne du tableau des Instruments des bardes manifestement tronquée");
  }
}

const exactDescriptions = new Map();
for (const item of items) {
  const description = String(item.description || "").trim();
  if (!description) continue;
  const previous = exactDescriptions.get(description);
  if (previous) {
    add(item, "duplicate-description", `description identique à ${previous}`);
  } else {
    exactDescriptions.set(description, item.officialName || item.name || item.id);
  }
}
for (let left = 0; left < items.length; left += 1) {
  for (let right = left + 1; right < items.length; right += 1) {
    const first = String(items[left].description || "");
    const second = String(items[right].description || "");
    if (first.length < 160 || second.length < 160) continue;
    if (similarity(first, second) >= 0.9) add(items[right], "similar-description", `description très proche de ${items[left].officialName || items[left].name}`);
    if (right === left + 1 && hasRepeatedNgram(first, second, 10)) add(items[right], "possible-neighbor-content", `séquence commune avec l'entrée voisine ${items[left].officialName || items[left].name}`);
  }
}

const byCategory = Object.groupBy(anomalies, (anomaly) => anomaly.category);
const byStatus = Object.groupBy(items, (item) => item.verificationStatus || "(absent)");
console.log("Magic item quality audit");
console.log("------------------------");
console.log(`Total : ${items.length}`);
console.log(`Statuts : ${Object.entries(byStatus).map(([status, entries]) => `${status}=${entries.length}`).join(", ") || "aucun"}`);
console.log(`Anomalies : ${anomalies.length}`);
for (const [category, entries] of Object.entries(byCategory).sort(([left], [right]) => left.localeCompare(right))) {
  console.log(`\n[${category}] ${entries.length}`);
  for (const entry of entries) console.log(`- ${entry.name} (${entry.id}) : ${entry.detail}`);
}
