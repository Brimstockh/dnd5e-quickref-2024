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

test("dons.html renders the local feat dataset", async () => {
  const data = JSON.parse(readFileSync(new URL("../data/feats_2024.json", import.meta.url), "utf8"));
  const elements = Object.fromEntries([
    "searchInput", "categorySelect", "prereqSelect", "repeatableSelect", "sortSelect",
    "expandAllBtn", "collapseAllBtn", "summary", "featsGrid", "sourceNote",
  ].map((id) => [id, new FakeElement()]));
  const context = vm.createContext({
    console,
    document: { getElementById: (id) => elements[id] ?? null },
    fetch: async (path, options) => {
      assert.equal(path, "data/feats_2024.json");
      assert.equal(options.credentials, "omit");
      return { ok: true, status: 200, json: async () => data };
    },
    location: { search: "" },
    URLSearchParams,
  });
  context.window = context;

  const source = readFileSync(new URL("../js/feats-page.js", import.meta.url), "utf8");
  vm.runInContext(source, context, { filename: "feats-page.js" });
  await new Promise((resolve) => setImmediate(resolve));

  assert.match(elements.sourceNote.textContent, /75 dons charg/);
  assert.match(elements.summary.textContent, /^75 don\(s\).*75/);
  assert.match(elements.featsGrid.innerHTML, /<details class="feat">/);
});
