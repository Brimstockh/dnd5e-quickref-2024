import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildGlossarySearch,
  filterGlossaryEntries,
  readGlossaryState,
} from "../js/glossary-page.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const glossary = JSON.parse(await readFile(resolve(root, "data/glossary.json"), "utf8"));

test("glossary page state round-trips through the URL", () => {
  const state = readGlossaryState("?q=saving+throw&category=Termes&letter=J&term=jet-de-sauvegarde");
  assert.deepEqual(state, {
    query: "saving throw",
    category: "Termes",
    letter: "J",
    term: "jet-de-sauvegarde",
  });
  assert.equal(
    buildGlossarySearch(state),
    "q=saving+throw&category=Termes&letter=J&term=jet-de-sauvegarde",
  );
  assert.equal(buildGlossarySearch({}), "");
});

test("glossary filters combine aliases, categories and initials", () => {
  assert.deepEqual(
    filterGlossaryEntries(glossary.entries, { query: "saving throw", category: "", letter: "" })
      .map(({ id }) => id),
    ["glossary-jet-de-sauvegarde"],
  );
  const states = filterGlossaryEntries(glossary.entries, {
    query: "",
    category: "États",
    letter: "É",
  });
  assert.ok(states.length >= 2);
  assert.ok(states.every(({ category, label }) => category === "États" && /^[EÉ]/u.test(label)));
});

test("glossary page exposes accessible controls and deep-link focus", async () => {
  const html = await readFile(resolve(root, "glossaire.html"), "utf8");
  const source = await readFile(resolve(root, "js/glossary-page.js"), "utf8");
  assert.match(html, /type="module" src="js\/glossary-page\.js"/);
  assert.match(source, /aria-live/);
  assert.match(source, /aria-pressed/);
  assert.match(source, /popstate/);
  assert.match(source, /scrollIntoView/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
});
