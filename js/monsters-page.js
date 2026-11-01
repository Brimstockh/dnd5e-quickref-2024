(function () {
    const searchInput = document.getElementById("searchInput");
    const crSelect = document.getElementById("crSelect");
    const typeSelect = document.getElementById("typeSelect");
    const alignmentSelect = document.getElementById("alignmentSelect");
    const sizeSelect = document.getElementById("sizeSelect");
    const sortSelect = document.getElementById("sortSelect");
    const expandAllBtn = document.getElementById("expandAllBtn");
    const collapseAllBtn = document.getElementById("collapseAllBtn");
    const exportJsonBtn = document.getElementById("exportJsonBtn");
    const exportStatus = document.getElementById("exportStatus");
    const summary = document.getElementById("summary");
    const monstersGrid = document.getElementById("monstersGrid");
    const sourceNote = document.getElementById("sourceNote");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const monsterImageDialog = document.getElementById("monsterImageDialog");
    const monsterImageDialogImage = document.getElementById("monsterImageDialogImage");
    const monsterImageDialogClose = document.querySelector(".monster-image-dialog-close");

    let monsters = [];
    let monsterNamesFr = {};
    let monsterLocalizationFr = { fieldsFr: {}, monsters: {} };
    let detailsLoaded = false;
    let revealSelection = true;
    const progressive = window.DndProgressiveList.create({
        button: loadMoreBtn,
        batchSize: 72,
        onChange: render,
    });

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function norm(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("fr-FR");
    }

    function displayName(monster) {
        return monster.nameFr;
    }

    function sortName(monster) {
        return monster.nameFr || monster.name;
    }

    const abilityOrder = [
        ["STR", "Force"],
        ["DEX", "Dextérité"],
        ["CON", "Constitution"],
        ["INT", "Intelligence"],
        ["WIS", "Sagesse"],
        ["CHA", "Charisme"]
    ];

    const optionSections = [
        ["Traits", "traits"],
        ["Actions", "actions"],
        ["Actions bonus", "bonus_actions"],
        ["Réactions", "reactions"],
        ["Actions légendaires", "legendary_actions"]
    ];

    function distanceInMeters(feet) {
        const meters = Number(feet) * 0.3;
        return `${meters.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} m`;
    }

    function splitTopLevel(value, separator) {
        const parts = [];
        let depth = 0;
        let start = 0;
        for (let index = 0; index < value.length; index += 1) {
            if (value[index] === "(") depth += 1;
            else if (value[index] === ")") depth = Math.max(0, depth - 1);
            else if (depth === 0 && value.startsWith(separator, index)) {
                parts.push(value.slice(start, index).trim());
                start = index + separator.length;
                index += separator.length - 1;
            }
        }
        parts.push(value.slice(start).trim());
        return parts.filter(Boolean);
    }

    function translateLanguageTerm(value) {
        const translations = monsterLocalizationFr.fieldsFr?.languages || {};
        const primordial = String(value).match(/^Primordial \((.+)\)$/);
        if (!primordial) return translations[value] || value;
        const dialects = splitTopLevel(primordial[1], ",").map(function (dialect) {
            return translations[dialect] || dialect.toLowerCase();
        });
        return `primordial (${dialects.join(", ")})`;
    }

    function translateLanguagePhrase(value) {
        const text = String(value).trim();
        if (text === "None") return "Aucune";
        if (text === "All") return "Toutes les langues";
        if (text === "—" || text === "———") return "—";
        const commonPlus = text.match(/^Common plus (one|two|three|four|five|six) other languages?$/);
        if (commonPlus) {
            const quantities = { one: "une", two: "deux", three: "trois", four: "quatre", five: "cinq", six: "six" };
            const quantity = quantities[commonPlus[1]];
            return `commun et ${quantity} autre${commonPlus[1] === "one" ? "" : "s"} langue${commonPlus[1] === "one" ? "" : "s"}`;
        }
        const understandsPlus = text.match(/^Understands Common plus (one|two) other languages? but can't speak$/);
        if (understandsPlus) {
            const quantity = understandsPlus[1] === "one" ? "une" : "deux";
            return `comprend le commun et ${quantity} autre${understandsPlus[1] === "one" ? "" : "s"} langue${understandsPlus[1] === "one" ? "" : "s"}, mais ne peut pas parler`;
        }
        const understands = text.match(/^Understands (.+) but can't speak( them)?$/);
        if (understands) {
            const languages = splitTopLevel(understands[1].replace(/, and /g, ", ").replace(/ and /g, ", "), ",").map(translateLanguageTerm);
            const joined = languages.length > 1 ? `${languages.slice(0, -1).join(", ")} et ${languages.at(-1)}` : languages[0];
            return `comprend ${joined}, mais ne peut pas parler${understands[2] ? " ces langues" : ""}`;
        }
        const form = text.match(/^Common \(can't speak in (bear|boar|rat|tiger|wolf) form\)$/);
        if (form) {
            const animals = { bear: "ours", boar: "sanglier", rat: "rat", tiger: "tigre", wolf: "loup" };
            return `commun (ne peut pas parler sous forme de ${animals[form[1]]})`;
        }
        if (text === "Blink Dog; understands Elvish and Sylvan but can't speak them") return "chien téléporteur ; comprend l'elfique et le sylvestre, mais ne peut pas parler ces langues";
        if (text === "Understands commands given in any language but can't speak") return "comprend les ordres donnés dans n'importe quelle langue, mais ne peut pas parler";

        const telepathy = text.match(/^(.*?)(?:;\s*)?telepathy (\d+) ft\.(?: \((.+)\))?$/);
        if (telepathy) {
            const base = telepathy[1].trim();
            const baseFr = base ? translateLanguagePhrase(base) : "";
            const aside = telepathy[3] === "works only with creatures that understand Abyssal"
                ? " (fonctionne uniquement avec les créatures qui comprennent l'abyssal)"
                : telepathy[3] === "doesn't allow the receiving creature to respond telepathically"
                    ? " (ne permet pas à la créature qui la reçoit de répondre par télépathie)"
                    : "";
            return `${baseFr ? `${baseFr} ; ` : ""}télépathie à ${distanceInMeters(telepathy[2])}${aside}`;
        }
        const split = splitTopLevel(text, ",");
        const andList = split.flatMap((part) => part.split(/\s+and\s+/i));
        return andList.map((part) => translateLanguageTerm(part.trim())).join(", ");
    }

    function translateDamageTerms(value, dictionary) {
        const terms = splitTopLevel(String(value).replace(/, and /g, ", ").replace(/\s+and\s+/g, ", "), ",");
        return terms.map(function (part) {
            const match = part.match(/^(Acid|Bludgeoning|Cold|Fire|Force|Lightning|Necrotic|Piercing|Poison|Psychic|Radiant|Slashing|Thunder)(.*)$/);
            if (!match) return dictionary[part] || dictionary[part.trim()] || part.trim();
            const suffix = match[2].replace(/\bfrom Nonmagical Attacks\b/i, "provenant d'attaques non magiques")
                .replace(/\bdamage from weapons\b/i, "dégâts provenant d'armes")
                .replace(/\bdamage\b/i, "dégâts");
            return `${dictionary[match[1]] || match[1]}${suffix}`.trim();
        }).join(", ");
    }

    function translateField(field, value) {
        const text = String(value || "").trim();
        if (!text) return "";
        const dictionary = monsterLocalizationFr.fieldsFr || {};
        if (field === "type") return dictionary.types?.[text] || text;
        if (field === "kind") return dictionary.kinds?.[text] || dictionary.types?.[text] || text;
        if (field === "subtype") return dictionary.subtypes?.[text] || text;
        if (field === "size") return dictionary.sizes?.[text] || text;
        if (field === "alignment") return dictionary.alignments?.[text] || text;
        if (field === "speed") {
            return splitTopLevel(text, ",").map(function (part) {
                const movement = part.match(/^(?:(Fly|Swim|Climb|Burrow) )?(\d+(?:\.\d+)?) ft\.(?: \((hover)\))?$/);
                if (!movement) return part;
                const mode = movement[1] ? `${dictionary.movementModes?.[movement[1]] || movement[1]} ` : "";
                const hover = movement[3] ? " (surplace)" : "";
                return `${mode}${distanceInMeters(movement[2])}${hover}`;
            }).join(", ");
        }
        if (field === "skills") {
            return splitTopLevel(text, ",").map(function (part) {
                const match = part.match(/^(.+?)(?:\s+([+-]\d+|Advantage))?$/);
                if (!match) return part;
                const skill = dictionary.skills?.[match[1]] || match[1];
                const bonus = match[2] === "Advantage" ? " (Avantage)" : match[2] ? ` ${match[2]}` : "";
                return `${skill}${bonus}`;
            }).join(", ");
        }
        if (field === "senses") {
            return splitTopLevel(text, ",").map(function (part) {
                const passive = part.match(/^Passive Perception (\d+)$/);
                if (passive) return `${dictionary.senses?.["Passive Perception"] || "Perception passive"} ${passive[1]}`;
                const sense = part.match(/^(Blindsight|Darkvision|Tremorsense|Truesight) (\d+) ft\.$/);
                if (sense) return `${dictionary.senses?.[sense[1]] || sense[1]} ${distanceInMeters(sense[2])}`;
                return part;
            }).join(", ");
        }
        if (field === "languages") return translateLanguagePhrase(text);
        if (["immunities", "resistances", "vulnerabilities"].includes(field)) {
            const parts = text.split(";").map((part) => part.trim());
            const damage = translateDamageTerms(parts[0], dictionary.damageTypes || {});
            const conditions = parts[1]
                ? splitTopLevel(parts[1].replace(/, and /g, ", "), ",").map((part) => dictionary.conditions?.[part.trim()] || part.trim()).filter(Boolean).join(", ")
                : "";
            return [damage, conditions].filter(Boolean).join(" ; ");
        }
        return text;
    }

    function translatedFields(monster) {
        const fields = {};
        for (const field of ["type", "subtype", "kind", "size", "alignment", "initiative", "ac", "hp", "speed", "skills", "senses", "languages", "immunities", "resistances", "vulnerabilities"]) {
            fields[field] = translateField(field, monster[field]);
        }
        if (monster.kind && fields.kind === monster.kind) fields.kind = translateField("type", monster.type);
        return fields;
    }

    function option(value, field) {
        return `<option value="${escapeHtml(value)}">${escapeHtml(translateField(field, value))}</option>`;
    }

    function uniqueValues(field) {
        return Array.from(new Set(monsters.map(m => m[field]).filter(Boolean)))
            .sort((a, b) => String(a).localeCompare(String(b), "fr", { numeric: true }));
    }

    function fillSelect(select, values, field) {
        select.insertAdjacentHTML("beforeend", values.map(value => option(value, field)).join(""));
    }

    function crChipLabel(monster) {
        return `FP ${monster.cr || "-"}`;
    }

    function crSupportLabel(monster) {
        return [monster.xp ? `${monster.xp} PX` : "", monster.pb ? `BM ${monster.pb}` : ""]
            .filter(Boolean)
            .join(" • ");
    }

    function optionSearchText(monster) {
        return optionSections
            .flatMap(([, field]) => (monster[field] || []).flatMap(entry => [entry.name, entry.description, entry.nameFr, entry.descriptionFr]))
            .join(" ");
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
                monster.nameFr,
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
                monster.vulnerabilities,
                optionSearchText(monster),
                ...Object.values(translatedFields(monster)),
                ...abilityOrder.flatMap(([code]) => {
                    const ability = monster.abilities?.[code] || {};
                    return [code, ability.score, ability.modifier, ability.save];
                })
            ].join(" "));
            return haystack.includes(query);
        });

        filtered.sort((a, b) => {
            const mode = sortSelect.value;
            if (mode === "cr_desc") return b.cr_sort - a.cr_sort || sortName(a).localeCompare(sortName(b), "fr");
            if (mode === "name_asc") return sortName(a).localeCompare(sortName(b), "fr");
            if (mode === "name_desc") return sortName(b).localeCompare(sortName(a), "fr");
            if (mode === "type_asc") return a.type.localeCompare(b.type, "fr") || sortName(a).localeCompare(sortName(b), "fr");
            return a.cr_sort - b.cr_sort || sortName(a).localeCompare(sortName(b), "fr");
        });

        return filtered;
    }

    function line(label, field, value) {
        if (!value) return "";
        return `<p class="monster-lines"><strong>${escapeHtml(label)}.</strong> ${escapeHtml(translateField(field, value))}</p>`;
    }

    function abilityMarkup(monster) {
        return abilityOrder.map(([code, label]) => {
            const ability = monster.abilities?.[code] || {};
            const save = ability.save ? `S ${ability.save}` : "";
            const modifier = ability.modifier ? `Mod ${ability.modifier}` : "";
            return `
                <div class="monster-ability" title="${escapeHtml(label)}">
                    <strong>${code}</strong>
                    <span>${escapeHtml(label)}</span>
                    <b>${escapeHtml(ability.score ?? "-")}</b>
                    <small>${escapeHtml([modifier, save].filter(Boolean).join(" · "))}</small>
                </div>
            `;
        }).join("");
    }

    function optionMarkup(label, entries) {
        if (!Array.isArray(entries) || !entries.length) return "";
        const content = entries.map(entry => {
            const title = entry.nameFr || entry.name;
            const description = entry.descriptionFr || entry.description || "";
            const titleMarkup = title ? `<strong>${escapeHtml(title)}.</strong> ` : "";
            return `<div class="monster-option"><p>${titleMarkup}${escapeHtml(description)}</p></div>`;
        }).join("");
        return `<section class="monster-options"><h3>${escapeHtml(label)}</h3>${content}</section>`;
    }

    function monsterImageMarkup(monster) {
        const type = String(monster.type || "").trim();
        const name = String(monster.name || "").trim();
        if (!type || !name) return "";

        const path = `img/enemies/${encodeURIComponent(type)}/${encodeURIComponent(name)}.webp`;
        const label = displayName(monster);
        const alt = `Illustration de ${label}`;
        return `
            <button class="monster-image-button" type="button" data-monster-image="${escapeHtml(path)}" data-monster-name="${escapeHtml(label)}" aria-label="Agrandir l’illustration de ${escapeHtml(label)}">
                <div class="monster-image-frame">
                    <img class="monster-image" src="${escapeHtml(path)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />
                </div>
            </button>
        `;
    }

    function openMonsterImage(button) {
        const imagePath = button.getAttribute("data-monster-image");
        const monsterName = button.getAttribute("data-monster-name") || "";
        if (!imagePath || !monsterImageDialog || !monsterImageDialogImage || typeof monsterImageDialog.showModal !== "function") return;

        monsterImageDialogImage.src = imagePath;
        monsterImageDialogImage.alt = `Illustration de ${monsterName}`;
        monsterImageDialog.showModal();
    }

    function closeMonsterImage() {
        if (monsterImageDialog?.open) monsterImageDialog.close();
    }

    function handleMonsterGridClick(event) {
        const button = event.target?.closest?.(".monster-image-button");
        if (!button) return;

        event.preventDefault();
        openMonsterImage(button);
    }

    function handleMonsterImageError(event) {
        const image = event.target;
        if (!image?.classList?.contains("monster-image")) return;

        console.warn("Monster image not found:", image.currentSrc || image.src);
        const button = image.closest?.(".monster-image-button");
        const frame = image.closest?.(".monster-image-frame");
        (button || frame)?.remove();
    }

    function handleMonsterDialogClick(event) {
        if (event.target === monsterImageDialog) closeMonsterImage();
    }

    function handleMonsterDialogKeydown(event) {
        if (event.key !== "Escape" || !monsterImageDialog?.open) return;

        event.preventDefault();
        closeMonsterImage();
    }

    function bindMonsterImageInteractions() {
        monstersGrid.addEventListener("click", handleMonsterGridClick);
        monstersGrid.addEventListener("error", handleMonsterImageError, true);
        monsterImageDialogClose?.addEventListener("click", closeMonsterImage);
        monsterImageDialog?.addEventListener("click", handleMonsterDialogClick);
        document.addEventListener("keydown", handleMonsterDialogKeydown);
    }

    function card(monster) {
        const typeLine = [
            translateField("kind", monster.kind || monster.type),
            translateField("size", monster.size),
            translateField("alignment", monster.alignment),
        ].filter(Boolean).join(" • ");
        const misc = [
            line("Vitesse", "speed", monster.speed),
            line("Compétences", "skills", monster.skills),
            line("Sens", "senses", monster.senses),
            line("Langues", "languages", monster.languages),
            line("Immunités", "immunities", monster.immunities),
            line("Résistances", "resistances", monster.resistances),
            line("Vulnérabilités", "vulnerabilities", monster.vulnerabilities)
        ].join("");

        return `
            <article class="monster-card">
                ${monsterImageMarkup(monster)}
                <details class="monster" id="monster-${escapeHtml(monster.slug)}" data-content-id="${escapeHtml(monster.slug)}">
                    <summary>
                        <header class="monster-head">
                            <h2 class="monster-title">${escapeHtml(displayName(monster))}</h2>
                            <div class="monster-meta">
                                <span class="meta-chip meta-chip--accent">${escapeHtml(crChipLabel(monster))}</span>
                                <span class="monster-meta__details">${escapeHtml(typeLine)}</span>
                                ${crSupportLabel(monster) ? `<span class="monster-meta__secondary">${escapeHtml(crSupportLabel(monster))}</span>` : ""}
                            </div>
                        </header>
                    </summary>
                    <div class="monster-body" data-glossary-richtext>
                        <div class="stat-grid">
                            <div class="stat"><strong>CA</strong>${escapeHtml(monster.ac || "-")}</div>
                            <div class="stat"><strong>PV</strong>${escapeHtml(monster.hp || "-")}</div>
                            <div class="stat"><strong>Initiative</strong>${escapeHtml(monster.initiative || "-")}</div>
                        </div>
                        <div class="monster-abilities">${abilityMarkup(monster)}</div>
                        ${misc || "<p class=\"monster-lines\">Aucune information secondaire extraite.</p>"}
                        ${optionSections.map(([label, field]) => optionMarkup(label, monster[field])).join("")}
                    </div>
                </details>
            </article>
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
        exportJsonBtn.disabled = !detailsLoaded || filtered.length === 0;
        exportStatus.textContent = "";
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

    function exportVisibleMonsters() {
        const filtered = applyFilters();
        if (!detailsLoaded || !filtered.length) return;

        filtered.forEach(function (monster) {
            window.DndMonsterExport.downloadMonsterJson(monster);
        });
        exportStatus.textContent = `${filtered.length} fichier${filtered.length > 1 ? "s" : ""} JSON exporté${filtered.length > 1 ? "s" : ""}.`;
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

    function loadMonsterDetails() {
        fetch("data/monsters_2024_details.json", { credentials: "omit" })
            .then(function (response) {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(function (detailsData) {
                const details = detailsData.monsters || {};
                monsters = monsters.map(function (monster) {
                    const sourceDetails = details[monster.slug] || {};
                    const localized = monsterLocalizationFr.monsters?.[monster.slug] || {};
                    const mergedDetails = Object.assign({}, sourceDetails);
                    for (const [, category] of optionSections) {
                        mergedDetails[category] = (sourceDetails[category] || []).map(function (entry, index) {
                            return Object.assign({}, entry, localized[category]?.[index] || {});
                        });
                    }
                    const merged = Object.assign({}, monster, mergedDetails);
                    merged.fieldsFr = translatedFields(merged);
                    merged.localizationFr = {
                        abilities: Object.fromEntries(optionSections.map(([, category]) => [
                            category,
                            (merged[category] || []).map(({ nameFr, descriptionFr }) => ({ name: nameFr || "", description: descriptionFr || "" })),
                        ])),
                        fields: merged.fieldsFr,
                    };
                    return merged;
                });
                detailsLoaded = true;
                progressive.reset();
                render();
            })
            .catch(function () {
                sourceNote.textContent += " Les blocs détaillés n'ont pas pu être chargés.";
            });
    }

    function init(data, translationsData) {
        monsterNamesFr = translationsData.monsterNamesFr || {};
        monsters = (data.monsters || [])
            .map(function (monster) {
                return Object.assign({}, monster, { nameFr: monsterNamesFr[monster.name] || "" });
            })
            .filter(function (monster) { return monster.nameFr; });
        const resolvedCount = monsters.length;
        sourceNote.textContent = data.note
            ? `${data.count || monsters.length} monstres chargés. ${resolvedCount} noms français confirmés. ${data.note}`
            : `${data.count || monsters.length} monstres chargés. ${resolvedCount} noms français confirmés.`;

        fillSelect(crSelect, uniqueValues("cr").sort((a, b) => {
            const am = monsters.find(m => m.cr === a);
            const bm = monsters.find(m => m.cr === b);
            return (am ? am.cr_sort : 0) - (bm ? bm.cr_sort : 0);
        }));
        fillSelect(typeSelect, uniqueValues("type"), "type");
        fillSelect(alignmentSelect, uniqueValues("alignment"), "alignment");
        fillSelect(sizeSelect, uniqueValues("size"), "size");
        applyUrlState();
        bindMonsterImageInteractions();

        [searchInput, crSelect, typeSelect, alignmentSelect, sizeSelect, sortSelect].forEach(el => {
            el.addEventListener("input", resetAndRender);
            el.addEventListener("change", resetAndRender);
        });
        expandAllBtn.addEventListener("click", function () { setAllCards(true); });
        collapseAllBtn.addEventListener("click", function () { setAllCards(false); });
        exportJsonBtn.addEventListener("click", exportVisibleMonsters);
        if (typeof window.addEventListener === "function") {
            window.addEventListener("popstate", function () {
                applyUrlState();
                progressive.reset();
                revealSelection = true;
                render();
            });
        }
        render();
        loadMonsterDetails();
    }

    Promise.all(["data/monsters_2024.json", "data/monster-names-fr.json", "data/monster-capabilities-fr.json"].map(function (path) {
        return fetch(path, { credentials: "omit" }).then(function (response) {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        });
    }))
        .then(function ([data, translationsData, localizationData]) {
            monsterLocalizationFr = localizationData || monsterLocalizationFr;
            init(data, translationsData);
        })
        .catch(function () {
            sourceNote.textContent = "Impossible de charger les données de monstres.";
            monstersGrid.innerHTML = `<div class="empty">Le fichier de données des monstres est introuvable ou invalide.</div>`;
        });
})();
