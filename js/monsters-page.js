(function () {
    const searchInput = document.getElementById("searchInput");
    const crSelect = document.getElementById("crSelect");
    const typeSelect = document.getElementById("typeSelect");
    const alignmentSelect = document.getElementById("alignmentSelect");
    const sizeSelect = document.getElementById("sizeSelect");
    const sortSelect = document.getElementById("sortSelect");
    const expandAllBtn = document.getElementById("expandAllBtn");
    const collapseAllBtn = document.getElementById("collapseAllBtn");
    const summary = document.getElementById("summary");
    const monstersGrid = document.getElementById("monstersGrid");
    const sourceNote = document.getElementById("sourceNote");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    let monsters = [];
    let revealSelection = true;
    const progressive = window.DndProgressiveList.create({
        button: loadMoreBtn,
        batchSize: 72,
        onChange: render,
    });

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function norm(value) {
        return String(value || "").toLowerCase();
    }

    const translations = [
        ["Medium or Small", "Moyenne ou Petite"],
        ["Lawful Good", "Loyal bon"],
        ["Lawful Neutral", "Loyal neutre"],
        ["Lawful Evil", "Loyal mauvais"],
        ["Neutral Good", "Neutre bon"],
        ["Neutral Evil", "Neutre mauvais"],
        ["Chaotic Good", "Chaotique bon"],
        ["Chaotic Neutral", "Chaotique neutre"],
        ["Chaotic Evil", "Chaotique mauvais"],
        ["Any Alignment", "Tout alignement"],
        ["Unaligned", "Non aligné"],
        ["Aberration", "Aberration"],
        ["Beast", "Bête"],
        ["Celestial", "Céleste"],
        ["Construct", "Artificiel"],
        ["Elemental", "Élémentaire"],
        ["Fey", "Fée"],
        ["Fiend", "Fiélon"],
        ["Giant", "Géant"],
        ["Humanoid", "Humanoïde"],
        ["Monstrosity", "Monstruosité"],
        ["Ooze", "Vase"],
        ["Undead", "Mort-vivant"],
        ["Tiny", "Minuscule"],
        ["Small", "Petite"],
        ["Medium", "Moyenne"],
        ["Large", "Grande"],
        ["Huge", "Très grande"],
        ["Gargantuan", "Gigantesque"],
        ["Neutral", "Neutre"],
        ["Arcana", "Arcanes"],
        ["Athletics", "Athlétisme"],
        ["Animal Handling", "Dressage"],
        ["Deception", "Tromperie"],
        ["History", "Histoire"],
        ["Insight", "Intuition"],
        ["Medicine", "Médecine"],
        ["Performance", "Représentation"],
        ["Sleight of Hand", "Escamotage"],
        ["Stealth", "Discrétion"],
        ["Survival", "Survie"],
        ["Passive Perception", "Perception passive"],
        ["Darkvision", "Vision dans le noir"],
        ["Truesight", "Vision lucide"],
        ["Blindsight", "Vision aveugle"],
        ["Tremorsense", "Perception des vibrations"],
        ["Bludgeoning", "Contondants"],
        ["Piercing", "Perforants"],
        ["Slashing", "Tranchants"],
        ["Lightning", "Foudre"],
        ["Thunder", "Tonnerre"],
        ["Necrotic", "Nécrotiques"],
        ["Radiant", "Radiants"],
        ["Psychic", "Psychiques"],
        ["Poison", "Poison"],
        ["Fire", "Feu"],
        ["Cold", "Froid"],
        ["Acid", "Acide"],
        ["Common", "Commun"],
        ["Fly", "Vol"],
        ["Swim", "Nage"],
        ["Climb", "Escalade"],
        ["Burrow", "Fouissement"],
        ["Hover", "Surplace"]
    ];

    function localize(value) {
        let text = String(value || "");
        translations.forEach(([source, target]) => {
            text = text.replace(new RegExp(`\\b${source}\\b`, "g"), target);
        });
        return text.replace(/\b(\d+) ft\./g, function (_, feet) {
            return `${(Number(feet) * 0.3).toLocaleString("fr-FR")} m`;
        });
    }

    function option(value) {
        return `<option value="${escapeHtml(value)}">${escapeHtml(localize(value))}</option>`;
    }

    function uniqueValues(field) {
        return Array.from(new Set(monsters.map(m => m[field]).filter(Boolean)))
            .sort((a, b) => String(a).localeCompare(String(b), "fr", { numeric: true }));
    }

    function fillSelect(select, values) {
        select.insertAdjacentHTML("beforeend", values.map(option).join(""));
    }

    function crLabel(monster) {
        const xp = monster.xp ? `, ${monster.xp} PX` : "";
        const pb = monster.pb ? `, BM ${monster.pb}` : "";
        return `FP ${monster.cr || "-"}${xp}${pb}`;
    }

    function applyFilters() {
        const query = norm(searchInput.value.trim());
        const cr = crSelect.value;
        const type = typeSelect.value;
        const alignment = alignmentSelect.value;
        const size = sizeSelect.value;

        const filtered = monsters.filter(monster => {
            if (cr && monster.cr !== cr) return false;
            if (type && monster.type !== type) return false;
            if (alignment && monster.alignment !== alignment) return false;
            if (size && monster.size !== size) return false;
            if (!query) return true;
            const haystack = norm([
                monster.name,
                monster.type,
                monster.subtype,
                monster.kind,
                monster.size,
                monster.alignment,
                monster.cr,
                monster.ac,
                monster.hp,
                monster.speed,
                monster.skills,
                monster.senses,
                monster.languages,
                monster.immunities,
                monster.resistances,
                monster.vulnerabilities
            ].join(" "));
            return haystack.includes(query) || norm(localize(haystack)).includes(query);
        });

        filtered.sort((a, b) => {
            const mode = sortSelect.value;
            if (mode === "cr_desc") return b.cr_sort - a.cr_sort || a.name.localeCompare(b.name, "fr");
            if (mode === "name_asc") return a.name.localeCompare(b.name, "fr");
            if (mode === "name_desc") return b.name.localeCompare(a.name, "fr");
            if (mode === "type_asc") return a.type.localeCompare(b.type, "fr") || a.name.localeCompare(b.name, "fr");
            return a.cr_sort - b.cr_sort || a.name.localeCompare(b.name, "fr");
        });

        return filtered;
    }

    function line(label, value) {
        if (!value) return "";
        return `<p class="monster-lines"><strong>${escapeHtml(label)}.</strong> ${escapeHtml(localize(value))}</p>`;
    }

    function card(monster) {
        const typeLine = [monster.kind || monster.type, monster.size, monster.alignment]
            .filter(Boolean)
            .map(localize)
            .join(" • ");
        const misc = [
            line("Vitesse", monster.speed),
            line("Compétences", monster.skills),
            line("Sens", monster.senses),
            line("Langues", monster.languages),
            line("Immunités", monster.immunities),
            line("Résistances", monster.resistances),
            line("Vulnérabilités", monster.vulnerabilities)
        ].join("");

        return `
            <details class="monster" id="monster-${escapeHtml(monster.slug)}" data-content-id="${escapeHtml(monster.slug)}">
                <summary>
                    <header class="monster-head">
                        <h2 class="monster-title">${escapeHtml(monster.name)}</h2>
                        <div class="monster-meta">${escapeHtml(typeLine)} • ${escapeHtml(crLabel(monster))}</div>
                    </header>
                </summary>
                <div class="monster-body">
                    <div class="stat-grid">
                        <div class="stat"><strong>CA</strong>${escapeHtml(monster.ac || "-")}</div>
                        <div class="stat"><strong>PV</strong>${escapeHtml(monster.hp || "-")}</div>
                        <div class="stat"><strong>Initiative</strong>${escapeHtml(monster.initiative || "-")}</div>
                    </div>
                    ${misc || "<p class=\"monster-lines\">Aucune information secondaire extraite.</p>"}
                </div>
            </details>
        `;
    }

    function render() {
        let filtered = applyFilters();
        let selectedSlug = window.DndCatalogUI.readSelection("monster");
        const selectedIndex = filtered.findIndex(function (monster) { return monster.slug === selectedSlug; });
        if (selectedSlug && selectedIndex === -1) {
            window.DndCatalogUI.updateSelection("monster", "", { mode: "replace" });
            selectedSlug = "";
        } else if (selectedIndex > 0) {
            filtered = [filtered[selectedIndex]].concat(filtered.slice(0, selectedIndex), filtered.slice(selectedIndex + 1));
        }
        const visible = progressive.take(filtered);
        summary.textContent = `${filtered.length} monstre(s) trouvé(s) sur ${monsters.length} · ${visible.length} affiché(s).`;
        if (!filtered.length) {
            monstersGrid.innerHTML = `<div class="empty">Aucun monstre ne correspond aux filtres actuels.</div>`;
            return;
        }
        monstersGrid.innerHTML = visible.map(card).join("");
        connectDetails(selectedSlug);
    }

    function connectDetails(selectedSlug) {
        const detailsElements = Array.from(monstersGrid.querySelectorAll("details[data-content-id]"));
        detailsElements.forEach(function (details) {
            const slug = details.getAttribute("data-content-id");
            details.open = Boolean(selectedSlug && slug === selectedSlug);
            details.querySelector("summary")?.addEventListener("click", function () {
                if (!details.open) {
                    detailsElements.forEach(function (other) {
                        if (other !== details) other.open = false;
                    });
                    window.DndCatalogUI.updateSelection("monster", slug, { mode: "push" });
                } else if (window.DndCatalogUI.readSelection("monster") === slug) {
                    window.DndCatalogUI.updateSelection("monster", "", { mode: "replace" });
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

    function resetAndRender() {
        progressive.reset();
        render();
    }

    function setAllCards(open) {
        monstersGrid.querySelectorAll("details.monster").forEach(el => {
            el.open = open;
        });
    }

    function applyUrlState() {
        const params = new URLSearchParams(window.location.search);
        searchInput.value = params.get("q") || "";
        [
            [crSelect, "cr"],
            [typeSelect, "type"],
            [alignmentSelect, "alignment"],
            [sizeSelect, "size"],
            [sortSelect, "sort"],
        ].forEach(function ([select, parameter]) {
            const value = params.get(parameter) || "";
            if (!select.options || !Array.from(select.options).some(function (option) { return option.value === value; })) return;
            select.value = value;
        });
    }

    function init(data) {
        monsters = data.monsters || [];
        sourceNote.textContent = data.note
            ? `${data.count || monsters.length} monstres chargés. ${data.note}`
            : `${data.count || monsters.length} monstres chargés.`;

        fillSelect(crSelect, uniqueValues("cr").sort((a, b) => {
            const am = monsters.find(m => m.cr === a);
            const bm = monsters.find(m => m.cr === b);
            return (am ? am.cr_sort : 0) - (bm ? bm.cr_sort : 0);
        }));
        fillSelect(typeSelect, uniqueValues("type"));
        fillSelect(alignmentSelect, uniqueValues("alignment"));
        fillSelect(sizeSelect, uniqueValues("size"));
        applyUrlState();

        [searchInput, crSelect, typeSelect, alignmentSelect, sizeSelect, sortSelect].forEach(el => {
            el.addEventListener("input", resetAndRender);
            el.addEventListener("change", resetAndRender);
        });
        expandAllBtn.addEventListener("click", function () { setAllCards(true); });
        collapseAllBtn.addEventListener("click", function () { setAllCards(false); });
        if (typeof window.addEventListener === "function") {
            window.addEventListener("popstate", function () {
                applyUrlState();
                progressive.reset();
                revealSelection = true;
                render();
            });
        }
        render();
    }

    fetch("data/monsters_2024.json", { credentials: "omit" })
        .then(function (response) {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(init)
        .catch(function () {
            sourceNote.textContent = "Impossible de charger les données de monstres.";
            monstersGrid.innerHTML = `<div class="empty">Le fichier de données des monstres est introuvable ou invalide.</div>`;
        });
})();
