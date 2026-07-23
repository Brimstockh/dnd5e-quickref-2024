import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function loadStorage(localStorage) {
  const source = await readFile(resolve(root, "js/user-library.js"), "utf8");
  const window = {
    addEventListener: () => {},
    dispatchEvent: () => {},
    localStorage,
    location: { href: "https://example.test/dnd/index.html" },
  };
  const document = {
    addEventListener: () => {},
    currentScript: { src: "https://example.test/dnd/js/user-library.js" },
    readyState: "loading",
  };
  const context = vm.createContext({
    CustomEvent: class {},
    URL,
    document,
    window,
  });
  vm.runInContext(source, context);
  return window.DndStorage;
}

function memoryLocalStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

test("DndStorage preserves existing keys and supports raw and JSON values", async () => {
  const local = memoryLocalStorage({
    dnd2024_theme: "light",
    dnd2024_favorites_v1: JSON.stringify([{ title: "Combat", url: "combat-2024.html" }]),
  });
  const storage = await loadStorage(local);

  assert.equal(storage.schemaVersion, 1);
  assert.equal(storage.get("dnd2024_theme", "dark"), "light");
  assert.equal(
    JSON.stringify(storage.getJson("dnd2024_favorites_v1", [])),
    JSON.stringify([{ title: "Combat", url: "combat-2024.html" }]),
  );
  assert.equal(storage.set("dnd2024_session_mode", "true"), true);
  assert.equal(local.values.get("dnd2024_session_mode"), "true");
  assert.equal(storage.setJson("custom", { enabled: true }), true);
  assert.equal(local.values.get("custom"), '{"enabled":true}');
  assert.equal(storage.remove("custom"), true);
  assert.equal(storage.get("custom", null), null);
  assert.equal(storage.isPersistent(), true);
});

test("DndStorage falls back to memory when browser storage is unavailable", async () => {
  const unavailable = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
    removeItem: () => { throw new Error("blocked"); },
  };
  const storage = await loadStorage(unavailable);

  assert.equal(storage.set("theme", "dark"), false);
  assert.equal(storage.get("theme", null), "dark");
  assert.equal(storage.setJson("profile", { name: "Lyria" }), false);
  assert.equal(JSON.stringify(storage.getJson("profile", null)), '{"name":"Lyria"}');
  assert.equal(storage.isPersistent(), false);
  assert.equal(storage.remove("profile"), false);
  assert.equal(storage.getJson("profile", null), null);
});

test("DndStorage migrates versioned data after creating a recoverable backup", async () => {
  const local = memoryLocalStorage({
    profile: JSON.stringify({ schemaVersion: 1, name: "Lyria", unknownField: "preserved" }),
  });
  const storage = await loadStorage(local);
  const migrated = storage.migrateJson("profile", {
    currentVersion: 2,
    fallback: null,
    migrations: {
      1: (value) => ({ ...value, level: 5 }),
    },
    validate: (value) => value.level === 5,
  });

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.unknownField, "preserved");
  assert.equal(JSON.parse(local.values.get("profile")).level, 5);
  assert.deepEqual(
    JSON.parse(local.values.get("profile_backup_v1")),
    { schemaVersion: 1, name: "Lyria", unknownField: "preserved" },
  );
});

test("DndStorage leaves the source untouched when a migration fails", async () => {
  const original = { schemaVersion: 1, name: "Lyria" };
  const local = memoryLocalStorage({ profile: JSON.stringify(original) });
  const storage = await loadStorage(local);
  const migrated = storage.migrateJson("profile", {
    currentVersion: 3,
    fallback: { safe: true },
    migrations: { 1: (value) => ({ ...value }) },
  });

  assert.equal(JSON.stringify(migrated), '{"safe":true}');
  assert.deepEqual(JSON.parse(local.values.get("profile")), original);
  assert.deepEqual(JSON.parse(local.values.get("profile_backup_v1")), original);
});

test("feature modules no longer access browser storage directly", async () => {
  for (const path of ["js/site-shell.js", "js/quicklinks.js", "js/character-sheet.js"]) {
    const source = await readFile(resolve(root, path), "utf8");
    assert.doesNotMatch(source, /(?:window\.)?localStorage\.(?:getItem|setItem|removeItem)/, path);
    assert.match(source, /window\.DndStorage/, path);
  }
});
