"use strict";

const CACHE_VERSION = "dnd-companion-v32";
const CACHE_PREFIX = "dnd-companion-";
const CACHE_NAMES = Object.freeze({
    core: `${CACHE_VERSION}-core`,
    pages: `${CACHE_VERSION}-pages`,
    data: `${CACHE_VERSION}-data`,
    assets: `${CACHE_VERSION}-assets`,
    images: `${CACHE_VERSION}-images`,
});
const MAX_RUNTIME_IMAGES = 60;
const MAX_RUNTIME_PAGES = 40;
const MAX_RUNTIME_DATA = 30;
const MAX_RUNTIME_ASSETS = 80;
const SCOPE_URL = new URL(self.registration.scope);

const CORE_ASSETS = Object.freeze([
    "./index.html",
    "./regles.html",
    "./compendium.html",
    "./creation.html",
    "./univers.html",
    "./ma-table.html",
    "./offline.html",
    "./manifest.webmanifest",
    "./sw.js",
    "./service-worker.js",
    "./css/components.css",
    "./css/home.css",
    "./css/category-hubs.css",
    "./css/icons.css",
    "./css/theme.css",
    "./js/dense-pages.js",
    "./js/github-report.js",
    "./js/glossary-client.js",
    "./js/pwa-client.js",
    "./js/search-engine.js",
    "./js/site-navigation.js",
    "./js/site-shell.js",
    "./js/shell/keyboard-shortcuts.js",
    "./js/shell/mobile-navigation.js",
    "./js/shell/personal-tools.js",
    "./js/shell/sharing.js",
    "./js/shell/session-controls.js",
    "./js/shell/search-trigger.js",
    "./js/shell/search-dialog.js",
    "./js/shell/theme.js",
    "./js/source-meta.js",
    "./js/user-library.js",
    "./data/search-index.json",
    "./data/source-metadata.json",
    "./assets/icons/pwa-192.png",
    "./assets/icons/pwa-512.png",
    "./assets/icons/site-emblem.svg",
    "./assets/icons/site-icons.svg",
    "./assets/images/classes-heroes.webp",
    "./assets/images/compendium-library.webp",
    "./assets/images/creation-hero.webp",
    "./assets/images/faerun-city.webp",
    "./assets/images/rules-game-table.webp",
    "./assets/images/table-adventurers.webp",
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
        await trimCache(CACHE_NAMES.pages, MAX_RUNTIME_PAGES);
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

async function staleWhileRevalidate(request, cacheName, event, maximumEntries) {
    const cached = await caches.match(request);
    const update = fetch(request)
        .then(async (response) => {
            await putInCache(cacheName, request, response.clone());
            if (maximumEntries) await trimCache(cacheName, maximumEntries);
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

async function precacheAssets() {
    const cache = await caches.open(CACHE_NAMES.core);
    await Promise.all(CORE_ASSETS.map(async (path) => {
        try {
            const request = new Request(scopedUrl(path), { cache: "reload" });
            const response = await fetch(request);
            if (response?.ok) await cache.put(request, response.clone());
        } catch {
            // A secondary resource must not make the whole PWA installation fail.
        }
    }));
}

self.addEventListener("install", (event) => {
    event.waitUntil(precacheAssets());
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
        event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.data, event, MAX_RUNTIME_DATA));
    } else if (requestType === "image") {
        event.respondWith(cacheFirstImage(request, event));
    } else {
        event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.assets, event, MAX_RUNTIME_ASSETS));
    }
});

self.DndPwaServiceWorker = Object.freeze({
    CACHE_VERSION,
    CACHE_NAMES,
    CORE_ASSETS,
    MAX_RUNTIME_ASSETS,
    MAX_RUNTIME_DATA,
    MAX_RUNTIME_IMAGES,
    MAX_RUNTIME_PAGES,
    classifyRequest,
    networkFirstNavigation,
    precacheAssets,
    scopedUrl,
});
