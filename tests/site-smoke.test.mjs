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
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json",
};

let server;
let baseUrl;

async function standaloneHtmlPages() {
  const directories = ["", "classes", "races", "html"];
  const pages = [];
  for (const directory of directories) {
    const entries = await readdir(resolve(root, directory), { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
      const page = directory ? `${directory}/${entry.name}` : entry.name;
      const source = await readFile(resolve(root, page), "utf8");
      if (/<html[\s>]/i.test(source) && /<body[\s>]/i.test(source)) pages.push(page);
    }
  }
  return pages.sort();
}

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
    "/css/theme.css",
    "/css/components.css",
    "/css/catalog.css",
    "/css/legacy-catalog.css",
    "/css/content-page.css",
    "/css/content-catalog.css",
    "/css/character-sheet-app.css",
    "/css/quickref-page.css",
    "/faerun.html#carte",
    "/html/characters.html",
    "/html/character.html?c=cleira",
    "/html/character-profile.html?c=cleira",
    "/js/characters-page.js",
    "/js/character-profile.js",
    "/js/feats-page.js",
    "/js/faerun-map.js",
    "/js/github-report.js",
    "/js/monsters-page.js",
    "/js/progressive-list.js",
    "/js/fetch-json.js",
    "/js/spell-filters.js",
    "/js/catalog-ui.js",
    "/js/legacy-catalog-ui.js",
    "/js/content-catalog.js",
    "/js/character-sheet-ui.js",
    "/js/spells-page.js",
    "/js/user-library.js",
    "/js/site-shell.js",
    "/js/pwa-client.js",
    "/js/source-meta.js",
    "/js/search-engine.js",
    "/service-worker.js",
    "/manifest.webmanifest",
    "/offline.html",
    "/data/source-metadata.json",
    "/assets/icons/pwa-192.png",
    "/assets/icons/pwa-512.png",
    "/assets/icons/site-icons.svg",
    "/assets/icons/site-emblem.svg",
    "/assets/decor/arcane-circle.svg",
    "/assets/decor/panel-corners.svg",
    "/assets/decor/header-lines.svg",
    "/assets/decor/section-divider.svg",
  ];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /(?:text\/(?:css|html|javascript)|application\/(?:json|manifest\+json)|image\/(?:png|svg\+xml))/, path);
  }
});

test("critical JSON data is available and valid", async () => {
  const spellsResponse = await fetch(`${baseUrl}/data/spells_2024.json`);
  const spells = await spellsResponse.json();
  assert.equal(spellsResponse.status, 200);
  assert.equal(spells.spells.length, 391);

  const monstersResponse = await fetch(`${baseUrl}/data/monsters_2024.json`);
  const monsters = await monstersResponse.json();
  assert.equal(monstersResponse.status, 200);
  assert.equal(monsters.monsters.length, 499);

  const featsResponse = await fetch(`${baseUrl}/data/feats_2024.json`);
  const feats = await featsResponse.json();
  assert.equal(featsResponse.status, 200);
  assert.equal(feats.feats.length, 75);

  const charactersResponse = await fetch(`${baseUrl}/data/characters/index.json`);
  const characters = await charactersResponse.json();
  assert.equal(charactersResponse.status, 200);
  assert.ok(characters.characters.length > 0);

  const searchResponse = await fetch(`${baseUrl}/data/search-index.json`);
  const search = await searchResponse.json();
  assert.equal(searchResponse.status, 200);
  assert.equal(search.count, search.entries.length);
  assert.ok(search.entries.length > 1000);

  const sourceMetadataResponse = await fetch(`${baseUrl}/data/source-metadata.json`);
  const sourceMetadata = await sourceMetadataResponse.json();
  assert.equal(sourceMetadataResponse.status, 200);
  assert.equal(sourceMetadata.schemaVersion, 1);
  assert.ok(sourceMetadata.entries.length >= 9);
});

test("optimized images are served with their expected format", async () => {
  const paths = [
    "/img/map/faerun-map.webp",
    "/img/race/aasimar.webp",
    "/img/characters/cleira-full.webp",
    "/img/enemies/Beast/Allosaurus.webp",
    "/img/enemies/Dragon/Adult%20Black%20Dragon.webp",
  ];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("content-type"), "image/webp", path);
    assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  }
});

