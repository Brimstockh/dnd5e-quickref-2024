import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [catalog, localization, schema] = await Promise.all([
  readJson("data/magic-items.json"),
  readJson("data/magic-items-fr.json"),
  readJson("schemas/magic-items-fr.schema.json"),
]);

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

function numberTokens(text) {
  return [...text.matchAll(/\d+d\d+|\d+(?:[ ,]\d{3})*(?:\.\d+)?/g)].map(([value]) => value.replace(/[ ,]/g, ""));
}

const itemsById = new Map(catalog.items.map((item) => [item.id, item]));
const translationsById = new Map();
const errors = [];
let translatedTables = 0;
let translatedRows = 0;
let translatedProperties = 0;
let translatedVariants = 0;
const strict = process.argv.includes("--strict");

if (localization.schemaVersion !== schema.properties.schemaVersion.const) errors.push("unexpected localization schemaVersion");
if (localization.language !== "fr") errors.push("localization language must be fr");
if (localization.sourceRef !== catalog.sourceRef) errors.push("localization sourceRef does not match the catalog");
if (localization.originalCatalog !== "data/magic-items.json") errors.push("localization must identify its source catalog");
if (!Array.isArray(localization.items)) errors.push("localization items must be an array");

for (const [index, translated] of (localization.items || []).entries()) {
  const context = `localized item ${index + 1}`;
  if (!translated.id || !itemsById.has(translated.id)) errors.push(`${context} has no matching source ID`);
  if (translationsById.has(translated.id)) errors.push(`${context} duplicates ${translated.id}`);
  translationsById.set(translated.id, translated);
  if (!String(translated.nameFr || "").trim()) errors.push(`${context} has no nameFr`);
  if (!String(translated.descriptionFr || "").trim()) errors.push(`${context} has no descriptionFr`);

  const original = itemsById.get(translated.id);
  if (!original) continue;
  for (const [tableIndex, tableFr] of (translated.tablesFr || []).entries()) {
    const table = original.tables?.[tableIndex];
    if (!table) {
      errors.push(`${context} has an extra translated table at index ${tableIndex}`);
      continue;
    }
    translatedTables += 1;
    if (!String(tableFr.titleFr || "").trim()) errors.push(`${context} table ${tableIndex + 1} has no titleFr`);
    const columnKeys = (table.columns || []).map((column) => typeof column === "string" ? column : column.key);
    for (const key of Object.keys(tableFr.columnsFr || {})) {
      if (!columnKeys.includes(key)) errors.push(`${context} table ${tableIndex + 1} translates unknown column ${key}`);
    }
    for (const [rowIndex, rowFr] of (tableFr.rowsFr || []).entries()) {
      const row = table.rows?.[rowIndex];
      if (!row) errors.push(`${context} table ${tableIndex + 1} has an extra translated row ${rowIndex + 1}`);
      else {
        translatedRows += 1;
        for (const [key, value] of Object.entries(row)) {
          const translatedValue = rowFr?.[key];
          if (translatedValue != null && JSON.stringify(numberTokens(String(value))) !== JSON.stringify(numberTokens(String(translatedValue)))) {
            errors.push(`${context} table ${tableIndex + 1}, row ${rowIndex + 1}, ${key} has different numeric tokens`);
          }
        }
      }
      for (const key of Object.keys(rowFr || {})) {
        if (!columnKeys.includes(key)) errors.push(`${context} table ${tableIndex + 1}, row ${rowIndex + 1} translates unknown column ${key}`);
      }
    }
    if (tableFr.rowsFr && tableFr.rowsFr.length !== table.rows.length) errors.push(`${context} table ${tableIndex + 1} row count differs from source`);
  }
  if (translated.tablesFr && translated.tablesFr.length !== original.tables.length) errors.push(`${context} translated table count differs from source`);
  for (const key of Object.keys(translated.propertiesFr || {})) {
    if (!(original.properties || []).some((property) => property.key === key)) errors.push(`${context} translates unknown property ${key}`);
    else translatedProperties += 1;
  }
  if (translated.spellsFr && translated.spellsFr.length !== original.spells.length) errors.push(`${context} translated spell count differs from source`);
  if (translated.variantsFr && translated.variantsFr.length !== original.variants.length) errors.push(`${context} translated variant count differs from source`);
  translatedVariants += (translated.variantsFr || []).length;

  const originalNumbers = numberTokens(original.description);
  const translatedNumbers = numberTokens(translated.descriptionFr);
  if (JSON.stringify(originalNumbers) !== JSON.stringify(translatedNumbers)) errors.push(`${context} numeric tokens differ from its source description`);
}

