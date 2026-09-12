import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const htmlPath = join(root, "faerun.html");
const imageDirectory = join(root, "img", "map");
const mappings = [
  { sectionId: "nord", label: "Le Nord", images: ["Nord-1.webp", "Nord-2.webp"] },
  { sectionId: "cote-epees", label: "La Côte des Épées", images: ["Épées-1.webp", "Épées-2.webp"] },
  { sectionId: "anauroch", label: "Anauroch", images: ["Anauroch-1.webp", "Anauroch-2.webp"] },
  { sectionId: "mitan", label: "Les Terres du mitan", images: ["Mitan-1.webp", "Mitan-2.webp"] },
  { sectionId: "oubliees", label: "Les Terres oubliées", images: ["Oubliées-1.webp", "Oubliées-2.webp"] },
  { sectionId: "intrigue", label: "Les Terres de l'intrigue", images: ["Intrigue-1.webp", "Intrigue-2.webp"] },
  { sectionId: "arcaniques", label: "Les Empires arcaniques", images: ["Arcaniques-1.webp", "Arcaniques-2.webp"] },
  { sectionId: "anciens", label: "Les Anciens empires", images: ["Empires-1.webp", "Empires-2.webp"] },
  { sectionId: "mer-inviolee", label: "La Mer inviolée", images: ["Inviolée-1.webp", "Inviolée-2.webp"] },
  { sectionId: "chult", label: "Chult", images: ["Chult-1.webp", "Chult-2.webp"] },
  { sectionId: "horde", label: "Les Terres de la Horde", images: ["Horde-1.webp", "Horde-2.webp"] },
];

const html = await readFile(htmlPath, "utf8");
const entries = await readdir(imageDirectory, { withFileTypes: true });
const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
const errors = [];
const detectedRegionIds = [...html.matchAll(/<section\s+class="region-card"\s+id="([^"]+)"/g)].map((match) => match[1]);
const mappedRegionIds = new Set(mappings.map((mapping) => mapping.sectionId));
const unmappedRegionIds = detectedRegionIds.filter((id) => !mappedRegionIds.has(id));
const missingRegionIds = mappings.map((mapping) => mapping.sectionId).filter((id) => !detectedRegionIds.includes(id));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sectionFor(id) {
  const pattern = new RegExp(`<section\\s+class="region-card"\\s+id="${escapeRegExp(id)}"[\\s\\S]*?<\\/section>`);
  return html.match(pattern)?.[0] ?? "";
}

async function requireNonEmpty(file) {
  try {
    const fileStats = await stat(join(imageDirectory, file));
    if (fileStats.size === 0) errors.push(`${file}: fichier vide`);
  } catch {
    errors.push(`${file}: fichier absent`);
  }
}

for (const mapping of mappings) {
  const section = sectionFor(mapping.sectionId);
  if (!section) {
    errors.push(`${mapping.sectionId}: section absente`);
    continue;
  }

  for (const image of mapping.images) {
    await requireNonEmpty(image);
    const imagePath = `img/map/${image}`;
    if (!section.includes(`src="${imagePath}"`)) {
      errors.push(`${mapping.sectionId}: référence absente pour ${image}`);
    }
    const imageTag = section.match(new RegExp(`<img[^>]+src="${escapeRegExp(imagePath)}"[^>]*>`))?.[0] ?? "";
    if (!imageTag.includes("alt=") || !imageTag.includes('loading="lazy"') || !imageTag.includes('decoding="async"')) {
      errors.push(`${mapping.sectionId}: attributs image incomplets pour ${image}`);
    }
    if (!/\bwidth="\d+"/.test(imageTag) || !/\bheight="\d+"/.test(imageTag)) {
      errors.push(`${mapping.sectionId}: dimensions absentes pour ${image}`);
    }
  }
  const galleryImages = [...section.matchAll(/<img[^>]+src="(img\/map\/[^"']+\.webp)"/gi)];
  if (galleryImages.length !== 2) errors.push(`${mapping.sectionId}: duo incomplet (${galleryImages.length}/2)`);
}

const pngFiles = files
  .filter((file) => extname(file).toLowerCase() === ".png")
  .sort((left, right) => left.localeCompare(right, "fr"));
const pagePngReferences = [...html.matchAll(/img\/map\/[^"']+\.png/gi)].map((match) => match[0]);
const expectedWebps = new Set(mappings.flatMap((mapping) => mapping.images));
const relevantFiles = files.filter((file) => /-(?:1|2)\.(?:png|jpe?g|webp)$/iu.test(file));
const relevantWebps = relevantFiles.filter((file) => extname(file).toLowerCase() === ".webp");
const unusedRelevantWebps = relevantWebps.filter((file) => !expectedWebps.has(file));
const missingSourceFiles = mappings.flatMap((mapping) => mapping.images.filter((image) => {
  const stem = image.slice(0, -extname(image).length);
  return !relevantFiles.some((file) => file.startsWith(`${stem}.`));
}));

for (const file of pngFiles) await requireNonEmpty(file);
if (pagePngReferences.length) errors.push(`PNG référencés dans la page : ${pagePngReferences.join(", ")}`);
if (unusedRelevantWebps.length) errors.push(`WebP régionaux non utilisés : ${unusedRelevantWebps.join(", ")}`);
if (missingSourceFiles.length) errors.push(`Sources absentes : ${missingSourceFiles.join(", ")}`);
if (unmappedRegionIds.length) errors.push(`Régions sans mapping : ${unmappedRegionIds.join(", ")}`);
if (missingRegionIds.length) errors.push(`Mappings sans région : ${missingRegionIds.join(", ")}`);

console.log(`Régions détectées : ${detectedRegionIds.length}`);
console.log(`Régions avec duo : ${mappings.filter((mapping) => sectionFor(mapping.sectionId)).length}`);
console.log(`PNG détectés dans img/map : ${pngFiles.length} (${pngFiles.join(", ") || "aucun"})`);
console.log(`WebP régionaux référencés : ${expectedWebps.size}`);
console.log(`WebP régionaux non utilisés : ${unusedRelevantWebps.length}`);
console.log(`Références PNG dans la page : ${pagePngReferences.length}`);

if (errors.length) {
  console.log(`Erreurs : ${errors.join(" | ")}`);
  process.exitCode = 1;
}
