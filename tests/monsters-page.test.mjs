import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeElement {
  constructor() {
    this.hidden = false;
    this.innerHTML = "";
    this.open = false;
    this.textContent = "";
    this.value = "";
  }

  addEventListener() {}
  insertAdjacentHTML(_position, html) { this.innerHTML += html; }
  querySelectorAll() { return []; }
}

test("monstres.html progressively renders the local monster dataset", async () => {
  const data = JSON.parse(readFileSync(new URL("../data/monsters_2024.json", import.meta.url), "utf8"));
  const elements = Object.fromEntries([
    "searchInput", "crSelect", "typeSelect", "alignmentSelect", "sizeSelect", "sortSelect",
    "expandAllBtn", "collapseAllBtn", "summary", "monstersGrid", "sourceNote", "loadMoreBtn",
  ].map((id) => [id, new FakeElement()]));
  const context = vm.createContext({
    console,
    document: { getElementById: (id) => elements[id] ?? null },
    fetch: async (path, options) => {
      assert.equal(path, "data/monsters_2024.json");
      assert.equal(options.credentials, "omit");
      return { ok: true, status: 200, json: async () => data };
    },
    location: { search: "" },
    URLSearchParams,
  });
  context.window = context;

  for (const path of ["../js/progressive-list.js", "../js/monsters-page.js"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    vm.runInContext(source, context, { filename: path });
  }
  await new Promise((resolve) => setImmediate(resolve));

  assert.match(elements.sourceNote.textContent, /499 monstres charg/);
  assert.match(elements.summary.textContent, /^499 monstre\(s\).*499.*72 affich/);
  assert.equal((elements.monstersGrid.innerHTML.match(/<details class="monster">/g) || []).length, 72);
  assert.equal(elements.loadMoreBtn.hidden, false);
  assert.match(elements.loadMoreBtn.textContent, /72\/499/);
  assert.match(elements.crSelect.innerHTML, /<option/);
});
