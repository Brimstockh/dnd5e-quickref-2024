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

test("the quick-links editor behaves as an accessible modal", async () => {
  const source = await readFile(resolve(root, "js/quicklinks.js"), "utf8");
  assert.match(source, /setAttribute\("role", "dialog"\)/);
  assert.match(source, /setAttribute\("aria-modal", "true"\)/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /previousFocus\.focus\(\)/);
  assert.doesNotMatch(source, /\balert\(/);
});
