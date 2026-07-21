import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
}

class FakeElement {
  constructor() {
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.style = {};
    this.textContent = "";
  }

  addEventListener(type, listener) { this.listeners.set(type, listener); }
  emit(type, event = {}) { this.listeners.get(type)?.(event); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 500 }; }
  setPointerCapture() {}
}

test("Faerûn map initializes and responds to zoom controls", () => {
  const viewer = new FakeElement();
  const image = new FakeElement();
  const zoomIn = new FakeElement();
  const zoomOut = new FakeElement();
  const reset = new FakeElement();
  const zoomValue = new FakeElement();
  const elements = new Map([
    ["[data-map-viewer]", viewer],
    ["[data-map-image]", image],
    ["[data-map-zoom-in]", zoomIn],
    ["[data-map-zoom-out]", zoomOut],
    ["[data-map-reset]", reset],
    ["[data-map-zoom-value]", zoomValue],
  ]);
  const context = vm.createContext({
    console,
    document: {
      querySelector: (selector) => elements.get(selector) ?? null,
    },
  });
  const source = readFileSync(new URL("../js/faerun-map.js", import.meta.url), "utf8");

  vm.runInContext(source, context, { filename: "faerun-map.js" });
  assert.equal(image.style.transform, "translate(0px, 0px) scale(1)");
  assert.equal(zoomValue.textContent, "100%");

  zoomIn.emit("click");
  assert.equal(image.style.transform, "translate(-100px, -50px) scale(1.2)");
  assert.equal(zoomValue.textContent, "120%");

  reset.emit("click");
  assert.equal(image.style.transform, "translate(0px, 0px) scale(1)");
  assert.equal(zoomValue.textContent, "100%");
});
