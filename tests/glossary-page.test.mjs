import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("glossary browser renders canonical relation targets", async () => {
  const source = await readFile(resolve(root, "js/glossary-page.js"), "utf8");
  assert.match(source, /content-relations\.json/);
  assert.match(source, /relationIndex\.targets/);
  assert.match(source, /Référence rapide :/);
  assert.match(source, /target\.url/);
});
