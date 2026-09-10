import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("editorial pages expose bounded rich-text glossary scopes", async () => {
  const paths = [
    "creation-personnage-2024.html",
    "historique.html",
    "armes-armures.html",
    "classes/class-barbarian.html",
    "classes/class-wizard.html",
    "races/race-aasimar.html",
    "races/race-human.html",
  ];
  for (const path of paths) {
    assert.match(await readFile(resolve(root, path), "utf8"), /data-glossary-richtext/, path);
  }
});

test("dynamic catalog renderers mark their user-authored text", async () => {
  for (const path of ["js/magic-items-page.js", "js/campaign-rules-page.js"]) {
    assert.match(await readFile(resolve(root, path), "utf8"), /data-glossary-richtext/, path);
  }
});
