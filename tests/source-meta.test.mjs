import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function registry() {
  return JSON.parse(await readFile(resolve(root, "data/source-metadata.json"), "utf8"));
}

function matchEntry(entries, path) {
  return entries.find((entry) => entry.path === path)
    ?? entries.find((entry) => entry.prefix && path.startsWith(entry.prefix));
}

test("source metadata registry is valid and covers priority pages", async () => {
  const data = await registry();
  const allowedStatuses = new Set(["editorial", "structured", "reviewed"]);
  const priorityPaths = [
    "rules-2024.html",
    "combat-2024.html",
    "mastery-2024.html",
    "spells.html",
    "dons.html",
    "armes-armures.html",
    "glossaire.html",
    "classes/index.html",
    "classes/class-paladin.html",
    "races/index.html",
    "races/race-aasimar.html",
  ];

  assert.equal(data.schemaVersion, 1);
  assert.equal(data.defaults.edition, "D&D 2024");
  assert.equal(data.defaults.language, "fr");
  assert.match(data.defaults.updated, /^\d{4}-\d{2}-\d{2}$/);

  for (const path of priorityPaths) {
    const entry = matchEntry(data.entries, path);
    assert.ok(entry, `missing source metadata for ${path}`);
    const metadata = { ...data.defaults, ...entry };
    assert.ok(metadata.document, `${path}: document`);
    assert.ok(metadata.type, `${path}: type`);
    assert.ok(allowedStatuses.has(metadata.status), `${path}: status`);
    assert.ok(metadata.translationNote, `${path}: translation note`);
  }
});

test("source metadata component stays shared, discreet, and GitHub Pages aware", async () => {
  const source = await readFile(resolve(root, "js/source-meta.js"), "utf8");
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  const styles = await readFile(resolve(root, "css/components.css"), "utf8");

  assert.doesNotThrow(() => new vm.Script(source));
  assert.match(source, /new URL\("\.\.\/", script/);
  assert.match(source, /data\/source-metadata\.json/);
  assert.match(source, /className = "source-meta"/);
  assert.match(source, /doc\.createElement\("details"\)/);
  assert.match(source, /doc\.createElement\("time"\)/);
  assert.match(shell, /data-source-meta-client/);
  assert.match(shell, /js\/source-meta\.js/);
  assert.match(styles, /\.source-meta summary\s*\{[^}]*min-height:\s*2\.75rem/s);
});
