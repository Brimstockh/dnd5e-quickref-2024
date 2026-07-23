import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const glossary = JSON.parse(await readFile(resolve(root, "data/glossary.json"), "utf8"));

test("glossary index exposes stable and complete entries", () => {
  assert.equal(glossary.schemaVersion, 1);
  assert.equal(glossary.count, glossary.entries.length);
  assert.ok(glossary.count >= 70);
  assert.equal(new Set(glossary.entries.map(({ id }) => id)).size, glossary.count);
  assert.equal(new Set(glossary.entries.map(({ anchor }) => anchor)).size, glossary.count);
  assert.deepEqual(
    new Set(glossary.entries.map(({ category }) => category)),
    new Set(["Actions", "États", "Termes"]),
  );
});

test("glossary keeps aliases, summaries and deep links", () => {
  const savingThrow = glossary.entries.find(({ id }) => id === "glossary-jet-de-sauvegarde");
  const advantage = glossary.entries.find(({ id }) => id === "glossary-avantage");
  const prone = glossary.entries.find(({ id }) => id === "glossary-a-terre");

  assert.ok(savingThrow.aliases.includes("Saving Throw"));
  assert.ok(advantage.summary.length > 80);
  assert.equal(prone.url, "glossaire.html?term=a-terre");
  assert.ok(prone.related.includes("condition-a-terre"));
});

test("glossary relations reference canonical search identifiers", async () => {
  const search = JSON.parse(await readFile(resolve(root, "data/search-index.json"), "utf8"));
  const knownIds = new Set(search.entries.map(({ id }) => id));
  for (const entry of glossary.entries) {
    assert.match(entry.id, /^glossary-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(entry.label);
    assert.ok(entry.summary);
    for (const related of entry.related) assert.ok(knownIds.has(related), `${entry.id} -> ${related}`);
  }
});
