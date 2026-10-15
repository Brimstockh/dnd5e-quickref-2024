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
  const characterStorage = await readFile(resolve(root, "js/character-storage.js"), "utf8");
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
  const context = vm.createContext({
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    Math,
    URL,
    document,
    window,
  });
  vm.runInContext(source, context);
  vm.runInContext(characterStorage, context);
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

test("character sheets are isolated by stable profile id and duplicate independently", async () => {
  const window = await loadPersonalApis();
  const first = window.DndProfiles.save({ name: "Même nom" });
  const second = window.DndProfiles.save({ name: "Même nom" });
  const firstSheet = { version: "standalone_v2", updated_at: "2026-01-01T00:00:00.000Z", data: { name: "A", future: { keep: true } } };
  const secondSheet = { version: "standalone_v2", updated_at: "2026-01-01T00:00:01.000Z", data: { name: "B" } };

  assert.equal(window.DndSheets.setForProfile(first.id, firstSheet).ok, true);
  assert.equal(window.DndSheets.setForProfile(second.id, secondSheet).ok, true);
  assert.equal(JSON.stringify(window.DndSheets.getForProfile(first.id)), JSON.stringify(firstSheet));
  assert.equal(JSON.stringify(window.DndSheets.getForProfile(second.id)), JSON.stringify(secondSheet));

  const duplicate = window.DndProfiles.duplicate(first.id);
  assert.notEqual(duplicate.id, first.id);
  assert.equal(JSON.stringify(window.DndSheets.getForProfile(duplicate.id)), JSON.stringify(firstSheet));
  window.DndSheets.setForProfile(duplicate.id, {
    ...firstSheet,
    data: { name: "Copie modifiée", future: { keep: true } },
  });
  assert.equal(window.DndSheets.getForProfile(first.id).data.name, "A");
  window.DndProfiles.remove(first.id);
  assert.equal(window.DndSheets.getForProfile(first.id), null);
  assert.equal(window.DndSheets.getForProfile(second.id).data.name, "B");
  assert.equal(window.DndSheets.getForProfile(duplicate.id).data.name, "Copie modifiée");
});

test("legacy standalone sheets migrate without choosing between several profiles", async () => {
  const legacy = { version: "standalone_v2", data: { name: "Historique", unknown: "preserve" } };
  const window = await loadPersonalApis({
    dnd2024_personal_v1: JSON.stringify({
      schemaVersion: 2,
      activeProfileId: "p1",
      profiles: [{ id: "p1", name: "A" }, { id: "p2", name: "B" }],
      lists: [],
      notes: {},
    }),
    dnd_character_sheet_standalone_v2: JSON.stringify(legacy),
  });

  assert.deepEqual(window.DndSheets.getForProfile("p1"), null);
  assert.equal(JSON.stringify(window.DndSheets.getUnassigned().payload), JSON.stringify(legacy));
  assert.equal(JSON.stringify(window.DndSheets.getStandalone()), JSON.stringify(legacy));
  assert.ok(window.localStorage.values.has("dnd_character_sheet_standalone_v2_backup_v2"));
  const firstState = window.DndSheets.getState();
  const secondState = window.DndSheets.getState();
  assert.equal(JSON.stringify(secondState), JSON.stringify(firstState));
  assert.equal(Object.keys(secondState.sheetsByProfileId).length, 0);
});

test("backup validation is atomic and includes profile sheets and the draft", async () => {
  const window = await loadPersonalApis();
  const profile = window.DndProfiles.save({ name: "Lyria" });
  const sheet = { version: "standalone_v2", data: { name: "Lyria", marker: "sheet" } };
  window.DndSheets.setForProfile(profile.id, sheet);
  window.DndStorage.setJson("dnd_character_creator_draft_v1", { schemaVersion: 1, name: "Brouillon" });
  const backup = window.DndBackup.create(true);
  const validation = window.DndBackup.validate(backup);
  assert.equal(validation.ok, true);
  assert.equal(JSON.stringify(backup.characterSheets.sheetsByProfileId[profile.id]), JSON.stringify(sheet));
  assert.equal(backup.creatorDraft.name, "Brouillon");

  const before = window.DndPersonal.getState();
  const invalid = window.DndBackup.apply({ ...backup, personal: { schemaVersion: 2, profiles: [{ id: 7 }] } });
  assert.equal(invalid.ok, false);
  assert.equal(JSON.stringify(window.DndPersonal.getState()), JSON.stringify(before));
});

test("the personal space exposes complete Lot 3 controls and runtime offline support", async () => {
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
  assert.match(worker, /networkFirstNavigation/);
  assert.match(worker, /MAX_RUNTIME_PAGES = 40/);
  assert.match(worker, /\.\/offline\.html/);
  assert.match(shell, /Ajouter une note personnelle/);
  assert.match(shell, /Espace personnel/);
});
