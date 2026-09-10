import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const classPages = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "rodeur",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
];

test("dense pages expose the shared layout primitives", async () => {
  const css = await read("css/content-page.css");
  const requiredSelectors = [
    ".dense-layout",
    ".page-toc",
    ".content-section",
    ".feature-card",
    ".level-badge",
    ".option-grid",
    ".option-card",
    ".callout--important",
    ".rule-details",
    ".subclass-details",
    ".death-flow",
    "@media (max-width: 700px)",
  ];

  for (const selector of requiredSelectors) assert.ok(css.includes(selector), selector);
});

test("target pages opt into the dense system without changing their content scope", async () => {
  const pages = [
    ["combat-2024.html", "combat"],
    ["rules-2024.html", "rules"],
    ["mastery-2024.html", "mastery"],
    ["historique.html", "backgrounds"],
    ...classPages.map((name) => [`classes/class-${name}.html`, "class"]),
  ];

  for (const [path, variant] of pages) {
    const html = await read(path);
    assert.match(html, /<body[^>]*\bdense-page\b/, path);
    assert.match(html, new RegExp(`data-dense-variant="${variant}"`), path);
  }

  for (const name of classPages) {
    const html = await read(`classes/class-${name}.html`);
    assert.match(html, /data-glossary-richtext/, name);
    assert.match(html, /id="sous-classes"/, name);
    assert.ok((html.match(/<h3><a id="[^"]+" class="ancre"/g) ?? []).length >= 4, name);
  }
});

test("dense migration preserves key public anchors and special catalog contracts", async () => {
  const combat = await read("combat-2024.html");
  for (const id of ["facteur-puissance", "ordre", "deplacement", "attaque", "pv", "opv", "monte"]) {
    assert.match(combat, new RegExp(`id="${id}"`), id);
  }

  const rules = await read("rules-2024.html");
  for (const id of ["d20", "avantage"]) assert.match(rules, new RegExp(`id="${id}"`), id);

  const mastery = await read("mastery-2024.html");
  for (const id of ["actions", "bonus", "reactions"]) assert.match(mastery, new RegExp(`id="${id}"`), id);

  const history = await read("historique.html");
  assert.equal((history.match(/<h3 id="[^"]+"/g) ?? []).length, 16);

  const fighter = await read("classes/class-fighter.html");
  assert.match(fighter, /id="manœuvres"/);
  const sorcerer = await read("classes/class-sorcerer.html");
  assert.match(sorcerer, /id="metamagie"/);
  const warlock = await read("classes/class-warlock.html");
  assert.match(warlock, /Options de manifestations occultes/);
});

test("dense runtime keeps hash navigation and details behavior explicit", async () => {
  const runtime = await read("js/dense-pages.js");
  const shell = await read("js/site-shell.js");
  assert.match(runtime, /export function initDensePage/);
  assert.match(runtime, /details\.open = true/);
  assert.match(runtime, /addEventListener\("hashchange"/);
  assert.match(shell, /js\/dense-pages\.js/);
  assert.match(shell, /enhanceDeepLinks\(\)/);
});
