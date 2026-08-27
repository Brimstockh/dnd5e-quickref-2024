"use strict";

const CACHE_VERSION = "dnd-companion-v11";
const CACHE_PREFIX = "dnd-companion-";
const CACHE_NAMES = Object.freeze({
    core: `${CACHE_VERSION}-core`,
    pages: `${CACHE_VERSION}-pages`,
    data: `${CACHE_VERSION}-data`,
    assets: `${CACHE_VERSION}-assets`,
    images: `${CACHE_VERSION}-images`,
});
const MAX_RUNTIME_IMAGES = 60;
const SCOPE_URL = new URL(self.registration.scope);

const CORE_ASSETS = Object.freeze([
    "./index.html",
    "./assistant-creation.html",
    "./comparateur.html",
    "./dice-stats.html",
    "./espace-personnel.html",
    "./offline.html",
    "./manifest.webmanifest",
    "./armes-armures.html",
    "./character-sheet-standalone.html",
    "./character-template.html",
    "./character-template-v2.html",
    "./combat-2024.html",
    "./creation-personnage-2024.html",
    "./divinites.html",
    "./dons.html",
    "./faerun.html",
    "./glossaire.html",
    "./groupes-royaumes.html",
    "./histoire-royaumes.html",
    "./historique.html",
    "./mastery-2024.html",
    "./monstres.html",
    "./outils-aventurier.html",
    "./personnages-royaumes.html",
    "./plans-existence.html",
    "./quickref.html",
    "./rules-2024.html",
    "./spells.html",
    "./classes/index.html",
    "./classes/class-barbarian.html",
    "./classes/class-bard.html",
    "./classes/class-cleric.html",
    "./classes/class-druid.html",
    "./classes/class-fighter.html",
    "./classes/class-monk.html",
    "./classes/class-paladin.html",
    "./classes/class-rodeur.html",
    "./classes/class-rogue.html",
    "./classes/class-sorcerer.html",
    "./classes/class-warlock.html",
    "./classes/class-wizard.html",
    "./races/index.html",
    "./races/race-aasimar.html",
    "./races/race-drakeide.html",
    "./races/race-dwarf.html",
    "./races/race-elfe.html",
    "./races/race-gnome.html",
    "./races/race-goliath.html",
    "./races/race-halfelin.html",
    "./races/race-human.html",
    "./races/race-orc.html",
    "./races/race-tieffelin.html",
    "./html/character.html",
    "./html/character-profile.html",
    "./html/characters.html",
    "./css/catalog.css",
    "./css/character.css",
    "./css/character-sheet.css",
    "./css/character-sheet-app.css",
    "./css/classes.css",
    "./css/components.css",
    "./css/content-catalog.css",
    "./css/content-page.css",
    "./css/home.css",
    "./css/icons.css",
    "./css/legacy-catalog.css",
    "./css/quicklinks.css",
    "./css/quickref.css",
    "./css/quickref-page.css",
    "./css/personal-space.css",
    "./css/session-tools.css",
    "./css/creator-tools.css",
    "./css/dice-stats.css",
    "./css/races.css",
    "./css/theme.css",
    "./js/catalog-ui.js",
    "./js/character.js",
    "./js/character-key.js",
    "./js/character-profile.js",
    "./js/character-sheet.js",
    "./js/character-sheet-ui.js",
    "./js/characters-page.js",
    "./js/content-catalog.js",
    "./js/content-ids.js",
    "./js/context-share.js",
    "./js/comparator.js",
    "./js/dice-stats.js",
    "./js/creation-state.js",
    "./js/creation-wizard.js",
    "./js/encounter-budget.js",
    "./js/data_action.js",
    "./js/data_bonusaction.js",
    "./js/data_condition.js",
    "./js/data_environment.js",
    "./js/data_movement.js",
    "./js/data_reaction.js",
    "./js/faerun-map.js",
    "./js/feats-page.js",
    "./js/fetch-json.js",
    "./js/github-report.js",
    "./js/glossary-client.js",
    "./js/glossary-page.js",
    "./js/html-utils.js",
    "./js/legacy-catalog-ui.js",
    "./js/monsters-page.js",
    "./js/monster-export.js",
    "./js/picture-source.js",
    "./js/personal-space.js",
    "./js/session-state.js",
    "./js/session-tools.js",
    "./js/progressive-list.js",
    "./js/pwa-client.js",
    "./js/source-meta.js",
    "./js/quicklinks.js",
    "./js/quickref.js",
    "./js/related-content.js",
    "./js/rich-html.js",
    "./js/search-engine.js",
    "./js/site-shell.js",
    "./js/spell-export.js",
    "./js/spell-filters.js",
    "./js/spells-page.js",
    "./js/user-library.js",
    "./data/feats_2024.json",
    "./data/character-creation.json",
    "./data/content-inventory.json",
    "./data/local-storage-contracts.json",
    "./data/monsters_2024.json",
    "./data/content-relations.json",
    "./data/glossary.json",
    "./data/search-index.json",
    "./data/source-metadata.json",
    "./data/spells_2024.json",
    "./data/characters/index.json",
    "./data/characters/character-template.json",
    "./data/characters/character-template.story.json",
    "./assets/decor/arcane-circle.svg",
    "./assets/decor/header-lines.svg",
    "./assets/decor/panel-corners.svg",
    "./assets/decor/section-divider.svg",
    "./assets/icons/pwa-192.png",
    "./assets/icons/pwa-512.png",
    "./assets/icons/site-emblem.svg",
    "./assets/icons/site-icons.svg",
    "./assets/images/classes-heroes.webp",
    "./assets/images/faerun-city.webp",
    "./assets/images/rules-game-table.webp",
    "./img/class-icons/barbarian.svg",
    "./img/class-icons/bard.svg",
    "./img/class-icons/cleric.svg",
    "./img/class-icons/druid.svg",
    "./img/class-icons/fighter.svg",
    "./img/class-icons/monk.svg",
    "./img/class-icons/paladin.svg",
    "./img/class-icons/ranger.svg",
    "./img/class-icons/rogue.svg",
    "./img/class-icons/sorcerer.svg",
    "./img/class-icons/warlock.svg",
    "./img/class-icons/wizard.svg",
    "./img/race/aasimar.webp",
    "./img/race/drakeide.webp",
    "./img/race/dwarf.webp",
    "./img/race/elf.webp",
    "./img/race/gnome.webp",
    "./img/race/goliath.webp",
    "./img/race/halfling.webp",
    "./img/race/human.webp",
    "./img/race/orc.webp",
    "./img/race/tiefling.webp",
]);

