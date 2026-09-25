import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("pilot catalogues expose the shared visual system contracts", async () => {
  const [theme, components, catalog, legacyCatalog, contentCatalog, spells, monsters, classes] = await Promise.all([
    readFile(resolve(root, "css/theme.css"), "utf8"),
    readFile(resolve(root, "css/components.css"), "utf8"),
    readFile(resolve(root, "css/catalog.css"), "utf8"),
    readFile(resolve(root, "css/legacy-catalog.css"), "utf8"),
    readFile(resolve(root, "css/content-catalog.css"), "utf8"),
    readFile(resolve(root, "spells.html"), "utf8"),
    readFile(resolve(root, "monstres.html"), "utf8"),
    readFile(resolve(root, "classes/index.html"), "utf8"),
  ]);

  assert.match(theme, /--text-xs:/);
  assert.match(theme, /:focus-visible\s*\{[\s\S]*outline: 3px solid var\(--color-focus\)/);
  assert.match(theme, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(components, /\.meta-chip,/);
  assert.match(components, /\.button-primary,/);
  assert.match(catalog, /\.catalog-card\[open\]/);
  assert.match(legacyCatalog, /\.monster-meta__secondary/);
  assert.match(contentCatalog, /\.content-catalog \{ --section-accent: var\(--section-creation\); \}/);
  assert.match(spells, /catalog-toolbar/);
  assert.match(monsters, /legacy-catalog\.css/);
  assert.match(classes, /content-catalog\.css/);
});
