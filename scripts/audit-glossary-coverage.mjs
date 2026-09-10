import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findGlossaryMatch, glossaryTerms } from "../js/glossary-client.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function listHtmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listHtmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

function textContent(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<table\b[\s\S]*?<\/table>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function termsFound(text, terms) {
  const found = new Set();
  const ignored = new Set();
  while (true) {
    const match = findGlossaryMatch(text, terms, ignored);
    if (!match) return found;
    found.add(match.entry.id);
    ignored.add(match.entry.id);
  }
}

const glossary = JSON.parse(await readFile(resolve(root, "data/glossary.json"), "utf8"));
const aliasesSource = JSON.parse(await readFile(resolve(root, "data/glossary-aliases.source.json"), "utf8"));
const relations = JSON.parse(await readFile(resolve(root, "data/content-relations.json"), "utf8"));
const relationSource = JSON.parse(await readFile(resolve(root, "data/content-relations.source.json"), "utf8"));
const [magicItemsSource, campaignRulesSource] = await Promise.all([
  readFile(resolve(root, "js/magic-items-page.js"), "utf8"),
  readFile(resolve(root, "js/campaign-rules-page.js"), "utf8"),
]);
const terms = glossaryTerms(glossary.entries);
const files = await listHtmlFiles(root);
const pages = await Promise.all(files.map(async (path) => ({
  path: relative(root, path).replaceAll("\\", "/"),
  html: await readFile(path, "utf8"),
})));
const richtextPages = pages.filter(({ html }) => html.includes("data-glossary-richtext"));
const editorialPages = pages.filter(({ html }) => /<body\b[^>]*\bclass=["'][^"']*(?:content-page|quickref-page|catalog-page|legacy-catalog-page)/i.test(html));
const intentionallyUnscoped = new Set([
  "assistant-creation.html",
  "character-sheet-standalone.html",
  "comparateur.html",
  "character-template-v2.html",
  "character-template.html",
  "dice-stats.html",
  "espace-personnel.html",
  "glossaire.html",
  "html/character-profile.html",
  "html/character.html",
  "html/characters.html",
  "index.html",
  "offline.html",
]);
const missingMarker = editorialPages
  .filter(({ html, path }) => !html.includes("data-glossary-richtext") && !intentionallyUnscoped.has(path))
  .map(({ path }) => path);
const coverage = richtextPages.map(({ path, html }) => ({ path, terms: termsFound(textContent(html), terms).size }));
const generatedSlugs = new Set(glossary.entries.map((entry) => entry.id.replace(/^glossary-/, "")));
const sourceKeys = new Set([
  ...Object.keys(aliasesSource.aliases || {}),
  ...Object.keys(aliasesSource.abbreviations || {}),
  ...Object.keys(aliasesSource.autoLink || {}),
]);
const orphanSourceKeys = [...sourceKeys].filter((key) => !generatedSlugs.has(key));
const collisions = [];
const labels = new Map();
for (const term of terms) {
  const previous = labels.get(term.normalizedLabel);
  if (previous && previous.entry.id !== term.entry.id) {
    collisions.push(`${term.label} (${term.entry.id}) ↔ ${previous.label} (${previous.entry.id})`);
  } else {
    labels.set(term.normalizedLabel, term);
  }
}
const relationEntries = glossary.entries.filter((entry) => entry.related.length > 0).length;
const aliasCount = new Set(glossary.entries.flatMap((entry) => entry.aliases)).size;
const abbreviationCount = new Set(glossary.entries.flatMap((entry) => entry.abbreviations || [])).size;
const sourceGlossaryRelations = (relationSource.relations || []).filter((relation) => relation.source.startsWith("glossary-")).length;
const dynamicMarkerSources = [
  ["js/magic-items-page.js", magicItemsSource],
  ["js/campaign-rules-page.js", campaignRulesSource],
].filter(([, source]) => !source.includes("data-glossary-richtext")).map(([path]) => path);

console.log(`Glossaire : ${glossary.entries.length} entrées, ${aliasCount} alias distincts, ${abbreviationCount} abréviations.`);
console.log(`Relations : ${relations.count} indexées, ${relationEntries}/${glossary.entries.length} entrées du glossaire reliées, ${sourceGlossaryRelations} relations source.`);
console.log(`Couverture : ${richtextPages.length}/${pages.length} pages HTML avec data-glossary-richtext ; ${missingMarker.length} page(s) éditoriale(s) sans marqueur.`);
console.log(`Termes statiques détectés par page marquée : ${coverage.length ? Math.min(...coverage.map((item) => item.terms)) : 0} à ${coverage.length ? Math.max(...coverage.map((item) => item.terms)) : 0}.`);
console.log(`Sources dynamiques contrôlées séparément : ${dynamicMarkerSources.length ? dynamicMarkerSources.join(", ") : "marqueurs présents dans les renderers"}.`);
console.log(`Contrôles : ${orphanSourceKeys.length ? `orphelins ${orphanSourceKeys.join(", ")}` : "aucune clé source orpheline"} ; ${collisions.length ? `collisions ${collisions.join(" ; ")}` : "aucune collision de normalisation"}.`);
if (missingMarker.length) console.log(`Pages éditoriales sans scope : ${missingMarker.join(", ")}.`);
console.log(`Pages volontairement hors scope : ${[...intentionallyUnscoped].join(", ")}.`);
if (coverage.length) console.log(`Pages marquées : ${coverage.map((item) => `${item.path} (${item.terms})`).join(", ")}.`);
