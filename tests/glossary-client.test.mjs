import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { findGlossaryMatch, glossaryTerms } from "../js/glossary-client.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const glossary = JSON.parse(await readFile(resolve(root, "data/glossary.json"), "utf8"));

test("contextual matcher prefers long terms and respects word boundaries", () => {
  const terms = glossaryTerms(glossary.entries);
  const match = findGlossaryMatch("Ce sort demande un jet de sauvegarde.", terms);
  assert.equal(match.entry.id, "glossary-jet-de-sauvegarde");
  assert.equal(match.length, "jet de sauvegarde".length);
  assert.equal(findGlossaryMatch("Une réactionnaire arrive.", terms)?.entry.id, undefined);
});

test("contextual matcher understands accent-insensitive aliases and exclusions", () => {
  const terms = glossaryTerms(glossary.entries);
  assert.equal(
    findGlossaryMatch("Le personnage est a terre.", terms).entry.id,
    "glossary-a-terre",
  );
  assert.equal(
    findGlossaryMatch("Avantage et concentration", terms, new Set(["glossary-avantage"])).entry.id,
    "glossary-concentration",
  );
});

test("shared glossary client is explicit, bounded and keyboard accessible", async () => {
  const source = await readFile(resolve(root, "js/glossary-client.js"), "utf8");
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  assert.match(source, /\[data-glossary-richtext\]/);
  assert.match(source, /MAX_TERMS_PER_SCOPE = 16/);
  assert.match(source, /aria-haspopup/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /restoreFocus/);
  assert.match(shell, /js\/glossary-client\.js/);
  assert.doesNotMatch(source, /createTreeWalker\(doc\.body/);
});
