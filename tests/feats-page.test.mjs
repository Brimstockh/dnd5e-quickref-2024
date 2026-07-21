import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeElement {
  constructor() {
    this.innerHTML = "";
    this.open = false;
    this.textContent = "";
    this.value = "";
  }

  addEventListener() {}
  querySelectorAll() { return []; }
}

test("dons.html initializes and renders the local feat dataset", () => {
  const elements = Object.fromEntries([
    "searchInput",
    "categorySelect",
    "prereqSelect",
    "repeatableSelect",
    "sortSelect",
    "expandAllBtn",
    "collapseAllBtn",
    "summary",
    "featsGrid",
    "sourceNote",
  ].map((id) => [id, new FakeElement()]));
  const context = vm.createContext({
    console,
    document: {
      getElementById: (id) => elements[id] ?? null,
    },
  });
  context.window = context;

  for (const path of ["../data/feats_2024.js", "../js/feats-page.js"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    vm.runInContext(source, context, { filename: path });
  }

  assert.match(elements.sourceNote.textContent, /75 dons chargés/);
  assert.equal(elements.summary.textContent, "75 don(s) affiché(s) sur 75.");
  assert.match(elements.featsGrid.innerHTML, /<details class="feat">/);
});
