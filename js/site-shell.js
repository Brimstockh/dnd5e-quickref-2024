(function () {
    "use strict";

    var doc = document;
    var script = doc.currentScript;
    var siteRoot = new URL("../", script ? script.src : window.location.href);
    var themeKey = "dnd2024_theme";
    var sessionKey = "dnd2024_session_mode";
    var storage = window.DndStorage;
    var shareStatus = null;
    var shareStatusTimer = 0;

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

    if (!doc.querySelector("script[data-github-report-client]")) {
        var githubReportClient = doc.createElement("script");
        githubReportClient.src = new URL("js/github-report.js", siteRoot).href;
        githubReportClient.dataset.githubReportClient = "";
        doc.head.append(githubReportClient);
    }

    if (!doc.querySelector("script[data-glossary-client]")) {
        var glossaryClient = doc.createElement("script");
        glossaryClient.type = "module";
        glossaryClient.src = new URL("js/glossary-client.js", siteRoot).href;
        glossaryClient.dataset.glossaryClient = "";
        doc.head.append(glossaryClient);
    }

    var groups = [
        {
            id: "rules",
            label: "Règles",
            links: [
                ["quickref", "Référence rapide", "quickref.html", "Actions et conditions en session"],
                ["rules", "Règles du jeu", "rules-2024.html", "Principes généraux 2024"],
                ["combat", "Combat", "combat-2024.html", "Initiative, attaques et dégâts"],
                ["mastery", "Maîtrise", "mastery-2024.html", "Maîtrises d’armes et actions"],
                ["glossary", "Glossaire", "glossaire.html", "Termes et états de jeu"],
                ["spells", "Sorts", "spells.html", "Catalogue des sorts"],
                ["equipment", "Équipement", "armes-armures.html", "Armes et armures"],
                ["monsters", "Monstres", "monstres.html", "Bestiaire"],
            ],
        },
        {
            id: "character",
            label: "Création de personnage",
            links: [
                ["creation", "Créer un personnage", "creation-personnage-2024.html", "Guide de création"],
                ["creator", "Assistant guidé", "assistant-creation.html", "Création en 11 étapes"],
                ["compare", "Comparateur", "comparateur.html", "Comparer classes, espèces et options"],
                ["classes", "Classes", "classes/index.html", "Les douze classes"],
                ["species", "Espèces", "races/index.html", "Peuples et origines"],
                ["backgrounds", "Historiques", "historique.html", "Dons et compétences"],
                ["feats", "Dons", "dons.html", "Capacités spéciales"],
                ["sheet", "Feuille de personnage", "character-sheet-standalone.html", "Feuille autonome"],
            ],
        },
        {
            id: "universe",
            label: "Univers",
            links: [
                ["faerun", "Royaumes Oubliés", "faerun.html", "Explorer Faerûn"],
                ["history", "Histoire", "histoire-royaumes.html", "Chronologie du monde"],
                ["gods", "Divinités", "divinites.html", "Panthéon de Faerûn"],
                ["factions", "Factions", "groupes-royaumes.html", "Groupes influents"],
                ["people", "Personnages", "personnages-royaumes.html", "Figures importantes"],
                ["planes", "Plans d’existence", "plans-existence.html", "Les autres réalités"],
            ],
        },
        {
            id: "tools",
            label: "Outils",
            links: [
                ["personal", "Espace personnel", "espace-personnel.html", "Bibliothèque, notes et profils"],
                ["sheet-tools", "Feuille autonome", "character-sheet-standalone.html", "Créer et sauvegarder une fiche"],
                ["characters", "Personnages sauvegardés", "html/characters.html", "Consulter les personnages"],
                ["tools", "Matériel d’aventurier", "outils-aventurier.html", "Outils, paquetages et objets"],
                ["dice-stats", "Statistiques de dés", "dice-stats.html", "Probabilités et distributions des jets de dés"],
            ],
        },
    ];

    function pageUrl(path) {
        return new URL(path, siteRoot).href;
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

    function announceShare(message, isError) {
        if (!shareStatus) return;
        window.clearTimeout(shareStatusTimer);
        shareStatus.textContent = message;
        shareStatus.classList.toggle("is-error", Boolean(isError));
        shareStatus.classList.add("is-visible");
        shareStatusTimer = window.setTimeout(function () {
            shareStatus.classList.remove("is-visible");
        }, 2600);
    }

    function fallbackCopy(text) {
        var field = doc.createElement("textarea");
        field.value = text;
        field.setAttribute("readonly", "");
        field.className = "share-copy-field";
        doc.body.appendChild(field);
        field.select();
        var copied = typeof doc.execCommand === "function" && doc.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Copy unavailable");
    }

    async function copyLink(url, successMessage) {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                await navigator.clipboard.writeText(url);
            } else {
                fallbackCopy(url);
            }
            announceShare(successMessage || "Lien copié dans le presse-papiers.", false);
            return true;
        } catch (error) {
            try {
                fallbackCopy(url);
                announceShare(successMessage || "Lien copié dans le presse-papiers.", false);
                return true;
            } catch (fallbackError) {
                announceShare("Impossible de copier le lien.", true);
                return false;
            }
        }
    }

    async function copyCurrentLink() {
        return copyLink(window.location.href);
    }

    function currentShareTitle() {
        var activeContext = doc.querySelector("#quickref-detail-layer.is-open [data-context-share-root]")
            || Array.from(doc.querySelectorAll("details[open][data-context-share-root]")).pop();
        if (!activeContext) {
            var parameters = new URLSearchParams(window.location.search);
            activeContext = Array.from(doc.querySelectorAll("[data-context-share-root]")).find(function (element) {
                var parameter = element.dataset.contextShareParameter;
                return parameter && parameters.get(parameter) === element.dataset.contextShareValue;
            });
        }
        var contextTitle = activeContext && (
            activeContext.dataset.contextShareTitle
            || activeContext.querySelector(".catalog-card__title, .feat-title, .monster-title, summary h3, h2, h3")?.textContent?.trim()
        );
        var libraryTitle = doc.body.dataset.libraryTitle || doc.title;
        return contextTitle ? contextTitle + " — " + libraryTitle : libraryTitle;
    }

    async function shareLink(url, title) {
        if (typeof navigator.share === "function") {
            try {
                await navigator.share({
                    title: title || currentShareTitle(),
                    url: url,
                });
                announceShare("Lien partagé.", false);
                return true;
            } catch (error) {
                if (error && error.name === "AbortError") return false;
            }
        }
        return copyLink(url);
    }

    async function shareCurrentPage() {
        return shareLink(window.location.href, currentShareTitle());
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
        doc.querySelectorAll("main h2, main h3").forEach(function (heading) {
            if (heading.closest("[data-site-header], dialog, .search-dialog, .session-panel")) return;
            var legacyAnchor = heading.querySelector("a[id]");
            var id = heading.id || (legacyAnchor ? legacyAnchor.id : "");
            if (!id) {
                var base = slugify(heading.textContent) || "section";
                id = base;
                var suffix = 2;
                while (used.has(id)) {
                    id = base + "-" + suffix;
                    suffix += 1;
                }
                heading.id = id;
                used.add(id);
            }
            if (heading.querySelector(".heading-anchor")) return;
            var anchor = doc.createElement("a");
            anchor.className = "heading-anchor";
            anchor.href = "#" + encodeURIComponent(id);
            anchor.setAttribute("aria-label", "Lien vers la section « " + heading.textContent.trim() + " »");
            anchor.textContent = "#";
            heading.appendChild(anchor);
        });
        window.addEventListener("hashchange", revealHashTarget);
        window.addEventListener("popstate", function () {
            window.requestAnimationFrame(revealHashTarget);
        });
        window.requestAnimationFrame(revealHashTarget);
    }

    window.DndShare = Object.freeze({
        announce: announceShare,
        copyLink: copyLink,
        shareLink: shareLink,
    });

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

    function setTheme(theme, persist) {
        doc.documentElement.dataset.theme = theme;
        if (!persist) return;
        storage.set(themeKey, theme);
    }

    function initialTheme() {
        var saved = storage.get(themeKey, null);
        if (saved === "dark" || saved === "light") return saved;
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    function setSessionMode(enabled, persist) {
        doc.documentElement.dataset.session = enabled ? "true" : "false";
        if (!persist) return;
        storage.set(sessionKey, enabled ? "true" : "false");
    }

    function initialSessionMode() {
        return storage.get(sessionKey, "false") === "true";
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
            summary.append(doc.createTextNode(group.label), createIcon("chevron-down", "nav-dropdown__chevron"));
            menu.className = "nav-dropdown__menu";

            group.links.forEach(function (entry) {
                var link = doc.createElement("a");
                link.href = pageUrl(entry[2]);
                link.textContent = entry[1];
                if (entry[0] === activePage) {
                    link.setAttribute("aria-current", "page");
                    groupIsActive = true;
                }
                menu.appendChild(link);
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
            shareLink.addEventListener("click", shareCurrentPage);
            nav.appendChild(shareLink);
        }

        return nav;
    }

    function searchEntries() {
        var seen = new Set();
        var entries = [{ id: "home", title: "Accueil", path: "index.html", group: "Page", description: "Tableau de bord D&D 2024", isBase: true }];
        groups.forEach(function (group) {
            group.links.forEach(function (entry) {
                if (seen.has(entry[2])) return;
                seen.add(entry[2]);
                entries.push({ id: entry[0], title: entry[1], path: entry[2], group: group.label, description: entry[3], isBase: true });
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
        var activeCategory = "";
        var indexLoaded = false;
        var indexLoading = null;
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
        filters.setAttribute("aria-label", "Filtrer les résultats par catégorie");
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

        function loadIndex() {
            if (indexLoaded || indexLoading || typeof window.fetch !== "function") return indexLoading;
            indexLoading = window.fetch(pageUrl("data/search-index.json"))
                .then(function (response) {
                    if (!response.ok) throw new Error("Search index unavailable");
                    return response.json();
                })
                .then(function (payload) {
                    var indexed = payload && Array.isArray(payload.entries) ? payload.entries : [];
                    var knownPaths = new Set(entries.map(function (entry) { return entry.path; }));
                    indexed.slice(0, 3000).forEach(function (entry) {
                        if (!entry || !entry.title || !entry.url) return;
                        if (knownPaths.has(String(entry.url))) return;
                        knownPaths.add(String(entry.url));
                        entries.push({
                            id: String(entry.id || entry.url),
                            title: String(entry.title),
                            path: String(entry.url),
                            group: String(entry.category || "Contenu"),
                            description: String(entry.excerpt || ""),
                            aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
                            keywords: Array.isArray(entry.keywords) ? entry.keywords.join(" ") : "",
                            isBase: false,
                        });
                    });
                    indexLoaded = true;
                    render();
                })
                .catch(function () { indexLoaded = true; });
            return indexLoading;
        }

        function recentEntries() {
            var api = window.DndLibrary;
            if (!api || typeof api.getRecent !== "function") return [];
            return api.getRecent().slice(0, 8).map(function (entry, index) {
                return {
                    id: "recent-" + index,
                    title: entry.title,
                    path: entry.url,
                    group: entry.category || "Page",
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

        function fallbackMatches(category, limit) {
            var query = normalize(input.value.trim());
            var queryTokens = query.split(/\s+/).filter(Boolean);
            if (!query) {
                var defaults = recentEntries().concat(entries.filter(function (entry) { return entry.isBase; }));
                var seenPaths = new Set();
                return defaults.filter(function (entry) {
                    if (category && entry.group !== category) return false;
                    var identity = entry.isRecent
                        ? "recent|" + normalize(entry.group) + "|" + normalize(entry.title)
                        : entry.path;
                    if (seenPaths.has(identity)) return false;
                    seenPaths.add(identity);
                    return true;
                }).slice(0, limit);
            }
            return entries.filter(function (entry) {
                if (category && entry.group !== category) return false;
                var searchable = normalize([entry.title, entry.group, entry.description, entry.keywords].join(" "));
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
            }).slice(0, limit);
        }

        function matchingEntries(category, limit) {
            if (!engine || !input.value.trim()) return fallbackMatches(category, limit);
            var context = searchContext();
            return engine.searchEntries(entries, input.value, {
                category: category,
                limit: limit,
                boostIds: context.boostIds,
                recentUrls: context.recentUrls,
            }).map(function (result) {
                return Object.assign({}, result.entry, { matchReason: result.reason });
            });
        }

        function categoryCounts(matches) {
            return matches.reduce(function (counts, entry) {
                counts.set(entry.group, (counts.get(entry.group) || 0) + 1);
                return counts;
            }, new Map());
        }

        function renderFilters(matches) {
            var counts = categoryCounts(matches);
            if (activeCategory && !counts.has(activeCategory)) activeCategory = "";
            filters.replaceChildren();
            [["", "Tout", matches.length]].concat(Array.from(counts.entries()).sort(function (first, second) {
                return second[1] - first[1] || first[0].localeCompare(second[0], "fr");
            }).map(function (entry) { return [entry[0], entry[0], entry[1]]; })).forEach(function (definition) {
                var button = doc.createElement("button");
                button.type = "button";
                button.className = "search-dialog__filter";
                button.textContent = definition[1] + " " + definition[2];
                button.setAttribute("aria-pressed", String(activeCategory === definition[0]));
                button.addEventListener("click", function () {
                    activeCategory = definition[0];
                    selectedIndex = 0;
                    render();
                    input.focus();
                });
                filters.appendChild(button);
            });
        }

        function render() {
            var allMatches = matchingEntries("", input.value.trim() ? 3000 : 30);
            var parsed = engine ? engine.parseSearchQuery(input.value) : { command: "", query: input.value };
            renderFilters(allMatches);
            var matches = activeCategory ? matchingEntries(activeCategory, 24) : allMatches.slice(0, 24);
            var total = activeCategory ? allMatches.filter(function (entry) { return entry.group === activeCategory; }).length : allMatches.length;
            selectedIndex = Math.min(selectedIndex, Math.max(matches.length - 1, 0));
            results.replaceChildren();
            resultCount.textContent = total + " résultat" + (total > 1 ? "s" : "")
                + (activeCategory ? " · " + activeCategory : "")
                + (parsed.command ? " · commande " + parsed.command : "");
            if (!matches.length) {
                var empty = doc.createElement("li");
                empty.className = "search-empty";
                empty.innerHTML = "<strong>Aucun résultat</strong><span>Essayez moins de mots ou une autre catégorie.</span>";
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
                category.textContent = entry.group;
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

        input.addEventListener("input", function () { selectedIndex = 0; activeCategory = ""; render(); });
        input.addEventListener("keydown", function (event) {
            var matches = matchingEntries(activeCategory, 24);
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
                activeCategory = "";
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

    function createSessionPanel() {
        var openButton = iconButton("session-panel-toggle", "Ouvrir le panneau de session", "session");
        var panel = doc.createElement("aside");
        var backdrop = doc.createElement("button");
        var header = doc.createElement("header");
        var heading = doc.createElement("div");
        var eyebrow = doc.createElement("span");
        var title = doc.createElement("h2");
        var closeButton = iconButton("session-panel__close", "Fermer le panneau de session", "close");
        var quickTitle = doc.createElement("h3");
        var quickActions = doc.createElement("nav");
        var library = doc.createElement("div");
        var favoritesSection = doc.createElement("section");
        var favoritesTitle = doc.createElement("h3");
        var favoritesList = doc.createElement("ul");
        var recentSection = doc.createElement("section");
        var recentHead = doc.createElement("div");
        var recentTitle = doc.createElement("h3");
        var clearRecent = doc.createElement("button");
        var recentList = doc.createElement("ul");
        var exitButton = doc.createElement("button");

        var actionEntries = [
            ["quick-reference", "Référence rapide", "Actions et états", "quickref.html"],
            ["spells", "Sorts", "Catalogue complet", "spells.html"],
            ["monsters", "Monstres", "Bestiaire", "monstres.html"],
            ["combat", "Combat", "Règles essentielles", "combat-2024.html"],
        ];

        openButton.setAttribute("aria-controls", "sessionPanel");
        openButton.setAttribute("aria-expanded", "false");
        panel.id = "sessionPanel";
        panel.className = "session-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-labelledby", "sessionPanelTitle");
        panel.setAttribute("aria-hidden", "true");
        panel.setAttribute("inert", "");
        backdrop.type = "button";
        backdrop.className = "session-panel-backdrop";
        backdrop.setAttribute("aria-label", "Fermer le panneau de session");
        header.className = "session-panel__header";
        heading.className = "session-panel__heading";
        eyebrow.className = "session-panel__eyebrow";
        eyebrow.textContent = "Mode session actif";
        title.id = "sessionPanelTitle";
        title.textContent = "Table de jeu";
        heading.append(eyebrow, title);
        header.append(heading, closeButton);

        quickTitle.textContent = "Actions rapides";
        quickActions.className = "session-panel__quick-actions";
        quickActions.setAttribute("aria-labelledby", "sessionQuickActionsTitle");
        quickTitle.id = "sessionQuickActionsTitle";
        actionEntries.forEach(function (entry) {
            var link = doc.createElement("a");
            var icon = doc.createElement("span");
            var text = doc.createElement("span");
            var strong = doc.createElement("strong");
            var small = doc.createElement("small");
            link.href = pageUrl(entry[3]);
            icon.setAttribute("aria-hidden", "true");
            icon.appendChild(createIcon(entry[0]));
            strong.textContent = entry[1];
            small.textContent = entry[2];
            text.append(strong, small);
            link.append(icon, text);
            quickActions.appendChild(link);
        });

        library.className = "session-panel__library";
        favoritesTitle.textContent = "Favoris";
        favoritesList.className = "session-panel__list";
        favoritesSection.append(favoritesTitle, favoritesList);
        recentHead.className = "session-panel__section-head";
        recentTitle.textContent = "Consultés récemment";
        clearRecent.type = "button";
        clearRecent.textContent = "Effacer";
        recentHead.append(recentTitle, clearRecent);
        recentList.className = "session-panel__list";
        recentSection.append(recentHead, recentList);
        library.append(favoritesSection, recentSection);

        exitButton.type = "button";
        exitButton.className = "session-panel__exit";
        exitButton.textContent = "Quitter le mode session";

        function appendEntries(container, entries, emptyText) {
            container.replaceChildren();
            if (!entries.length) {
                var empty = doc.createElement("li");
                empty.className = "session-panel__empty";
                empty.textContent = emptyText;
                container.appendChild(empty);
                return;
            }
            entries.slice(0, 4).forEach(function (entry) {
                var item = doc.createElement("li");
                var link = doc.createElement("a");
                var text = doc.createElement("span");
                var meta = doc.createElement("small");
                link.href = pageUrl(entry.url);
                text.textContent = entry.title;
                meta.textContent = entry.category || "Page";
                link.append(text, meta);
                item.appendChild(link);
                container.appendChild(item);
            });
        }

        function render() {
            var api = window.DndLibrary;
            appendEntries(favoritesList, api ? api.getFavorites() : [], "Ajoutez des pages avec l’étoile.");
            appendEntries(recentList, api ? api.getRecent() : [], "Vos dernières consultations apparaîtront ici.");
            clearRecent.disabled = !api || api.getRecent().length === 0;
        }

        clearRecent.addEventListener("click", function () {
            if (window.DndLibrary) window.DndLibrary.clearRecent();
            render();
        });
        window.addEventListener("dndlibrarychange", render);
        panel.append(header, quickTitle, quickActions, library, exitButton);
        render();
        return {
            openButton: openButton,
            panel: panel,
            backdrop: backdrop,
            closeButton: closeButton,
            exitButton: exitButton,
            render: render,
        };
    }

    function init() {
        setTheme(initialTheme(), false);
        setSessionMode(initialSessionMode(), false);
        doc.querySelectorAll("svg.icon:not([viewBox])").forEach(function (icon) {
            icon.setAttribute("viewBox", "0 0 64 64");
        });
        var mount = doc.querySelector("[data-site-header]");
        if (!mount) return;

        var activePage = mount.getAttribute("data-active") || "";
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
        var backdrop = doc.createElement("button");
        var search = createSearch();
        var sessionPanel = createSessionPanel();
        shareStatus = doc.createElement("span");

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
        profileSelect.className = "active-profile-select";
        profileSelect.setAttribute("aria-label", "Profil de personnage actif");
        function renderProfileSelect() {
            var api = window.DndProfiles;
            var all = api && typeof api.getAll === "function" ? api.getAll() : [];
            var active = api && typeof api.getActive === "function" ? api.getActive() : null;
            profileSelect.replaceChildren(new Option("Sans profil", ""));
            all.forEach(function (profile) { profileSelect.appendChild(new Option(profile.name, profile.id)); });
            profileSelect.value = active?.id || "";
            profileSelect.hidden = all.length === 0;
        }
        profileSelect.addEventListener("change", function () {
            if (window.DndProfiles) window.DndProfiles.setActive(profileSelect.value);
        });
        window.addEventListener("dndpersonalchange", renderProfileSelect);
        renderProfileSelect();
        var noteId = doc.body.dataset.contentId || (
            window.location.pathname.slice(siteRoot.pathname.length) + window.location.search + window.location.hash
        );
        noteDialog.className = "personal-note-dialog";
        noteTitle.textContent = "Note personnelle";
        noteLabel.textContent = "Votre note sur cette page";
        noteLabel.htmlFor = "personal-page-note";
        noteField.id = "personal-page-note";
        noteField.rows = 7;
        noteField.maxLength = 5000;
        noteHelp.textContent = "Enregistrée automatiquement sur cet appareil. Elle ne fait pas partie des règles officielles.";
        noteClose.className = "button";
        noteClose.type = "button";
        noteClose.textContent = "Fermer";
        noteDialog.append(noteTitle, noteHelp, noteLabel, noteField, noteClose);
        function updateNoteButton() {
            var hasNote = Boolean(window.DndPersonal?.getNote(noteId));
            noteButton.classList.toggle("is-active", hasNote);
            noteButton.setAttribute("aria-label", hasNote ? "Modifier la note personnelle" : "Ajouter une note personnelle");
        }
        noteButton.addEventListener("click", function () {
            noteField.value = window.DndPersonal?.getNote(noteId) || "";
            noteDialog.showModal();
            noteField.focus();
        });
        noteField.addEventListener("input", function () {
            if (window.DndPersonal) window.DndPersonal.setNote(noteId, noteField.value);
        });
        noteClose.addEventListener("click", function () { noteDialog.close(); });
        window.addEventListener("dndpersonalchange", updateNoteButton);
        updateNoteButton();
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
        setButtonIcon(themeButton, doc.documentElement.dataset.theme === "dark" ? "theme-sun" : "theme-moon");
        sessionButton.setAttribute("aria-pressed", String(doc.documentElement.dataset.session === "true"));
        sessionButton.classList.toggle("is-active", doc.documentElement.dataset.session === "true");
        if (doc.documentElement.dataset.session === "true") sessionButton.setAttribute("aria-label", "Désactiver le mode session");

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
                setDrawer(false);
                sessionPanel.render();
                sessionPanel.closeButton.focus();
            } else if (doc.activeElement && sessionPanel.panel.contains(doc.activeElement)) {
                sessionPanel.openButton.focus();
            }
        }

        function updateSessionMode(enabled, openPanel) {
            setSessionMode(enabled, true);
            sessionButton.setAttribute("aria-pressed", String(enabled));
            sessionButton.setAttribute("aria-label", enabled ? "Désactiver le mode session" : "Activer le mode session");
            sessionButton.classList.toggle("is-active", enabled);
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

        function setDrawer(open) {
            if (open) setSessionPanel(false);
            drawer.classList.toggle("is-open", open);
            backdrop.classList.toggle("is-open", open);
            drawer.setAttribute("aria-hidden", String(!open));
            if (open) drawer.removeAttribute("inert");
            else drawer.setAttribute("inert", "");
            menuButton.setAttribute("aria-expanded", String(open));
            doc.body.classList.toggle("has-open-drawer", open);
            if (open) drawerClose.focus();
            else menuButton.focus();
        }

        searchButton.addEventListener("click", function () { setSessionPanel(false); search.open(); });
        doc.querySelectorAll("[data-open-site-search]").forEach(function (button) {
            button.addEventListener("click", search.open);
        });
        themeButton.addEventListener("click", function () {
            var next = doc.documentElement.dataset.theme === "dark" ? "light" : "dark";
            setTheme(next, true);
            setButtonIcon(themeButton, next === "dark" ? "theme-sun" : "theme-moon");
        });
        sessionButton.addEventListener("click", function () {
            var enabled = doc.documentElement.dataset.session !== "true";
            updateSessionMode(enabled, enabled);
        });
        shareButton.addEventListener("click", shareCurrentPage);
        sessionPanel.openButton.addEventListener("click", function () { setSessionPanel(true); });
        sessionPanel.closeButton.addEventListener("click", function () { setSessionPanel(false); });
        sessionPanel.backdrop.addEventListener("click", function () { setSessionPanel(false); });
        sessionPanel.exitButton.addEventListener("click", function () { updateSessionMode(false, false); });
        sessionPanel.panel.addEventListener("click", function (event) {
            if (event.target.closest("a")) setSessionPanel(false);
        });
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.addEventListener("click", function () { setDrawer(true); });
        drawerClose.addEventListener("click", function () { setDrawer(false); });
        backdrop.addEventListener("click", function () { setDrawer(false); });
        drawer.addEventListener("click", function (event) {
            if (event.target.closest("a, .mobile-share-link")) setDrawer(false);
        });
        doc.addEventListener("click", function (event) {
            doc.querySelectorAll(".site-header .nav-dropdown[open]").forEach(function (details) {
                if (!details.contains(event.target)) details.removeAttribute("open");
            });
        });
        doc.addEventListener("keydown", function (event) {
            var editable = /^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement ? doc.activeElement.tagName : "");
            if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
                event.preventDefault();
                search.open();
            } else if (event.key === "/" && !editable) {
                event.preventDefault();
                var pageSearch = doc.querySelector("[data-page-search]");
                if (pageSearch) {
                    pageSearch.focus();
                    if (typeof pageSearch.select === "function") pageSearch.select();
                } else {
                    search.open();
                }
            } else if (event.key === "Escape" && sessionPanel.panel.classList.contains("is-open")) {
                setSessionPanel(false);
            } else if (event.key === "Tab" && sessionPanel.panel.classList.contains("is-open")) {
                var sessionFocusable = sessionPanel.panel.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])");
                if (!sessionFocusable.length) return;
                var sessionFirst = sessionFocusable[0];
                var sessionLast = sessionFocusable[sessionFocusable.length - 1];
                if (event.shiftKey && doc.activeElement === sessionFirst) {
                    event.preventDefault();
                    sessionLast.focus();
                } else if (!event.shiftKey && doc.activeElement === sessionLast) {
                    event.preventDefault();
                    sessionFirst.focus();
                }
            } else if (event.key === "Escape" && drawer.classList.contains("is-open")) {
                setDrawer(false);
            } else if (event.key === "Tab" && drawer.classList.contains("is-open")) {
                var focusable = drawer.querySelectorAll("a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex='-1'])");
                if (!focusable.length) return;
                var first = focusable[0];
                var last = focusable[focusable.length - 1];
                if (event.shiftKey && doc.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && doc.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });

        logoText.append(logoTitle, logoSubtitle);
        logo.append(mark, logoText);
        actions.append(searchButton);
        if (favoriteButton) actions.append(favoriteButton);
        actions.append(profileSelect, personalLink, noteButton, shareButton, sessionPanel.openButton, sessionButton, themeButton, menuButton);
        inner.append(logo, createNavigation(activePage, false), actions);
        drawerHead.append(drawerTitle, drawerClose);
        drawer.append(drawerHead, createNavigation(activePage, true));
        mount.replaceChildren(inner);
        doc.body.append(backdrop, drawer, sessionPanel.backdrop, sessionPanel.panel, noteDialog, shareStatus);
        enhanceDeepLinks();
        import(pageUrl("js/related-content.js"))
            .then(function (module) { return module.initRelatedContent(doc, window); })
            .catch(function () {});
        import(pageUrl("js/context-share.js")).catch(function () {});
    }

    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
