import assert from "node:assert/strict";
import test from "node:test";

import { loadClassicScript } from "./load-classic-script.mjs";

const { readState, buildSearch } = loadClassicScript("../js/catalog-ui.js", { URLSearchParams }).DndCatalogUI;

test("catalog URL state supports shareable combined filters", () => {
  const state = readState("?q=feu&level=3&class=Magicien&class=Druide&sort=name_desc");
  assert.equal(state.query, "feu");
  assert.equal(state.level, "3");
  assert.deepEqual(Array.from(state.classes), ["Magicien", "Druide"]);
  assert.equal(state.sort, "name_desc");
  assert.equal(buildSearch(state), "q=feu&level=3&class=Druide&class=Magicien&sort=name_desc");
});

test("catalog URL state omits default and empty values", () => {
  assert.equal(buildSearch({ query: " ", level: "", classes: [], sort: "level_asc" }), "");
});
