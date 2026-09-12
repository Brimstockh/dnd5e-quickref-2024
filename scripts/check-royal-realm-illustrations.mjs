import { readdir, stat } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const groupMappings = new Map([
  ["alliance", "emblems/seigneurs.webp"],
  ["enclave", "emblems/emeraude.webp"],
  ["menestrels", "emblems/ménestrels.webp"],
  ["gantelet", "emblems/gantelet.webp"],
  ["zhentarim", "emblems/zhentarim.webp"],
  ["culte-dragon", "emblems/dragon.webp"],
]);

const historyMappings = [
  {
    title: "Le Temps des Troubles, 1358 CV",
    images: ["history/troubles-1.webp", "history/troubles-2.webp"],
  },
  {
    title: "Le retour du Nétheril, 1374 CV",
    images: ["history/Nétheril-1.webp", "history/Nétheril-2.webp"],
  },
  {
    title: "La Magepeste, 1385 CV",
    images: ["history/magepeste-1.webp", "history/magepeste-2.webp"],
  },
  {
    title: "La Fracture, 1482-1489 CV",
    images: ["history/fracture-1.webp", "history/fracture-2.webp"],
  },
];

const divineMappings = new Map([
  ["Bahamut", "divines/Bahamut.webp"],
  ["Corellon Larethian", "divines/corellon.webp"],
  ["Garl Brilledor", "divines/brilledor.webp"],
  ["Gruumsh", "divines/Gruumsh.webp"],
  ["Kurtulmak", "divines/Kurtulmak.webp"],
  ["Lolth", "divines/Lolth.webp"],
  ["Maglubiyet", "divines/maglubiyet.webp"],
  ["Moradin", "divines/Moradin.webp"],
  ["Tiamat", "divines/Tiamat.webp"],
  ["Yondalla", "divines/Yondalla.webp"],
]);

const htmlPaths = {
  groups: resolve(root, "groupes-royaumes.html"),
  history: resolve(root, "histoire-royaumes.html"),
  divines: resolve(root, "divinites.html"),
};

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function getAttribute(markup, name) {
  const match = markup.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1] ?? null;
}

