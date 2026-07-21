(function () {
    "use strict";

    const searchInput = document.getElementById("searchInput");
    const levelSelect = document.getElementById("levelSelect");
    const sortSelect = document.getElementById("sortSelect");
    const classList = document.getElementById("classList");
    const expandAllBtn = document.getElementById("expandAllBtn");
    const collapseAllBtn = document.getElementById("collapseAllBtn");
    const exportTxtBtn = document.getElementById("exportTxtBtn");
    const exportStatus = document.getElementById("exportStatus");
    const summary = document.getElementById("summary");
    const spellsGrid = document.getElementById("spellsGrid");
    const sourceNote = document.getElementById("sourceNote");

    let spells = [];
    const selectedClasses = new Set();

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renderClassFilters(allClasses) {
        classList.innerHTML = allClasses.map((className) => {
            return `<label class="class-item"><input type="checkbox" value="${escapeHtml(className)}" />${escapeHtml(className)}</label>`;
        }).join("");

        classList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
            checkbox.addEventListener("change", function () {
                if (checkbox.checked) selectedClasses.add(checkbox.value);
                else selectedClasses.delete(checkbox.value);
                render();
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

    function card(spell) {
        const details = [
            `Temps: ${spell.casting_time || "-"}`,
            `Portée: ${spell.range || "-"}`,
            `Composantes: ${spell.components || "-"}`,
            `Durée: ${spell.duration || "-"}`,
        ];
        const description = spell.description_html && spell.description_html.trim()
            ? window.DndHtml.sanitizeRichHtml(spell.description_html)
            : escapeHtml(spell.description || "Description non disponible.");
        return `
            <details class="spell">
                <summary>
                    <header class="spell-head">
                        <h2 class="spell-title">${escapeHtml(spell.name)}</h2>
                        <div class="spell-meta">
                            Niveau ${spell.level} • ${escapeHtml(spell.school)} • ${escapeHtml((spell.classes || []).join(", "))}
                        </div>
                    </header>
                </summary>
                <div class="spell-body">
                    <p class="spell-lines">${escapeHtml(details.join(" | "))}</p>
                    <div>${description}</div>
                </div>
            </details>
        `;
    }

    function render() {
        const filtered = applyFilters();
        summary.textContent = `${filtered.length} sort(s) affiché(s) sur ${spells.length}.`;
        exportTxtBtn.disabled = filtered.length === 0;
        exportStatus.textContent = "";
        if (!filtered.length) {
            spellsGrid.innerHTML = `<div class="empty">Aucun sort ne correspond aux filtres actuels.</div>`;
            return;
        }
        spellsGrid.innerHTML = filtered.map(card).join("");
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
        exportStatus.textContent = `${filtered.length} sort(s) exporté(s).`;
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    }

    function setAllCards(open) {
        spellsGrid.querySelectorAll("details.spell").forEach((element) => {
            element.open = open;
        });
    }

    function init(data) {
        spells = data.spells || [];
        sourceNote.textContent = data.note
            ? `${data.count || spells.length} sorts chargés. ${data.note}`
            : `${data.count || spells.length} sorts chargés.`;

        const allClasses = Array.from(
            new Set(spells.flatMap((spell) => spell.classes || [])),
        ).sort((first, second) => first.localeCompare(second, "fr"));

        renderClassFilters(allClasses);
        searchInput.addEventListener("input", render);
        levelSelect.addEventListener("change", render);
        sortSelect.addEventListener("change", render);
        expandAllBtn.addEventListener("click", function () { setAllCards(true); });
        collapseAllBtn.addEventListener("click", function () { setAllCards(false); });
        exportTxtBtn.addEventListener("click", exportVisibleSpells);
        render();
    }

    function failMessage() {
        sourceNote.textContent = "Impossible de charger les données de sorts.";
        spellsGrid.innerHTML = `<div class="empty">Le fichier data/spells_2024.json est introuvable ou invalide.</div>`;
    }

    if (window.SPELLS_DATA && window.SPELLS_DATA.spells) {
        init(window.SPELLS_DATA);
    } else {
        fetch("data/spells_2024.json")
            .then(function (response) {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(init)
            .catch(failMessage);
    }
})();
