import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  contentIdForElement,
  pageContentId,
  relatedEntries,
} from "../js/related-content.js";

const index = JSON.parse(await readFile(new URL("../data/content-relations.json", import.meta.url), "utf8"));
const classList = (...names) => ({ contains: (name) => names.includes(name) });

test("related content resolves compact target metadata", () => {
  const entries = relatedEntries(index, "spell-boule-de-feu");
  assert.deepEqual(entries.map((entry) => entry.title).sort(), ["Ensorceleur", "Magicien"]);
  assert.ok(entries.every((entry) => entry.url.startsWith("classes/")));
});

test("catalog and quick-reference elements resolve canonical content IDs", () => {
  assert.equal(contentIdForElement({
    dataset: { contentId: "boule-de-feu" },
    classList: classList("spell"),
    id: "spell-boule-de-feu",
  }, "/dnd/spells.html"), "spell-boule-de-feu");
  assert.equal(contentIdForElement({
    dataset: { contentId: "a-terre" },
    classList: classList("item"),
    id: "quickref-condition-a-terre",
  }, "/dnd/quickref.html"), "condition-a-terre");
  assert.equal(contentIdForElement({
    dataset: { contentId: "rapiere" },
    classList: classList("content-catalog-entry"),
    id: "equipment-rapiere",
  }, "/dnd/armes-armures.html"), "equipment-rapiere");
});

test("page relations prefer anchors and otherwise use the generic page", () => {
  const siteRoot = new URL("https://example.test/dnd/");
  assert.equal(pageContentId(index, {
    href: "https://example.test/dnd/rules-2024.html",
  }, siteRoot), "page-regles-du-jeu");
  assert.equal(pageContentId(index, {
    href: "https://example.test/dnd/combat-2024.html#attaque",
  }, siteRoot), "rule-combat-2024-attaque");
  assert.equal(pageContentId(index, {
    href: "https://example.test/dnd/spells.html?class=Paladin",
  }, siteRoot), "page-sorts");
});
