import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const htmlPath = join(root, "personnages-royaumes.html");
const vipDirectory = join(root, "img", "vip");

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const html = await readFile(htmlPath, "utf8");
const entries = await readdir(vipDirectory, { withFileTypes: true });
const pngFiles = entries
  .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".png")
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));
const webpFiles = new Set(entries
  .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".webp")
  .map((entry) => entry.name));
const sourceFiles = pngFiles.length ? pngFiles : [...webpFiles].sort((left, right) => left.localeCompare(right));

const cards = [...html.matchAll(/<section\s+class="character-card"\s+id="([^"]+)"\s*>([\s\S]*?)<\/section>/g)]
  .map((match) => {
    const body = match[2];
    const title = body.match(/<h2>([\s\S]*?)<\/h2>/)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
    const image = body.match(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/i);
    return { id: match[1], title, src: image?.[1] ?? "" };
  });

const availableByKey = new Map();
for (const sourceFile of sourceFiles) {
  const key = normalize(basename(sourceFile, extname(sourceFile)));
  const matches = availableByKey.get(key) ?? [];
  matches.push(sourceFile);
  availableByKey.set(key, matches);
}

const missingPortraits = [];
const ambiguousPortraits = [];
const mismatchedPortraits = [];
const usedWebp = new Set();

for (const card of cards) {
  const matches = availableByKey.get(normalize(card.title)) ?? [];
  if (matches.length === 0) {
    missingPortraits.push(card.title);
    continue;
  }
  if (matches.length > 1) {
    ambiguousPortraits.push(`${card.title}: ${matches.join(", ")}`);
    continue;
  }

  const expectedWebp = extname(matches[0]).toLowerCase() === ".webp"
    ? matches[0]
    : `${matches[0].slice(0, -extname(matches[0]).length)}.webp`;
  const actualWebp = decodeURIComponent(card.src).split(/[\\/]/).pop() ?? "";
  usedWebp.add(actualWebp);
  if (actualWebp !== expectedWebp || !webpFiles.has(expectedWebp)) {
    mismatchedPortraits.push(`${card.title}: attendu ${expectedWebp}, trouvé ${actualWebp || "aucun"}`);
  }
}

const unusedPortraits = [...webpFiles].filter((file) => !usedWebp.has(file)).sort((left, right) => left.localeCompare(right));
const issues = [...missingPortraits, ...ambiguousPortraits, ...mismatchedPortraits];

console.log(`Personnages HTML : ${cards.length}`);
console.log(`Portraits trouvés : ${sourceFiles.length} (${pngFiles.length ? "PNG source" : "WebP suivis"})`);
console.log(`Portraits associés : ${cards.length - issues.length}`);
console.log(`Portraits non associés : ${unusedPortraits.length}`);
console.log(`Personnages sans portrait : ${missingPortraits.length}`);
if (missingPortraits.length) console.log(`Sans portrait : ${missingPortraits.join(", ")}`);
if (ambiguousPortraits.length) console.log(`Ambigus : ${ambiguousPortraits.join(" | ")}`);
if (mismatchedPortraits.length) console.log(`Chemins incorrects : ${mismatchedPortraits.join(" | ")}`);
if (unusedPortraits.length) console.log(`Portraits non utilisés : ${unusedPortraits.join(", ")}`);

for (const file of webpFiles) {
  const fileStats = await stat(join(vipDirectory, file));
  if (fileStats.size === 0) issues.push(`${file}: fichier vide`);
}

if (issues.length || unusedPortraits.length || webpFiles.size !== sourceFiles.length) {
  process.exitCode = 1;
}
