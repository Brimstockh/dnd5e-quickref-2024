export function createSearch({ document, view, pageUrl, groups, navigationModule, createIcon, normalize }) {
    const dialog = document.createElement("dialog");
    const header = document.createElement("div");
    const input = document.createElement("input");
    const close = iconButton("search-dialog__close", "Fermer la recherche", "close");
    const commands = document.createElement("div");
    const filters = document.createElement("div");
    const resultCount = document.createElement("p");
    const results = document.createElement("ul");
    const footer = document.createElement("div");
    const entries = searchEntries();
    let selectedIndex = 0;
    let activeSection = "";
    let indexLoaded = false;
    let indexLoading = null;
    let deepIndexLoaded = false;
    let deepIndexLoading = null;
    let engine = null;
    let engineLoading = null;
    let previousFocus = null;

    function iconButton(className, label, iconName) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "icon-button " + className;
        button.setAttribute("aria-label", label);
        button.appendChild(createIcon(iconName));
        return button;
    }

    function searchEntries() {
        const seen = new Set();
        const searchEntries = [{ id: "home", title: "Accueil", path: "index.html", section: "Accueil", category: "Page", type: "page", description: "Tableau de bord D&D 2024", isBase: true }];
        groups.forEach(function (group) {
            group.links.forEach(function (entry) {
                if (seen.has(entry.url)) return;
                seen.add(entry.url);
                searchEntries.push({
                    id: entry.id,
                    title: entry.label,
                    path: entry.url,
                    section: group.label,
                    category: entry.category || "Page",
                    type: entry.type || "page",
                    description: entry.description,
                    isBase: true,
                });
            });
        });
        return searchEntries;
    }

    dialog.className = "search-dialog";
    dialog.setAttribute("aria-label", "Recherche dans le site");
    header.className = "search-dialog__header";
    input.className = "search-field";
    input.type = "search";
    input.placeholder = "Rechercher un sort, une règle, un monstre…";
    input.setAttribute("aria-label", "Rechercher dans le site");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", "site-search-results");
    input.setAttribute("aria-expanded", "false");
    commands.className = "search-dialog__commands";
    commands.setAttribute("aria-label", "Commandes de recherche");
    results.id = "site-search-results";
    results.className = "search-results";
    results.setAttribute("role", "listbox");
    filters.className = "search-dialog__filters";
    filters.setAttribute("aria-label", "Filtrer les résultats par espace");
    resultCount.className = "search-dialog__count";
    resultCount.setAttribute("role", "status");
    resultCount.setAttribute("aria-live", "polite");
    footer.className = "search-dialog__footer";
    footer.innerHTML = "<span><kbd>↑</kbd><kbd>↓</kbd> Naviguer</span><span><kbd>Entrée</kbd> Ouvrir</span><span><kbd>Échap</kbd> Fermer</span>";

    function loadEngine() {
        if (engine || engineLoading) return engineLoading;
        engineLoading = import(pageUrl("js/search-engine.js"))
            .then(function (module) { engine = module; render(); return module; })
            .catch(function () { return null; });
        return engineLoading;
    }

    function appendIndexed(indexed) {
        const knownPaths = new Set(entries.map(function (entry) { return entry.path; }));
        indexed.slice(0, 3000).forEach(function (entry) {
            if (!entry || !entry.title || !entry.url) return;
            if (knownPaths.has(String(entry.url))) return;
            knownPaths.add(String(entry.url));
            entries.push({
                id: String(entry.id || entry.url),
                title: String(entry.title),
                path: String(entry.url),
                section: String(entry.section || "Contenu"),
                category: String(entry.category || "Page"),
                type: String(entry.type || "page"),
                description: String(entry.excerpt || ""),
                aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
                keywords: Array.isArray(entry.keywords) ? entry.keywords.join(" ") : "",
                isBase: false,
            });
        });
    }

    function loadIndex() {
        if (indexLoaded || indexLoading || typeof view.fetch !== "function") return indexLoading;
        indexLoading = view.fetch(pageUrl("data/search-index.json"))
            .then(function (response) {
                if (!response.ok) throw new Error("Search index unavailable");
                return response.json();
            })
            .then(function (payload) {
                const indexed = payload && Array.isArray(payload.entries) ? payload.entries : [];
                appendIndexed(indexed);
                indexLoaded = true;
                render();
            })
            .catch(function () { indexLoaded = true; });
        return indexLoading;
    }

    function loadDeepIndex() {
        if (deepIndexLoaded || deepIndexLoading || typeof view.fetch !== "function") return deepIndexLoading;
        deepIndexLoading = view.fetch(pageUrl("data/search-index-deep.json"))
            .then(function (response) {
                if (!response.ok) throw new Error("Deep search index unavailable");
                return response.json();
            })
            .then(function (payload) {
                appendIndexed(payload && Array.isArray(payload.entries) ? payload.entries : []);
                deepIndexLoaded = true;
                render();
            })
            .catch(function () { deepIndexLoaded = true; });
        return deepIndexLoading;
    }

    function recentEntries() {
        const api = view.DndLibrary;
        if (!api || typeof api.getRecent !== "function") return [];
        return api.getRecent().slice(0, 8).map(function (entry, index) {
            return {
                id: "recent-" + index,
                title: entry.title,
                path: entry.url,
                section: entry.section || "Page",
                category: entry.category || "Page",
                type: entry.type || "page",
                description: entry.description || "Consulté récemment",
                isRecent: true,
                matchReason: "Consulté récemment",
            };
        });
    }

    function searchContext() {
        const recentUrls = recentEntries().map(function (entry) { return entry.path; });
        const profiles = view.DndProfiles;
        const activeProfile = profiles && typeof profiles.getActive === "function" ? profiles.getActive() : null;
        const boostIds = activeProfile
            ? ["preparedSpells", "pinnedRules", "shortcuts"].flatMap(function (key) {
                return Array.isArray(activeProfile[key]) ? activeProfile[key] : [];
            })
            : [];
        return { recentUrls, boostIds };
    }

    function fallbackMatches(section) {
        const query = normalize(input.value.trim());
        const queryTokens = query.split(/\s+/).filter(Boolean);
        if (!query) {
            const defaults = recentEntries().concat(entries.filter(function (entry) { return entry.isBase; }));
            const seenPaths = new Set();
            return defaults.filter(function (entry) {
                if (section && entry.section !== section) return false;
                const identity = entry.isRecent
                    ? "recent|" + normalize(entry.section) + "|" + normalize(entry.title)
                    : entry.path;
                if (seenPaths.has(identity)) return false;
                seenPaths.add(identity);
                return true;
            });
        }
        return entries.filter(function (entry) {
            if (section && entry.section !== section) return false;
            const searchable = normalize([entry.title, entry.section, entry.category, entry.type, entry.description, entry.keywords].join(" "));
            return queryTokens.every(function (token) { return searchable.includes(token); });
        }).sort(function (first, second) {
            function score(entry) {
                const title = normalize(entry.title);
                if (title === query) return 0;
                if (title.startsWith(query)) return 1;
                if (title.includes(query)) return 2;
                return 3;
            }
            return score(first) - score(second) || first.title.localeCompare(second.title, "fr");
        });
    }

    function matchingEntries(section) {
        if (!engine || !input.value.trim()) return fallbackMatches(section);
        const context = searchContext();
        return engine.searchEntries(entries, input.value, {
            section,
            limit: entries.length,
            boostIds: context.boostIds,
            recentUrls: context.recentUrls,
        }).map(function (result) {
            return Object.assign({}, result.entry, { matchReason: result.reason });
        });
    }

    function filterAndLimit(matches, limit) {
        return matches.slice(0, limit);
    }

    function renderFilters(matches) {
        filters.replaceChildren();
        const definitions = navigationModule && typeof navigationModule.buildSectionFilterDefinitions === "function"
            ? navigationModule.buildSectionFilterDefinitions(groups, matches)
            : (function () {
                const counts = new Map();
                matches.forEach(function (entry) {
                    counts.set(entry.section, (counts.get(entry.section) || 0) + 1);
                });
                return [{ value: "", label: "Tout", count: matches.length, disabled: false }].concat(groups.map(function (group) {
                    const count = counts.get(group.label) || 0;
                    return { value: group.label, label: group.label, count, disabled: count === 0 };
                }));
            }());
        definitions.forEach(function (definition) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "search-dialog__filter";
            button.textContent = definition.label + " " + definition.count;
            button.disabled = Boolean(definition.disabled);
            button.setAttribute("aria-pressed", String(activeSection === definition.value));
            button.addEventListener("click", function () {
                activeSection = definition.value;
                selectedIndex = 0;
                render();
                input.focus();
            });
            filters.appendChild(button);
        });
    }

    function render() {
        const allMatches = matchingEntries("");
        const parsed = engine ? engine.parseSearchQuery(input.value) : { command: "", query: input.value };
        renderFilters(allMatches);
        const scopedMatches = activeSection
            ? allMatches.filter(function (entry) { return entry.section === activeSection; })
            : allMatches;
        const matches = filterAndLimit(scopedMatches, 24);
        const total = scopedMatches.length;
        selectedIndex = Math.min(selectedIndex, Math.max(matches.length - 1, 0));
        results.replaceChildren();
        resultCount.textContent = total + " résultat" + (total > 1 ? "s" : "")
            + (activeSection ? " · " + activeSection : "")
            + (parsed.command ? " · commande " + parsed.command : "");
        if (!matches.length) {
            const empty = document.createElement("li");
            empty.className = "search-empty";
            empty.innerHTML = "<strong>" + (activeSection ? "Aucun résultat dans " + activeSection : "Aucun résultat") + "</strong><span>Essayez moins de mots ou un autre espace.</span>";
            results.appendChild(empty);
            input.removeAttribute("aria-activedescendant");
            return;
        }
        matches.forEach(function (entry, index) {
            const item = document.createElement("li");
            const link = document.createElement("a");
            const heading = document.createElement("span");
            const title = document.createElement("strong");
            const category = document.createElement("span");
            const meta = document.createElement("small");
            const reason = document.createElement("span");
            link.href = pageUrl(entry.path);
            link.id = "site-search-result-" + index;
            link.setAttribute("role", "option");
            link.setAttribute("aria-selected", String(index === selectedIndex));
            if (index === selectedIndex) link.classList.add("is-selected");
            function appendHighlightedText(container, value) {
                const segments = engine
                    ? engine.highlightSearchText(value, input.value)
                    : [{ text: String(value || ""), match: false }];
                segments.forEach(function (segment) {
                    if (!segment.match) {
                        container.appendChild(document.createTextNode(segment.text));
                        return;
                    }
                    const mark = document.createElement("mark");
                    mark.textContent = segment.text;
                    container.appendChild(mark);
                });
            }
            appendHighlightedText(title, entry.title);
            category.className = "search-result__category";
            category.textContent = entry.section + (entry.category && entry.category !== entry.section ? " — " + entry.category : "");
            appendHighlightedText(meta, entry.description || "Ouvrir cette entrée");
            reason.className = "search-result__reason";
            reason.textContent = entry.matchReason || (entry.isRecent ? "Consulté récemment" : "Contenu du site");
            heading.className = "search-result__heading";
            heading.append(category, title);
            link.append(heading, meta, reason);
            item.appendChild(link);
            results.appendChild(item);
        });
        input.setAttribute("aria-activedescendant", "site-search-result-" + selectedIndex);
    }

    function keepSelectionVisible() {
        const selected = results.querySelector(".is-selected");
        if (selected && typeof selected.scrollIntoView === "function") selected.scrollIntoView({ block: "nearest" });
    }

    function open() {
        previousFocus = document.activeElement;
        render();
        loadIndex();
        loadEngine();
        if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
        else dialog.setAttribute("open", "");
        input.setAttribute("aria-expanded", "true");
        view.setTimeout(function () { input.focus(); }, 0);
    }

    function closeDialog() {
        if (typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
        input.setAttribute("aria-expanded", "false");
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    }

    input.addEventListener("input", function () {
        selectedIndex = 0;
        loadDeepIndex();
        render();
    });
    input.addEventListener("keydown", function (event) {
        const matches = matchingEntries(activeSection).slice(0, 24);
        if (event.key === "ArrowDown" && matches.length) {
            event.preventDefault();
            selectedIndex = (selectedIndex + 1) % matches.length;
            render();
            keepSelectionVisible();
        } else if (event.key === "ArrowUp" && matches.length) {
            event.preventDefault();
            selectedIndex = (selectedIndex - 1 + matches.length) % matches.length;
            render();
            keepSelectionVisible();
        } else if (event.key === "Home" && matches.length) {
            event.preventDefault();
            selectedIndex = 0;
            render();
            keepSelectionVisible();
        } else if (event.key === "End" && matches.length) {
            event.preventDefault();
            selectedIndex = matches.length - 1;
            render();
            keepSelectionVisible();
        } else if (event.key === "Enter" && matches[selectedIndex]) {
            event.preventDefault();
            view.location.href = pageUrl(matches[selectedIndex].path);
        } else if (event.key === "Escape") {
            event.preventDefault();
            closeDialog();
        }
    });
    close.addEventListener("click", closeDialog);
    dialog.addEventListener("close", function () {
        input.setAttribute("aria-expanded", "false");
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    });
    [
        ["@sort", "Rechercher uniquement dans les sorts"],
        ["@règle", "Rechercher uniquement dans les règles"],
        ["@classe", "Rechercher uniquement dans les classes"],
        ["@don", "Rechercher uniquement dans les dons"],
        ["@équipement", "Rechercher uniquement dans l’équipement"],
    ].forEach(function (definition) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = definition[0];
        button.setAttribute("aria-label", definition[1]);
        button.addEventListener("click", function () {
            input.value = definition[0] + " ";
            selectedIndex = 0;
            activeSection = "";
            render();
            input.focus();
        });
        commands.appendChild(button);
    });
    header.append(input, close);
    dialog.append(header, commands, filters, resultCount, results, footer);
    document.body.appendChild(dialog);
    return { open, element: dialog };
}
