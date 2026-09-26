import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("pilot catalogues expose the shared visual system contracts", async () => {
  const [theme, components, catalog, legacyCatalog, contentCatalog, contentPage, contentCatalogScript, hubs, spells, monsters, classes, icons] = await Promise.all([
    readFile(resolve(root, "css/theme.css"), "utf8"),
    readFile(resolve(root, "css/components.css"), "utf8"),
    readFile(resolve(root, "css/catalog.css"), "utf8"),
    readFile(resolve(root, "css/legacy-catalog.css"), "utf8"),
    readFile(resolve(root, "css/content-catalog.css"), "utf8"),
    readFile(resolve(root, "css/content-page.css"), "utf8"),
    readFile(resolve(root, "js/content-catalog.js"), "utf8"),
    readFile(resolve(root, "css/category-hubs.css"), "utf8"),
    readFile(resolve(root, "spells.html"), "utf8"),
    readFile(resolve(root, "monstres.html"), "utf8"),
    readFile(resolve(root, "classes/index.html"), "utf8"),
    readFile(resolve(root, "assets/icons/site-icons.svg"), "utf8"),
  ]);

  assert.match(theme, /--text-xs:/);
  assert.match(theme, /:focus-visible\s*\{[\s\S]*outline: 3px solid var\(--color-focus\)/);
  assert.match(theme, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(components, /\.meta-chip,/);
  assert.match(components, /\.button-primary,/);
  assert.match(components, /\.card--interactive/);
  assert.doesNotMatch(components, /\.card:hover\s*\{/);
  assert.match(catalog, /\.catalog-card\[open\]/);
  assert.match(catalog, /badge--accent/);
  assert.match(legacyCatalog, /\.monster-meta__secondary/);
  assert.match(legacyCatalog, /\.monster-card:has\(details\[open\]\)/);
  assert.match(contentCatalog, /\.content-catalog \{ --section-accent: var\(--section-creation\); \}/);
  assert.match(contentCatalog, /\.content-catalog-entry\[open\]/);
  assert.match(contentCatalog, /content-catalog-equipment-tables/);
  assert.match(contentCatalog, /\.content-catalog-equipment-section \.table-scroll/);
  assert.match(contentCatalogScript, /mode: "table"/);
  assert.match(contentCatalogScript, /item\.element\.hidden = !visible\.includes\(item\)/);
  assert.match(contentCatalogScript, /group\.element\.hidden = !group\.items\.some/);
  assert.match(contentCatalogScript, /content\.insertBefore\(container, firstPropertyHeading\)/);
  assert.doesNotMatch(contentCatalogScript, /wrapper\.hidden\s*=\s*true/);
  assert.match(contentPage, /\.content-page :is\(\.rules-content, \.combat-content, \.mastery-content\)/);
  assert.match(contentPage, /combat-formula/);
  assert.doesNotMatch(contentPage, /:is\(\.rule-box, \.tool-card,[^)]*\):hover/);
  assert.match(hubs, /category-hub__group/);
  assert.match(hubs, /var\(--section-accent\)/);
  assert.match(hubs, /data-category-hub="table"/);
  assert.match(spells, /catalog-toolbar/);
  assert.match(monsters, /legacy-catalog\.css/);
  assert.match(classes, /content-catalog\.css/);

  const [equipment, magicItems] = await Promise.all([
    readFile(resolve(root, "armes-armures.html"), "utf8"),
    readFile(resolve(root, "objets-magiques.html"), "utf8"),
  ]);
  assert.match(equipment, /table class="equipment-table"/);
  assert.doesNotMatch(equipment, /<style[\s>]/i);
  assert.match(magicItems, /site-icons\.svg#magic-item/);
  assert.match(icons, /<symbol id="magic-item"/);
});