for (const [name, actual, expected] of [
  ["items", translationsById.size, catalog.items.length],
  ["tables", translatedTables, catalog.items.reduce((sum, item) => sum + item.tables.length, 0)],
  ["table rows", translatedRows, catalog.items.reduce((sum, item) => sum + item.tables.reduce((subtotal, table) => subtotal + table.rows.length, 0), 0)],
  ["properties", translatedProperties, catalog.items.reduce((sum, item) => sum + item.properties.length, 0)],
  ["variants", translatedVariants, catalog.items.reduce((sum, item) => sum + item.variants.length, 0)],
]) {
  console.log(`${name}: ${actual}/${expected}`);
}

if (strict) {
  if (translationsById.size !== catalog.items.length) errors.push(`missing French translations for ${catalog.items.length - translationsById.size} items`);
  for (const item of catalog.items) {
    const translated = translationsById.get(item.id);
    if (!translated) continue;
    if (item.subtype && !translated.subtypeFr) errors.push(`${item.id} has no French subtype`);
    if (item.attunement?.requirement && !translated.attunementRequirementFr) errors.push(`${item.id} has no French attunement requirement`);
    if (item.charges?.recovery && !translated.chargeRecoveryFr) errors.push(`${item.id} has no French charge recovery text`);
    if (item.properties.length && item.properties.some((property) => !translated.propertiesFr?.[property.key])) errors.push(`${item.id} has untranslated properties`);
    if (item.spells.length && (!translated.spellsFr || translated.spellsFr.length !== item.spells.length)) errors.push(`${item.id} has untranslated spell names`);
    if (item.variants.some((variant) => /[a-z]/i.test(variant.name)) && (!translated.variantsFr || translated.variantsFr.length !== item.variants.length)) errors.push(`${item.id} has untranslated variants`);
    if ((translated.tablesFr || []).length !== item.tables.length) errors.push(`${item.id} has untranslated tables`);
    for (const [tableIndex, table] of (item.tables || []).entries()) {
      const tableFr = translated.tablesFr?.[tableIndex];
      if (!tableFr?.titleFr) errors.push(`${item.id} table ${tableIndex + 1} has no French title`);
      if (table.dice && !tableFr?.diceFr) errors.push(`${item.id} table ${tableIndex + 1} has no French dice label`);
      if (table.dice && tableFr?.diceFr && JSON.stringify(numberTokens(table.dice)) !== JSON.stringify(numberTokens(tableFr.diceFr))) errors.push(`${item.id} table ${tableIndex + 1} dice label has different numeric tokens`);
      const keys = (table.columns || []).map((column) => typeof column === "string" ? column : column.key);
      for (const key of keys) if (/[a-z]/i.test(key) && !/^\d+d\d+$/i.test(key) && !tableFr?.columnsFr?.[key]) errors.push(`${item.id} table ${tableIndex + 1} has untranslated column ${key}`);
      for (const [rowIndex, row] of (table.rows || []).entries()) {
        const rowFr = tableFr?.rowsFr?.[rowIndex];
        for (const [key, value] of Object.entries(row)) {
          const sourceNote = keys.length === 0 && key === "source" && value === "Transcription intégrée dans la description";
          if (!sourceNote && /[a-z]/i.test(String(value)) && !rowFr?.[key]) errors.push(`${item.id} table ${tableIndex + 1}, row ${rowIndex + 1} has untranslated ${key}`);
        }
      }
    }
  }
}
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("French magic-item localization is structurally valid.");
}
