import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(await readFile(resolve(root, "data/magic-items.json"), "utf8"));
const schema = JSON.parse(await readFile(resolve(root, "schemas/magic-items.schema.json"), "utf8"));
const validRarities = new Set(["common", "uncommon", "rare", "very-rare", "legendary", "artifact", "varies"]);
const validTypes = new Set(["weapon", "armor", "wondrous-item", "potion", "ring", "rod", "staff", "wand", "scroll", "ammunition"]);
const activationTypes = new Set(["action", "bonus-action", "reaction", "passive"]);
const validStatuses = new Set(schema.properties.items.items.properties.verificationStatus.enum);
const errors = [];
const ids = new Set();
const names = new Set();

if (catalog.schemaVersion !== 2) errors.push("magic item catalog must use schemaVersion 2");
if (catalog.ruleset !== "2024") errors.push("magic item catalog must target the 2024 ruleset");
if (catalog.sourceRef !== "dmg-2024-magic-pdf") errors.push("magic item catalog must use the DMG 2024 PDF source");
if (catalog.localization?.interfaceLanguage !== "fr" || catalog.localization?.contentLanguage !== "en" || catalog.localization?.originalDescriptionField !== "description") errors.push("magic item localization contract is incomplete");
if (!Array.isArray(catalog.items) || catalog.items.length === 0) errors.push("magic item catalog must contain items");

for (const [position, item] of (catalog.items || []).entries()) {
  const context = `magic item ${position + 1}`;
  if (!/^magic-item-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || "")) errors.push(`${context} has an invalid ID`);
  if (ids.has(item.id)) errors.push(`${context} duplicates ID ${item.id}`);
  ids.add(item.id);
  if (names.has(item.officialName)) errors.push(`${context} duplicates officialName ${item.officialName}`);
  names.add(item.officialName);
  if (!String(item.name || "").trim() || !String(item.officialName || "").trim()) errors.push(`${context} has no name`);
  if (!validTypes.has(item.type)) errors.push(`${context} has an invalid type ${item.type}`);
  if (!validRarities.has(item.rarity)) errors.push(`${context} has an invalid rarity ${item.rarity}`);
  if (typeof item.requiresAttunement !== "boolean" || item.attunement?.required !== item.requiresAttunement) errors.push(`${context} has inconsistent attunement metadata`);
  if (!String(item.description || "").trim()) errors.push(`${context} has no description`);
  if (!validStatuses.has(item.verificationStatus)) errors.push(`${context} has an invalid verification status ${item.verificationStatus || "(missing)"}`);
  if (item.verificationStatus === "verified" && /(?:\\\\|¥|�|\b(?:de|am)-\s+\w+)/i.test(item.description || "")) errors.push(`${context} is marked verified despite raw transcription markers`);
  if (!Number.isInteger(item.sourcePage) || item.sourcePage < 227 || item.sourcePage > 325) errors.push(`${context} has an invalid DMG page`);
  if (!item.source || item.source.book !== "Dungeon Master's Guide 2024" || item.source.page !== item.sourcePage) errors.push(`${context} has an invalid source object`);
  if (!Array.isArray(item.aliases)) errors.push(`${context} aliases must be an array`);
  if (!Array.isArray(item.properties)) errors.push(`${context} properties must be an array`);
  if (!Array.isArray(item.activationTypes) || item.activationTypes.some((value) => !activationTypes.has(value))) errors.push(`${context} has invalid activation types`);
  if (item.charges !== null && (!Number.isInteger(item.charges?.max) || item.charges.max < 1)) errors.push(`${context} has invalid charges`);
  if (!Array.isArray(item.spells) || item.spells.some((spell) => !String(spell?.name || "").trim())) errors.push(`${context} has invalid spells`);
  if (!Array.isArray(item.tables) || item.tables.some((table) => !Array.isArray(table?.rows) || table.rows.length === 0)) errors.push(`${context} has an empty table`);
  if (!Array.isArray(item.variants) || item.variants.some((variant) => !String(variant?.name || "").trim() || !validRarities.has(variant.rarity))) errors.push(`${context} has invalid variants`);
  if (new Set(item.aliases || []).size !== (item.aliases || []).length) errors.push(`${context} aliases contain duplicates`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  const statuses = Object.groupBy(catalog.items, (item) => item.verificationStatus);
  console.log(`Validated ${catalog.items.length} magic items (${Object.entries(statuses).map(([key, value]) => `${key}: ${value.length}`).join(", ")}).`);
}
