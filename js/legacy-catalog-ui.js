(function () {
    "use strict";

    var panel = document.querySelector(".legacy-catalog-page .filters");
    if (!panel) return;

    var parameterById = {
        searchInput: "q",
        crSelect: "cr",
        typeSelect: "type",
        alignmentSelect: "alignment",
        sizeSelect: "size",
        categorySelect: "category",
        prereqSelect: "prereq",
        repeatableSelect: "repeatable",
        sortSelect: "sort",
    };
    var controls = Array.from(panel.querySelectorAll("input[id], select[id]")).filter(function (control) {
        return Boolean(parameterById[control.id]);
    });
    var defaults = new Map(controls.map(function (control) {
        var defaultValue = control.id === "sortSelect" && control.options.length ? control.options[0].value : "";
        return [control.id, defaultValue];
    }));
    var inputTimer = 0;

    panel.id = panel.id || "catalogFilters";
    panel.setAttribute("aria-label", "Filtres du catalogue");

    function labelFor(control) {
        var label = panel.querySelector("label[for='" + control.id + "']");
        var option = control.tagName === "SELECT" ? control.options[control.selectedIndex] : null;
        return {
            name: label ? label.textContent.trim() : control.id,
            value: option ? option.textContent.trim() : control.value.trim(),
        };
    }

    function dispatch(control) {
        control.dispatchEvent(new Event(control.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    }

    function restoreFromUrl() {
        if (typeof URLSearchParams === "undefined") return;
        var params = new URLSearchParams(window.location.search);
        controls.forEach(function (control) {
            var value = params.get(parameterById[control.id]);
            if (value === null) value = defaults.get(control.id);
            control.value = value;
            if (control.value !== value) control.value = defaults.get(control.id);
            dispatch(control);
        });
    }

    var toggle = document.createElement("button");
    var count = document.createElement("span");
    toggle.type = "button";
    toggle.className = "legacy-filter-toggle";
    toggle.setAttribute("aria-controls", panel.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.append("Filtres", count);
    panel.parentNode.insertBefore(toggle, panel);

    var heading = document.createElement("div");
    var headingTitle = document.createElement("strong");
    var close = document.createElement("button");
    heading.className = "legacy-filter-heading";
    headingTitle.textContent = "Filtres";
    close.type = "button";
    close.setAttribute("aria-label", "Fermer les filtres");
    close.textContent = "×";
    heading.append(headingTitle, close);
    panel.insertBefore(heading, panel.firstChild);

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "legacy-filter-reset";
    reset.textContent = "Réinitialiser";
    panel.appendChild(reset);

    var chips = document.createElement("div");
    chips.className = "legacy-active-filters";
    chips.setAttribute("aria-label", "Filtres actifs");
    panel.parentNode.insertBefore(chips, panel.nextSibling);

    var catalogParent = panel.parentNode;
    var layout = document.createElement("div");
    var results = document.createElement("div");
    var listTools = catalogParent.querySelector(".list-tools");
    var summary = catalogParent.querySelector(".summary");
    var grid = catalogParent.querySelector(".grid");
    layout.className = "legacy-catalog-layout";
    results.className = "legacy-catalog-results";
    catalogParent.insertBefore(layout, panel);
    catalogParent.insertBefore(chips, layout);
    layout.appendChild(panel);
    [listTools, summary, grid].forEach(function (element) {
        if (element) results.appendChild(element);
    });
    layout.appendChild(results);

    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "legacy-filter-backdrop";
    backdrop.setAttribute("aria-label", "Fermer les filtres");
    document.body.appendChild(backdrop);

    function activeControls() {
        return controls.filter(function (control) { return control.value !== defaults.get(control.id); });
    }

    function renderChips() {
        var active = activeControls();
        count.textContent = String(active.length);
        chips.replaceChildren();
        active.forEach(function (control) {
            var data = labelFor(control);
            var chip = document.createElement("button");
            chip.type = "button";
            chip.textContent = data.name + " : " + data.value + " ×";
            chip.setAttribute("aria-label", "Retirer le filtre " + data.name + " " + data.value);
            chip.addEventListener("click", function () {
                control.value = defaults.get(control.id);
                dispatch(control);
                update();
            });
            chips.appendChild(chip);
        });
    }

    function updateUrl() {
        if (!window.history || typeof URL === "undefined") return;
        var url = new URL(window.location.href);
        controls.forEach(function (control) {
            var parameter = parameterById[control.id];
            if (control.value === defaults.get(control.id)) url.searchParams.delete(parameter);
            else url.searchParams.set(parameter, control.value);
        });
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }

    function update() {
        renderChips();
        updateUrl();
    }

    function setOpen(open) {
        panel.classList.toggle("is-open", open);
        backdrop.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("has-open-legacy-filters", open);
        if (open) {
            panel.setAttribute("role", "dialog");
            panel.setAttribute("aria-modal", "true");
        } else {
            panel.removeAttribute("role");
            panel.removeAttribute("aria-modal");
        }
        if (open) close.focus();
        else toggle.focus();
    }

    restoreFromUrl();
    renderChips();
    window.addEventListener("popstate", function () {
        restoreFromUrl();
        renderChips();
    });
    controls.forEach(function (control) {
        control.addEventListener(control.tagName === "SELECT" ? "change" : "input", function () {
            window.clearTimeout(inputTimer);
            inputTimer = window.setTimeout(update, control.tagName === "SELECT" ? 0 : 120);
        });
    });
    reset.addEventListener("click", function () {
        controls.forEach(function (control) {
            control.value = defaults.get(control.id);
            dispatch(control);
        });
        update();
    });
    toggle.addEventListener("click", function () { setOpen(true); });
    close.addEventListener("click", function () { setOpen(false); });
    backdrop.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (event) {
        if (!panel.classList.contains("is-open")) return;
        if (event.key === "Escape") {
            setOpen(false);
        } else if (event.key === "Tab") {
            var focusable = panel.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])");
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
    });
})();
