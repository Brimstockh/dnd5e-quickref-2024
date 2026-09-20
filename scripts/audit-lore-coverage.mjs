import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(import.meta.dirname, "..");

export const EXPECTED_LORE_ENTRIES = Object.freeze([
  "acererak", "adamantine", "alustriel-silverhand", "ashardalon", "baba-yaga", "bahamut",
  "baldurs-gate", "barovia", "bigby", "boo", "castle-ravenloft", "companions-of-the-hall",
  "company-of-seven", "corellon", "delina", "diancastra", "drizzt-do-urden", "elder-evils",
  "elminster", "euryale", "fallbacks", "first-world", "fizban", "great-modron-march", "gruumsh",
  "hadar", "harpers", "heroes-of-the-lance", "heroes-of-the-realm", "icewind-dale", "iggwilv", "iuz",
  "jallarzi-sallavarian", "kas-the-betrayer", "keraptis", "kyuss", "laeral-silverhand", "league-of-malevolence",
  "lord-soth", "menzoberranzan", "minsc", "mithral", "moradin", "mordenkainen", "neverwinter", "otiluke",
  "otto", "phandalin", "prince-of-frost", "queen-of-air-and-darkness", "raven-queen", "rock-of-bral",
  "rudolph-van-richten", "strahd-von-zarovich", "summer-queen", "sword-coast", "szass-tam", "tasha",
  "tharizdun", "tiamat", "underdark", "undermountain", "vajra-safahr", "valors-call", "vecna", "venger",
  "vi", "vlaakith", "waterdeep", "xanathar", "yolande", "yawning-portal", "zagyg", "zargon",
]);

function targetErrors(target) {
  if (!target) return [];
  const [path, hash] = String(target).split("#", 2);
  const errors = [];
  if (!path || !path.endsWith(".html")) errors.push(`target non HTML: ${target}`);
  if (path.includes("/") || path.startsWith(".") || path.includes("\\")) errors.push(`target hors racine: ${target}`);
  if (hash && !/^[-a-z0-9]+$/i.test(hash)) errors.push(`ancre invalide: ${target}`);
  return errors;
}

export function auditLore(data) {
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const expectedIds = new Set(EXPECTED_LORE_ENTRIES.map((id) => `lore-${id}`));
  const seen = new Set();
  const errors = [];
  const missing = [];

  for (const id of expectedIds) {
    if (!entries.some((entry) => entry?.id === id)) missing.push(id);
  }
  for (const [index, entry] of entries.entries()) {
    const context = `entrée ${index + 1}`;
    if (!entry?.id) errors.push(`${context} sans ID`);
    if (seen.has(entry?.id)) errors.push(`ID dupliqué: ${entry.id}`);
    seen.add(entry?.id);
    if (!entry?.summary?.trim() && !entry?.target) errors.push(`${entry?.id || context} sans contenu ni target`);
    if (!Array.isArray(entry?.details) || !entry.details.some((detail) => String(detail).trim())) {
      errors.push(`${entry?.id || context} sans détail`);
    }
    errors.push(...targetErrors(entry?.target));
    if (!expectedIds.has(entry?.id)) errors.push(`entrée inattendue: ${entry?.id || context}`);
  }
  return { errors, missing, found: entries.length, expected: EXPECTED_LORE_ENTRIES.length };
}

async function main() {
  const data = JSON.parse(await readFile(resolve(root, "data/lore.json"), "utf8"));
  const result = auditLore(data);
  console.log("Lore coverage");
  console.log("-------------");
  console.log(`Expected: ${result.expected}`);
  console.log(`Found: ${result.found}`);
  console.log(`Missing: ${result.missing.length}`);
  if (result.missing.length) console.error(`Missing entries: ${result.missing.join(", ")}`);
  if (result.errors.length) console.error(result.errors.map((error) => `- ${error}`).join("\n"));
  if (result.missing.length || result.errors.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
