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
  insertAdjacentHTML(_position, html) { this.innerHTML += html; }
  querySelectorAll() { return []; }
}

test("monstres.html initializes and renders the local monster dataset", () => {
  const elements = Object.fromEntries([
    "searchInput",
    "crSelect",
    "typeSelect",
    "alignmentSelect",
    "sizeSelect",
    "sortSelect",
    "expandAllBtn",
    "collapseAllBtn",
    "summary",
    "monstersGrid",
    "sourceNote",
  ].map((id) => [id, new FakeElement()]));
  const context = vm.createContext({
    console,
    document: {
      getElementById: (id) => elements[id] ?? null,
    },
  });
  context.window = context;

  for (const path of ["../data/monsters_2024.js", "../js/monsters-page.js"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    vm.runInContext(source, context, { filename: path });
  }

  assert.match(elements.sourceNote.textContent, /499 monstres chargés/);
  assert.equal(elements.summary.textContent, "499 monstre(s) affiché(s) sur 499.");
  assert.match(elements.monstersGrid.innerHTML, /<details class="monster">/);
  assert.match(elements.crSelect.innerHTML, /<option/);
});
