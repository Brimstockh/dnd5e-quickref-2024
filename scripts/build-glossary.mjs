import { readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import { resolve } from "node:path";
import { createContentId, slugifyContent } from "../js/content-ids.js";

const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "glossaire.html"), "utf8");
const aliasesSource = JSON.parse(await readFile(resolve(root, "data/glossary-aliases.source.json"), "utf8"));
const searchIndex = JSON.parse(await readFile(resolve(root, "data/search-index.json"), "utf8"));

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function plainText(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function concise(value, limit = 230) {
  const text = plainText(value);
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

const categoryLabels = Object.freeze({
  actions: "Actions",
  etats: "États",
  termes: "Termes",
});
const relatedTypes = new Set(["action", "bonus-action", "condition", "movement", "reaction"]);
const searchableEntries = searchIndex.entries.filter((entry) => relatedTypes.has(entry.type));
const sections = [...source.matchAll(/<section[^>]*\bid=["'](termes|actions|etats)["'][^>]*>/gi)];
const headings = [...source.matchAll(/<h4([^>]*)>([\s\S]*?)<\/h4>/gi)];
const entries = [];

for (const [index, heading] of headings.entries()) {
  const attributes = heading[1];
  const rawTitle = plainText(heading[2]);
  const headingId = attributes.match(/\bid=["']([^"']+)["']/i)?.[1] || "";
  const category = sections
    .filter((section) => section.index < heading.index)
    .at(-1)?.[1] || "";
  if (!category || !rawTitle) continue;

  const aliasMatch = rawTitle.match(/\[([^\]]+)\]\s*$/);
  const label = rawTitle.replace(/\s*\[[^\]]+\]\s*$/, "").trim();
  const slug = slugifyContent(label);
  const bodyStart = heading.index + heading[0].length;
  const bodyEnd = headings[index + 1]?.index ?? source.length;
  const body = source.slice(bodyStart, bodyEnd);
  const firstParagraph = body.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || body;
  const aliases = [
    ...(aliasMatch ? [aliasMatch[1]] : []),
    ...(aliasesSource.aliases?.[slug] || []),
  ].filter((value, aliasIndex, values) => (
    value.toLocaleLowerCase("fr") !== label.toLocaleLowerCase("fr")
    && values.findIndex((candidate) => candidate.toLocaleLowerCase("fr") === value.toLocaleLowerCase("fr")) === aliasIndex
  ));
  const related = searchableEntries
    .filter((entry) => slugifyContent(entry.title) === slug)
    .map((entry) => entry.id);

  entries.push({
    id: createContentId("glossary", slug),
    label,
    aliases,
    summary: concise(firstParagraph),
    url: `glossaire.html?term=${encodeURIComponent(slug)}`,
    anchor: headingId || slug,
    category: categoryLabels[category],
    related,
  });
}

entries.sort((first, second) => first.label.localeCompare(second.label, "fr"));
const ids = new Set(entries.map((entry) => entry.id));
if (ids.size !== entries.length) throw new Error("Glossary IDs must be unique");
if (entries.some((entry) => !entry.summary)) throw new Error("Every glossary entry must have a summary");

const output = `${JSON.stringify({
  schemaVersion: 1,
  count: entries.length,
  entries,
})}${EOL}`;
const outputPath = resolve(root, "data/glossary.json");

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) throw new Error("Generated glossary is stale: data/glossary.json");
  console.log(`Verified ${entries.length} glossary entries.`);
} else {
  await writeFile(outputPath, output, "utf8");
  console.log(`Generated ${entries.length} glossary entries.`);
}
