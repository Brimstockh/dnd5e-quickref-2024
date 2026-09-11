import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const htmlPath = join(root, "plans-existence.html");
const imageDirectory = join(root, "img", "map");
const mappings = [
  { sectionId: "exterieurs", source: "astral.png", webp: "astral.webp" },
  { sectionId: "interieurs", source: "inner.png", webp: "inner.webp" },
];

const html = await readFile(htmlPath, "utf8");
const entries = await readdir(imageDirectory, { withFileTypes: true });
const pngFiles = entries
  .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".png")
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));
const errors = [];

for (const mapping of mappings) {
  for (const file of [mapping.source, mapping.webp]) {
    try {
      const fileStats = await stat(join(imageDirectory, file));
      if (fileStats.size === 0) errors.push(`${file}: fichier vide`);
    } catch {
      errors.push(`${file}: fichier absent`);
    }
  }

  const sectionPattern = new RegExp(`<section\\s+class="plan-card"\\s+id="${mapping.sectionId}"[\\s\\S]*?<\\/section>`);
  const section = html.match(sectionPattern)?.[0] ?? "";
  if (!section) {
    errors.push(`${mapping.sectionId}: section absente`);
    continue;
  }
  if (!section.includes(`src="img/map/${mapping.webp}"`)) {
    errors.push(`${mapping.sectionId}: référence WebP absente ou incorrecte`);
  }
}

const unexpectedPngs = pngFiles.filter((file) => !mappings.some((mapping) => mapping.source === file));
const pagePngReferences = [...html.matchAll(/img\/map\/[^"']+\.png/gi)].map((match) => match[0]);
if (unexpectedPngs.length) errors.push(`PNG non associés : ${unexpectedPngs.join(", ")}`);
if (pagePngReferences.length) errors.push(`PNG référencés dans la page : ${pagePngReferences.join(", ")}`);

console.log(`PNG détectés dans img/map : ${pngFiles.length} (${pngFiles.join(", ") || "aucun"})`);
console.log(`Illustrations prévues : ${mappings.length}`);
console.log(`Sections associées : ${mappings.length - errors.filter((error) => error.includes("section") || error.includes("référence")).length}`);
console.log(`WebP contrôlés : ${mappings.length}`);
console.log(`PNG non associés : ${unexpectedPngs.length}`);
console.log(`Références PNG dans la page : ${pagePngReferences.length}`);

if (errors.length) {
  console.log(`Erreurs : ${errors.join(" | ")}`);
  process.exitCode = 1;
}
