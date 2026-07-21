import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const contentTypes = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
};

let server;
let baseUrl;

test.before(async () => {
  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
      const filePath = resolve(root, relativePath);

      if (!filePath.startsWith(`${root}${sep}`)) {
        response.writeHead(403).end();
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose());
  });
});

test("critical pages and modules are served over HTTP", async () => {
  const paths = [
    "/",
    "/quickref.html",
    "/spells.html",
    "/dons.html",
    "/monstres.html",
    "/races/index.html",
    "/classes/index.html",
    "/css/races.css",
    "/css/classes.css",
    "/faerun.html#carte",
    "/html/characters.html",
    "/html/character.html?c=cleira",
    "/html/character-profile.html?c=cleira",
    "/js/characters-page.js",
    "/js/character-profile.js",
    "/js/feats-page.js",
    "/js/faerun-map.js",
    "/js/monsters-page.js",
    "/js/fetch-json.js",
    "/js/spell-filters.js",
    "/js/spells-page.js",
  ];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /text\/(css|html|javascript)/, path);
  }
});

test("critical JSON data is available and valid", async () => {
  const spellsResponse = await fetch(`${baseUrl}/data/spells_2024.json`);
  const spells = await spellsResponse.json();
  assert.equal(spellsResponse.status, 200);
  assert.equal(spells.spells.length, 391);

  const charactersResponse = await fetch(`${baseUrl}/data/characters/index.json`);
  const characters = await charactersResponse.json();
  assert.equal(charactersResponse.status, 200);
  assert.ok(characters.characters.length > 0);
});

test("optimized images are served with their expected format", async () => {
  const paths = [
    "/img/map/faerun-map.webp",
    "/img/race/aasimar.webp",
    "/img/characters/cleira-full.webp",
  ];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("content-type"), "image/webp", path);
    assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  }
});

test("critical pages do not reference missing local files", async () => {
  const racePages = (await readdir(resolve(root, "races")))
    .filter((name) => name.startsWith("race-") && name.endsWith(".html"))
    .map((name) => `races/${name}`);
  const classPages = (await readdir(resolve(root, "classes")))
    .filter((name) => name.startsWith("class-") && name.endsWith(".html"))
    .map((name) => `classes/${name}`);
  const pages = [
    "index.html",
    "quickref.html",
    "spells.html",
    "dons.html",
    "monstres.html",
    "faerun.html",
    "races/index.html",
    "html/characters.html",
    "html/character.html",
    "html/character-profile.html",
    ...racePages,
    ...classPages,
  ];

  for (const page of pages) {
    const source = await readFile(resolve(root, page), "utf8");
    const references = [
      ...source.matchAll(/(?:href|src|srcset)="([^"]+)"/g),
      ...source.matchAll(/\bfrom\s+"([^"]+)"/g),
    ].map((match) => match[1]);

    for (const reference of references) {
      if (!reference || /^(?:#|data:|https?:|mailto:)/.test(reference) || reference.includes("${")) continue;
      const cleanPath = reference.split(/[?#]/, 1)[0];
      if (!cleanPath) continue;
      const target = cleanPath.startsWith("/")
        ? resolve(root, cleanPath.slice(1))
        : resolve(root, dirname(page), cleanPath);
      assert.equal(existsSync(target), true, `${page} -> ${reference}`);
    }
  }
});

test("the standalone sheet keeps valid inline JavaScript", async () => {
  const source = await readFile(resolve(root, "character-sheet-standalone.html"), "utf8");
  const scripts = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((script) => script.trim());

  assert.ok(scripts.length > 0);
  for (const script of scripts) {
    assert.doesNotThrow(() => new vm.Script(script));
  }
});
