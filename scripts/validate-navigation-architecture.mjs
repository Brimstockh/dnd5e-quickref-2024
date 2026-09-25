import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SITE_SECTIONS } from "../js/site-navigation.js";

const root = resolve(import.meta.dirname, "..");
const expectedIds = ["rules", "compendium", "creation", "universe", "table"];
const errors = [];

function navigationEntries() {
  return SITE_SECTIONS.flatMap((section) => section.links.map((link) => ({
    section,
    url: link[2],
    context: `${section.id}.${link[0]}`,
  })));
}

if (JSON.stringify(SITE_SECTIONS.map(({ id }) => id)) !== JSON.stringify(expectedIds)) {
  errors.push(`sections must be exactly: ${expectedIds.join(", ")}`);
}
if (new Set(SITE_SECTIONS.map(({ id }) => id)).size !== SITE_SECTIONS.length) {
  errors.push("section identifiers are duplicated");
}

const entries = navigationEntries();
const urls = entries.map(({ url }) => url);
for (const duplicate of urls.filter((url, index) => urls.indexOf(url) !== index)) {
  if (!errors.includes(`navigation URL is duplicated: ${duplicate}`)) errors.push(`navigation URL is duplicated: ${duplicate}`);
}

for (const { context, url } of entries) {
  const path = String(url).split(/[?#]/, 1)[0];
  try {
    await access(resolve(root, path));
  } catch {
    errors.push(`${context} targets a missing file: ${path}`);
  }
}
for (const section of SITE_SECTIONS) {
  if (!section.links.some(([, , url]) => url === section.landing)) {
    errors.push(`${section.id}.landing is not declared in its links`);
  }
}

const home = await readFile(resolve(root, "index.html"), "utf8");
if (!home.includes('data-site-explorer')) errors.push("index.html is missing the canonical site explorer mount");

const inventory = JSON.parse(await readFile(resolve(root, "data/content-inventory.json"), "utf8"));
const inventoryUrls = new Set(inventory.pages || []);
for (const url of new Set(urls)) {
  if (!inventoryUrls.has(url)) errors.push(`navigation URL is absent from content inventory: ${url}`);
}
for (const section of SITE_SECTIONS) {
  if (!inventory.navigation?.sections?.some((candidate) => candidate.id === section.id && candidate.landing === section.landing)) {
    errors.push(`section is absent from content inventory: ${section.id}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${SITE_SECTIONS.length} navigation sections and ${new Set(urls).size} public URLs.`);
}

