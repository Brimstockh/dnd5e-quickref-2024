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
    this.children = [];
    this.classList = new FakeClassList();
    this.listeners = {};
    this.style = {};
    this.textContent = "";
  }

  addEventListener(name, callback) { this.listeners[name] = callback; }
  appendChild(child) { this.children.push(child); child.parentNode = this; }
  replaceChildren() { this.children = []; }
}

test("quick reference initializes and opens a modal without jQuery", () => {
  const ids = [
    "basic-movement",
    "basic-actions",
    "basic-bonus-actions",
    "basic-reactions",
    "basic-conditions",
    "environment-obscurance",
    "environment-light",
    "environment-vision",
    "environment-cover",
    "modal",
    "modal-backdrop",
    "modal-container",
    "modal-title",
    "modal-subtitle",
    "modal-bullets",
    "modal-reference",
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement()]));
  ids.slice(0, 9).forEach((id) => {
    elements[id].parentNode = { parentNode: {} };
  });

  let readyHandler;
  const document = {
    body: new FakeElement(),
    addEventListener: (name, callback) => {
      if (name === "DOMContentLoaded") readyHandler = callback;
    },
    createElement: () => new FakeElement(),
    getElementById: (id) => elements[id] ?? null,
  };
  const item = {
    title: "Attaquer",
    subtitle: "Effectuer une attaque",
    bullets: ["Jet avec <b>avantage</b>."],
    reference: "PHB",
  };
  const sandbox = {
    console,
    document,
    window: {
      getComputedStyle: () => ({ backgroundColor: "rgb(1, 2, 3)" }),
      innerHeight: 800,
    },
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

  const source = readFileSync(new URL("../js/quickref.js", import.meta.url), "utf8");
  vm.runInNewContext(source, sandbox);
  assert.equal(typeof readyHandler, "function");
  readyHandler();

  assert.equal(elements["basic-actions"].children.length, 1);
  elements["basic-actions"].children[0].listeners.click();
  assert.equal(document.body.classList.contains("modal-open"), true);
  assert.equal(elements.modal.classList.contains("modal-visible"), true);
  assert.equal(elements["modal-title"].textContent, "Attaquer");
  assert.equal(elements["modal-bullets"].children.length, 1);
  assert.equal(elements["modal-bullets"].children[0].innerHTML, "Jet avec <b>avantage</b>.");
});
