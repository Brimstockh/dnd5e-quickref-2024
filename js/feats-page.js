(function () {
    "use strict";

    const searchInput = document.getElementById("searchInput");
    const categorySelect = document.getElementById("categorySelect");
    const prereqSelect = document.getElementById("prereqSelect");
    const repeatableSelect = document.getElementById("repeatableSelect");
    const sortSelect = document.getElementById("sortSelect");
    const expandAllBtn = document.getElementById("expandAllBtn");
    const collapseAllBtn = document.getElementById("collapseAllBtn");
    const activeFilters = document.getElementById("activeFilters");
    const activeFilterCount = document.getElementById("activeFilterCount");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const openFiltersBtn = document.getElementById("openFiltersBtn");
    const closeFiltersBtn = document.getElementById("closeFiltersBtn");
    const filterPanel = document.getElementById("filterPanel");
    const filterBackdrop = document.getElementById("filterBackdrop");
    const summary = document.getElementById("summary");
    const featsGrid = document.getElementById("featsGrid");
    const sourceNote = document.getElementById("sourceNote");

    const categoryOrder = {
        "Don d’origines": 0,
        "Don général": 1,
        "Don de Style de combat": 2,
        "Don de faveur épique": 3,
    };

    let feats = [];
    let revealSelection = true;

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function norm(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function getState() {
        return {
            query: searchInput.value,
            category: categorySelect.value,
            prereq: prereqSelect.value,
            repeatable: repeatableSelect.value,
            sort: sortSelect.value,
            sortDefault: "name_asc",
        };
    }

    function renderDescription(text) {
        const lines = String(text || "").split(/\r?\n/);
        const chunks = [];
        let index = 0;

        function renderParagraph(line) {
            const match = line.match(/^([^.!?]{1,48}[.:])\s+(.+)$/);
            if (match) {
                return `<p><strong>${escapeHtml(match[1])}</strong> ${escapeHtml(match[2])}</p>`;
            }
            return `<p>${escapeHtml(line)}</p>`;
        }

        while (index < lines.length) {
            const line = lines[index].trim();
            if (!line) {
                index += 1;
                continue;
            }

            if (line.includes("\t")) {
                const rows = [];
                while (index < lines.length && lines[index].trim().includes("\t")) {
                    rows.push(lines[index].trim().split("\t"));
                    index += 1;
                }
                const [head, ...body] = rows;
                chunks.push(
                    `<table><thead><tr>${head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>` +
                    `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
                );
                continue;
            }

            chunks.push(renderParagraph(line));
            index += 1;
        }

        return chunks.join("");
    }

    function applyFilters() {
        const query = norm(searchInput.value.trim());
        const category = categorySelect.value;
        const prereqMode = prereqSelect.value;
        const repeatableMode = repeatableSelect.value;

        const filtered = feats.filter((feat) => {
            if (category && feat.category !== category) return false;
            if (prereqMode === "yes" && !feat.prerequis) return false;
            if (prereqMode === "no" && feat.prerequis) return false;
            if (repeatableMode === "yes" && !feat.repeatable) return false;
            if (repeatableMode === "no" && feat.repeatable) return false;
            if (!query) return true;

            const haystack = norm([
                feat.name,
                (feat.aliases || []).join(" "),
                feat.category,
                feat.prerequis,
                feat.repeatable ? "repetable" : "non repetable",
                feat.description,
            ].join(" "));
            return haystack.includes(query);
        });

        filtered.sort((first, second) => {
            const mode = sortSelect.value;
            if (mode === "name_desc") return second.name.localeCompare(first.name, "fr");
            if (mode === "category_asc") {
                return (categoryOrder[first.category] ?? 99) - (categoryOrder[second.category] ?? 99)
                    || first.name.localeCompare(second.name, "fr");
            }
            if (mode === "repeatable_desc") {
                return Number(second.repeatable) - Number(first.repeatable)
                    || first.name.localeCompare(second.name, "fr");
            }
            if (mode === "prereq_desc") {
                return Number(Boolean(second.prerequis)) - Number(Boolean(first.prerequis))
                    || first.name.localeCompare(second.name, "fr");
            }
            return first.name.localeCompare(second.name, "fr");
        });

        return filtered;
    }

    function card(feat) {
        const meta = [
            feat.category,
            feat.prerequis ? `Prérequis : ${feat.prerequis}` : "Aucun prérequis explicite",
            feat.repeatable ? "Répétable" : "Non répétable",
        ];
        const aliases = feat.aliases && feat.aliases.length
            ? `<p class="aliases"><strong>Alias :</strong> ${escapeHtml(feat.aliases.join(", "))}</p>`
            : "";

        return `
            <details class="feat catalog-card" id="feat-${escapeHtml(window.DndCatalogUI.slugify(feat.name))}" data-content-id="${escapeHtml(window.DndCatalogUI.slugify(feat.name))}">
                <summary>
                    <header class="catalog-card__head">
                        <h2 class="catalog-card__title">${escapeHtml(feat.name)}</h2>
                        <div class="catalog-card__badges">
                            <span class="meta-chip meta-chip--accent">${escapeHtml(meta[0])}</span>
                            <span class="meta-chip meta-chip--muted">${escapeHtml(meta[1])}</span>
                            <span class="meta-chip meta-chip--muted">${escapeHtml(meta[2])}</span>
                        </div>
                    </header>
                </summary>
                <div class="catalog-card__body feat-body">
                    ${aliases.replace('class="aliases"', 'class="aliases catalog-card__details"')}
                    <div data-glossary-richtext>${renderDescription(feat.description)}</div>
                </div>
            </details>
        `;
    }

    function render() {
        let filtered = applyFilters();
        let selectedSlug = window.DndCatalogUI.readSelection("feat");
        const selectedIndex = filtered.findIndex(function (feat) {
            return window.DndCatalogUI.slugify(feat.name) === selectedSlug;
        });
        if (selectedSlug && selectedIndex === -1) {
            window.DndCatalogUI.updateSelection("feat", "", { mode: "replace" });
            selectedSlug = "";
        } else if (selectedIndex > 0) {
            filtered = [filtered[selectedIndex]].concat(filtered.slice(0, selectedIndex), filtered.slice(selectedIndex + 1));
        }
        const chips = buildChips();
        summary.textContent = `${filtered.length} don(s) affiché(s) sur ${feats.length}.`;
        if (activeFilterCount) activeFilterCount.textContent = String(chips.length);
        if (activeFilters) window.DndCatalogUI.renderChips(activeFilters, chips, removeChip);
        window.DndCatalogUI.replaceUrlState(getState());
        if (!filtered.length) {
            featsGrid.innerHTML = `<div class="catalog-empty"><strong>Aucun don trouvé</strong><span>Modifiez ou réinitialisez vos filtres.</span></div>`;
            return;
        }
        featsGrid.innerHTML = filtered.map(card).join("");
        connectDetails(selectedSlug);
    }

    function connectDetails(selectedSlug) {
        const detailsElements = Array.from(featsGrid.querySelectorAll("details[data-content-id]"));
        detailsElements.forEach(function (details) {
            const slug = details.getAttribute("data-content-id");
            details.open = Boolean(selectedSlug && slug === selectedSlug);
            details.querySelector("summary")?.addEventListener("click", function () {
                if (!details.open) {
                    detailsElements.forEach(function (other) {
                        if (other !== details) other.open = false;
                    });
                    window.DndCatalogUI.updateSelection("feat", slug, { mode: "push" });
                } else if (window.DndCatalogUI.readSelection("feat") === slug) {
                    window.DndCatalogUI.updateSelection("feat", "", { mode: "replace" });
                }
            });
        });
        const selected = detailsElements.find(function (details) {
            return details.getAttribute("data-content-id") === selectedSlug;
        });
        if (selected && revealSelection) {
            selected.scrollIntoView({ block: "start" });
            selected.querySelector("summary")?.focus({ preventScroll: true });
        }
        revealSelection = false;
    }

    function setAllCards(open) {
        featsGrid.querySelectorAll("details.feat").forEach((element) => {
            element.open = open;
        });
    }

    function buildChips() {
        const chips = [];
        const query = searchInput.value.trim();
        if (query) chips.push({ type: "query", label: `Recherche : ${query}` });
        if (categorySelect.value) chips.push({ type: "category", label: categorySelect.value });
        if (prereqSelect.value) chips.push({
            type: "prereq",
            label: prereqSelect.value === "yes" ? "Avec prérequis" : "Sans prérequis",
        });
        if (repeatableSelect.value) chips.push({
            type: "repeatable",
            label: repeatableSelect.value === "yes" ? "Répétable" : "Non répétable",
        });
        if (sortSelect.value !== "name_asc") {
            const option = sortSelect.options?.[sortSelect.selectedIndex];
            chips.push({ type: "sort", label: `Tri : ${option?.textContent || sortSelect.value}` });
        }
        return chips;
    }

    function removeChip(chip) {
        if (chip.type === "query") searchInput.value = "";
        if (chip.type === "category") categorySelect.value = "";
        if (chip.type === "prereq") prereqSelect.value = "";
        if (chip.type === "repeatable") repeatableSelect.value = "";
        if (chip.type === "sort") sortSelect.value = "name_asc";
        render();
    }

    function resetFilters() {
        searchInput.value = "";
        categorySelect.value = "";
        prereqSelect.value = "";
        repeatableSelect.value = "";
        sortSelect.value = "name_asc";
        render();
        searchInput.focus();
    }

    function applyUrlState() {
        const state = window.DndCatalogUI.readState(window.location.search);
        searchInput.value = state.query;
        [[categorySelect, state.category], [prereqSelect, state.prereq], [repeatableSelect, state.repeatable], [sortSelect, state.sort]]
            .forEach(function ([select, value]) {
                if (!select.options || !Array.from(select.options).some(function (option) { return option.value === value; })) return;
                select.value = value;
            });
    }

    function init(data) {
        feats = data.feats || [];
        applyUrlState();
        sourceNote.textContent = data.note
            ? `${data.count || feats.length} dons chargés. ${data.note}`
            : `${data.count || feats.length} dons chargés.`;

        searchInput.addEventListener("input", render);
        categorySelect.addEventListener("change", render);
        prereqSelect.addEventListener("change", render);
        repeatableSelect.addEventListener("change", render);
        sortSelect.addEventListener("change", render);
        expandAllBtn.addEventListener("click", function () { setAllCards(true); });
        collapseAllBtn.addEventListener("click", function () { setAllCards(false); });
        if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", resetFilters);
        if (openFiltersBtn && closeFiltersBtn && filterPanel && filterBackdrop) {
            window.DndCatalogUI.connectDrawer({
                panel: filterPanel,
                backdrop: filterBackdrop,
                closeButton: closeFiltersBtn,
                triggers: [{ button: openFiltersBtn }],
            });
        }
        if (typeof window.addEventListener === "function") {
            window.addEventListener("popstate", function () {
                applyUrlState();
                revealSelection = true;
                render();
            });
        }
        render();
    }

    fetch("data/feats_2024.json", { credentials: "omit" })
        .then(function (response) {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(init)
        .catch(function () {
            sourceNote.textContent = "Impossible de charger les données de dons.";
            featsGrid.innerHTML = `<div class="empty">Le fichier de données des dons est introuvable ou invalide.</div>`;
        });
})();
