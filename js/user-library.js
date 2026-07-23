(function () {
    "use strict";

    if (!window.DndStorage) {
        var memoryStorage = Object.create(null);
        var persistenceAvailable = true;

        function readRaw(key, fallbackValue) {
            if (
                !persistenceAvailable
                && Object.prototype.hasOwnProperty.call(memoryStorage, key)
            ) {
                return memoryStorage[key];
            }
            try {
                var value = window.localStorage.getItem(key);
                persistenceAvailable = true;
                if (value === null) delete memoryStorage[key];
                else memoryStorage[key] = value;
                return value === null ? fallbackValue : value;
            } catch (error) {
                persistenceAvailable = false;
                return Object.prototype.hasOwnProperty.call(memoryStorage, key)
                    ? memoryStorage[key]
                    : fallbackValue;
            }
        }

        function writeRaw(key, value) {
            var serialized = String(value);
            memoryStorage[key] = serialized;
            try {
                window.localStorage.setItem(key, serialized);
                persistenceAvailable = true;
                return true;
            } catch (error) {
                persistenceAvailable = false;
                return false;
            }
        }

        function remove(key) {
            delete memoryStorage[key];
            try {
                window.localStorage.removeItem(key);
                persistenceAvailable = true;
                return true;
            } catch (error) {
                persistenceAvailable = false;
                return false;
            }
        }

        function getJson(key, fallbackValue) {
            var raw = readRaw(key, null);
            if (raw === null) return fallbackValue;
            try {
                return JSON.parse(raw);
            } catch (error) {
                return fallbackValue;
            }
        }

        function setJson(key, value) {
            try {
                return writeRaw(key, JSON.stringify(value));
            } catch (error) {
                return false;
            }
        }

        window.DndStorage = Object.freeze({
            schemaVersion: 1,
            get: readRaw,
            set: writeRaw,
            remove: remove,
            getJson: getJson,
            setJson: setJson,
            isPersistent: function () { return persistenceAvailable; },
        });
    }

    var storage = window.DndStorage;
    var favoritesKey = "dnd2024_favorites_v1";
    var recentKey = "dnd2024_recent_v1";
    var maxRecentItems = 8;
    var script = document.currentScript;
    var siteRoot = new URL("../", script ? script.src : window.location.href);

    function safeRead(key) {
        var value = storage.getJson(key, []);
        return Array.isArray(value) ? value.filter(isValidEntry) : [];
    }

    function safeWrite(key, value) {
        return storage.setJson(key, value);
    }

    function isValidEntry(entry) {
        return entry && typeof entry.url === "string" && typeof entry.title === "string";
    }

    function relativeUrl(value) {
        var url = new URL(value || window.location.href, siteRoot);
        var rootPath = siteRoot.pathname;
        if (url.origin !== siteRoot.origin || !url.pathname.startsWith(rootPath)) return url.href;
        var path = url.pathname.slice(rootPath.length) || "index.html";
        return path + url.search + url.hash;
    }

    function pageUrl(value) {
        return /^(?:https?:|mailto:)/.test(value) ? value : new URL(value, siteRoot).href;
    }

    function createIcon(name) {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        svg.setAttribute("class", "icon");
        svg.setAttribute("viewBox", "0 0 64 64");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        use.setAttribute("href", pageUrl("assets/icons/site-icons.svg#" + name));
        svg.appendChild(use);
        return svg;
    }

    function cleanEntry(entry) {
        return {
            url: relativeUrl(entry.url),
            title: String(entry.title || "Page sans titre").trim(),
            category: String(entry.category || "Page").trim(),
            description: String(entry.description || "").trim(),
            visitedAt: Number(entry.visitedAt) || Date.now(),
        };
    }

    function currentEntry() {
        return cleanEntry({
            url: window.location.href,
            title: document.body.dataset.libraryTitle || document.title.replace(/\s*[—|-]\s*D&D.*$/i, ""),
            category: document.body.dataset.libraryCategory || "Page",
            description: document.body.dataset.libraryDescription || "",
        });
    }

    function getFavorites() {
        return safeRead(favoritesKey).map(cleanEntry);
    }

    function getRecent() {
        return safeRead(recentKey).map(cleanEntry);
    }

    function isFavorite(url) {
        var normalized = relativeUrl(url);
        return getFavorites().some(function (entry) { return entry.url === normalized; });
    }

    function notify() {
        window.dispatchEvent(new CustomEvent("dndlibrarychange"));
    }

    function toggleFavorite(entry) {
        var normalized = cleanEntry(entry);
        var favorites = getFavorites();
        var index = favorites.findIndex(function (item) { return item.url === normalized.url; });
        var active = index === -1;
        if (active) favorites.unshift(normalized);
        else favorites.splice(index, 1);
        safeWrite(favoritesKey, favorites.slice(0, 30));
        notify();
        return active;
    }

    function recordRecent(entry) {
        var normalized = cleanEntry(entry);
        if (normalized.url === "index.html") return;
        var recent = getRecent().filter(function (item) { return item.url !== normalized.url; });
        recent.unshift(normalized);
        safeWrite(recentKey, recent.slice(0, maxRecentItems));
        notify();
    }

    function clearRecent() {
        safeWrite(recentKey, []);
        notify();
    }

    function entryFromElement(element) {
        return cleanEntry({
            url: element.dataset.libraryUrl || element.querySelector("a")?.href || window.location.href,
            title: element.dataset.libraryTitle || element.querySelector("strong")?.textContent || document.title,
            category: element.dataset.libraryCategory || "Page",
            description: element.dataset.libraryDescription || element.querySelector("small")?.textContent || "",
        });
    }

    function updateFavoriteButton(button, entry) {
        var active = isFavorite(entry.url);
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-label", active ? "Retirer des favoris : " + entry.title : "Ajouter aux favoris : " + entry.title);
        button.title = active ? "Retirer des favoris" : "Ajouter aux favoris";
        button.replaceChildren(createIcon(active ? "favorite-filled" : "favorite-empty"));
    }

    function connectFavoriteButton(button, entry, listenForChanges) {
        button.type = "button";
        button.classList.add("favorite-button");
        updateFavoriteButton(button, entry);
        button.addEventListener("click", function () { toggleFavorite(entry); });
        if (listenForChanges !== false) {
            window.addEventListener("dndlibrarychange", function () { updateFavoriteButton(button, entry); });
        }
    }

    function createLibraryRow(entry, favoriteAction) {
        var item = document.createElement("li");
        var link = document.createElement("a");
        var icon = document.createElement("span");
        var text = document.createElement("span");
        var title = document.createElement("strong");
        var meta = document.createElement("small");
        var button = document.createElement("button");

        item.className = "library-row";
        link.className = "library-row__link";
        link.href = pageUrl(entry.url);
        icon.className = "resource-row__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.appendChild(createIcon(favoriteAction ? "favorite-filled" : "history"));
        text.className = "library-row__text";
        title.textContent = entry.title;
        meta.textContent = entry.category + (entry.description ? " — " + entry.description : "");
        text.append(title, meta);
        link.append(icon, text);
        item.append(link, button);
        connectFavoriteButton(button, entry, false);
        return item;
    }

    function renderList(container, entries, favoriteAction, emptyTitle, emptyText) {
        container.replaceChildren();
        if (!entries.length) {
            var empty = document.createElement("li");
            var title = document.createElement("strong");
            var text = document.createElement("span");
            empty.className = "library-empty";
            title.textContent = emptyTitle;
            text.textContent = emptyText;
            empty.append(title, text);
            container.appendChild(empty);
            return;
        }
        entries.forEach(function (entry) { container.appendChild(createLibraryRow(entry, favoriteAction)); });
    }

    function renderHomeLists() {
        var favorites = document.querySelector("[data-favorites-list]");
        var recent = document.querySelector("[data-recent-list]");
        if (favorites) renderList(favorites, getFavorites().slice(0, 6), true, "Aucun favori", "Utilisez l’étoile sur une ressource pour la garder ici.");
        if (recent) renderList(recent, getRecent().slice(0, 6), false, "Aucun historique", "Les pages consultées récemment apparaîtront ici.");
    }

    function init() {
        document.querySelectorAll("[data-library-item]").forEach(function (element) {
            var button = element.querySelector("[data-favorite-button]");
            if (button) connectFavoriteButton(button, entryFromElement(element));
        });

        document.querySelectorAll("[data-clear-recent]").forEach(function (button) {
            button.addEventListener("click", clearRecent);
        });

        window.addEventListener("dndlibrarychange", renderHomeLists);
        renderHomeLists();

        if (document.body.dataset.trackRecent !== "false") recordRecent(currentEntry());
    }

    window.DndLibrary = {
        currentEntry: currentEntry,
        getFavorites: getFavorites,
        getRecent: getRecent,
        isFavorite: isFavorite,
        toggleFavorite: toggleFavorite,
        recordRecent: recordRecent,
        clearRecent: clearRecent,
        connectFavoriteButton: connectFavoriteButton,
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
