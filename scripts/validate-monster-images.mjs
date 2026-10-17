import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const dataPath = resolve(root, "data/monsters_2024.json");
const imageRoot = resolve(root, "img/enemies");
const strictMissing = process.argv.includes("--strict-missing");
const monsters = JSON.parse(await readFile(dataPath, "utf8")).monsters || [];

const knownMissingSlugs = new Set([
  "aberrant-spirit",
  "animated-object",
  "beast-of-the-land",
  "beast-of-the-sea",
  "beast-of-the-sky",
  "bestial-spirit",
  "celestial-spirit",
  "construct-spirit",
  "draconic-spirit",
  "elemental-spirit",
  "fey-spirit",
  "fiendish-spirit",
  "giant-insect",
  "otherworldly-steed",
  "undead-spirit",
]);

function relativePath(path) {
  return relative(root, path).replaceAll("\\", "/");
}

async function imageFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await imageFiles(absolutePath));
    else if (entry.isFile() && /\.(png|webp)$/i.test(entry.name)) files.push(absolutePath);
  }
  return files.sort();
}

function probe(path) {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height,pix_fmt",
      "-of", "json",
      path,
    ], { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectProcess);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectProcess(new Error(stderr.trim() || `ffprobe exited with code ${code}`));
        return;
      }
      try {
        const stream = JSON.parse(stdout).streams?.[0];
        if (!stream) throw new Error("Aucun flux vidéo détecté");
        resolveProcess(stream);
      } catch (error) {
        rejectProcess(error);
      }
    });
  });
}

const files = await imageFiles(imageRoot);
const relativeFiles = files.map((path) => relative(imageRoot, path).replaceAll("\\", "/"));
const exactFiles = new Set(relativeFiles);
const lowerFiles = new Map(relativeFiles.map((path) => [path.toLocaleLowerCase("en-US"), path]));
const invalid = [];

await Promise.all(files.map(async (path) => {
  try {
    await probe(path);
  } catch (error) {
    invalid.push({ path: relativePath(path), reason: error.message });
  }
}));

const missing = [];
const caseMismatches = [];
for (const monster of monsters) {
  const expected = `${monster.type}/${monster.name}.webp`;
  const expectedLower = expected.toLocaleLowerCase("en-US");
  if (exactFiles.has(expected)) continue;
  const alternative = lowerFiles.get(expectedLower);
  if (alternative) caseMismatches.push({ expected, actual: alternative, slug: monster.slug || monster.name });
  else missing.push({ expected, slug: monster.slug || monster.name, known: knownMissingSlugs.has(monster.slug) });
}

const pngs = relativeFiles.filter((path) => path.toLowerCase().endsWith(".png"));
const basenameGroups = new Map();
for (const path of relativeFiles.filter((entry) => entry.toLowerCase().endsWith(".webp"))) {
  const basename = path.slice(path.lastIndexOf("/") + 1, -5).toLocaleLowerCase("en-US");
  const group = basenameGroups.get(basename) || [];
  group.push(path);
  basenameGroups.set(basename, group);
}
const collisions = [...basenameGroups.values()].filter((group) => group.length > 1);
const knownMissing = missing.filter((entry) => entry.known);
const actionableMissing = missing.filter((entry) => !entry.known);
const errors = [
  ...invalid.map((entry) => `Image illisible : ${entry.path} (${entry.reason})`),
  ...pngs.map((path) => `PNG résiduel : img/enemies/${path}`),
  ...caseMismatches.map((entry) => `Casse incorrecte : attendu img/enemies/${entry.expected}, trouvé img/enemies/${entry.actual}`),
  ...actionableMissing.map((entry) => `Portrait manquant : img/enemies/${entry.expected} (${entry.slug})`),
  ...(strictMissing ? knownMissing.map((entry) => `Portrait manquant connu : img/enemies/${entry.expected} (${entry.slug})`) : []),
];

console.log("Monster images:");
console.log(`- monsters total: ${monsters.length}`);
console.log(`- image files: ${files.length}`);
console.log(`- WebP files: ${relativeFiles.filter((path) => path.toLowerCase().endsWith(".webp")).length}`);
console.log(`- PNG files: ${pngs.length}`);
console.log(`- missing: ${missing.length} (${knownMissing.length} known)`);
console.log(`- invalid: ${invalid.length}`);
console.log(`- basename collisions: ${collisions.length}`);

if (missing.length) {
  console.log("\nMissing images:");
  missing.forEach((entry) => console.log(`- img/enemies/${entry.expected}${entry.known ? " (known)" : ""}`));
}
if (collisions.length) {
  console.log("\nName collisions:");
  collisions.forEach((group) => console.log(`- ${group.join(" / ")}`));
}
if (errors.length) throw new Error(errors.join("\n"));