function scopedUrl(path) {
    return new URL(path, SCOPE_URL).href;
}

function canonicalRequest(request) {
    const url = new URL(request.url);
    url.search = "";
    url.hash = "";
    return new Request(url.href);
}

function classifyRequest(request) {
    const url = new URL(request.url);
    if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return "external";
    if (request.mode === "navigate" || request.headers?.get?.("accept")?.includes("text/html")) return "navigation";
    if (url.pathname.endsWith(".json")) return "data";
    if (request.destination === "image" || /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)) return "image";
    if (
        request.destination === "script"
        || request.destination === "style"
        || request.destination === "font"
        || /\.(?:css|js|woff2?)$/i.test(url.pathname)
    ) return "asset";
    return "other";
}

async function putInCache(cacheName, request, response) {
    if (!response || !response.ok) return;
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
}

async function networkFirstNavigation(request) {
    const key = canonicalRequest(request);
    try {
        const response = await fetch(request);
        await putInCache(CACHE_NAMES.pages, key, response.clone());
        return response;
    } catch {
        const cachedPage = await caches.match(key);
        if (cachedPage) return cachedPage;
        if (new URL(request.url).pathname === SCOPE_URL.pathname) {
            const cachedHome = await caches.match(scopedUrl("./index.html"));
            if (cachedHome) return cachedHome;
        }
        return caches.match(scopedUrl("./offline.html"));
    }
}

async function staleWhileRevalidate(request, cacheName, event) {
    const cached = await caches.match(request);
    const update = fetch(request)
        .then(async (response) => {
            await putInCache(cacheName, request, response.clone());
            return response;
        })
        .catch(() => null);
    if (cached) {
        event.waitUntil(update);
        return cached;
    }
    return (await update) || Response.error();
}

async function trimCache(cacheName, maximumEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - maximumEntries)).map((key) => cache.delete(key)));
}

async function cacheFirstImage(request, event) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            event.waitUntil((async () => {
                await putInCache(CACHE_NAMES.images, request, response.clone());
                await trimCache(CACHE_NAMES.images, MAX_RUNTIME_IMAGES);
            })());
        }
        return response;
    } catch {
        return Response.error();
    }
}

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAMES.core);
        const requests = CORE_ASSETS.map((path) => new Request(scopedUrl(path), { cache: "reload" }));
        await cache.addAll(requests);
    })());
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const currentCaches = new Set(Object.values(CACHE_NAMES));
        const existingCaches = await caches.keys();
        await Promise.all(existingCaches
            .filter((name) => name.startsWith(CACHE_PREFIX) && !currentCaches.has(name))
            .map((name) => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET" || request.headers.has("range")) return;
    const requestType = classifyRequest(request);
    if (requestType === "external" || requestType === "other") return;

    if (requestType === "navigation") {
        event.respondWith(networkFirstNavigation(request));
    } else if (requestType === "data") {
        event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.data, event));
    } else if (requestType === "image") {
        event.respondWith(cacheFirstImage(request, event));
    } else {
        event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.assets, event));
    }
});

self.DndPwaServiceWorker = Object.freeze({
    CACHE_VERSION,
    CACHE_NAMES,
    CORE_ASSETS,
    classifyRequest,
    networkFirstNavigation,
    scopedUrl,
});
