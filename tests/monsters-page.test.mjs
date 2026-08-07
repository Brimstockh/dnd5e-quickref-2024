import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeElement {
  constructor() {
    this.hidden = false;
    this.disabled = false;
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
  const details = JSON.parse(readFileSync(new URL("../data/monsters_2024_details.json", import.meta.url), "utf8"));
  const elements = Object.fromEntries([
    "searchInput", "crSelect", "typeSelect", "alignmentSelect", "sizeSelect", "sortSelect",
    "expandAllBtn", "collapseAllBtn", "exportJsonBtn", "exportStatus", "summary", "monstersGrid", "sourceNote", "loadMoreBtn",
  ].map((id) => [id, new FakeElement()]));
  const context = vm.createContext({
    console,
    document: { getElementById: (id) => elements[id] ?? null },
    fetch: async (path, options) => {
      assert.equal(options.credentials, "omit");
      if (path === "data/monsters_2024.json") return { ok: true, status: 200, json: async () => data };
      assert.equal(path, "data/monsters_2024_details.json");
      return { ok: true, status: 200, json: async () => details };
    },
    history: { pushState() {}, replaceState() {} },
    location: { href: "https://dnd.local/monstres.html", hash: "", pathname: "/monstres.html", search: "" },
    URL,
    URLSearchParams,
  });
  context.window = context;

  for (const path of ["../js/catalog-ui.js", "../js/progressive-list.js", "../js/monster-export.js", "../js/monsters-page.js"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    vm.runInContext(source, context, { filename: path });
  }
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(Object.keys(details.monsters[data.monsters[0].slug].abilities), ["STR", "DEX", "CON", "INT", "WIS", "CHA"]);
  assert.ok(Object.values(details.monsters).some((monster) => monster.traits?.length));
  assert.ok(Object.values(details.monsters).some((monster) => monster.legendary_actions?.length));
  assert.match(elements.sourceNote.textContent, /499 monstres charg/);
  assert.match(elements.summary.textContent, /^499 monstre\(s\).*499.*72 affich/);
  assert.equal((elements.monstersGrid.innerHTML.match(/<details class="monster"/g) || []).length, 72);
  assert.match(elements.monstersGrid.innerHTML, /class="monster-abilities"/);
  assert.match(elements.monstersGrid.innerHTML, /class="monster-options"/);
  assert.equal(elements.loadMoreBtn.hidden, false);
  assert.match(elements.loadMoreBtn.textContent, /72\/499/);
  assert.match(elements.crSelect.innerHTML, /<option/);
  assert.equal(elements.exportJsonBtn.disabled, false);
});
