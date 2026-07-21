import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeElement {
  constructor() {
    this.disabled = false;
    this.innerHTML = "";
    this.open = false;
    this.textContent = "";
    this.value = "";
  }

  addEventListener() {}
  appendChild() {}
  click() {}
  querySelectorAll() { return []; }
  remove() {}
}

test("spells.html initializes and renders the local spell dataset", async () => {
  const data = JSON.parse(readFileSync(new URL("../data/spells_2024.json", import.meta.url), "utf8"));
  const elements = Object.fromEntries([
    "searchInput",
    "levelSelect",
    "sortSelect",
    "classList",
    "expandAllBtn",
    "collapseAllBtn",
    "exportTxtBtn",
    "exportStatus",
    "summary",
    "spellsGrid",
    "sourceNote",
  ].map((id) => [id, new FakeElement()]));
  const document = {
    body: new FakeElement(),
    createElement: () => new FakeElement(),
    getElementById: (id) => elements[id] ?? null,
  };
  const sandbox = {
    Blob,
    console,
    document,
    fetch: async (path) => {
      assert.equal(path, "data/spells_2024.json");
      return { ok: true, status: 200, json: async () => data };
    },
    setTimeout,
    URL,
  };
  const context = vm.createContext(sandbox);
  context.window = context;

  for (const path of ["rich-html.js", "spell-export.js", "spell-filters.js"]) {
    const source = readFileSync(new URL(`../js/${path}`, import.meta.url), "utf8");
    vm.runInContext(source, context, { filename: path });
  }

  const pageScript = readFileSync(new URL("../js/spells-page.js", import.meta.url), "utf8");
  vm.runInContext(pageScript, context, { filename: "spells-page.js" });
  await new Promise((resolve) => setImmediate(resolve));

  assert.match(elements.sourceNote.textContent, /391 sorts chargés/);
  assert.equal(elements.summary.textContent, "391 sort(s) affiché(s) sur 391.");
  assert.match(elements.spellsGrid.innerHTML, /<details class="spell">/);
});
