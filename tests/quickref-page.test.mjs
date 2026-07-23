import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  contains(value) { return this.values.has(value); }
  remove(value) { this.values.delete(value); }
}

class FakeElement {
  constructor() {
    this.attributes = new Map();
    this.children = [];
    this.classList = new FakeClassList();
    this.hidden = false;
    this.listeners = {};
    this.style = { setProperty: (name, value) => { this.style[name] = value; } };
    this.textContent = "";
    this.value = "";
  }

  addEventListener(name, callback) { this.listeners[name] = callback; }
  appendChild(child) { this.children.push(child); child.parentNode = this; }
  closest() { return this.section ?? null; }
  focus() { this.focused = true; }
  querySelectorAll() { return []; }
  replaceChildren() { this.children = []; }
  removeAttribute(name) { this.attributes.delete(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
}

test("quick reference filters entries and opens an accessible detail panel", () => {
  const collectionIds = [
    "basic-movement",
    "basic-actions",
    "basic-bonus-actions",
    "basic-reactions",
    "basic-conditions",
    "environment-obscurance",
    "environment-light",
    "environment-vision",
    "environment-cover",
  ];
  const ids = [
    ...collectionIds,
    "quickref-search",
    "quickref-result-count",
    "quickref-empty",
    "quickref-detail-layer",
    "quickref-detail-panel",
    "quickref-detail-backdrop",
    "quickref-detail-close",
    "quickref-detail-title",
    "quickref-detail-type",
    "quickref-detail-cost",
    "quickref-detail-summary",
    "quickref-detail-reference",
    "quickref-detail-bullets",
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement()]));
  collectionIds.forEach((id) => {
    elements[id].section = new FakeElement();
  });

  const documentListeners = {};
  const document = {
    activeElement: null,
    body: new FakeElement(),
    addEventListener: (name, callback) => { documentListeners[name] = callback; },
    createElement: () => new FakeElement(),
    getElementById: (id) => elements[id] ?? null,
  };
  const item = {
    title: "Attaquer",
    subtitle: "Effectuer une attaque",
    description: "Faites un jet d’attaque.",
    bullets: ["Jet avec <b>avantage</b>."],
    reference: "PHB",
  };
  const sandbox = {
    console,
    document,
    getComputedStyle: () => ({
      backgroundColor: "rgb(1, 2, 3)",
      getPropertyValue: () => "#708b5b",
    }),
    history: { pushState() {}, replaceState() {} },
    location: { href: "https://dnd.local/quickref.html", hash: "", pathname: "/quickref.html", search: "" },
    URL,
    URLSearchParams,
    data_movement: [item],
    data_action: [item],
    data_bonusaction: [item],
    data_reaction: [item],
    data_condition: [item],
    data_environment_obscurance: [item],
    data_environment_light: [item],
    data_environment_vision: [item],
    data_environment_cover: [item],
  };
  sandbox.window = sandbox;

  for (const path of ["../js/catalog-ui.js", "../js/quickref.js"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    vm.runInNewContext(source, sandbox);
  }
  assert.equal(typeof documentListeners.DOMContentLoaded, "function");
  documentListeners.DOMContentLoaded();

  assert.equal(elements["basic-actions"].children.length, 1);
  assert.equal(elements["quickref-result-count"].textContent, "9 entrées");

  const action = elements["basic-actions"].children[0];
  action.listeners.click();
  assert.equal(document.body.classList.contains("quickref-detail-open"), true);
  assert.equal(elements["quickref-detail-layer"].classList.contains("is-open"), true);
  assert.equal(elements["quickref-detail-layer"].getAttribute("aria-hidden"), "false");
  assert.equal(elements["quickref-detail-layer"].getAttribute("inert"), null);
  assert.equal(elements["quickref-detail-title"].textContent, "Attaquer");
  assert.equal(elements["quickref-detail-cost"].textContent, "Action");
  assert.equal(elements["quickref-detail-bullets"].children[0].innerHTML, "Jet avec <b>avantage</b>.");

  elements["quickref-detail-close"].listeners.click();
  assert.equal(elements["quickref-detail-layer"].getAttribute("aria-hidden"), "true");
  assert.equal(elements["quickref-detail-layer"].getAttribute("inert"), "");
  assert.equal(action.getAttribute("aria-expanded"), "false");

  elements["quickref-search"].value = "introuvable";
  elements["quickref-search"].listeners.input();
  assert.equal(elements["quickref-result-count"].textContent, "0 entrée");
  assert.equal(elements["quickref-empty"].hidden, false);
});
