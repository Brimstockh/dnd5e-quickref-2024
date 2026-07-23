import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function standalonePages() {
  const directories = ["", "classes", "races", "html"];
  const pages = [];
  for (const directory of directories) {
    const entries = await readdir(resolve(root, directory), { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
      const relativePath = directory ? `${directory}/${entry.name}` : entry.name;
      const source = await readFile(resolve(root, relativePath), "utf8");
      if (/<html[\s>]/i.test(source) && /<body[\s>]/i.test(source)) pages.push([relativePath, source]);
    }
  }
  return pages;
}

test("standalone pages expose essential document accessibility metadata", async () => {
  const pages = await standalonePages();
  assert.ok(pages.length >= 40, "the audit must cover the complete site");

  for (const [page, source] of pages) {
    assert.match(source, /<html[^>]*\blang=["']fr["']/i, `${page}: missing French language`);
    assert.match(source, /<meta[^>]*\bname=["']viewport["']/i, `${page}: missing viewport metadata`);
    assert.match(source, /<h1[\s>]/i, `${page}: missing primary heading`);
    assert.doesNotMatch(source, /\btabindex=["'][1-9]\d*["']/i, `${page}: positive tabindex disrupts keyboard order`);

    const ids = [...source.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page}: duplicate id`);

    for (const image of source.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(image[0], /\balt=["'][^"']*["']/i, `${page}: image missing alt attribute`);
    }
  }
});

test("the shared shell supplies keyboard and form accessibility fallbacks", async () => {
  const source = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  assert.match(source, /function enhanceFormAccessibility\(\)/);
  assert.match(source, /main\.setAttribute\("tabindex", "-1"\)/);
  assert.match(source, /main\.focus\(\)/);
  assert.match(source, /setAttribute\("inert", ""\)/);
});

test("motion, contrast and forced-colors preferences are supported", async () => {
  const source = await readFile(resolve(root, "css/theme.css"), "utf8");
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(source, /@media \(prefers-contrast: more\)/);
  assert.match(source, /@media \(forced-colors: active\)/);
});

test("legacy content surfaces inherit the shared dark theme", async () => {
  const contentTheme = await readFile(resolve(root, "css/content-page.css"), "utf8");
  const sheetTheme = await readFile(resolve(root, "css/character-sheet-app.css"), "utf8");

  for (const selector of [".encadre", ".toc a", ".timeline-item", ".kv-item", ".trow", ".domain"]) {
    assert.ok(contentTheme.includes(selector), `missing legacy theme override for ${selector}`);
  }
  assert.match(contentTheme, /\.content :is\(h1, h3\)/);
  assert.match(sheetTheme, /\.level-card/);
});

test("the quick-links editor behaves as an accessible modal", async () => {
  const source = await readFile(resolve(root, "js/quicklinks.js"), "utf8");
  assert.match(source, /setAttribute\("role", "dialog"\)/);
  assert.match(source, /setAttribute\("aria-modal", "true"\)/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /previousFocus\.focus\(\)/);
  assert.doesNotMatch(source, /\balert\(/);
});

test("home quick-access favorites remain independently keyboard accessible", async () => {
  const source = await readFile(resolve(root, "index.html"), "utf8");
  const styles = await readFile(resolve(root, "css/home.css"), "utf8");
  const library = await readFile(resolve(root, "js/user-library.js"), "utf8");

  const cards = [...source.matchAll(/<article class="quick-access-card[\s\S]*?<\/article>/g)];
  assert.equal(cards.length, 4);
  for (const card of cards) {
    assert.match(card[0], /<\/a>\s*<button data-favorite-button>/);
    assert.doesNotMatch(card[0], /<a[^>]*>[\s\S]*<button data-favorite-button>[\s\S]*<\/a>/);
    assert.match(card[0], /aria-hidden="true"/);
  }

  assert.match(library, /setAttribute\("aria-pressed", String\(active\)\)/);
  assert.match(library, /setAttribute\("aria-label", active \?/);
  assert.match(styles, /quick-access-card:focus-within > \.favorite-button/);
  assert.match(styles, /quick-access-card > \.favorite-button:focus-visible/);
});

test("creation tools expose keyboard focus, live status, and an accessible comparison table", async () => {
  const wizardHtml = await readFile(resolve(root, "assistant-creation.html"), "utf8");
  const wizardScript = await readFile(resolve(root, "js/creation-wizard.js"), "utf8");
  const comparatorHtml = await readFile(resolve(root, "comparateur.html"), "utf8");
  const comparatorScript = await readFile(resolve(root, "js/comparator.js"), "utf8");

  assert.match(wizardHtml, /id="wizardStatus" role="status" aria-live="polite"/);
  assert.match(wizardScript, /heading\.tabIndex = -1/);
  assert.match(wizardScript, /heading\.focus\(\)/);
  assert.match(comparatorHtml, /role="region" aria-label="Tableau comparatif défilable"/);
  assert.match(comparatorHtml, /aria-describedby="compareStatus"/);
  assert.match(comparatorScript, /document\.createElement\("caption"\)/);
  assert.match(comparatorScript, /cell\.scope = "col"/);
});
