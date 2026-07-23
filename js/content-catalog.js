(function () {
    "use strict";

    var kind = document.body.dataset.catalogKind;
    if (!kind) return;

    function normalize(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("fr");
    }

    function textAfterPeriod(value) {
        var text = String(value || "").trim();
        var index = text.indexOf(".");
        return index === -1 ? text : text.slice(index + 1).trim();
    }

    function splitValues(value) {
        return String(value || "").split(/,|\bou\b/i).map(function (entry) { return entry.trim(); }).filter(Boolean);
    }

    function createDetailsItem(title, meta, body) {
        var details = document.createElement("details");
        var summary = document.createElement("summary");
        var heading = document.createElement("h3");
        var metadata = document.createElement("span");
        details.className = "content-catalog-entry";
        heading.textContent = title;
        metadata.className = "content-catalog-entry__meta";
        metadata.textContent = meta;
        body.classList.add("content-catalog-entry__body");
        summary.append(heading, metadata);
        details.append(summary, body);
        return details;
    }

    function classCatalog() {
        var container = document.querySelector(".class-grid");
        if (!container) return null;
        var profiles = {
            Barbare: "Martial", Barde: "Lanceur de sorts", Clerc: "Lanceur de sorts",
            Druide: "Lanceur de sorts", Ensorceleur: "Lanceur de sorts", Guerrier: "Martial",
            Magicien: "Lanceur de sorts", Moine: "Martial", Occultiste: "Lanceur de sorts",
            Paladin: "Hybride", "Rôdeur": "Hybride", Roublard: "Martial",
        };
        var items = Array.from(container.querySelectorAll(":scope > a")).map(function (element, index) {
            var title = element.querySelector("strong")?.textContent.trim() || "Classe";
            return { element: element, title: title, text: element.textContent, index: index, values: { profile: [profiles[title] || "Autre"] } };
        });
        return { host: container.closest(".card"), container: container, items: items, label: "classes", filters: [{ key: "profile", label: "Profil" }] };
    }

    function speciesCatalog() {
        var container = document.querySelector(".race-grid");
        if (!container) return null;
        var sizes = {
            Aasimar: "Petite ou Moyenne", "Drakéide": "Moyenne", Elfe: "Moyenne", Gnome: "Petite",
            Goliath: "Moyenne", Halfelin: "Petite", Humain: "Petite ou Moyenne", Nain: "Moyenne",
            Orc: "Moyenne", Tieffelin: "Petite ou Moyenne",
        };
        var items = Array.from(container.querySelectorAll(":scope > a")).map(function (element, index) {
            var title = element.querySelector("strong")?.textContent.trim() || "Espèce";
            return { element: element, title: title, text: element.textContent, index: index, values: { size: [sizes[title] || "Autre"] } };
        });
        return { host: container.closest(".card"), container: container, items: items, label: "espèces", filters: [{ key: "size", label: "Taille" }] };
    }

    function equipmentCatalog() {
        var host = document.querySelector("main .card");
        var content = host?.querySelector(".content");
        var tables = content ? Array.from(content.querySelectorAll("table.equipment-table")) : [];
        if (!content || !tables.length) return null;
        var container = document.createElement("div");
        var items = [];
        container.className = "content-catalog-equipment-grid";

        tables.forEach(function (table, tableIndex) {
            var headers = Array.from(table.querySelectorAll("thead th")).map(function (cell) { return cell.textContent.trim(); });
            var group = tableIndex === 0 ? "Armes" : "Armures";
            Array.from(table.querySelectorAll("tbody tr")).forEach(function (row) {
                var cells = Array.from(row.cells);
                if (row.classList.contains("group-row")) {
                    group = cells[0]?.textContent.trim() || group;
                    return;
                }
                if (!cells.length) return;
                var title = cells[0].textContent.trim();
                var body = document.createElement("div");
                var list = document.createElement("dl");
                cells.slice(1).forEach(function (cell, index) {
                    var term = document.createElement("dt");
                    var definition = document.createElement("dd");
                    term.textContent = headers[index + 1] || "Détail";
                    definition.textContent = cell.textContent.trim();
                    list.append(term, definition);
                });
                body.appendChild(list);
                var type = tableIndex === 0 ? "Arme" : "Armure";
                var element = createDetailsItem(title, type + " · " + group, body);
                var slug = window.DndCatalogUI.slugify(title);
                element.id = "equipment-" + slug;
                element.dataset.contentId = slug;
                container.appendChild(element);
                items.push({
                    element: element,
                    title: title,
                    text: row.textContent + " " + group,
                    index: items.length,
                    values: {
                        type: [type],
                        category: [group],
                        mastery: tableIndex === 0 && cells[3] ? [cells[3].textContent.trim()] : [],
                    },
                });
            });
            var wrapper = table.closest(".table-scroll");
            if (wrapper) {
                var heading = wrapper.previousElementSibling;
                if (heading && /^H[1-6]$/.test(heading.tagName)) heading.hidden = true;
                wrapper.hidden = true;
            }
        });

        var firstPropertyHeading = Array.from(content.querySelectorAll("h3")).find(function (heading) {
            return normalize(heading.textContent) === "proprietes des armes";
        });
        content.insertBefore(container, firstPropertyHeading || content.firstChild);
        return {
            host: host,
            container: container,
            items: items,
            label: "équipements",
            defaultSort: "source",
            filters: [
                { key: "type", label: "Type" },
                { key: "category", label: "Catégorie" },
                { key: "mastery", label: "Botte d’arme" },
            ],
        };
    }

    function backgroundCatalog() {
        var host = document.querySelector("main .card");
        var content = host?.querySelector(".content");
        var headings = content ? Array.from(content.querySelectorAll(":scope > h3[id]")) : [];
        if (!content || !headings.length) return null;
        var container = document.createElement("div");
        var items = [];
        container.className = "content-catalog-background-grid";
        content.insertBefore(container, headings[0]);

        headings.forEach(function (heading, index) {
            var title = heading.textContent.trim();
            var nodes = [];
            var cursor = heading.nextSibling;
            while (cursor && !(cursor.nodeType === 1 && cursor.matches("h3[id]"))) {
                var next = cursor.nextSibling;
                nodes.push(cursor);
                cursor = next;
            }
            var body = document.createElement("div");
            nodes.forEach(function (node) { body.appendChild(node); });
            var paragraphs = Array.from(body.querySelectorAll(":scope > p"));
            var abilities = splitValues(textAfterPeriod(paragraphs[0]?.textContent));
            var feat = textAfterPeriod(paragraphs[1]?.textContent);
            var meta = [abilities.join(", "), feat].filter(Boolean).join(" · ");
            var element = createDetailsItem(title, meta, body);
            element.id = heading.id;
            element.dataset.contentId = heading.id || window.DndCatalogUI.slugify(title);
            heading.remove();
            container.appendChild(element);
            items.push({ element: element, title: title, text: element.textContent, index: index, values: { ability: abilities, feat: feat ? [feat] : [] } });
        });
        return { host: host, container: container, items: items, label: "historiques", filters: [{ key: "ability", label: "Caractéristique" }, { key: "feat", label: "Don" }] };
    }

    function buildCatalog() {
        if (kind === "classes") return classCatalog();
        if (kind === "species") return speciesCatalog();
        if (kind === "equipment") return equipmentCatalog();
        if (kind === "backgrounds") return backgroundCatalog();
        return null;
    }

    function enhance(config) {
        if (!config || !config.items.length) return;
        var defaultSort = config.defaultSort || "name-asc";
        var root = document.createElement("section");
        var toolbar = document.createElement("div");
        var searchWrap = document.createElement("div");
        var searchLabel = document.createElement("label");
        var search = document.createElement("input");
        var sort = document.createElement("select");
        var mobileFilter = document.createElement("button");
        var mobileCount = document.createElement("span");
        var chips = document.createElement("div");
        var layout = document.createElement("div");
        var filters = document.createElement("aside");
        var filterHead = document.createElement("div");
        var filterTitle = document.createElement("strong");
        var filterClose = document.createElement("button");
        var reset = document.createElement("button");
        var results = document.createElement("div");
        var summary = document.createElement("p");
        var empty = document.createElement("div");
        var backdrop = document.createElement("button");
        var filterControls = new Map();
        var selectionParameter = kind === "equipment" ? "equipment" : kind === "backgrounds" ? "background" : "";

        root.className = "content-catalog";
        root.setAttribute("aria-label", "Catalogue des " + config.label);
        toolbar.className = "content-catalog-toolbar";
        searchWrap.className = "content-catalog-search";
        searchLabel.className = "sr-only";
        searchLabel.htmlFor = kind + "CatalogSearch";
        searchLabel.textContent = "Rechercher dans les " + config.label;
        search.id = kind + "CatalogSearch";
        search.type = "search";
        search.placeholder = "Rechercher dans les " + config.label + "…";
        search.setAttribute("data-catalog-search", "");
        sort.className = "content-catalog-sort";
        sort.setAttribute("aria-label", "Trier les résultats");
        [[defaultSort, defaultSort === "source" ? "Ordre d’origine" : "Nom A–Z"], ["name-desc", "Nom Z–A"]].forEach(function (entry) {
            var option = document.createElement("option");
            option.value = entry[0];
            option.textContent = entry[1];
            sort.appendChild(option);
        });
        mobileFilter.type = "button";
        mobileFilter.className = "content-catalog-mobile-filter";
        mobileFilter.setAttribute("aria-expanded", "false");
        mobileFilter.append("Filtres", mobileCount);
        searchWrap.append(searchLabel, search);
        toolbar.append(searchWrap, mobileFilter, sort);

        chips.className = "content-catalog-chips";
        chips.setAttribute("aria-label", "Filtres actifs");
        layout.className = "content-catalog-layout";
        filters.className = "content-catalog-filters";
        filters.id = kind + "CatalogFilters";
        filters.setAttribute("aria-label", "Filtres du catalogue");
        mobileFilter.setAttribute("aria-controls", filters.id);
        filterHead.className = "content-catalog-filter-head";
        filterTitle.textContent = "Filtres";
        filterClose.type = "button";
        filterClose.className = "content-catalog-filter-close";
        filterClose.setAttribute("aria-label", "Fermer les filtres");
        filterClose.textContent = "×";
        filterHead.append(filterTitle, filterClose);
        filters.appendChild(filterHead);

        config.filters.forEach(function (definition) {
            var group = document.createElement("div");
            var label = document.createElement("label");
            var select = document.createElement("select");
            var options = Array.from(new Set(config.items.flatMap(function (item) { return item.values[definition.key] || []; }).filter(function (value) { return Boolean(value) && value !== "-"; })))
                .sort(function (first, second) { return first.localeCompare(second, "fr"); });
            group.className = "content-catalog-filter";
            label.htmlFor = kind + "Filter" + definition.key;
            label.textContent = definition.label;
            select.id = kind + "Filter" + definition.key;
            var all = document.createElement("option");
            all.value = "";
            all.textContent = "Tous";
            select.appendChild(all);
            options.forEach(function (value) {
                var option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            group.append(label, select);
            filters.appendChild(group);
            filterControls.set(definition.key, { select: select, label: definition.label });
        });

        reset.type = "button";
        reset.className = "content-catalog-reset";
        reset.textContent = "Réinitialiser";
        filters.appendChild(reset);
        results.className = "content-catalog-results";
        summary.className = "content-catalog-summary";
        summary.setAttribute("role", "status");
        summary.setAttribute("aria-live", "polite");
        empty.className = "content-catalog-empty";
        empty.textContent = "Aucun résultat ne correspond aux filtres actuels.";
        empty.hidden = true;

        config.container.parentNode.insertBefore(root, config.container);
        results.append(summary, config.container, empty);
        layout.append(filters, results);
        root.append(toolbar, chips, layout);
        backdrop.type = "button";
        backdrop.className = "content-catalog-backdrop";
        backdrop.setAttribute("aria-label", "Fermer les filtres");
        document.body.appendChild(backdrop);

        function selectedFilters() {
            return Array.from(filterControls.entries()).filter(function (entry) { return Boolean(entry[1].select.value); });
        }

        function updateUrl() {
            var url = new URL(window.location.href);
            if (search.value.trim()) url.searchParams.set("q", search.value.trim());
            else url.searchParams.delete("q");
            if (sort.value !== defaultSort) url.searchParams.set("sort", sort.value);
            else url.searchParams.delete("sort");
            filterControls.forEach(function (control, key) {
                if (control.select.value) url.searchParams.set(key, control.select.value);
                else url.searchParams.delete(key);
            });
            window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        }

        function renderChips() {
            chips.replaceChildren();
            var active = selectedFilters();
            mobileCount.textContent = String(active.length);
            active.forEach(function (entry) {
                var key = entry[0];
                var control = entry[1];
                var button = document.createElement("button");
                button.type = "button";
                button.textContent = control.label + " : " + control.select.value + " ×";
                button.addEventListener("click", function () { control.select.value = ""; apply(); });
                chips.appendChild(button);
            });
        }

        function apply() {
            var query = normalize(search.value.trim());
            var active = selectedFilters();
            var visible = config.items.filter(function (item) {
                if (query && !normalize(item.title + " " + item.text).includes(query)) return false;
                return active.every(function (entry) { return (item.values[entry[0]] || []).includes(entry[1].select.value); });
            });
            var sorted = config.items.slice();
            if (sort.value === "name-desc") sorted.sort(function (first, second) { return second.title.localeCompare(first.title, "fr"); });
            else if (sort.value === "name-asc") sorted.sort(function (first, second) { return first.title.localeCompare(second.title, "fr"); });
            else sorted.sort(function (first, second) { return first.index - second.index; });
            sorted.forEach(function (item) {
                item.element.hidden = !visible.includes(item);
                config.container.appendChild(item.element);
            });
            summary.textContent = visible.length + " résultat" + (visible.length > 1 ? "s" : "") + " sur " + config.items.length + " " + config.label + ".";
            empty.hidden = visible.length !== 0;
            renderChips();
            updateUrl();
            restoreSelection(false);
        }

        function restoreSelection(reveal) {
            if (!selectionParameter) return;
            var selectedId = window.DndCatalogUI.readSelection(selectionParameter);
            var selected = config.items.find(function (item) {
                return item.element.dataset.contentId === selectedId && !item.element.hidden;
            });
            config.items.forEach(function (item) {
                if (item.element.matches("details")) item.element.open = Boolean(selected && item === selected);
            });
            if (selectedId && !selected) {
                window.DndCatalogUI.updateSelection(selectionParameter, "", { mode: "replace" });
                return;
            }
            if (selected && reveal) {
                selected.element.scrollIntoView({ block: "start" });
                selected.element.querySelector("summary")?.focus({ preventScroll: true });
            }
        }

        function connectSelections() {
            if (!selectionParameter) return;
            config.items.forEach(function (item) {
                if (!item.element.matches("details")) return;
                item.element.querySelector("summary")?.addEventListener("click", function () {
                    var id = item.element.dataset.contentId;
                    if (!item.element.open) {
                        config.items.forEach(function (other) {
                            if (other !== item && other.element.matches("details")) other.element.open = false;
                        });
                        window.DndCatalogUI.updateSelection(selectionParameter, id, { mode: "push" });
                    } else if (window.DndCatalogUI.readSelection(selectionParameter) === id) {
                        window.DndCatalogUI.updateSelection(selectionParameter, "", { mode: "replace" });
                    }
                });
            });
        }

        function restoreControlsFromUrl() {
            var params = new URLSearchParams(window.location.search);
            search.value = params.get("q") || "";
            sort.value = defaultSort;
            if (params.get("sort") && Array.from(sort.options).some(function (option) { return option.value === params.get("sort"); })) sort.value = params.get("sort");
            filterControls.forEach(function (control, key) {
                var value = params.get(key) || "";
                control.select.value = Array.from(control.select.options).some(function (option) { return option.value === value; }) ? value : "";
            });
        }

        function setFiltersOpen(open) {
            filters.classList.toggle("is-open", open);
            backdrop.classList.toggle("is-open", open);
            mobileFilter.setAttribute("aria-expanded", String(open));
            document.body.classList.toggle("has-open-content-catalog", open);
            if (open) {
                filters.setAttribute("role", "dialog");
                filters.setAttribute("aria-modal", "true");
                filterClose.focus();
            } else {
                filters.removeAttribute("role");
                filters.removeAttribute("aria-modal");
                mobileFilter.focus();
            }
        }

        restoreControlsFromUrl();
        connectSelections();

        search.addEventListener("input", apply);
        sort.addEventListener("change", apply);
        filterControls.forEach(function (control) { control.select.addEventListener("change", apply); });
        reset.addEventListener("click", function () {
            search.value = "";
            sort.value = defaultSort;
            filterControls.forEach(function (control) { control.select.value = ""; });
            apply();
        });
        mobileFilter.addEventListener("click", function () { setFiltersOpen(true); });
        filterClose.addEventListener("click", function () { setFiltersOpen(false); });
        backdrop.addEventListener("click", function () { setFiltersOpen(false); });
        document.addEventListener("keydown", function (event) {
            if (!filters.classList.contains("is-open")) return;
            if (event.key === "Escape") setFiltersOpen(false);
            if (event.key !== "Tab") return;
            var focusable = filters.querySelectorAll("button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])");
            if (!focusable.length) return;
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
        window.addEventListener("popstate", function () {
            restoreControlsFromUrl();
            apply();
            restoreSelection(true);
        });
        apply();
        restoreSelection(true);
    }

    enhance(buildCatalog());
})();
