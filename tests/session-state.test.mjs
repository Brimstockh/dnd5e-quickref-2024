import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadStateApi() {
  const source = readFileSync(new URL("../js/session-state.js", import.meta.url), "utf8");
  const context = vm.createContext({ Date, Math, Set, window: {} });
  vm.runInContext(source, context);
  return context.window.DndSessionState;
}

test("session state normalizes generic resources and spell slots", () => {
  const api = loadStateApi();
  const scope = api.normalizeScope({
    resources: [{ id: "channel", label: "Canalisation", current: 8, max: 2, reset: "short-rest" }],
    slots: [{ level: 1, current: 6, max: 4 }],
  });
  assert.equal(scope.resources[0].current, 2);
  assert.equal(scope.slots[0].current, 4);
  assert.equal(scope.slots.length, 9);
});

test("short and long rests only restore explicitly configured resources", () => {
  const api = loadStateApi();
  const scope = api.normalizeScope({
    resources: [
      { id: "short", label: "Canalisation", current: 0, max: 1, reset: "short-rest" },
      { id: "long", label: "Rage", current: 1, max: 3, reset: "long-rest" },
      { id: "manual", label: "Objet", current: 0, max: 2, reset: "manual" },
    ],
    slots: [{ level: 1, current: 1, max: 4 }],
  });

  const shortRest = api.applyRest(scope, "short-rest", "2026-07-23T10:00:00Z");
  assert.equal(shortRest.scope.resources[0].current, 1);
  assert.equal(shortRest.scope.resources[1].current, 1);
  assert.equal(shortRest.scope.slots[0].current, 1);

  const longRest = api.applyRest(shortRest.scope, "long-rest", "2026-07-23T11:00:00Z");
  assert.equal(longRest.scope.resources[0].current, 1);
  assert.equal(longRest.scope.resources[1].current, 3);
  assert.equal(longRest.scope.resources[2].current, 0);
  assert.equal(longRest.scope.slots[0].current, 4);
});

test("session history is bounded to fifty operations", () => {
  const api = loadStateApi();
  let scope = api.createScope();
  for (let index = 0; index < 60; index += 1) {
    scope = api.recordHistory(scope, `Opération ${index}`, "2026-07-23T10:00:00Z");
  }
  assert.equal(scope.history.length, 50);
  assert.equal(scope.history[0].label, "Opération 59");
});

test("the standalone sheet exposes the complete session dashboard", () => {
  const html = readFileSync(new URL("../character-sheet-standalone.html", import.meta.url), "utf8");
  const script = readFileSync(new URL("../js/session-tools.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../css/session-tools.css", import.meta.url), "utf8");
  for (const id of [
    "sessionPage", "sheetModeRead", "shortRestBtn", "longRestBtn", "sessionResources",
    "sessionSlots", "knownSpells", "preparedSpells", "sessionShortcuts", "sessionNotes", "sessionHistory",
  ]) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.match(script, /data\/spells_2024\.json/);
  assert.match(script, /dnd_character_session_v1/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /\[data-sheet-mode="read"\]/);
});
