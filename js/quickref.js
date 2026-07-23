(function () {
    "use strict";

    var records = [];
    var lastTrigger = null;
    var lastRecord = null;
    var selectionParameters = ["movement", "action", "bonus", "reaction", "condition", "environment"];

    function normalize(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function getSectionColor(parent) {
        var section = parent.closest ? parent.closest(".section-container") : parent.parentNode && parent.parentNode.parentNode;
        var style = window.getComputedStyle(section || parent);
        return style.getPropertyValue && style.getPropertyValue("--category-color").trim()
            ? style.getPropertyValue("--category-color").trim()
            : style.backgroundColor || "#7f6635";
    }

    function addQuickrefItem(parent, data, type, parameter) {
        var icon = data.icon || "perspective-dice-six-faces-one";
        var subtitle = data.subtitle || data.description || "";
        var title = data.title || "[sans titre]";
        var item = document.createElement("button");
        var iconEl = document.createElement("span");
        var textContainer = document.createElement("span");
        var titleEl = document.createElement("span");
        var subtitleEl = document.createElement("span");
        var typeEl = document.createElement("span");
        var section = parent.closest ? parent.closest(".section-container") : parent.parentNode && parent.parentNode.parentNode;
        var slug = window.DndCatalogUI.slugify(title);

        item.type = "button";
        item.className = "item itemsize";
        item.id = "quickref-" + parameter + "-" + slug;
        item.setAttribute("data-content-id", slug);
        item.setAttribute("aria-haspopup", "dialog");
        item.setAttribute("aria-expanded", "false");
        iconEl.className = "item-icon iconsize icon-" + icon;
        iconEl.setAttribute("aria-hidden", "true");
        textContainer.className = "item-text-container text";
        titleEl.className = "item-title";
        titleEl.textContent = title;
        subtitleEl.className = "item-desc";
        subtitleEl.textContent = subtitle;
        typeEl.className = "item-meta";
        typeEl.textContent = type;

        textContainer.appendChild(titleEl);
        textContainer.appendChild(subtitleEl);
        textContainer.appendChild(typeEl);
        item.appendChild(iconEl);
        item.appendChild(textContainer);
        var record = {
            data: data,
            element: item,
            parameter: parameter,
            section: section,
            slug: slug,
            type: type,
            color: getSectionColor(parent),
            searchText: normalize([
                title,
                type,
                data.subtitle,
                data.description,
                data.reference,
                ...(Array.isArray(data.bullets) ? data.bullets : []),
            ].join(" ").replace(/<[^>]*>/g, " ")),
        };
        item.addEventListener("click", function () {
            showDetail(data, record.color, type, item, record, true);
        });
        parent.appendChild(item);
        records.push(record);
    }

    function showDetail(data, color, type, trigger, record, syncUrl) {
        var layer = document.getElementById("quickref-detail-layer");
        var panel = document.getElementById("quickref-detail-panel");
        var bulletsEl = document.getElementById("quickref-detail-bullets");
        var bullets = Array.isArray(data.bullets) ? data.bullets : [];

        if (lastTrigger && lastTrigger !== trigger) lastTrigger.setAttribute("aria-expanded", "false");
        lastTrigger = trigger;
        lastRecord = record;
        trigger.setAttribute("aria-expanded", "true");
        document.getElementById("quickref-detail-title").textContent = data.title || "[sans titre]";
        document.getElementById("quickref-detail-type").textContent = type || "Règle";
        document.getElementById("quickref-detail-cost").textContent = type || "Règle";
        document.getElementById("quickref-detail-summary").textContent = data.description || data.subtitle || "";
        document.getElementById("quickref-detail-reference").textContent = data.reference || "Non précisée";
        panel.style.setProperty("--category-color", color || "#7f6635");

        bulletsEl.replaceChildren();
        if (!bullets.length) {
            var empty = document.createElement("p");
            empty.className = "quickref-detail__bullet";
            empty.textContent = "Aucune précision supplémentaire.";
            bulletsEl.appendChild(empty);
        } else {
            bullets.forEach(function (bullet) {
                var paragraph = document.createElement("div");
                paragraph.className = "quickref-detail__bullet";
                paragraph.innerHTML = bullet;
                bulletsEl.appendChild(paragraph);
            });
        }

        document.body.classList.add("quickref-detail-open");
        layer.classList.add("is-open");
        layer.setAttribute("aria-hidden", "false");
        layer.removeAttribute("inert");
        if (syncUrl !== false && record) {
            window.DndCatalogUI.updateSelection(record.parameter, record.slug, {
                clear: selectionParameters,
                mode: "push",
            });
        }
        document.getElementById("quickref-detail-close").focus();
    }

    function hideDetail(restoreFocus, syncUrl) {
        var layer = document.getElementById("quickref-detail-layer");
        if (!layer.classList.contains("is-open")) return;
        layer.classList.remove("is-open");
        layer.setAttribute("aria-hidden", "true");
        layer.setAttribute("inert", "");
        document.body.classList.remove("quickref-detail-open");
        if (lastTrigger) {
            lastTrigger.setAttribute("aria-expanded", "false");
            if (restoreFocus !== false) lastTrigger.focus();
        }
        if (syncUrl !== false && lastRecord) {
            window.DndCatalogUI.updateSelection(lastRecord.parameter, "", {
                clear: selectionParameters,
                mode: "replace",
            });
        }
        lastRecord = null;
    }

    function filterItems() {
        var query = normalize(document.getElementById("quickref-search").value).trim();
        var visible = 0;
        var sections = new Set();

        records.forEach(function (record) {
            var matches = !query || record.searchText.includes(query);
            record.element.hidden = !matches;
            if (matches) visible += 1;
            if (record.section) sections.add(record.section);
        });

        sections.forEach(function (section) {
            section.hidden = !records.some(function (record) {
                return record.section === section && !record.element.hidden;
            });
        });

        document.getElementById("quickref-result-count").textContent = `${visible} ${visible > 1 ? "entrées" : "entrée"}`;
        document.getElementById("quickref-empty").hidden = visible !== 0;
    }

    function fillSection(data, parentId, type, parameter) {
        var parent = document.getElementById(parentId);
        if (!parent || !Array.isArray(data)) return;
        parent.classList.add("quickref-grid");
        data.forEach(function (item) {
            addQuickrefItem(parent, item, type, parameter);
        });
    }

    function updateQueryUrl() {
        if (!window.history || typeof URL === "undefined") return;
        var url = new URL(window.location.href);
        var query = document.getElementById("quickref-search").value.trim();
        if (query) url.searchParams.set("q", query);
        else url.searchParams.delete("q");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }

    function restoreFromUrl() {
        var params = new URLSearchParams(window.location.search);
        document.getElementById("quickref-search").value = params.get("q") || "";
        filterItems();
        var selected = records.find(function (record) {
            return params.get(record.parameter) === record.slug;
        });
        if (!selected || selected.element.hidden) {
            hideDetail(false, false);
            return;
        }
        showDetail(selected.data, selected.color, selected.type, selected.element, selected, false);
        if (typeof selected.element.scrollIntoView === "function") selected.element.scrollIntoView({ block: "center" });
    }

    function trapPanelFocus(event) {
        var layer = document.getElementById("quickref-detail-layer");
        if (!layer.classList.contains("is-open")) return;
        if (event.key === "Escape") {
            event.preventDefault();
            hideDetail(true);
            return;
        }
        if (event.key !== "Tab") return;
        var panel = document.getElementById("quickref-detail-panel");
        var focusable = Array.from(panel.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])"))
            .filter(function (element) { return !element.disabled; });
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function init() {
        fillSection(data_movement, "basic-movement", "Déplacement", "movement");
        fillSection(data_action, "basic-actions", "Action", "action");
        fillSection(data_bonusaction, "basic-bonus-actions", "Action bonus", "bonus");
        fillSection(data_reaction, "basic-reactions", "Réaction", "reaction");
        fillSection(data_condition, "basic-conditions", "État", "condition");
        fillSection(data_environment_obscurance, "environment-obscurance", "Environnement", "environment");
        fillSection(data_environment_light, "environment-light", "Environnement", "environment");
        fillSection(data_environment_vision, "environment-vision", "Environnement", "environment");
        fillSection(data_environment_cover, "environment-cover", "Environnement", "environment");

        document.getElementById("quickref-search").addEventListener("input", function () {
            filterItems();
            updateQueryUrl();
        });
        document.getElementById("quickref-detail-close").addEventListener("click", function () { hideDetail(true, true); });
        document.getElementById("quickref-detail-backdrop").addEventListener("click", function () { hideDetail(true, true); });
        document.addEventListener("keydown", trapPanelFocus);
        if (typeof window.addEventListener === "function") {
            window.addEventListener("popstate", restoreFromUrl);
        }
        restoreFromUrl();
    }

    document.addEventListener("DOMContentLoaded", init, { once: true });
})();
