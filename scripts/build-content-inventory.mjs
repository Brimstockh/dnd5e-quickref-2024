import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "data/content-inventory.json");
const checkOnly = process.argv.includes("--check");
const [primaryIndex, deepIndex] = await Promise.all([
  readFile(resolve(root, "data/search-index.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "data/search-index-deep.json"), "utf8").then(JSON.parse),
]);
const index = { entries: [...(primaryIndex.entries || []), ...(deepIndex.entries || [])] };
const byType = {};
const seen = new Set();
const duplicateIds = [];
const invalidUrls = [];
const incompleteEntries = [];

for (const entry of index.entries || []) {
  byType[entry.type] = (byType[entry.type] || 0) + 1;
  if (seen.has(entry.id)) duplicateIds.push(entry.id);
  seen.add(entry.id);
  if (!entry.url || /^(?:javascript|data):/i.test(entry.url)) invalidUrls.push(entry.id);
  if (!entry.title || !entry.category || !Array.isArray(entry.keywords) || !Array.isArray(entry.aliases)) {
    incompleteEntries.push(entry.id);
  }
}

const pages = Array.from(new Set((index.entries || []).map(({ url }) => String(url || "").split(/[?#]/, 1)[0]).filter(Boolean))).sort();
const inventory = {
  schemaVersion: 1,
  count: index.entries?.length || 0,
  byType: Object.fromEntries(Object.entries(byType).sort(([left], [right]) => left.localeCompare(right))),
  pages,
  quality: { duplicateIds, invalidUrls, incompleteEntries },
};
const serialized = `${JSON.stringify(inventory, null, 2)}\n`;

if (checkOnly) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== serialized) {
    console.error("data/content-inventory.json is stale. Run npm run build:inventory.");
    process.exitCode = 1;
  } else {
    console.log(`Verified ${inventory.count} indexed contents across ${pages.length} pages.`);
  }
} else {
  await writeFile(outputPath, serialized);
  console.log(`Generated ${inventory.count} indexed contents across ${pages.length} pages.`);
}
