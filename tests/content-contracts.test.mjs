import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CONTENT_TYPES,
  createContentId,
  isContentId,
  resolveContentId,
  slugifyContent,
} from "../js/content-ids.js";

const loadJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const index = await loadJson("../data/search-index.json");
const aliasRegistry = await loadJson("../data/content-id-aliases.json");
const schemas = await Promise.all([
  loadJson("../schemas/search-index.schema.json"),
  loadJson("../schemas/content-id-aliases.schema.json"),
  loadJson("../schemas/content-relations.schema.json"),
  loadJson("../schemas/content-relations-source.schema.json"),
  loadJson("../schemas/glossary.schema.json"),
  loadJson("../schemas/search-aliases.schema.json"),
  loadJson("../schemas/character-creation.schema.json"),
  loadJson("../schemas/local-storage-contracts.schema.json"),
  loadJson("../schemas/content-inventory.schema.json"),
]);

test("content IDs are stable, readable, and aligned with catalog slugs", () => {
  assert.equal(slugifyContent("Boule d’Acide"), "boule-d-acide");
  assert.equal(createContentId("spell", "Boule de feu"), "spell-boule-de-feu");
  assert.equal(createContentId("class", "Rôdeur"), "class-rodeur");
  assert.equal(isContentId("rule-concentration"), true);
  assert.equal(isContentId("unknown-concentration"), false);
  assert.throws(() => createContentId("unknown", "Test"), /Unknown content type/);
});

test("legacy content IDs resolve without replacing canonical IDs", () => {
  const aliases = aliasRegistry.aliases;
  const legacyFireballId = Object.keys(aliases).find((id) => aliases[id] === "spell-boule-de-feu");
  assert.match(legacyFireballId, /^spell-\d+$/);
  assert.equal(resolveContentId(legacyFireballId, aliases), "spell-boule-de-feu");
  assert.equal(resolveContentId("spell-boule-de-feu", aliases), "spell-boule-de-feu");
  assert.equal(aliasRegistry.count, Object.keys(aliases).length);
  assert.ok(aliasRegistry.count > 1000);
});

test("Lot 2 data contracts use versioned JSON schemas", () => {
  for (const schema of schemas) {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.type, "object");
    assert.ok(schema.properties.schemaVersion);
  }
  assert.ok(CONTENT_TYPES.includes("glossary"));
  assert.ok(CONTENT_TYPES.includes("spell"));
  assert.deepEqual(
    schemas[3].properties.relations.items.properties.type.enum,
    ["available-for", "prerequisite", "related-rule", "see-also"],
  );
});
