import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

test("progressive lists expose results in bounded batches", () => {
  let clickHandler;
  let changes = 0;
  const button = {
    hidden: false,
    textContent: "",
    addEventListener(type, handler) {
      if (type === "click") clickHandler = handler;
    },
  };
  const context = vm.createContext({});
  context.globalThis = context;
  vm.runInContext(
    readFileSync(new URL("../js/progressive-list.js", import.meta.url), "utf8"),
    context,
  );
  const list = context.DndProgressiveList.create({
    button,
    batchSize: 60,
    onChange: () => { changes += 1; },
  });
  const items = Array.from({ length: 150 }, (_, index) => index);

  assert.equal(list.take(items).length, 60);
  assert.match(button.textContent, /60\/150/);
  clickHandler();
  assert.equal(changes, 1);
  assert.equal(list.take(items).length, 120);
  list.reset();
  assert.equal(list.take(items).length, 60);
  assert.equal(list.take(items.slice(0, 20)).length, 20);
  assert.equal(button.hidden, true);
});
