import assert from "node:assert/strict";
import test from "node:test";

import { loadClassicScript } from "./load-classic-script.mjs";

const {
  readState,
  buildSearch,
  readSelection,
  replaceUrlState,
  slugify,
  updateSelection,
} = loadClassicScript("../js/catalog-ui.js", { URL, URLSearchParams }).DndCatalogUI;

test("catalog URL state supports shareable combined filters", () => {
  const state = readState("?q=feu&level=3&school=%C3%89vocation&class=Magicien&class=Druide&sort=name_desc&spell=boule-de-feu");
  assert.equal(state.query, "feu");
  assert.equal(state.level, "3");
  assert.equal(state.school, "Évocation");
  assert.deepEqual(Array.from(state.classes), ["Magicien", "Druide"]);
  assert.equal(state.sort, "name_desc");
  assert.equal(state.spell, "boule-de-feu");
  assert.equal(buildSearch(state), "q=feu&level=3&school=%C3%89vocation&class=Druide&class=Magicien&sort=name_desc&spell=boule-de-feu");
});

test("catalog URL state omits default and empty values", () => {
  assert.equal(buildSearch({ query: " ", level: "", classes: [], sort: "level_asc" }), "");
});

test("catalog URL updates preserve unrelated parameters and detailed selections", () => {
  let next = "";
  replaceUrlState(
    { query: "feu", level: "3", school: "Évocation", classes: ["Magicien"], sort: "level_asc" },
    {
      href: "https://dnd.local/spells.html?spell=boule-de-feu&unknown=1",
      hash: "",
      pathname: "/spells.html",
      search: "?spell=boule-de-feu&unknown=1",
    },
    { replaceState: (_state, _title, value) => { next = value; } },
  );
  assert.equal(next, "/spells.html?spell=boule-de-feu&unknown=1&q=feu&level=3&school=%C3%89vocation&class=Magicien");
});

test("detailed selections use readable slugs and pushable URL state", () => {
  assert.equal(slugify("Boule d’Acide"), "boule-d-acide");
  assert.equal(readSelection("condition", "?condition=agrippe"), "agrippe");

  let pushed = null;
  updateSelection("condition", "agrippe", {
    clear: ["action", "condition"],
    location: {
      href: "https://dnd.local/quickref.html?q=prise&action=attaquer",
      hash: "",
      pathname: "/quickref.html",
      search: "?q=prise&action=attaquer",
    },
    history: { pushState: (state, _title, value) => { pushed = { state, value }; } },
  });
  assert.equal(pushed.state.dndSelection, "condition");
  assert.equal(pushed.value, "/quickref.html?q=prise&condition=agrippe");
});