test("the visual asset system is local, complete, and lightweight", async () => {
  const sprite = await readFile(resolve(root, "assets/icons/site-icons.svg"), "utf8");
  const emblem = await readFile(resolve(root, "assets/icons/site-emblem.svg"), "utf8");
  const city = await readFile(resolve(root, "assets/images/faerun-city.webp"));
  const ids = [...sprite.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const required = [
    "site-emblem", "quick-reference", "spells", "monsters", "character-sheet",
    "rules", "combat", "mastery", "glossary", "equipment", "classes", "species",
    "backgrounds", "feats", "history", "gods", "factions", "characters", "planes",
    "search", "theme-sun", "theme-moon", "session", "favorite-empty", "favorite-filled",
    "menu", "close", "chevron-down", "chevron-right",
  ];

  assert.equal(new Set(ids).size, ids.length, "sprite icon ids must be unique");
  for (const id of required) assert.ok(ids.includes(id), `missing sprite icon: ${id}`);
  assert.match(emblem, /viewBox="0 0 64 64"/);
  assert.ok(city.length < 300_000, "Faerûn illustration exceeds its transfer budget");
});

test("featured content pages expose shared illustrated HTML page features", async () => {
  const styles = await readFile(resolve(root, "css/content-page.css"), "utf8");
  const cases = [
    ["classes/index.html", "classes", "Classes", "Création de personnage"],
    ["rules-2024.html", "rules", "Règles du jeu", "Référence D&amp;D 2024"],
    ["faerun.html", "faerun", "Les Royaumes Oubliés", "Univers"],
  ];

  for (const [page, modifier, title, eyebrow] of cases) {
    const source = await readFile(resolve(root, page), "utf8");
    const feature = source.match(new RegExp(`<section class="page-feature page-feature--${modifier}"[\\s\\S]*?</section>`));
    assert.ok(feature, `${page}: missing shared page feature`);
    assert.match(feature[0], new RegExp(`<h1[^>]*>${title}</h1>`));
    assert.ok(feature[0].includes(eyebrow));
    assert.doesNotMatch(feature[0], /<img\b/i);
  }

  assert.match(styles, /page-feature--classes[\s\S]*classes-heroes\.webp/);
  assert.match(styles, /page-feature--rules[\s\S]*rules-game-table\.webp/);
  assert.match(styles, /page-feature--faerun[\s\S]*faerun-city\.webp/);
  for (const asset of ["classes-heroes.webp", "rules-game-table.webp", "faerun-city.webp"]) {
    assert.ok((await readFile(resolve(root, "assets/images", asset))).length > 0, `missing ${asset}`);
  }
});

test("critical pages do not reference missing local files", async () => {
  const pages = await standaloneHtmlPages();

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

test("every standalone page uses the shared visual shell", async () => {
  const pages = (await standaloneHtmlPages()).filter((page) => page !== "offline.html");
  assert.equal(pages.length, 52);

  for (const page of pages) {
    const source = await readFile(resolve(root, page), "utf8");
    const response = await fetch(`${baseUrl}/${page}`);
    assert.equal(response.status, 200, page);
    assert.match(source, /(?:\.\.\/|)css\/theme\.css/, page);
    assert.match(source, /(?:\.\.\/|)css\/components\.css/, page);
    assert.match(source, /(?:\.\.\/|)js\/user-library\.js/, page);
    assert.match(source, /(?:\.\.\/|)js\/site-shell\.js/, page);
    assert.ok(
      source.indexOf("js/user-library.js") < source.indexOf("js/site-shell.js"),
      `${page}: storage bootstrap must load before the shared shell`,
    );
    assert.match(source, /data-site-header data-active="[^"]+"/, page);
    if (/<body[^>]*\bcontent-page\b/i.test(source)) {
      assert.match(source, /(?:\.\.\/|)css\/content-page\.css/, page);
    }
  }
});

test("the shared content theme preserves print output", async () => {
  const source = await readFile(resolve(root, "css/content-page.css"), "utf8");
  assert.match(source, /@media print/);
  assert.match(source, /body\.content-page\s*\{[^}]*background:\s*#fff/s);
});

test("the standalone sheet keeps its implementation in external assets", async () => {
  const source = await readFile(resolve(root, "character-sheet-standalone.html"), "utf8");
  const script = await readFile(resolve(root, "js/character-sheet.js"), "utf8");
  const styles = await readFile(resolve(root, "css/character-sheet.css"), "utf8");

  assert.doesNotMatch(source, /<style[\s>]/i);
  assert.doesNotMatch(source, /<script>([\s\S]*?)<\/script>/i);
  assert.match(source, /href="css\/character-sheet\.css"/);
  assert.match(source, /src="js\/character-sheet\.js"\s+defer/);
  assert.ok(styles.length > 20_000);
  assert.doesNotThrow(() => new vm.Script(script));
});

test("pilot pages use the shared site shell", async () => {
  const pilotPages = [
    ["index.html", "home"],
    ["spells.html", "spells"],
    ["quickref.html", "quickref"],
    ["character-sheet-standalone.html", "sheet"],
  ];

  for (const [page, activePage] of pilotPages) {
    const source = await readFile(resolve(root, page), "utf8");
    assert.match(source, /href="css\/theme\.css"/);
    assert.match(source, /href="css\/components\.css"/);
    assert.match(source, /src="js\/user-library\.js"\s+defer/);
    assert.match(source, /src="js\/site-shell\.js"\s+defer/);
    assert.match(source, new RegExp(`data-site-header data-active="${activePage}"`));
    assert.match(source, /class="skip-link"/);
  }
});

test("the home dashboard exposes quick access and personal library regions", async () => {
  const source = await readFile(resolve(root, "index.html"), "utf8");
  const styles = await readFile(resolve(root, "css/home.css"), "utf8");
  const shell = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  const library = await readFile(resolve(root, "js/user-library.js"), "utf8");
  assert.equal([...source.matchAll(/class="quick-access-card\s/g)].length, 4);
  assert.match(source, /class="home-intro-grid"[\s\S]*class="home-hero"[\s\S]*class="home-quick-access"/);
  for (const icon of ["quick-reference", "spells", "monsters", "character-sheet"]) {
    assert.match(source, new RegExp(`site-icons\\.svg#${icon}`));
  }
  assert.equal([...source.matchAll(/quick-access-card__action[\s\S]{0,180}site-icons\.svg#chevron-right/g)].length, 4);
  assert.doesNotMatch(source, /quick-access-card__action[\s\S]{0,160}#chevron-down/);
  assert.equal([...source.matchAll(/class="dashboard-feature dashboard-feature--/g)].length, 3);
  for (const feature of ["rules", "classes", "universe"]) {
    assert.match(source, new RegExp(`dashboard-feature--${feature}`));
  }
  for (const asset of ["rules-game-table.webp", "classes-heroes.webp", "faerun-city.webp"]) {
    assert.match(styles, new RegExp(asset.replace(".", "\\.")));
  }
  for (const card of source.matchAll(/<article class="quick-access-card[\s\S]*?<\/article>/g)) {
    assert.match(card[0], /<\/a>\s*<button data-favorite-button>/);
  }
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*favorite-button:not\(\[aria-pressed="true"\]\)/);
  assert.match(styles, /quick-access-card:focus-within > \.favorite-button/);
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 420px\)[\s\S]*grid-template-columns: 1fr/);
  assert.match(library, /setAttribute\("aria-pressed"/);
  assert.match(shell, /createIcon\("site-emblem"\)/);
  assert.doesNotMatch(shell, /markText|textContent\s*=\s*"D20"/);
  assert.doesNotMatch(source + shell + library, /[◈✦♜✎⚔☼♞◉▧✧⬡▱⚑♙⊛☆★☾☰⌕×›◆⚡]/);
  assert.ok([...source.matchAll(/data-library-item/g)].length >= 15);
  assert.match(source, /data-recent-list/);
  assert.match(source, /data-favorites-list/);
  assert.match(source, /data-open-site-search/);
});

test("the spells catalog exposes persistent filters and its mobile drawer", async () => {
  const source = await readFile(resolve(root, "spells.html"), "utf8");
  assert.match(source, /href="css\/catalog\.css"/);
  assert.match(source, /data-page-search/);
  assert.match(source, /id="activeFilters"/);
  assert.match(source, /id="schoolSelect"/);
  assert.match(source, /id="filterPanel"/);
  assert.match(source, /id="openFiltersBtn"/);
  assert.match(source, /src="js\/catalog-ui\.js"/);
  assert.match(source, /src="js\/progressive-list\.js"\s+defer/);
  assert.match(source, /id="loadMoreBtn"/);
});

test("the quick reference exposes search, category shortcuts, and a detail drawer", async () => {
  const source = await readFile(resolve(root, "quickref.html"), "utf8");
  assert.match(source, /id="quickref-search"[^>]*data-page-search/);
  assert.match(source, /class="quickref-category-nav"/);
  assert.match(source, /id="quickref-detail-panel"[^>]*role="dialog"/);
  assert.match(source, /id="quickref-detail-backdrop"/);
  assert.match(source, /src="js\/catalog-ui\.js"/);
  assert.doesNotMatch(source, /id="modal"/);
});

test("the shared shell exposes indexed search and persistent session mode", async () => {
  const source = await readFile(resolve(root, "js/site-shell.js"), "utf8");
  assert.match(source, /dnd2024_session_mode/);
  assert.match(source, /data\/search-index\.json/);
  assert.match(source, /sessionButton\.setAttribute\("aria-pressed"/);
  assert.match(source, /function ensureSkipLink/);
  assert.match(source, /aria-autocomplete/);
  assert.match(source, /results\.setAttribute\("role", "listbox"\)/);
  assert.match(source, /drawer\.setAttribute\("aria-modal", "true"\)/);
  assert.match(source, /function createSessionPanel/);
  assert.match(source, /sessionPanel\.panel\.setAttribute\("aria-hidden"/);
  assert.match(source, /sessionPanel\.panel\.setAttribute\("inert"/);
  assert.match(source, /session-panel__quick-actions/);
  assert.match(source, /window\.DndLibrary\.clearRecent/);
  assert.match(source, /function copyCurrentLink/);
  assert.match(source, /window\.DndShare = Object\.freeze/);
  assert.match(source, /js\/context-share\.js/);
  assert.match(source, /function shareCurrentPage/);
  assert.match(source, /navigator\.share/);
  assert.match(source, /js\/github-report\.js/);
  assert.match(source, /function enhanceDeepLinks/);
  assert.match(source, /window\.addEventListener\("hashchange", revealHashTarget\)/);
  assert.match(source, /details\.contains\(target\)/);
  for (const path of ["quickref.html", "spells.html", "monstres.html", "combat-2024.html"]) {
    assert.match(source, new RegExp(path.replace(".", "\\.")), path);
  }
});

test("the monsters and feats catalogs use the consolidated catalog shell", async () => {
  const catalogs = [
    ["monstres.html", "monsters"],
    ["dons.html", "feats"],
  ];

  for (const [page, activePage] of catalogs) {
    const source = await readFile(resolve(root, page), "utf8");
    assert.doesNotMatch(source, /<style[\s>]/i);
    assert.match(source, /class="legacy-catalog-page"/);
    assert.match(source, /href="css\/theme\.css"/);
    assert.match(source, /href="css\/components\.css"/);
    assert.match(source, /href="css\/legacy-catalog\.css"/);
    assert.match(source, /src="js\/catalog-ui\.js"\s+defer/);
    assert.match(source, /src="js\/legacy-catalog-ui\.js"\s+defer/);
    assert.match(source, new RegExp(`data-site-header data-active="${activePage}"`));
    assert.match(source, /data-page-search/);
    assert.match(source, /aria-live="polite"/);
    assert.match(source, /rel="preload" href="data\/(?:monsters|feats)_2024\.json"/);
  }
});

test("catalog details expose stable deep-link parameters and history restoration", async () => {
  const scripts = {
    "js/spells-page.js": "spell",
    "js/monsters-page.js": "monster",
    "js/feats-page.js": "feat",
  };
  for (const [path, parameter] of Object.entries(scripts)) {
    const source = await readFile(resolve(root, path), "utf8");
    assert.match(source, new RegExp(`readSelection\\("${parameter}"\\)`), path);
    assert.match(source, new RegExp(`updateSelection\\("${parameter}"`), path);
    assert.match(source, /data-content-id/, path);
    assert.match(source, /addEventListener\("popstate"/, path);
  }

  const quickref = await readFile(resolve(root, "js/quickref.js"), "utf8");
  for (const parameter of ["movement", "action", "bonus", "reaction", "condition", "environment"]) {
    assert.match(quickref, new RegExp(`"${parameter}"`), parameter);
  }
  assert.match(quickref, /updateSelection\(record\.parameter, record\.slug/);
  assert.match(quickref, /addEventListener\("popstate", restoreFromUrl\)/);
});

test("the remaining content catalogs expose the shared filtering experience", async () => {
  const catalogs = [
    ["classes/index.html", "classes", "../"],
    ["races/index.html", "species", "../"],
    ["armes-armures.html", "equipment", ""],
    ["historique.html", "backgrounds", ""],
  ];

  for (const [page, kind, prefix] of catalogs) {
    const source = await readFile(resolve(root, page), "utf8");
    assert.match(source, new RegExp(`data-catalog-kind="${kind}"`));
    assert.match(source, new RegExp(`href="${prefix.replace("../", "\\.\\.\\/")}css/content-catalog\\.css"`));
    assert.match(source, new RegExp(`src="${prefix.replace("../", "\\.\\.\\/")}js/catalog-ui\\.js"\\s+defer`));
    assert.match(source, new RegExp(`src="${prefix.replace("../", "\\.\\.\\/")}js/content-catalog\\.js"\\s+defer`));
  }
});

test("the standalone sheet exposes critical values and compact page navigation", async () => {
  const source = await readFile(resolve(root, "character-sheet-standalone.html"), "utf8");
  assert.match(source, /href="css\/character-sheet\.css"/);
  assert.match(source, /href="css\/character-sheet-app\.css"/);
  assert.match(source, /src="js\/character-sheet\.js"\s+defer/);
  assert.match(source, /src="js\/character-sheet-ui\.js"\s+defer/);
  assert.match(source, /id="previousPageBtn"/);
  assert.match(source, /id="nextPageBtn"/);
  assert.ok([...source.matchAll(/data-mirror-field=/g)].length >= 8);
});
