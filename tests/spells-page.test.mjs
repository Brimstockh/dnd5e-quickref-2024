import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeElement {
  constructor() {
    this.attributes = new Map();
    this.classList = { add() {}, remove() {}, toggle() {} };
    this.disabled = false;
    this.hidden = false;
    this.id = "";
    this.innerHTML = "";
    this.open = false;
    this.textContent = "";
    this.value = "";
  }

  addEventListener() {}
  append() {}
  appendChild() {}
  click() {}
  focus() {}
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  querySelectorAll() { return []; }
  remove() {}
  removeAttribute(name) { this.attributes.delete(name); }
  replaceChildren() {}
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
}

test("spells.html initializes and renders the local spell dataset", async () => {
  const data = JSON.parse(readFileSync(new URL("../data/spells_2024.json", import.meta.url), "utf8"));
  const elements = Object.fromEntries([
    "searchInput",
    "levelSelect",
    "schoolSelect",
    "sortSelect",
    "classList",
    "activeFilters",
    "activeFilterCount",
    "resetFiltersBtn",
    "expandAllBtn",
    "collapseAllBtn",
    "exportTxtBtn",
    "exportStatus",
    "summary",
    "spellsGrid",
    "sourceNote",
    "loadMoreBtn",
    "filterPanel",
    "filterBackdrop",
    "closeFiltersBtn",
    "openFiltersBtn",
    "openSortBtn",
  ].map((id) => [id, new FakeElement()]));
  for (const [id, element] of Object.entries(elements)) element.id = id;

  const document = {
    body: new FakeElement(),
    createElement: () => new FakeElement(),
    createTextNode: (text) => ({ textContent: text }),
    addEventListener() {},
    getElementById: (id) => elements[id] ?? null,
  };
  for (const element of [...Object.values(elements), document.body]) element.ownerDocument = document;

  const sandbox = {
    Blob,
    console,
    document,
    fetch: async (path, options) => {
      assert.equal(path, "data/spells_2024.json");
      assert.equal(options.credentials, "omit");
      return { ok: true, status: 200, json: async () => data };
    },
    history: { replaceState() {} },
    location: { hash: "", pathname: "/spells.html", search: "" },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    setTimeout,
    URL,
    URLSearchParams,
  };
  const context = vm.createContext(sandbox);
  context.window = context;

  for (const path of ["rich-html.js", "spell-export.js", "spell-filters.js", "catalog-ui.js", "progressive-list.js"]) {
    const source = readFileSync(new URL(`../js/${path}`, import.meta.url), "utf8");
    vm.runInContext(source, context, { filename: path });
  }

  const pageScript = readFileSync(new URL("../js/spells-page.js", import.meta.url), "utf8");
  vm.runInContext(pageScript, context, { filename: "spells-page.js" });
  await new Promise((resolve) => setImmediate(resolve));

  assert.match(elements.sourceNote.textContent, /391 sorts disponibles/);
  assert.equal(elements.summary.textContent, "391 sorts sur 391 · 60 affichés");
  assert.equal((elements.spellsGrid.innerHTML.match(/<details class="spell catalog-card"/g) || []).length, 60);
  assert.equal(elements.loadMoreBtn.hidden, false);
  assert.match(elements.loadMoreBtn.textContent, /60\/391/);
});
