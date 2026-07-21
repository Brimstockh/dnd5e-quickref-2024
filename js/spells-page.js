(function () {
    "use strict";

    const searchInput = document.getElementById("searchInput");
    const levelSelect = document.getElementById("levelSelect");
    const sortSelect = document.getElementById("sortSelect");
    const classList = document.getElementById("classList");
    const activeFilters = document.getElementById("activeFilters");
    const activeFilterCount = document.getElementById("activeFilterCount");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const expandAllBtn = document.getElementById("expandAllBtn");
    const collapseAllBtn = document.getElementById("collapseAllBtn");
    const exportTxtBtn = document.getElementById("exportTxtBtn");
    const exportStatus = document.getElementById("exportStatus");
    const summary = document.getElementById("summary");
    const spellsGrid = document.getElementById("spellsGrid");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const sourceNote = document.getElementById("sourceNote");
    const initialState = window.DndCatalogUI.readState(window.location.search);
    const progressive = window.DndProgressiveList.create({
        button: loadMoreBtn,
        batchSize: 60,
        onChange: render,
    });

    let spells = [];
    let allClasses = [];
    const selectedClasses = new Set();
    const allowedSorts = new Set(["level_asc", "level_desc", "name_asc", "name_desc"]);

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getState() {
        return {
            query: searchInput.value,
            level: levelSelect.value,
            classes: Array.from(selectedClasses),
            sort: sortSelect.value,
        };
    }

    function renderClassFilters() {
        classList.innerHTML = allClasses.map(function (className) {
            const checked = selectedClasses.has(className) ? " checked" : "";
            return `<label class="class-item"><input type="checkbox" value="${escapeHtml(className)}"${checked} />${escapeHtml(className)}</label>`;
        }).join("");

        classList.querySelectorAll("input[type='checkbox']").forEach(function (checkbox) {
            checkbox.addEventListener("change", function () {
                if (checkbox.checked) selectedClasses.add(checkbox.value);
                else selectedClasses.delete(checkbox.value);
                resetAndRender();
            });
        });
    }

    function applyFilters() {
        const level = levelSelect.value === "" ? null : Number(levelSelect.value);
        return window.DndSpellFilters.filterAndSortSpells(spells, {
            query: searchInput.value,
            level,
            selectedClasses,
            sort: sortSelect.value,
        });
    }

    function levelLabel(level) {
        return Number(level) === 0 ? "Tour de magie" : `Niveau ${level}`;
    }

    function card(spell) {
        const description = spell.description_html && spell.description_html.trim()
            ? window.DndHtml.sanitizeRichHtml(spell.description_html)
            : escapeHtml(spell.description || "Description non disponible.");
        const classes = (spell.classes || []).join(", ") || "Classe non précisée";
        return `
            <details class="spell catalog-card">
                <summary>
                    <header class="catalog-card__head">
                        <h2 class="catalog-card__title">${escapeHtml(spell.name)}</h2>
                        <div class="catalog-card__badges">
                            <span class="badge">${escapeHtml(levelLabel(spell.level))}</span>
                            <span class="badge badge--muted">${escapeHtml(spell.school || "École inconnue")}</span>
                        </div>
                        <div class="catalog-card__classes">${escapeHtml(classes)}</div>
                        <div class="catalog-card__quick-meta">
                            <span><strong>Incantation</strong> ${escapeHtml(spell.casting_time || "—")}</span>
                            <span><strong>Portée</strong> ${escapeHtml(spell.range || "—")}</span>
                            <span><strong>Durée</strong> ${escapeHtml(spell.duration || "—")}</span>
                        </div>
                    </header>
                </summary>
                <div class="catalog-card__body">
                    <p class="catalog-card__details"><strong>Composantes :</strong> ${escapeHtml(spell.components || "—")}</p>
                    <div>${description}</div>
                </div>
            </details>
        `;
    }

    function buildChips() {
        const chips = [];
        const query = searchInput.value.trim();
        if (query) chips.push({ type: "query", label: `Recherche : ${query}` });
        if (levelSelect.value !== "") chips.push({ type: "level", label: levelLabel(levelSelect.value) });
        Array.from(selectedClasses).sort(function (first, second) {
            return first.localeCompare(second, "fr");
        }).forEach(function (className) {
            chips.push({ type: "class", value: className, label: className });
        });
        return chips;
    }

    function removeChip(chip) {
        if (chip.type === "query") searchInput.value = "";
        if (chip.type === "level") levelSelect.value = "";
        if (chip.type === "class") {
            selectedClasses.delete(chip.value);
            renderClassFilters();
        }
        resetAndRender();
    }

    function render() {
        const filtered = applyFilters();
        const visible = progressive.take(filtered);
        const chips = buildChips();
        summary.textContent = `${filtered.length} ${filtered.length > 1 ? "sorts" : "sort"} sur ${spells.length} · ${visible.length} affiché${visible.length > 1 ? "s" : ""}`;
        activeFilterCount.textContent = String(chips.length);
        window.DndCatalogUI.renderChips(activeFilters, chips, removeChip);
        window.DndCatalogUI.replaceUrlState(getState());
        exportTxtBtn.disabled = filtered.length === 0;
        exportStatus.textContent = "";

        if (!filtered.length) {
            spellsGrid.innerHTML = `<div class="catalog-empty"><strong>Aucun sort trouvé</strong><span>Modifiez ou réinitialisez vos filtres.</span></div>`;
            return;
        }
        spellsGrid.innerHTML = visible.map(card).join("");
    }

    function resetAndRender() {
        progressive.reset();
        render();
    }

    function resetFilters() {
        searchInput.value = "";
        levelSelect.value = "";
        sortSelect.value = "level_asc";
        selectedClasses.clear();
        renderClassFilters();
        resetAndRender();
        searchInput.focus();
    }

    function exportVisibleSpells() {
        const filtered = applyFilters();
        if (!filtered.length) return;

        const content = window.DndSpellExport.buildSpellExportText(filtered);
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "sorts-dnd-2024.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        exportStatus.textContent = `${filtered.length} ${filtered.length > 1 ? "sorts exportés" : "sort exporté"}.`;
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    }

    function setAllCards(open) {
        spellsGrid.querySelectorAll("details.spell").forEach(function (element) {
            element.open = open;
        });
    }

    function applyInitialState() {
        searchInput.value = initialState.query;
        if (/^[0-9]$/.test(initialState.level)) levelSelect.value = initialState.level;
        if (allowedSorts.has(initialState.sort)) sortSelect.value = initialState.sort;
        initialState.classes.forEach(function (className) {
            if (allClasses.includes(className)) selectedClasses.add(className);
        });
    }

    function init(data) {
        spells = data.spells || [];
        sourceNote.textContent = `${data.count || spells.length} sorts disponibles · recherche instantanée et filtres combinables`;
        allClasses = Array.from(new Set(spells.flatMap(function (spell) {
            return spell.classes || [];
        }))).sort(function (first, second) {
            return first.localeCompare(second, "fr");
        });

        applyInitialState();
        renderClassFilters();
        searchInput.addEventListener("input", resetAndRender);
        levelSelect.addEventListener("change", resetAndRender);
        sortSelect.addEventListener("change", resetAndRender);
        resetFiltersBtn.addEventListener("click", resetFilters);
        expandAllBtn.addEventListener("click", function () { setAllCards(true); });
        collapseAllBtn.addEventListener("click", function () { setAllCards(false); });
        exportTxtBtn.addEventListener("click", exportVisibleSpells);
        window.DndCatalogUI.connectDrawer({
            panel: document.getElementById("filterPanel"),
            backdrop: document.getElementById("filterBackdrop"),
            closeButton: document.getElementById("closeFiltersBtn"),
            triggers: [
                { button: document.getElementById("openFiltersBtn") },
                { button: document.getElementById("openSortBtn"), focusTarget: sortSelect },
            ],
        });
        render();
    }

    function failMessage() {
        sourceNote.textContent = "Impossible de charger les données de sorts.";
        spellsGrid.innerHTML = `<div class="catalog-empty"><strong>Données indisponibles</strong><span>Le fichier data/spells_2024.json est introuvable ou invalide.</span></div>`;
    }

    fetch("data/spells_2024.json", { credentials: "omit" })
        .then(function (response) {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(init)
        .catch(failMessage);
})();
