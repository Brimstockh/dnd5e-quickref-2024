(function (root) {
    "use strict";

    function readState(search) {
        var params = new URLSearchParams(search || "");
        return {
            query: params.get("q") || "",
            level: params.get("level") || "",
            school: params.get("school") || "",
            classes: params.getAll("class").filter(Boolean),
            sort: params.get("sort") || "level_asc",
            spell: params.get("spell") || "",
        };
    }

    function buildSearch(state) {
        var params = new URLSearchParams();
        var query = String(state.query || "").trim();
        var level = String(state.level || "");
        var school = String(state.school || "");
        var sort = String(state.sort || "level_asc");
        var classes = Array.isArray(state.classes) ? state.classes : Array.from(state.classes || []);

        if (query) params.set("q", query);
        if (level) params.set("level", level);
        if (school) params.set("school", school);
        classes.filter(Boolean).sort(function (a, b) {
            return String(a).localeCompare(String(b), "fr");
        }).forEach(function (className) { params.append("class", className); });
        if (sort !== "level_asc") params.set("sort", sort);
        if (state.spell) params.set("spell", state.spell);
        return params.toString();
    }

    function replaceUrlState(state, locationObject, historyObject) {
        var locationValue = locationObject || root.location;
        var historyValue = historyObject || root.history;
        if (!locationValue || !historyValue || typeof historyValue.replaceState !== "function") return;
        var current = new URL(
            locationValue.href || locationValue.pathname + (locationValue.search || "") + (locationValue.hash || ""),
            "https://dnd.local",
        );
        ["q", "level", "school", "class", "sort"].forEach(function (parameter) {
            current.searchParams.delete(parameter);
        });
        var search = new URLSearchParams(buildSearch(state));
        search.forEach(function (value, key) {
            if (key !== "spell") current.searchParams.append(key, value);
        });
        var next = current.pathname + current.search + current.hash;
        historyValue.replaceState(null, "", next);
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

    function readSelection(parameter, search) {
        if (!parameter) return "";
        return new URLSearchParams(search === undefined ? root.location?.search || "" : search).get(parameter) || "";
    }

    function updateSelection(parameter, value, options) {
        options = options || {};
        var locationValue = options.location || root.location;
        var historyValue = options.history || root.history;
        var mode = options.mode === "replace" ? "replaceState" : "pushState";
        if (!parameter || !locationValue || !historyValue || typeof historyValue[mode] !== "function") return;

        var current = new URL(
            locationValue.href || locationValue.pathname + (locationValue.search || "") + (locationValue.hash || ""),
            "https://dnd.local",
        );
        (options.clear || []).forEach(function (key) { current.searchParams.delete(key); });
        if (value) current.searchParams.set(parameter, value);
        else current.searchParams.delete(parameter);
        var next = current.pathname + current.search + current.hash;
        var previous = locationValue.pathname + (locationValue.search || "") + (locationValue.hash || "");
        if (next === previous) return;
        historyValue[mode]({ dndSelection: value ? parameter : null }, "", next);
    }

    function renderChips(container, chips, onRemove) {
        if (!container) return;
        container.replaceChildren();
        container.hidden = chips.length === 0;
        chips.forEach(function (chip) {
            var button = container.ownerDocument.createElement("button");
            var remove = container.ownerDocument.createElement("span");
            button.type = "button";
            button.className = "filter-chip";
            button.setAttribute("aria-label", "Retirer le filtre : " + chip.label);
            button.append(container.ownerDocument.createTextNode(chip.label + " "));
            remove.setAttribute("aria-hidden", "true");
            remove.textContent = "×";
            button.appendChild(remove);
            button.addEventListener("click", function () { onRemove(chip); });
            container.appendChild(button);
        });
    }

    function connectDrawer(options) {
        var panel = options.panel;
        var backdrop = options.backdrop;
        var closeButton = options.closeButton;
        var triggers = options.triggers || [];
        if (!panel || !backdrop || !closeButton) return { close: function () {} };

        var media = typeof root.matchMedia === "function"
            ? root.matchMedia("(max-width: 820px)")
            : { matches: false };
        var open = false;
        var lastTrigger = null;

        function focusableElements() {
            return Array.from(panel.querySelectorAll("button, input, select, [href], [tabindex]:not([tabindex='-1'])"))
                .filter(function (element) { return !element.disabled && element.getAttribute("aria-hidden") !== "true"; });
        }

        function sync() {
            var mobile = media.matches;
            panel.classList.toggle("is-open", mobile && open);
            backdrop.classList.toggle("is-open", mobile && open);
            panel.setAttribute("aria-hidden", String(mobile && !open));
            if (mobile && !open) panel.setAttribute("inert", "");
            else panel.removeAttribute("inert");
            if (mobile && open) {
                panel.setAttribute("role", "dialog");
                panel.setAttribute("aria-modal", "true");
            } else {
                panel.removeAttribute("role");
                panel.removeAttribute("aria-modal");
            }
            document.body.classList.toggle("has-open-drawer", mobile && open);
            triggers.forEach(function (trigger) { trigger.button.setAttribute("aria-expanded", String(mobile && open)); });
        }

        function openDrawer(trigger, focusTarget) {
            if (!media.matches) {
                if (focusTarget) focusTarget.focus();
                return;
            }
            open = true;
            lastTrigger = trigger;
            sync();
            (focusTarget || closeButton).focus();
        }

        function closeDrawer(restoreFocus) {
            if (!open) return;
            open = false;
            sync();
            if (restoreFocus !== false && lastTrigger) lastTrigger.focus();
        }

        triggers.forEach(function (trigger) {
            trigger.button.setAttribute("aria-controls", panel.id);
            trigger.button.setAttribute("aria-expanded", "false");
            trigger.button.addEventListener("click", function () {
                openDrawer(trigger.button, trigger.focusTarget || null);
            });
        });
        closeButton.addEventListener("click", function () { closeDrawer(true); });
        backdrop.addEventListener("click", function () { closeDrawer(true); });
        document.addEventListener("keydown", function (event) {
            if (!open || !media.matches) return;
            if (event.key === "Escape") {
                event.preventDefault();
                closeDrawer(true);
                return;
            }
            if (event.key !== "Tab") return;
            var items = focusableElements();
            if (!items.length) return;
            var first = items[0];
            var last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        function handleMediaChange() {
            if (!media.matches) open = false;
            sync();
        }
        if (typeof media.addEventListener === "function") media.addEventListener("change", handleMediaChange);
        else if (typeof media.addListener === "function") media.addListener(handleMediaChange);
        sync();
        return { close: closeDrawer };
    }

    root.DndCatalogUI = {
        readState: readState,
        buildSearch: buildSearch,
        readSelection: readSelection,
        replaceUrlState: replaceUrlState,
        slugify: slugify,
        updateSelection: updateSelection,
        renderChips: renderChips,
        connectDrawer: connectDrawer,
    };
})(globalThis);
