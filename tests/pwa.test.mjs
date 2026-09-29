import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function loadServiceWorker(overrides = {}) {
  const listeners = new Map();
  const self = {
    registration: { scope: "https://example.test/dnd/" },
    clients: { claim: async () => {} },
    addEventListener: (name, listener) => listeners.set(name, listener),
    skipWaiting: () => {},
  };
  const context = vm.createContext({
    Headers,
    Request,
    Response,
    Set,
    URL,
    caches: {
      delete: async () => true,
      keys: async () => [],
      match: async () => undefined,
      open: async () => ({
        addAll: async () => {},
        delete: async () => true,
        keys: async () => [],
        put: async () => {},
      }),
    },
    fetch,
    self,
    ...overrides,
  });
  const source = await readFile(resolve(root, "service-worker.js"), "utf8");
  vm.runInContext(source, context);
  return { api: self.DndPwaServiceWorker, listeners, source };
}

function pngDimensions(buffer) {
  assert.equal(buffer.toString("ascii", 1, 4), "PNG");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test("manifest describes an installable French standalone application", async () => {
  const manifest = JSON.parse(await readFile(resolve(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.lang, "fr");
  assert.equal(manifest.start_url, "./index.html");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#0d0c0a");
  assert.deepEqual(manifest.icons.map(({ sizes }) => sizes), ["192x192", "512x512"]);
  assert.ok(manifest.icons.every(({ purpose }) => purpose.includes("maskable")));
});

test("PWA icons have the declared PNG dimensions", async () => {
  for (const size of [192, 512]) {
    const buffer = await readFile(resolve(root, `assets/icons/pwa-${size}.png`));
    assert.deepEqual(pngDimensions(buffer), { width: size, height: size });
  }
});

test("every precached resource exists in the repository", async () => {
  const { api } = await loadServiceWorker();
  assert.equal(api.CACHE_VERSION, "dnd-companion-v32");
  assert.ok(api.CORE_ASSETS.length <= 44);
  assert.ok(api.CORE_ASSETS.includes("./js/dense-pages.js"));
  assert.ok(api.CORE_ASSETS.includes("./css/category-hubs.css"));
  assert.ok(api.CORE_ASSETS.includes("./data/search-index.json"));
  assert.ok(api.CORE_ASSETS.includes("./js/shell/mobile-navigation.js"));
  assert.ok(api.CORE_ASSETS.includes("./js/shell/personal-tools.js"));
  assert.ok(api.CORE_ASSETS.includes("./js/shell/sharing.js"));
  assert.ok(api.CORE_ASSETS.includes("./js/shell/session-controls.js"));
  assert.ok(api.CORE_ASSETS.includes("./js/shell/search-trigger.js"));
  assert.ok(api.CORE_ASSETS.includes("./js/shell/search-dialog.js"));
  assert.ok(!api.CORE_ASSETS.includes("./data/monsters_2024.json"));
  assert.ok(!api.CORE_ASSETS.includes("./data/magic-items.json"));
  assert.ok(!api.CORE_ASSETS.includes("./data/search-index-deep.json"));

  let totalBytes = 0;
  for (const asset of api.CORE_ASSETS) {
    assert.match(asset, /^\.\//);
    const assetPath = resolve(root, asset.slice(2));
    assert.equal(existsSync(assetPath), true, asset);
    totalBytes += (await stat(assetPath)).size;
  }
  assert.ok(totalBytes <= 1_500_000, `Précache trop lourd: ${totalBytes} octets`);
});

test("installation tolère l'absence d'une ressource secondaire", async () => {
  const entries = new Map();
  const cache = {
    put: async (request, response) => entries.set(request.url, response),
    keys: async () => [...entries.keys()].map((url) => new Request(url)),
    delete: async (request) => entries.delete(typeof request === "string" ? request : request.url),
  };
  const { listeners } = await loadServiceWorker({
    fetch: async (request) => {
      if (request.url.endsWith("/css/theme.css")) throw new TypeError("ressource indisponible");
      return new Response("ok", { status: 200 });
    },
    caches: {
      open: async () => cache,
      match: async () => undefined,
      keys: async () => [],
      delete: async () => true,
    },
  });

  let installation;
  listeners.get("install")({ waitUntil(promise) { installation = promise; } });
  await assert.doesNotReject(installation);
  assert.ok(entries.size > 0);
  assert.equal([...entries.keys()].some((url) => url.endsWith("/css/theme.css")), false);
});

test("activation purges caches from previous service worker versions", async () => {
  const deleted = [];
  const { listeners } = await loadServiceWorker({
    caches: {
      open: async () => ({ put: async () => {}, keys: async () => [], delete: async () => true }),
      match: async () => undefined,
      keys: async () => ["dnd-companion-v30-core", "dnd-companion-v31-core", "dnd-companion-v32-core", "other-cache"],
      delete: async (name) => { deleted.push(name); return true; },
    },
  });

  let activation;
  listeners.get("activate")({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ["dnd-companion-v30-core", "dnd-companion-v31-core"]);
});

test("service worker classifies scoped requests and supports GitHub Pages paths", async () => {
  const { api } = await loadServiceWorker();
  const request = (path, details = {}) => ({
    url: `https://example.test/dnd/${path}`,
    mode: details.mode ?? "same-origin",
    destination: details.destination ?? "",
    headers: new Headers(details.headers),
  });

  assert.equal(api.scopedUrl("./offline.html"), "https://example.test/dnd/offline.html");
  assert.equal(api.classifyRequest(request("spells.html", { mode: "navigate" })), "navigation");
  assert.equal(api.classifyRequest(request("data/spells_2024.json")), "data");
  assert.equal(api.classifyRequest(request("css/theme.css", { destination: "style" })), "asset");
  assert.equal(api.classifyRequest(request("img/race/elf.webp", { destination: "image" })), "image");
  assert.equal(api.classifyRequest({
    ...request(""),
    url: "https://fonts.example.test/font.woff2",
  }), "external");
});

test("offline navigation falls back to the dedicated page", async () => {
  const offlineResponse = new Response("<h1>Hors connexion</h1>", {
    headers: { "content-type": "text/html" },
  });
  const homeResponse = new Response("<h1>Accueil</h1>", {
    headers: { "content-type": "text/html" },
  });
  const { api } = await loadServiceWorker({
    fetch: async () => { throw new TypeError("offline"); },
    caches: {
      match: async (key) => {
        const url = typeof key === "string" ? key : key.url;
        if (url.endsWith("/offline.html")) return offlineResponse;
        if (url.endsWith("/index.html")) return homeResponse;
        return undefined;
      },
    },
  });

  const response = await api.networkFirstNavigation(
    new Request("https://example.test/dnd/page-inconnue.html", {
      headers: { accept: "text/html" },
    }),
  );
  assert.match(await response.text(), /Hors connexion/);
});

test("PWA client exposes an explicit, accessible update flow", async () => {
  const source = await readFile(resolve(root, "js/pwa-client.js"), "utf8");
  assert.match(source, /serviceWorker\.register/);
  assert.match(source, /registration\.waiting/);
  assert.match(source, /updatefound/);
  assert.match(source, /controllerchange/);
  assert.match(source, /SKIP_WAITING/);
  assert.match(source, /aria-live/);
  assert.match(source, /Mettre à jour/);
  assert.match(source, /Plus tard/);
  assert.match(source, /new URL\("\.\.\/", script/);
});

test("service worker does not depend on page storage", async () => {
  const { source } = await loadServiceWorker();
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});
