import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

function localStorageStub(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

async function loadPersonalApis(initial = {}) {
  const source = await readFile(resolve(root, "js/user-library.js"), "utf8");
  const listeners = new Map();
  const window = {
    addEventListener: (type, callback) => listeners.set(type, callback),
    dispatchEvent: () => {},
    localStorage: localStorageStub(initial),
    location: { href: "https://example.test/dnd/index.html" },
  };
  const document = {
    addEventListener: () => {},
    currentScript: { src: "https://example.test/dnd/js/user-library.js" },
    readyState: "loading",
  };
  vm.runInContext(source, vm.createContext({
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    Math,
    URL,
    document,
    window,
  }));
  return window;
}

test("personal state migrates v1 to v2 without losing unknown fields", async () => {
  const window = await loadPersonalApis({
    dnd2024_personal_v1: JSON.stringify({
      schemaVersion: 1,
      activeProfileId: null,
      profiles: [],
      lists: [],
      notes: {},
      futureField: "kept",
    }),
  });
  const state = window.DndPersonal.getState();
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.futureField, "kept");
  assert.equal(
    JSON.parse(window.localStorage.values.get("dnd2024_personal_v1_backup_v1")).schemaVersion,
    1,
  );
});

test("personal state supports optional profiles, notes and profile-scoped data", async () => {
  const window = await loadPersonalApis();
  assert.equal(window.DndPersonal.schemaVersion, 2);
  assert.equal(window.DndProfiles.getActive(), null);
  const profile = window.DndProfiles.save({ name: "Lyria", class: "Paladin", level: 5, species: "Aasimar" });
  assert.equal(window.DndProfiles.getActive().id, profile.id);
  assert.equal(window.DndProfiles.getActive().level, 5);

  window.DndPersonal.setNote("rule-concentration", "À relire avant la partie");
  assert.equal(window.DndPersonal.getNote("rule-concentration"), "À relire avant la partie");
  window.DndPersonal.setNote("rule-concentration", "");
  assert.equal(window.DndPersonal.getNote("rule-concentration"), "");

  window.DndProfiles.remove(profile.id);
  assert.equal(window.DndProfiles.getActive(), null);
});

test("the personal space exposes complete Lot 3 controls and offline assets", async () => {
  const html = await readFile(resolve(root, "espace-personnel.html"), "utf8");
  const script = await readFile(resolve(root, "js/personal-space.js"), "utf8");
  const styles = await readFile(resolve(root, "css/personal-space.css"), "utf8");
  const worker = await readFile(resolve(root, "service-worker.js"), "utf8");
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");

  for (const id of [
    "activeProfileSelect", "profileForm", "newListBtn", "librarySearch",
    "pageNoteForm", "exportBackupBtn", "importBackupInput",
  ]) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.match(script, /dnd-companion-backup/);
  assert.match(script, /profileId: activeScopeId\(\)/);
  assert.match(script, /window\.confirm/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(worker, /\.\/espace-personnel\.html/);
  assert.match(worker, /\.\/js\/personal-space\.js/);
  assert.match(shell, /Ajouter une note personnelle/);
  assert.match(shell, /Espace personnel/);
});
