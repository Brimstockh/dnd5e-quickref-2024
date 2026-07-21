(function () {
    "use strict";

    var doc = document;
    var script = doc.currentScript;
    var siteRoot = new URL("../", script ? script.src : window.location.href);
    var themeKey = "dnd2024_theme";
    var sessionKey = "dnd2024_session_mode";

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
                ["sheet-tools", "Feuille autonome", "character-sheet-standalone.html", "Créer et sauvegarder une fiche"],
                ["characters", "Personnages sauvegardés", "html/characters.html", "Consulter les personnages"],
                ["tools", "Matériel d’aventurier", "outils-aventurier.html", "Outils, paquetages et objets"],
            ],
        },
    ];

    function pageUrl(path) {
        return new URL(path, siteRoot).href;
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
        try { localStorage.setItem(themeKey, theme); } catch (error) { /* Storage can be disabled. */ }
    }

    function initialTheme() {
        try {
            var saved = localStorage.getItem(themeKey);
            if (saved === "dark" || saved === "light") return saved;
        } catch (error) { /* Storage can be disabled. */ }
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    function setSessionMode(enabled, persist) {
        doc.documentElement.dataset.session = enabled ? "true" : "false";
        if (!persist) return;
        try { localStorage.setItem(sessionKey, enabled ? "true" : "false"); } catch (error) { /* Storage can be disabled. */ }
    }

    function initialSessionMode() {
        try { return localStorage.getItem(sessionKey) === "true"; } catch (error) { return false; }
    }

    function iconButton(className, label, symbol) {
        var button = doc.createElement("button");
        button.type = "button";
        button.className = "icon-button " + className;
        button.setAttribute("aria-label", label);
        button.textContent = symbol;
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
            summary.textContent = group.label;
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
        var close = iconButton("search-dialog__close", "Fermer la recherche", "×");
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

        function fallbackMatches(category, limit) {
            var query = normalize(input.value.trim());
            var queryTokens = query.split(/\s+/).filter(Boolean);
            if (!query) return entries.filter(function (entry) { return entry.isBase && (!category || entry.group === category); }).slice(0, limit);
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
            return engine.searchEntries(entries, input.value, { category: category, limit: limit }).map(function (result) { return result.entry; });
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
            renderFilters(allMatches);
            var matches = activeCategory ? matchingEntries(activeCategory, 24) : allMatches.slice(0, 24);
            var total = activeCategory ? allMatches.filter(function (entry) { return entry.group === activeCategory; }).length : allMatches.length;
            selectedIndex = Math.min(selectedIndex, Math.max(matches.length - 1, 0));
            results.replaceChildren();
            resultCount.textContent = total + " résultat" + (total > 1 ? "s" : "") + (activeCategory ? " · " + activeCategory : "");
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
                link.href = pageUrl(entry.path);
                link.id = "site-search-result-" + index;
                link.setAttribute("role", "option");
                link.setAttribute("aria-selected", String(index === selectedIndex));
                if (index === selectedIndex) link.classList.add("is-selected");
                title.textContent = entry.title;
                category.className = "search-result__category";
                category.textContent = entry.group;
                meta.textContent = entry.description || "Ouvrir cette entrée";
                heading.className = "search-result__heading";
                heading.append(category, title);
                link.append(heading, meta);
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
        header.append(input, close);
        dialog.append(header, filters, resultCount, results, footer);
        doc.body.appendChild(dialog);
        return { open: open, element: dialog };
    }

    function createSessionPanel() {
        var openButton = iconButton("session-panel-toggle", "Ouvrir le panneau de session", "⚡");
        var panel = doc.createElement("aside");
        var backdrop = doc.createElement("button");
        var header = doc.createElement("header");
        var heading = doc.createElement("div");
        var eyebrow = doc.createElement("span");
        var title = doc.createElement("h2");
        var closeButton = iconButton("session-panel__close", "Fermer le panneau de session", "×");
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
            ["◇", "Référence rapide", "Actions et états", "quickref.html"],
            ["✦", "Sorts", "Catalogue complet", "spells.html"],
            ["♜", "Monstres", "Bestiaire", "monstres.html"],
            ["⚔", "Combat", "Règles essentielles", "combat-2024.html"],
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
            icon.textContent = entry[0];
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
        var mount = doc.querySelector("[data-site-header]");
        if (!mount) return;

        var activePage = mount.getAttribute("data-active") || "";
        ensureSkipLink(mount);
        enhanceFormAccessibility();
        var inner = doc.createElement("div");
        var logo = doc.createElement("a");
        var mark = doc.createElement("span");
        var markText = doc.createElement("span");
        var logoText = doc.createElement("span");
        var logoTitle = doc.createElement("span");
        var logoSubtitle = doc.createElement("span");
        var actions = doc.createElement("div");
        var searchButton = doc.createElement("button");
        var themeButton = iconButton("theme-toggle", "Changer de thème", "☼");
        var sessionButton = iconButton("session-toggle", "Activer le mode session", "◉");
        var favoriteButton = null;
        var menuButton = iconButton("mobile-navigation-toggle", "Ouvrir le menu", "☰");
        var drawer = doc.createElement("aside");
        var drawerHead = doc.createElement("div");
        var drawerTitle = doc.createElement("span");
        var drawerClose = iconButton("mobile-navigation__close", "Fermer le menu", "×");
        var backdrop = doc.createElement("button");
        var search = createSearch();
        var sessionPanel = createSessionPanel();

        mount.className = "site-header";
        inner.className = "site-header__inner";
        logo.className = "site-logo";
        logo.href = pageUrl("index.html");
        logo.setAttribute("aria-label", "D&D 2024 — Accueil");
        mark.className = "site-logo__mark";
        markText.textContent = "D20";
        logoText.className = "site-logo__text";
        logoTitle.className = "site-logo__title";
        logoTitle.textContent = "D&D 2024";
        logoSubtitle.className = "site-logo__subtitle";
        logoSubtitle.textContent = "Référence francophone";
        actions.className = "site-header__actions";
        searchButton.type = "button";
        searchButton.className = "search-trigger";
        searchButton.setAttribute("aria-label", "Ouvrir la recherche");
        searchButton.innerHTML = "<span class=\"search-trigger__icon\" aria-hidden=\"true\">⌕</span><span class=\"search-trigger__label\">Rechercher…</span><kbd>Ctrl K</kbd>";

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
        themeButton.textContent = doc.documentElement.dataset.theme === "dark" ? "☼" : "☾";
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
            favoriteButton = iconButton("favorite-current", "Ajouter cette page aux favoris", "☆");
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
            themeButton.textContent = next === "dark" ? "☼" : "☾";
        });
        sessionButton.addEventListener("click", function () {
            var enabled = doc.documentElement.dataset.session !== "true";
            updateSessionMode(enabled, enabled);
        });
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
            if (event.target.closest("a")) setDrawer(false);
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

        mark.appendChild(markText);
        logoText.append(logoTitle, logoSubtitle);
        logo.append(mark, logoText);
        actions.append(searchButton);
        if (favoriteButton) actions.append(favoriteButton);
        actions.append(sessionPanel.openButton, sessionButton, themeButton, menuButton);
        inner.append(logo, createNavigation(activePage, false), actions);
        drawerHead.append(drawerTitle, drawerClose);
        drawer.append(drawerHead, createNavigation(activePage, true));
        mount.replaceChildren(inner);
        doc.body.append(backdrop, drawer, sessionPanel.backdrop, sessionPanel.panel);
    }

    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
