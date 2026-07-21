(function () {
    "use strict";

    var records = [];
    var lastTrigger = null;

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

    function addQuickrefItem(parent, data, type) {
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

        item.type = "button";
        item.className = "item itemsize";
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
        item.addEventListener("click", function () {
            showDetail(data, getSectionColor(parent), type, item);
        });
        parent.appendChild(item);

        records.push({
            element: item,
            section: section,
            searchText: normalize([
                title,
                type,
                data.subtitle,
                data.description,
                data.reference,
                ...(Array.isArray(data.bullets) ? data.bullets : []),
            ].join(" ").replace(/<[^>]*>/g, " ")),
        });
    }

    function showDetail(data, color, type, trigger) {
        var layer = document.getElementById("quickref-detail-layer");
        var panel = document.getElementById("quickref-detail-panel");
        var bulletsEl = document.getElementById("quickref-detail-bullets");
        var bullets = Array.isArray(data.bullets) ? data.bullets : [];

        lastTrigger = trigger;
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
        document.getElementById("quickref-detail-close").focus();
    }

    function hideDetail(restoreFocus) {
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

    function fillSection(data, parentId, type) {
        var parent = document.getElementById(parentId);
        if (!parent || !Array.isArray(data)) return;
        parent.classList.add("quickref-grid");
        data.forEach(function (item) {
            addQuickrefItem(parent, item, type);
        });
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
        fillSection(data_movement, "basic-movement", "Déplacement");
        fillSection(data_action, "basic-actions", "Action");
        fillSection(data_bonusaction, "basic-bonus-actions", "Action bonus");
        fillSection(data_reaction, "basic-reactions", "Réaction");
        fillSection(data_condition, "basic-conditions", "État");
        fillSection(data_environment_obscurance, "environment-obscurance", "Environnement");
        fillSection(data_environment_light, "environment-light", "Environnement");
        fillSection(data_environment_vision, "environment-vision", "Environnement");
        fillSection(data_environment_cover, "environment-cover", "Environnement");

        document.getElementById("quickref-search").addEventListener("input", filterItems);
        document.getElementById("quickref-detail-close").addEventListener("click", function () { hideDetail(true); });
        document.getElementById("quickref-detail-backdrop").addEventListener("click", function () { hideDetail(true); });
        document.addEventListener("keydown", trapPanelFocus);
        if (window.location && typeof URLSearchParams !== "undefined") {
            document.getElementById("quickref-search").value = new URLSearchParams(window.location.search).get("q") || "";
        }
        filterItems();
    }

    document.addEventListener("DOMContentLoaded", init, { once: true });
})();