function getImages(markup) {
  return [...markup.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
}

function getHeading(markup) {
  const heading = markup.match(/<h2>([\s\S]*?)<\/h2>/i)?.[1] ?? "";
  return heading.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

async function ensureImage(imagePath, markup) {
  const src = getAttribute(markup, "src");
  if (!src) throw new Error(`Image without src: ${markup}`);
  const normalizedSource = normalizePath(src);
  if (!normalizedSource.startsWith("img/")) throw new Error(`Image outside img/: ${src}`);
  await stat(resolve(root, normalizedSource));

  for (const attribute of ["alt", "loading", "decoding", "width", "height"]) {
    if (!getAttribute(markup, attribute)) throw new Error(`Missing ${attribute} on ${src}`);
  }

  const width = Number(getAttribute(markup, "width"));
  const height = Number(getAttribute(markup, "height"));
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid dimensions on ${src}`);
  }
  if (normalizedSource !== `img/${imagePath}`) throw new Error(`Expected img/${imagePath}, found ${normalizedSource}`);
}

async function readText(path) {
  const { readFile } = await import("node:fs/promises");
  return readFile(path, "utf8");
}

async function checkGroups() {
  const html = await readText(htmlPaths.groups);
  const sections = [...html.matchAll(/<section\s+class="group-card"\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi)];
  if (sections.length !== groupMappings.size) throw new Error(`Expected ${groupMappings.size} group cards, found ${sections.length}`);

  const used = [];
  for (const [id, imagePath] of groupMappings) {
    const section = sections.find((match) => match[1] === id)?.[2];
    if (!section) throw new Error(`Missing faction section: ${id}`);
    const images = getImages(section);
    if (images.length !== 1) throw new Error(`Faction ${id} must have exactly one emblem`);
    await ensureImage(imagePath, images[0]);
    if (!getAttribute(images[0], "alt")?.startsWith("Emblème")) throw new Error(`Invalid faction alt on ${imagePath}`);
    used.push(imagePath);
  }
  return { count: sections.length, used };
}

async function checkHistory() {
  const html = await readText(htmlPaths.history);
  const sections = [...html.matchAll(/<section\s+class="timeline-item"[^>]*>([\s\S]*?)<\/section>/gi)];
  if (sections.length !== historyMappings.length) throw new Error(`Expected ${historyMappings.length} history events, found ${sections.length}`);

  const used = [];
  for (const mapping of historyMappings) {
    const section = sections.find((match) => getHeading(match[1]) === mapping.title)?.[1];
    if (!section) throw new Error(`Missing history event: ${mapping.title}`);
    const images = getImages(section);
    if (images.length !== 2) throw new Error(`${mapping.title} must have exactly two illustrations`);
    for (let index = 0; index < images.length; index += 1) {
      await ensureImage(mapping.images[index], images[index]);
      if (!getAttribute(images[index], "alt")?.startsWith("Illustration ")) {
        throw new Error(`Invalid history alt on ${mapping.images[index]}`);
      }
      used.push(mapping.images[index]);
    }
  }
  return { count: sections.length, complete: historyMappings.length, used };
}

async function checkDivines() {
  const html = await readText(htmlPaths.divines);
  const images = getImages(html).filter((markup) => getAttribute(markup, "src")?.startsWith("img/divines/"));
  if (images.length !== divineMappings.size) throw new Error(`Expected ${divineMappings.size} divine symbols, found ${images.length}`);

  const used = [];
  for (const [name, imagePath] of divineMappings) {
    const image = images.find((markup) => getAttribute(markup, "src") === `img/${imagePath}`);
    if (!image) throw new Error(`Missing symbol for ${name}`);
    await ensureImage(imagePath, image);
    if (!getAttribute(image, "alt")?.startsWith("Symbole sacré")) throw new Error(`Invalid divine alt on ${imagePath}`);
    used.push(imagePath);
  }
  return { count: divineMappings.size, used };
}

async function findUnusedAssets(family, usedPaths) {
  const directoryPath = resolve(root, "img", family);
  const files = await readdir(directoryPath, { withFileTypes: true });
  const usedNames = new Set(usedPaths.filter((path) => path.startsWith(`${family}/`)).map((path) => path.slice(family.length + 1)));
  const webp = files.filter((file) => file.isFile() && extname(file.name).toLowerCase() === ".webp").map((file) => file.name);
  const unusedWebp = webp.filter((name) => !usedNames.has(name));
  const sourceWithoutOutput = files
    .filter((file) => file.isFile() && [".png", ".jpg", ".jpeg"].includes(extname(file.name).toLowerCase()))
    .filter((file) => !usedNames.has(`${file.name.slice(0, -extname(file.name).length)}.webp`))
    .map((file) => `${family}/${file.name}`);
  return { unusedWebp, sourceWithoutOutput };
}

const groups = await checkGroups();
const history = await checkHistory();
const divines = await checkDivines();
const usedPaths = [...groups.used, ...history.used, ...divines.used];
const unused = new Map();
for (const family of ["emblems", "history", "divines"]) unused.set(family, await findUnusedAssets(family, usedPaths));

console.log(`Factions : ${groups.count}`);
console.log(`Emblèmes associés : ${groups.used.length}`);
console.log(`Factions sans emblème : ${groups.count - groups.used.length}`);
console.log(`Événements : ${history.count}`);
console.log(`Paires historiques complètes : ${history.complete}`);
console.log(`Événements incomplets : ${history.count - history.complete}`);
console.log(`Divinités illustrées : ${divines.count}`);
console.log(`Symboles associés : ${divines.used.length}`);
console.log(`Divinités sans symbole : ${divines.count - divines.used.length}`);
for (const family of ["emblems", "history", "divines"]) {
  const familyUnused = unused.get(family);
  console.log(`${family} WebP inutilisés : ${familyUnused.unusedWebp.length}${familyUnused.unusedWebp.length ? ` (${familyUnused.unusedWebp.join(", ")})` : ""}`);
  console.log(`${family} sources sans association : ${familyUnused.sourceWithoutOutput.length}${familyUnused.sourceWithoutOutput.length ? ` (${familyUnused.sourceWithoutOutput.join(", ")})` : ""}`);
}
