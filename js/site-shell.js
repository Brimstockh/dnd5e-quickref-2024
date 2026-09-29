(function () {
    "use strict";

    var doc = document;
    var script = doc.currentScript;
    var siteRoot = new URL("../", script ? script.src : window.location.href);
    var storage = window.DndStorage;
    var sharingController = null;

    function loadIdleScript(path, dataAttribute, type) {
        if (doc.querySelector("script[data-" + dataAttribute.replace(/[A-Z]/g, function (letter) { return "-" + letter.toLowerCase(); }) + "]")) return;
        var load = function () {
            if (doc.querySelector("script[data-" + dataAttribute.replace(/[A-Z]/g, function (letter) { return "-" + letter.toLowerCase(); }) + "]")) return;
            var script = doc.createElement("script");
            if (type) script.type = type;
            script.src = new URL(path, siteRoot).href;
            script.dataset[dataAttribute] = "";
            doc.head.append(script);
        };
        if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(load, { timeout: 2000 });
        else window.setTimeout(load, 0);
    }

    if (!doc.querySelector("script[data-pwa-client]")) {
        var pwaClient = doc.createElement("script");
        pwaClient.src = new URL("js/pwa-client.js", siteRoot).href;
        pwaClient.dataset.pwaClient = "";
        doc.head.append(pwaClient);
    }

    if (!doc.querySelector("script[data-source-meta-client]")) {
        var sourceMetaClient = doc.createElement("script");
        sourceMetaClient.src = new URL("js/source-meta.js", siteRoot).href;
        sourceMetaClient.dataset.sourceMetaClient = "";
        doc.head.append(sourceMetaClient);
    }

    loadIdleScript("js/github-report.js", "githubReportClient");
    loadIdleScript("js/glossary-client.js", "glossaryClient", "module");

    var groups = [];
    var navigationModule = null;
    var navigationLoading = null;
    var shellModulesLoading = null;

    function loadNavigation() {
        if (groups.length) return Promise.resolve(groups);
        if (!navigationLoading) {
            navigationLoading = import(pageUrl("js/site-navigation.js"))
                .then(function (module) {
                    navigationModule = module;
                    groups = module.SITE_SECTIONS;
                    window.DndSiteNavigation = groups;
                    return groups;
                });
        }
        return navigationLoading;
    }

    function pageUrl(path) {
        return new URL(path, siteRoot).href;
    }

    function loadShellModules() {
        if (!shellModulesLoading) {
            shellModulesLoading = Promise.all([
                import(pageUrl("js/shell/theme.js")),
                import(pageUrl("js/shell/keyboard-shortcuts.js")),
                import(pageUrl("js/shell/sharing.js")),
                import(pageUrl("js/shell/mobile-navigation.js")),
                import(pageUrl("js/shell/session-controls.js")),
                import(pageUrl("js/shell/personal-tools.js")),
                import(pageUrl("js/shell/search-trigger.js")),
            ]).then(function (modules) {
                return {
                    theme: modules[0],
                    keyboard: modules[1],
                    sharing: modules[2],
                    mobile: modules[3],
                    session: modules[4],
                    personal: modules[5],
                    searchTrigger: modules[6],
                };
            });
        }
        return shellModulesLoading;
    }

    function slugify(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("fr")
            .replace(/['’]/g, "-")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function revealHashTarget() {
        if (!window.location.hash) return;
        var id;
        try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (error) { return; }
        var target = doc.getElementById(id);
        if (!target) return;
        doc.querySelectorAll("details").forEach(function (details) {
            if (details.contains(target)) details.open = true;
        });
        target.setAttribute("tabindex", "-1");
        target.scrollIntoView({ block: "start" });
        target.focus({ preventScroll: true });
    }

    function enhanceDeepLinks() {
        if (!doc.body.classList.contains("content-page")) return;
        var used = new Set(Array.from(doc.querySelectorAll("[id]")).map(function (element) { return element.id; }));
        doc.querySelectorAll("main h2, main h3, main h4").forEach(function (heading) {
            if (heading.closest("[data-site-header], dialog, .search-dialog, .session-panel")) return;
            var legacyAnchor = heading.querySelector("a[id]");
            var id = heading.id || (legacyAnchor ? legacyAnchor.id : "");
            if (!id) {
                var label = heading.textContent
                    .replace(/^Niveau\s+\d+\s*:\s*/i, "")
                    .replace(/\s*\([^)]*\)\s*$/, "");
                var base = slugify(label) || "section";
                id = base;
                var suffix = 2;
                while (used.has(id)) {
                    id = base + "-" + suffix;
                    suffix += 1;
                }
                heading.id = id;
                used.add(id);
            }
            if (heading.tagName === "H4" || heading.querySelector(".heading-anchor")) return;
            var anchor = doc.createElement("a");
            anchor.className = "heading-anchor";
            anchor.href = "#" + encodeURIComponent(id);
            anchor.setAttribute("aria-label", "Lien vers la section « " + heading.textContent.trim() + " »");
            anchor.textContent = "#";
            heading.appendChild(anchor);
        });
        doc.querySelectorAll("main .trait, main table.equipment-table tr").forEach(function (element) {
            if (element.id || element.closest("[data-site-header], dialog, .search-dialog, .session-panel")) return;
            var labelElement = element.querySelector("h3, h4, strong, td");
            var label = labelElement ? labelElement.textContent : "";
            label = label.replace(/\s*\([^)]*\)\s*$/, "").replace(/:$/, "").trim();
            if (!label || /^Objet$|^Poids$|^Prix$/i.test(label)) return;
            var base = slugify(label) || "entry";
            var id = base;
            var suffix = 2;
            while (used.has(id)) {
                id = base + "-" + suffix;
                suffix += 1;
            }
            element.id = id;
            used.add(id);
        });
        window.addEventListener("hashchange", revealHashTarget);
        window.addEventListener("popstate", function () {
            window.requestAnimationFrame(revealHashTarget);
        });
        window.requestAnimationFrame(revealHashTarget);
    }

    function createIcon(name, className) {
        var svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
        var use = doc.createElementNS("http://www.w3.org/2000/svg", "use");
        svg.setAttribute("class", "icon" + (className ? " " + className : ""));
        svg.setAttribute("viewBox", "0 0 64 64");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        use.setAttribute("href", pageUrl("assets/icons/site-icons.svg#" + name));
        svg.appendChild(use);
        return svg;
    }

    function setButtonIcon(button, name) {
        button.replaceChildren(createIcon(name));
    }

    function normalize(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("fr");
    }

    function iconButton(className, label, iconName) {
        var button = doc.createElement("button");
        button.type = "button";
        button.className = "icon-button " + className;
        button.setAttribute("aria-label", label);
        setButtonIcon(button, iconName);
        return button;
    }

    function ensureSkipLink(mount) {
        var main = doc.querySelector("main, [role='main'], .wrap, .page, .rules-wrap, .container, #app");
        if (!main) return;
        if (!main.id) main.id = "main-content";
        var link = doc.querySelector(".skip-link");
        if (!link) {
            link = doc.createElement("a");
            link.className = "skip-link";
            link.href = "#" + main.id;
            link.textContent = "Aller au contenu";
            doc.body.insertBefore(link, mount);
        }
        main.setAttribute("tabindex", "-1");
        link.addEventListener("click", function () {
            window.setTimeout(function () { main.focus(); }, 0);
        });
    }

    function enhanceFormAccessibility() {
        var abilityNames = { str: "Force", for: "Force", dex: "Dextérité", con: "Constitution", int: "Intelligence", wis: "Sagesse", sag: "Sagesse", cha: "Charisme" };

        function cleanText(value) {
            return String(value || "").replace(/\s+/g, " ").trim();
        }

        function fieldName(control) {
            var key = control.dataset.field || control.name || "champ";
            return cleanText(key
                .replace(/^skill_/, "")
                .replace(/_prof$/, " — maîtrise")
                .replace(/_mod$/, " — modificateur")
                .replace(/_save$/, " — sauvegarde")
                .replace(/_/g, " "));
        }

        doc.querySelectorAll("input:not([type='hidden']), select, textarea").forEach(function (control, index) {
            if (control.labels?.length || control.hasAttribute("aria-label") || control.hasAttribute("aria-labelledby")) return;

            var field = control.closest(".field, .big-field");
            var visibleLabel = field ? Array.from(field.children).find(function (child) { return child.tagName === "LABEL"; }) : null;
            if (visibleLabel && !visibleLabel.contains(control)) {
                if (!control.id) control.id = "accessible-field-" + index;
                visibleLabel.htmlFor = control.id;
                return;
            }

            var line = control.closest(".skill-line, .save-line, .death-saves-line");
            var lineLabel = line ? cleanText(line.querySelector("span")?.textContent) : "";
            if (lineLabel) {
                if (line.classList.contains("save-line")) {
                    var saveCode = cleanText(control.dataset.field).split("_")[0].toLocaleLowerCase("fr");
                    var saveName = abilityNames[saveCode] || saveCode.toLocaleUpperCase("fr");
                    lineLabel = "Sauvegarde " + (saveName === "Intelligence" ? "d’" : "de ") + saveName;
                }
                var siblings = Array.from(line.querySelectorAll("input:not([type='hidden']), select, textarea"));
                var position = siblings.indexOf(control) + 1;
                if (line.classList.contains("death-saves-line")) control.setAttribute("aria-label", "Jet contre la mort — " + lineLabel + " " + position);
                else if (control.type === "checkbox") control.setAttribute("aria-label", "Maîtrise — " + lineLabel);
                else control.setAttribute("aria-label", (line.classList.contains("save-line") ? "Bonus de sauvegarde — " : "Bonus de compétence — ") + lineLabel);
                return;
            }

            var ability = control.closest(".ability-score");
            if (ability) {
                var code = cleanText(ability.querySelector("strong")?.textContent).toLocaleLowerCase("fr");
                var abilityName = abilityNames[code] || code.toLocaleUpperCase("fr");
                control.setAttribute("aria-label", (control.classList.contains("mod") ? "Modificateur de " : "Valeur de ") + abilityName);
                return;
            }

            var cell = control.closest("td");
            var row = control.closest("tr");
            var table = control.closest("table");
            if (cell && row && table) {
                var headers = table.querySelectorAll("thead th");
                var column = headers[cell.cellIndex] ? cleanText(headers[cell.cellIndex].textContent) : "Champ";
                control.setAttribute("aria-label", column + " — ligne " + row.rowIndex);
                return;
            }

            var placeholder = cleanText(control.getAttribute("placeholder"));
            control.setAttribute("aria-label", placeholder || fieldName(control));
        });
    }

    function createNavigation(activePage, mobile) {
        var nav = doc.createElement("nav");
        nav.className = "main-navigation";
        nav.setAttribute("aria-label", mobile ? "Navigation mobile" : "Navigation principale");

        var home = doc.createElement("a");
        home.className = "nav-link";
        home.href = pageUrl("index.html");
        home.textContent = "Accueil";
        if (activePage === "home") home.setAttribute("aria-current", "page");
        nav.appendChild(home);

        groups.forEach(function (group) {
            var details = doc.createElement("details");
            var summary = doc.createElement("summary");
            var menu = doc.createElement("div");
            var groupIsActive = false;

            details.className = "nav-dropdown";
            details.dataset.section = group.id;
            summary.append(doc.createTextNode(group.label), createIcon("chevron-down", "nav-dropdown__chevron"));
            menu.className = "nav-dropdown__menu";

            var groupedMenus = new Map();
            group.links.forEach(function (entry) {
                var groupId = entry.group || "";
                var target = groupedMenus.get(groupId);
                if (!target) {
                    target = doc.createElement("div");
                    target.className = groupId ? "nav-dropdown__group" : "nav-dropdown__group nav-dropdown__group--primary";
                    if (groupId) {
                        var groupDefinition = (group.groups || []).find(function (definition) { return definition.id === groupId; });
                        var groupLabel = doc.createElement("span");
                        groupLabel.className = "nav-dropdown__group-label";
                        groupLabel.textContent = groupDefinition?.label || groupId;
                        target.appendChild(groupLabel);
                    }
                    groupedMenus.set(groupId, target);
                    menu.appendChild(target);
                }
                var link = doc.createElement("a");
                link.href = pageUrl(entry.url);
                link.textContent = entry.label;
                if (entry.id === activePage) {
                    link.setAttribute("aria-current", "page");
                    groupIsActive = true;
                }
                target.appendChild(link);
            });

            if (groupIsActive) details.classList.add("is-active");
            details.append(summary, menu);
            nav.appendChild(details);
        });

        if (mobile) {
            var shareLink = doc.createElement("button");
            shareLink.type = "button";
            shareLink.className = "nav-link mobile-share-link";
            shareLink.append(createIcon("share"), doc.createTextNode(
                typeof navigator.share === "function" ? "Partager cette page" : "Copier le lien",
            ));
            shareLink.addEventListener("click", sharingController.shareCurrentPage);
            nav.appendChild(shareLink);
        }

        return nav;
    }

    function searchEntries() {
        var seen = new Set();
        var entries = [{ id: "home", title: "Accueil", path: "index.html", section: "Accueil", category: "Page", type: "page", description: "Tableau de bord D&D 2024", isBase: true }];
        groups.forEach(function (group) {
            group.links.forEach(function (entry) {
                if (seen.has(entry.url)) return;
                seen.add(entry.url);
                entries.push({
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
        return entries;
    }

    function createSearch() {
        var dialog = doc.createElement("dialog");
        var header = doc.createElement("div");
        var input = doc.createElement("input");
        var close = iconButton("search-dialog__close", "Fermer la recherche", "close");
        var commands = doc.createElement("div");
        var filters = doc.createElement("div");
        var resultCount = doc.createElement("p");
        var results = doc.createElement("ul");
        var footer = doc.createElement("div");
        var entries = searchEntries();
        var selectedIndex = 0;
        var activeSection = "";
        var indexLoaded = false;
        var indexLoading = null;
        var deepIndexLoaded = false;
        var deepIndexLoading = null;
        var engine = null;
        var engineLoading = null;
        var previousFocus = null;

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
            var knownPaths = new Set(entries.map(function (entry) { return entry.path; }));
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
            if (indexLoaded || indexLoading || typeof window.fetch !== "function") return indexLoading;
            indexLoading = window.fetch(pageUrl("data/search-index.json"))
                .then(function (response) {
                    if (!response.ok) throw new Error("Search index unavailable");
                    return response.json();
                })
                .then(function (payload) {
                    var indexed = payload && Array.isArray(payload.entries) ? payload.entries : [];
                    appendIndexed(indexed);
                    indexLoaded = true;
                    render();
                })
                .catch(function () { indexLoaded = true; });
            return indexLoading;
        }

        function loadDeepIndex() {
            if (deepIndexLoaded || deepIndexLoading || typeof window.fetch !== "function") return deepIndexLoading;
            deepIndexLoading = window.fetch(pageUrl("data/search-index-deep.json"))
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
            var api = window.DndLibrary;
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
            var recentUrls = recentEntries().map(function (entry) { return entry.path; });
            var profiles = window.DndProfiles;
            var activeProfile = profiles && typeof profiles.getActive === "function" ? profiles.getActive() : null;
            var boostIds = activeProfile
                ? ["preparedSpells", "pinnedRules", "shortcuts"].flatMap(function (key) {
                    return Array.isArray(activeProfile[key]) ? activeProfile[key] : [];
                })
                : [];
            return { recentUrls: recentUrls, boostIds: boostIds };
        }

        function fallbackMatches(section) {
            var query = normalize(input.value.trim());
            var queryTokens = query.split(/\s+/).filter(Boolean);
            if (!query) {
                var defaults = recentEntries().concat(entries.filter(function (entry) { return entry.isBase; }));
                var seenPaths = new Set();
                return defaults.filter(function (entry) {
                    if (section && entry.section !== section) return false;
                    var identity = entry.isRecent
                        ? "recent|" + normalize(entry.section) + "|" + normalize(entry.title)
                        : entry.path;
                    if (seenPaths.has(identity)) return false;
                    seenPaths.add(identity);
                    return true;
                });
            }
            return entries.filter(function (entry) {
                if (section && entry.section !== section) return false;
                var searchable = normalize([entry.title, entry.section, entry.category, entry.type, entry.description, entry.keywords].join(" "));
                return queryTokens.every(function (token) { return searchable.includes(token); });
            }).sort(function (first, second) {
                function score(entry) {
                    var title = normalize(entry.title);
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
            var context = searchContext();
            return engine.searchEntries(entries, input.value, {
                section: section,
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
            var definitions = navigationModule && typeof navigationModule.buildSectionFilterDefinitions === "function"
                ? navigationModule.buildSectionFilterDefinitions(groups, matches)
                : (function () {
                    var counts = new Map();
                    matches.forEach(function (entry) {
                        counts.set(entry.section, (counts.get(entry.section) || 0) + 1);
                    });
                    return [{ value: "", label: "Tout", count: matches.length, disabled: false }].concat(groups.map(function (group) {
                        var count = counts.get(group.label) || 0;
                        return { value: group.label, label: group.label, count: count, disabled: count === 0 };
                    }));
                }());
            definitions.forEach(function (definition) {
                var button = doc.createElement("button");
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
            var allMatches = matchingEntries("");
            var parsed = engine ? engine.parseSearchQuery(input.value) : { command: "", query: input.value };
            renderFilters(allMatches);
            var scopedMatches = activeSection
                ? allMatches.filter(function (entry) { return entry.section === activeSection; })
                : allMatches;
            var matches = filterAndLimit(scopedMatches, 24);
            var total = scopedMatches.length;
            selectedIndex = Math.min(selectedIndex, Math.max(matches.length - 1, 0));
            results.replaceChildren();
            resultCount.textContent = total + " résultat" + (total > 1 ? "s" : "")
                + (activeSection ? " · " + activeSection : "")
                + (parsed.command ? " · commande " + parsed.command : "");
            if (!matches.length) {
                var empty = doc.createElement("li");
                empty.className = "search-empty";
                empty.innerHTML = "<strong>" + (activeSection ? "Aucun résultat dans " + activeSection : "Aucun résultat") + "</strong><span>Essayez moins de mots ou un autre espace.</span>";
                results.appendChild(empty);
                input.removeAttribute("aria-activedescendant");
                return;
            }
            matches.forEach(function (entry, index) {
                var item = doc.createElement("li");
                var link = doc.createElement("a");
                var heading = doc.createElement("span");
                var title = doc.createElement("strong");
                var category = doc.createElement("span");
                var meta = doc.createElement("small");
                var reason = doc.createElement("span");
                link.href = pageUrl(entry.path);
                link.id = "site-search-result-" + index;
                link.setAttribute("role", "option");
                link.setAttribute("aria-selected", String(index === selectedIndex));
                if (index === selectedIndex) link.classList.add("is-selected");
                function appendHighlightedText(container, value) {
                    var segments = engine
                        ? engine.highlightSearchText(value, input.value)
                        : [{ text: String(value || ""), match: false }];
                    segments.forEach(function (segment) {
                        if (!segment.match) {
                            container.appendChild(doc.createTextNode(segment.text));
                            return;
                        }
                        var mark = doc.createElement("mark");
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
            var selected = results.querySelector(".is-selected");
            if (selected && typeof selected.scrollIntoView === "function") selected.scrollIntoView({ block: "nearest" });
        }

        function open() {
            previousFocus = doc.activeElement;
            render();
            loadIndex();
            loadEngine();
            if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
            else dialog.setAttribute("open", "");
            input.setAttribute("aria-expanded", "true");
            window.setTimeout(function () { input.focus(); }, 0);
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
            var matches = matchingEntries(activeSection).slice(0, 24);
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
                window.location.href = pageUrl(matches[selectedIndex].path);
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
            var button = doc.createElement("button");
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
        doc.body.appendChild(dialog);
        return { open: open, element: dialog };
    }

    function applySectionTheme(element, section) {
        if (!element || !section) return;
        element.classList.add("section-theme");
        element.dataset.sectionId = section.id;
        element.style.setProperty("--section-accent", section.accent || "var(--color-gold)");
        if (section.artwork?.src) {
            element.style.setProperty("--section-artwork", "url(" + JSON.stringify(pageUrl(section.artwork.src)) + ")");
        }
        element.style.setProperty("--section-artwork-position", section.artwork?.position || "center");
    }

    function createSectionVisual(section) {
        var visual = doc.createElement("div");
        var artwork = doc.createElement("div");
        var overlay = doc.createElement("div");
        var content = doc.createElement("div");
        var icon = doc.createElement("span");
        var eyebrow = doc.createElement("p");
        var title = doc.createElement("h3");
        var description = doc.createElement("p");
        var action = doc.createElement("a");

        visual.className = "section-visual home-explorer-panel__visual";
        artwork.className = "section-visual__artwork";
        overlay.className = "section-visual__overlay";
        content.className = "section-visual__content";
        icon.className = "section-visual__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.appendChild(createIcon(section.icon || "rules"));
        eyebrow.className = "section-visual__eyebrow";
        eyebrow.textContent = "Espace du site";
        title.className = "section-visual__title";
        title.textContent = section.label;
        description.className = "section-visual__description";
        description.textContent = section.description;
        action.className = "section-visual__action panel-action";
        action.href = pageUrl(section.landing);
        action.textContent = section.actionLabel;
        content.append(icon, eyebrow, title, description, action);
        visual.append(artwork, overlay, content);
        applySectionTheme(visual, section);
        return visual;
    }

    function enhanceCategoryHero(hero, section) {
        if (!hero) return;
        applySectionTheme(hero, section);
        hero.classList.add("section-visual");
        if (!hero.querySelector(".section-visual__artwork")) {
            var artwork = doc.createElement("div");
            var overlay = doc.createElement("div");
            var content = doc.createElement("div");
            var icon = doc.createElement("span");
            artwork.className = "section-visual__artwork";
            overlay.className = "section-visual__overlay";
            content.className = "section-visual__content";
            icon.className = "section-visual__icon";
            icon.setAttribute("aria-hidden", "true");
            icon.appendChild(createIcon(section.icon || "rules"));
            content.append(icon);
            content.append(...Array.from(hero.childNodes));
            hero.replaceChildren(artwork, overlay, content);
        }
    }

    function navigationEntryCard(section, entry, className) {
        var article = doc.createElement("article");
        var link = doc.createElement("a");
        var icon = doc.createElement("span");
        var iconSvg = createIcon(entry.icon || section.icon || "rules");
        var text = doc.createElement("span");
        var title = doc.createElement("strong");
        var description = doc.createElement("small");
        var chevron = doc.createElement("span");
        var favorite = doc.createElement("button");

        article.className = className || "hub-card";
        article.dataset.libraryItem = "";
        article.dataset.libraryUrl = entry.url;
        article.dataset.libraryTitle = entry.label;
        article.dataset.libraryCategory = section.label;
        article.dataset.librarySection = section.label;
        article.dataset.libraryDescription = entry.description;
        link.className = "hub-card__link";
        link.href = pageUrl(entry.url);
        icon.className = "hub-card__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.appendChild(iconSvg);
        title.textContent = entry.label;
        description.textContent = entry.description;
        text.className = "hub-card__text";
        text.append(title, description);
        chevron.className = "hub-card__chevron";
        chevron.setAttribute("aria-hidden", "true");
        chevron.appendChild(createIcon("chevron-right"));
        link.append(icon, text, chevron);
        favorite.type = "button";
        favorite.dataset.favoriteButton = "";
        article.append(link, favorite);
        return article;
    }

    function renderHomeExplorer() {
        var host = doc.querySelector("[data-site-explorer]");
        if (!host) return;

        var heading = doc.createElement("div");
        var title = doc.createElement("h2");
        var intro = doc.createElement("p");
        var grid = doc.createElement("div");

        heading.className = "home-section__heading";
        title.textContent = "Explorer le site";
        intro.textContent = "Cinq espaces pour trouver rapidement la bonne ressource.";
        heading.append(title, intro);
        grid.className = "home-explorer-grid";

        groups.forEach(function (section) {
            var panel = doc.createElement("article");
            var list = doc.createElement("div");

            panel.className = "dashboard-panel home-explorer-panel home-explorer-panel--" + section.id;
            applySectionTheme(panel, section);
            list.className = "resource-list";
            list.setAttribute("role", "list");
            section.links.filter(function (entry) { return entry.url !== section.landing; }).forEach(function (entry) {
                var item = navigationEntryCard(section, entry, "resource-row");
                item.setAttribute("role", "listitem");
                var link = item.querySelector("a");
                link.className = "resource-row__link";
                item.querySelector(".hub-card__icon").className = "resource-row__icon";
                item.querySelector(".hub-card__text").className = "resource-row__text";
                item.querySelector(".hub-card__chevron").className = "resource-row__chevron";
                list.appendChild(item);
            });
            panel.append(createSectionVisual(section), list);
            grid.appendChild(panel);
        });
        host.replaceChildren(heading, grid);
    }

    function renderCategoryHub() {
        var main = doc.querySelector("[data-category-hub]");
        if (!main) return;
        var section = groups.find(function (candidate) { return candidate.id === main.dataset.categoryHub; });
        if (!section) return;
        applySectionTheme(main, section);
        var title = main.querySelector("[data-category-hub-title]");
        var description = main.querySelector("[data-category-hub-description]");
        var content = main.querySelector("[data-category-hub-content]");
        enhanceCategoryHero(main.querySelector(".category-hub__hero"), section);
        if (title) title.textContent = section.label;
        if (description) description.textContent = section.description;
        if (!content) return;

        content.replaceChildren();
        var grouped = new Map();
        section.links.filter(function (entry) { return entry.url !== section.landing; }).forEach(function (entry) {
            var groupId = entry.group || "";
            if (!grouped.has(groupId)) grouped.set(groupId, []);
            grouped.get(groupId).push(entry);
        });
        var groupsToRender = section.groups?.length ? section.groups : [{ id: "", label: "Ressources" }];
        groupsToRender.forEach(function (definition) {
            var entries = grouped.get(definition.id) || [];
            if (!entries.length) return;
            var group = doc.createElement("section");
            var heading = doc.createElement("h2");
            var cards = doc.createElement("div");
            group.className = "category-hub__group";
            heading.textContent = definition.label;
            cards.className = "category-hub__cards" + (entries.length === 1 ? " category-hub__cards--single" : "");
            entries.forEach(function (entry) { cards.appendChild(navigationEntryCard(section, entry)); });
            group.append(heading, cards);
            content.appendChild(group);
        });
    }

    function applyCanonicalPageSection() {
        var currentPath = window.location.pathname.slice(siteRoot.pathname.length) || "index.html";
        var context = navigationModule?.navigationContextForPath(currentPath);
        if (context?.section) doc.body.dataset.librarySection = context.section.label;
        return context;
    }

    async function init() {
        if (!groups.length) {
            try {
                await loadNavigation();
            } catch (error) {
                return;
            }
        }
        var shellModules;
        try {
            shellModules = await loadShellModules();
        } catch (error) {
            return;
        }
        var themeController = shellModules.theme.createThemeController({
            document: doc,
            storage: storage,
            view: window,
        });
        themeController.applyInitial();
        var sessionController = shellModules.session.createSessionController({
            document: doc,
            storage: storage,
            view: window,
            pageUrl: pageUrl,
            createIcon: createIcon,
        });
        sessionController.applyInitial();
        doc.querySelectorAll("svg.icon:not([viewBox])").forEach(function (icon) {
            icon.setAttribute("viewBox", "0 0 64 64");
        });
        var mount = doc.querySelector("[data-site-header]");
        if (!mount) return;

        var navigationContext = applyCanonicalPageSection();
        var activePage = navigationContext?.entry?.id || mount.getAttribute("data-active") || "";
        ensureSkipLink(mount);
        enhanceFormAccessibility();
        var inner = doc.createElement("div");
        var logo = doc.createElement("a");
        var mark = doc.createElement("span");
        var logoText = doc.createElement("span");
        var logoTitle = doc.createElement("span");
        var logoSubtitle = doc.createElement("span");
        var actions = doc.createElement("div");
        var searchButton = doc.createElement("button");
        var searchIcon = doc.createElement("span");
        var searchLabel = doc.createElement("span");
        var searchShortcut = doc.createElement("kbd");
        var themeButton = iconButton("theme-toggle", "Changer de thème", "theme-sun");
        var sessionButton = iconButton("session-toggle", "Activer le mode session", "session");
        var shareButton = iconButton(
            "share-current",
            typeof navigator.share === "function" ? "Partager cette page" : "Copier le lien",
            "share",
        );
        var favoriteButton = null;
        var personalLink = doc.createElement("a");
        var profileSelect = doc.createElement("select");
        var noteButton = iconButton("note-current", "Ajouter une note personnelle", "glossary");
        var noteDialog = doc.createElement("dialog");
        var noteTitle = doc.createElement("h2");
        var noteLabel = doc.createElement("label");
        var noteField = doc.createElement("textarea");
        var noteHelp = doc.createElement("p");
        var noteClose = doc.createElement("button");
        var menuButton = iconButton("mobile-navigation-toggle", "Ouvrir le menu", "menu");
        var drawer = doc.createElement("aside");
        var drawerHead = doc.createElement("div");
        var drawerTitle = doc.createElement("span");
        var drawerClose = iconButton("mobile-navigation__close", "Fermer le menu", "close");
        var mobileTools = doc.createElement("nav");
        var mobilePersonalLink = doc.createElement("a");
        var mobileSessionButton = doc.createElement("button");
        var mobileSessionLabel = doc.createElement("span");
        var backdrop = doc.createElement("button");
        var search = createSearch();
        var sessionPanel = sessionController.createPanel();
        var shareStatus = doc.createElement("span");
        sharingController = shellModules.sharing.createSharingController({
            document: doc,
            view: window,
            status: shareStatus,
        });
        window.DndShare = Object.freeze({
            announce: sharingController.announce,
            copyLink: sharingController.copyLink,
            shareLink: sharingController.shareLink,
        });

        mount.className = "site-header";
        inner.className = "site-header__inner";
        logo.className = "site-logo";
        logo.href = pageUrl("index.html");
        logo.setAttribute("aria-label", "D&D 2024 — Accueil");
        mark.className = "site-logo__mark";
        mark.appendChild(createIcon("site-emblem"));
        logoText.className = "site-logo__text";
        logoTitle.className = "site-logo__title";
        logoTitle.textContent = "D&D 2024";
        logoSubtitle.className = "site-logo__subtitle";
        logoSubtitle.textContent = "Le Compagnon de jeu";
        actions.className = "site-header__actions";
        personalLink.className = "icon-button personal-space-link";
        personalLink.href = pageUrl("espace-personnel.html");
        personalLink.setAttribute("aria-label", "Ouvrir mon espace personnel");
        personalLink.title = "Espace personnel";
        personalLink.appendChild(createIcon("characters"));
        mobileTools.className = "mobile-navigation__tools";
        mobileTools.setAttribute("aria-label", "Outils personnels");
        mobilePersonalLink.className = "mobile-navigation__tool mobile-navigation__personal-link";
        mobilePersonalLink.href = pageUrl("espace-personnel.html");
        mobilePersonalLink.append(createIcon("characters"), document.createTextNode("Espace personnel"));
        mobileSessionButton.type = "button";
        mobileSessionButton.className = "mobile-navigation__tool mobile-navigation__session-toggle";
        mobileSessionButton.append(createIcon("session"), mobileSessionLabel);
        mobileTools.append(mobilePersonalLink, mobileSessionButton);
        var noteId = doc.body.dataset.contentId || (
            window.location.pathname.slice(siteRoot.pathname.length) + window.location.search + window.location.hash
        );
        shellModules.personal.createPersonalTools({
            document: doc,
            view: window,
            profileSelect: profileSelect,
            noteButton: noteButton,
            noteDialog: noteDialog,
            noteTitle: noteTitle,
            noteLabel: noteLabel,
            noteField: noteField,
            noteHelp: noteHelp,
            noteClose: noteClose,
            noteId: noteId,
        });
        shareStatus.className = "share-feedback";
        shareStatus.setAttribute("role", "status");
        shareStatus.setAttribute("aria-live", "polite");
        searchButton.type = "button";
        searchButton.className = "search-trigger";
        searchButton.setAttribute("aria-label", "Ouvrir la recherche");
        searchIcon.className = "search-trigger__icon";
        searchIcon.setAttribute("aria-hidden", "true");
        searchIcon.appendChild(createIcon("search"));
        searchLabel.className = "search-trigger__label";
        searchLabel.textContent = "Rechercher…";
        searchShortcut.textContent = "Ctrl K";
        searchButton.append(searchIcon, searchLabel, searchShortcut);

        drawer.className = "mobile-navigation";
        drawer.setAttribute("role", "dialog");
        drawer.setAttribute("aria-modal", "true");
        drawer.setAttribute("aria-label", "Navigation du site");
        drawer.setAttribute("aria-hidden", "true");
        drawer.setAttribute("inert", "");
        drawerHead.className = "mobile-navigation__head";
        drawerTitle.className = "mobile-navigation__title";
        drawerTitle.textContent = "Navigation";
        backdrop.className = "drawer-backdrop";
        backdrop.type = "button";
        backdrop.setAttribute("aria-label", "Fermer la navigation");
        themeController.bind(themeButton, setButtonIcon);
        sessionButton.setAttribute("aria-pressed", String(doc.documentElement.dataset.session === "true"));
        sessionButton.classList.toggle("is-active", doc.documentElement.dataset.session === "true");
        var initialSessionEnabled = doc.documentElement.dataset.session === "true";
        mobileSessionLabel.textContent = initialSessionEnabled ? "Désactiver le mode session" : "Activer le mode session";
        mobileSessionButton.setAttribute("aria-pressed", String(initialSessionEnabled));
        if (initialSessionEnabled) sessionButton.setAttribute("aria-label", "Désactiver le mode session");

        var mobileNavigationController = null;

        function setSessionPanel(open) {
            var enabled = doc.documentElement.dataset.session === "true";
            var shouldOpen = Boolean(open && enabled);
            sessionPanel.panel.classList.toggle("is-open", shouldOpen);
            sessionPanel.backdrop.classList.toggle("is-open", shouldOpen);
            sessionPanel.panel.setAttribute("aria-hidden", String(!shouldOpen));
            if (shouldOpen) sessionPanel.panel.removeAttribute("inert");
            else sessionPanel.panel.setAttribute("inert", "");
            sessionPanel.openButton.setAttribute("aria-expanded", String(shouldOpen));
            doc.body.classList.toggle("has-open-session-panel", shouldOpen);
            if (shouldOpen) {
                if (mobileNavigationController) mobileNavigationController.setOpen(false);
                sessionPanel.render();
                sessionPanel.closeButton.focus();
            } else if (doc.activeElement && sessionPanel.panel.contains(doc.activeElement)) {
                sessionPanel.openButton.focus();
            }
        }

        function updateSessionMode(enabled, openPanel) {
            sessionController.setMode(enabled, true);
            sessionButton.setAttribute("aria-pressed", String(enabled));
            sessionButton.setAttribute("aria-label", enabled ? "Désactiver le mode session" : "Activer le mode session");
            sessionButton.classList.toggle("is-active", enabled);
            mobileSessionButton.setAttribute("aria-pressed", String(enabled));
            mobileSessionLabel.textContent = enabled ? "Désactiver le mode session" : "Activer le mode session";
            if (!enabled) {
                setSessionPanel(false);
                sessionButton.focus();
            }
            else if (openPanel) setSessionPanel(true);
        }

        if (window.DndLibrary && activePage !== "home") {
            favoriteButton = iconButton("favorite-current", "Ajouter cette page aux favoris", "favorite-empty");
            window.DndLibrary.connectFavoriteButton(favoriteButton, window.DndLibrary.currentEntry());
        }

        mobileNavigationController = shellModules.mobile.createMobileNavigationController({
            document: doc,
            drawer: drawer,
            backdrop: backdrop,
            menuButton: menuButton,
            closeButton: drawerClose,
            setSessionPanel: setSessionPanel,
        });

        shellModules.searchTrigger.bindSearchTriggers({
            document: doc,
            search: search,
            searchButton: searchButton,
            setSessionPanel: setSessionPanel,
        });
        sessionButton.addEventListener("click", function () {
            var enabled = doc.documentElement.dataset.session !== "true";
            updateSessionMode(enabled, enabled);
        });
        mobileSessionButton.addEventListener("click", function () { sessionButton.click(); });
        shareButton.addEventListener("click", sharingController.shareCurrentPage);
        sessionPanel.openButton.addEventListener("click", function () { setSessionPanel(true); });
        sessionPanel.closeButton.addEventListener("click", function () { setSessionPanel(false); });
        sessionPanel.backdrop.addEventListener("click", function () { setSessionPanel(false); });
        sessionPanel.exitButton.addEventListener("click", function () { updateSessionMode(false, false); });
        sessionPanel.panel.addEventListener("click", function (event) {
            if (event.target.closest("a")) setSessionPanel(false);
        });
        doc.addEventListener("click", function (event) {
            doc.querySelectorAll(".site-header .nav-dropdown[open]").forEach(function (details) {
                if (!details.contains(event.target)) details.removeAttribute("open");
            });
        });
        shellModules.keyboard.bindKeyboardShortcuts({
            document: doc,
            search: search,
            sessionPanel: sessionPanel,
            drawer: drawer,
            setSessionPanel: setSessionPanel,
            setDrawer: mobileNavigationController.setOpen,
        });

        logoText.append(logoTitle, logoSubtitle);
        logo.append(mark, logoText);
        actions.append(searchButton);
        if (favoriteButton) actions.append(favoriteButton);
        actions.append(profileSelect, personalLink, noteButton, shareButton, sessionPanel.openButton, sessionButton, themeButton, menuButton);
        inner.append(logo, createNavigation(activePage, false), actions);
        drawerHead.append(drawerTitle, drawerClose);
        drawer.append(drawerHead, createNavigation(activePage, true), mobileTools);
        mount.replaceChildren(inner);
        doc.body.append(backdrop, drawer, sessionPanel.backdrop, sessionPanel.panel, noteDialog, shareStatus);
        renderHomeExplorer();
        renderCategoryHub();
        window.dispatchEvent(new CustomEvent("dndnavigationready"));
        enhanceDeepLinks();
        if (doc.body.classList.contains("dense-page")) {
            import(pageUrl("js/dense-pages.js"))
                .then(function (module) { return module.initDensePage(doc, window); })
                .catch(function () {});
        }
        import(pageUrl("js/related-content.js"))
            .then(function (module) { return module.initRelatedContent(doc, window); })
            .catch(function () {});
        import(pageUrl("js/context-share.js")).catch(function () {});
    }

    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
