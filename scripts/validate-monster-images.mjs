import { access, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dataPath = resolve(root, "data/monsters_2024.json");
const imageRoot = resolve(root, "img/enemies");
const monsters = JSON.parse(await readFile(dataPath, "utf8")).monsters || [];

function imagePath(monster) {
  return resolve(imageRoot, String(monster.type || ""), `${String(monster.name || "")}.webp`);
}

const results = await Promise.all(monsters.map(async (monster) => {
  const path = imagePath(monster);
  try {
    await access(path);
    return { monster, path, found: true };
  } catch {
    return { monster, path, found: false };
  }
}));

const missing = results.filter((result) => !result.found);
const relativePath = (path) => relative(root, path).replaceAll("\\", "/");

console.log("Monster images:");
console.log(`- monsters total: ${results.length}`);
console.log(`- images found: ${results.length - missing.length}`);
console.log(`- images missing: ${missing.length}`);

if (missing.length) {
  console.log("\nMissing images:");
  missing.forEach(({ monster, path }) => {
    console.log(`- ${relativePath(path)} (${monster.slug || monster.name})`);
  });
}
