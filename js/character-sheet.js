(function () {
    var SHEET_VERSION = "standalone_v2";
    var STORAGE_KEY = "dnd_character_sheet_standalone_v2";
    var LEGACY_STORAGE_KEY = "dnd_character_sheet_standalone_v1";
    var storage = window.DndStorage;
    var MAX_IMPORT_BYTES = 1024 * 1024;
    var statusEl = document.getElementById("status");
    var saveBtn = document.getElementById("saveBtn");
    var resetBtn = document.getElementById("resetBtn");
    var exportBtn = document.getElementById("exportBtn");
    var printBtn = document.getElementById("printBtn");
    var importFile = document.getElementById("importFile");
    var spellRowsA = document.getElementById("spellRowsA");
    var spellRowsB = document.getElementById("spellRowsB");
    var spellRowsC = document.getElementById("spellRowsC");
    var classSelect = document.querySelector("[data-class-select]");
    var speciesSelect = document.querySelector("[data-species-select]");
    var backgroundSelect = document.querySelector("[data-background-select]");
    var subclassSelect = document.querySelector("[data-subclass-select]");
    var classLevelField = document.querySelector("[data-class-level]");
    var levelInput = document.querySelector("[data-level-input]");
    var saveTimer = null;
    var storageFailed = false;
    var currentClassDetails = null;
    var classOptions = [];
    var subclassCache = {};
    var classSaveCache = {};
    var classMasteryCache = {};
    var classDetailCache = {};
    var backgroundDetailCache = {};
    var speciesDetailCache = {};
    var modifierTable = {};
    var fallbackClasses = [
        { name: "Barbare", href: "classes/class-barbarian.html" },
        { name: "Barde", href: "classes/class-bard.html" },
        { name: "Clerc", href: "classes/class-cleric.html" },
        { name: "Druide", href: "classes/class-druid.html" },
        { name: "Ensorceleur", href: "classes/class-sorcerer.html" },
        { name: "Guerrier", href: "classes/class-fighter.html" },
        { name: "Magicien", href: "classes/class-wizard.html" },
        { name: "Moine", href: "classes/class-monk.html" },
        { name: "Occultiste", href: "classes/class-warlock.html" },
        { name: "Paladin", href: "classes/class-paladin.html" },
        { name: "Rôdeur", href: "classes/class-rodeur.html" },
        { name: "Roublard", href: "classes/class-rogue.html" }
    ];
    var fallbackSpecies = [
        { name: "Aasimar", href: "races/race-aasimar.html" },
        { name: "Drakéide", href: "races/race-drakeide.html" },
        { name: "Elfe", href: "races/race-elfe.html" },
        { name: "Gnome", href: "races/race-gnome.html" },
        { name: "Goliath", href: "races/race-goliath.html" },
        { name: "Halfelin", href: "races/race-halfelin.html" },
        { name: "Humain", href: "races/race-human.html" },
        { name: "Nain", href: "races/race-dwarf.html" },
        { name: "Orc", href: "races/race-orc.html" },
        { name: "Tieffelin", href: "races/race-tieffelin.html" }
    ];
    var fallbackBackgrounds = [
        { name: "Acolyte", href: "historique.html#acolyte" },
        { name: "Artisan", href: "historique.html#artisan" },
        { name: "Artiste", href: "historique.html#artiste" },
        { name: "Charlatan", href: "historique.html#charlatan" },
        { name: "Criminel", href: "historique.html#criminel" },
        { name: "Ermite", href: "historique.html#ermite" },
        { name: "Fermier", href: "historique.html#fermier" },
        { name: "Garde", href: "historique.html#garde" },
        { name: "Guide", href: "historique.html#guide" },
        { name: "Marchand", href: "historique.html#marchand" },
        { name: "Marin", href: "historique.html#marin" },
        { name: "Noble", href: "historique.html#noble" },
        { name: "Sage", href: "historique.html#sage" },
        { name: "Scribe", href: "historique.html#scribe" },
        { name: "Soldat", href: "historique.html#soldat" },
        { name: "Voyageur", href: "historique.html#voyageur" }
    ];
    var fallbackSubclasses = {
        "Barbare": ["Voie de l'Arbre-Monde", "Voie du Berserker", "Voie du Cœur sauvage", "Voie du Zélateur"],
        "Barde": ["Collège de la Danse", "Collège du Savoir", "Collège de la Séduction", "Collège de la Vaillance"],
        "Clerc": ["Domaine de la Guerre", "Domaine de la Lumière", "Domaine de la Ruse", "Domaine de la Vie"],
        "Druide": ["Cercle des Astres", "Cercle de la Terre", "Cercle des Mers", "Cercle de la Lune"],
        "Guerrier": ["Champion", "Chevalier occulte", "Maître de guerre", "Soldat psi"],
        "Moine": ["Credo des Éléments", "Credo de la Miséricorde", "Credo de l'Ombre", "Credo de la Paume"],
        "Paladin": ["Serment des Anciens", "Serment de Dévotion", "Serment de Gloire", "Serment de Vengeance"],
        "Rôdeur": ["Belluaire", "Chasseur", "Traqueur des ténèbres", "Vagabond féerique"],
        "Roublard": ["Âme acérée", "Arnaqueur arcanique", "Assassin", "Voleur"],
        "Ensorceleur": ["Sorcellerie aberrante", "Sorcellerie draconique", "Sorcellerie mécanique", "Sorcellerie sauvage"],
        "Occultiste": ["Protecteur Archifée", "Protecteur Céleste", "Protecteur Fiélon", "Protecteur Grand Ancien"],
        "Magicien": ["Abjurateur", "Devin", "Évocateur", "Illusionniste"]
    };
    var fallbackClassSaves = {
        "Barbare": ["str", "con"],
        "Barde": ["dex", "cha"],
        "Clerc": ["wis", "cha"],
        "Druide": ["int", "wis"],
        "Guerrier": ["str", "con"],
        "Moine": ["str", "dex"],
        "Paladin": ["wis", "cha"],
        "Rôdeur": ["str", "dex"],
        "Roublard": ["dex", "int"],
        "Ensorceleur": ["con", "cha"],
        "Occultiste": ["wis", "cha"],
        "Magicien": ["int", "wis"]
    };
    var fallbackClassMasteries = {
        "Barbare": { weapons: "Armes courantes et de guerre", armor: "Armures légères et intermédiaires, boucliers" },
        "Barde": { weapons: "Armes courantes", armor: "Armures légères" },
        "Clerc": { weapons: "Armes courantes", armor: "Armures légères et intermédiaires, boucliers" },
        "Druide": { weapons: "Armes courantes", armor: "Armures légères, boucliers" },
        "Guerrier": { weapons: "Armes courantes et de guerre", armor: "Armures légères, intermédiaires et lourdes, boucliers" },
        "Moine": { weapons: "Armes courantes et armes de guerre qui ont la propriété Légère", armor: "Aucune" },
        "Paladin": { weapons: "Armes courantes et de guerre", armor: "Armures légères, intermédiaires et lourdes, boucliers" },
        "Rôdeur": { weapons: "Armes courantes et de guerre", armor: "Armures légères et intermédiaires, boucliers" },
        "Roublard": { weapons: "Armes courantes et armes de guerre qui ont la propriété Finesse ou Légère", armor: "Armures légères" },
        "Ensorceleur": { weapons: "Armes courantes", armor: "Aucune" },
        "Occultiste": { weapons: "Armes courantes", armor: "Armures légères" },
        "Magicien": { weapons: "Armes courantes", armor: "Aucune" }
    };
    var skillAbilities = {
        skill_athletisme: "str",
        skill_acrobaties: "dex",
        skill_discretion: "dex",
        skill_escamotage: "dex",
        skill_arcanes: "int",
        skill_histoire: "int",
        skill_investigation: "int",
        skill_nature: "int",
        skill_religion: "int",
        skill_dressage: "wis",
        skill_intuition: "wis",
        skill_medecine: "wis",
        skill_perception: "wis",
        skill_survie: "wis",
        skill_intimidation: "cha",
        skill_persuasion: "cha",
        skill_representation: "cha",
        skill_tromperie: "cha"
    };
    var skillNames = {
        Acrobaties: "skill_acrobaties",
        Arcanes: "skill_arcanes",
        Athlétisme: "skill_athletisme",
        Discrétion: "skill_discretion",
        Dressage: "skill_dressage",
        Escamotage: "skill_escamotage",
        Histoire: "skill_histoire",
        Intimidation: "skill_intimidation",
        Intuition: "skill_intuition",
        Investigation: "skill_investigation",
        Médecine: "skill_medecine",
        Nature: "skill_nature",
        Perception: "skill_perception",
        Persuasion: "skill_persuasion",
        Religion: "skill_religion",
        Représentation: "skill_representation",
        Survie: "skill_survie",
        Tromperie: "skill_tromperie"
    };
    var abilityNames = {
        Force: "str",
        Dextérité: "dex",
        Constitution: "con",
        Intelligence: "int",
        Sagesse: "wis",
        Charisme: "cha"
    };

    function spellRow(index) {
        return [
            "<tr>",
            "<td><input type=\"text\" data-field=\"spell_" + index + "_level\" /></td>",
            "<td><input type=\"text\" data-field=\"spell_" + index + "_name\" /></td>",
            "<td><input type=\"text\" data-field=\"spell_" + index + "_school\" /></td>",
            "<td><input type=\"text\" data-field=\"spell_" + index + "_cast\" /></td>",
            "<td><input type=\"text\" data-field=\"spell_" + index + "_range\" /></td>",
            "<td><input type=\"text\" data-field=\"spell_" + index + "_duration\" /></td>",
            "<td><div class=\"spell-components-cell\"><label>V<input type=\"checkbox\" data-field=\"spell_" + index + "_verbal\" /></label><label>S<input type=\"checkbox\" data-field=\"spell_" + index + "_somatic\" /></label><label>M<input type=\"checkbox\" data-field=\"spell_" + index + "_material\" /></label></div></td>",
            "<td><input type=\"text\" data-field=\"spell_" + index + "_notes\" /></td>",
            "<td><input type=\"text\" data-field=\"spell_" + index + "_page\" /></td>",
            "</tr>"
        ].join("");
    }

    function buildSpellRows() {
        var rowsB = [];
        var rowsC = [];
        for (var j = 1; j <= 28; j += 1) rowsB.push(spellRow(j));
        for (var k = 29; k <= 65; k += 1) rowsC.push(spellRow(k));
        if (spellRowsA) spellRowsA.innerHTML = "";
        if (spellRowsB) spellRowsB.innerHTML = rowsB.join("");
        if (spellRowsC) spellRowsC.innerHTML = rowsC.join("");
    }

    buildSpellRows();

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function ensureOption(select, value) {
        if (!select || !value || select.value === value) return;
        if (Array.prototype.some.call(select.options, function (option) { return option.value === value; })) {
            select.value = value;
            return;
        }
        if (select.value !== value) {
            var custom = document.createElement("option");
            custom.value = value;
            custom.textContent = value;
            select.appendChild(custom);
            select.value = value;
        }
    }

    function populateSelect(select, items, placeholder) {
        if (!select) return;
        var current = select.value;
        var options = ["<option value=\"\">" + escapeHtml(placeholder) + "</option>"];
        items.forEach(function (item) {
            var href = item.href ? " data-href=\"" + escapeHtml(item.href) + "\"" : "";
            options.push("<option value=\"" + escapeHtml(item.name) + "\"" + href + ">" + escapeHtml(item.name) + "</option>");
        });
        select.innerHTML = options.join("");
        select.value = current;
        ensureOption(select, current);
    }

    function populateClassOptions(classes) {
        classOptions = classes.slice();
        populateSelect(classSelect, classOptions, "Choisir une classe");
    }

    function extractClassesFromIndex(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        return Array.prototype.slice.call(doc.querySelectorAll(".class-grid a")).map(function (link) {
            var label = link.querySelector("strong");
            var href = link.getAttribute("href") || "";
            return {
                name: label ? label.textContent.trim() : link.textContent.trim(),
                href: href.indexOf("classes/") === 0 ? href : "classes/" + href
            };
        }).filter(function (item) {
            return item.name && item.href;
        });
    }

    function extractSpeciesFromIndex(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        return Array.prototype.slice.call(doc.querySelectorAll(".race-link")).map(function (link) {
            var label = link.querySelector("strong");
            var href = link.getAttribute("href") || "";
            return {
                name: label ? label.textContent.trim() : link.textContent.trim(),
                href: href.indexOf("races/") === 0 ? href : "races/" + href
            };
        }).filter(function (item) {
            return item.name && item.href;
        });
    }

    function extractBackgroundsFromPage(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        return Array.prototype.slice.call(doc.querySelectorAll(".content h3[id]")).map(function (heading) {
            return {
                name: heading.textContent.trim(),
                href: "historique.html#" + heading.id
            };
        }).filter(function (item) {
            return item.name;
        });
    }

    function extractSubclassesFromClassPage(html, classHref) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var section = doc.querySelector("#sous-classes");
        var subclasses = [];
        var node = section ? section.nextElementSibling : null;
        while (node) {
            if (node.tagName === "H2") break;
            if (node.tagName === "H3") {
                var anchor = node.querySelector("a[id]");
                subclasses.push({
                    name: node.textContent.trim(),
                    href: classHref + (anchor ? "#" + anchor.id : "")
                });
            }
            node = node.nextElementSibling;
        }
        return subclasses;
    }

    function getField(key) {
        return document.querySelector("[data-field=\"" + key + "\"]");
    }

    function setupAbilityColumns() {
        var grid = document.querySelector(".ability-scores-grid");
        if (!grid || grid.querySelector(".ability-column")) return;

        var meta = grid.querySelector(".ability-meta-card");
        var blocks = Array.prototype.slice.call(grid.querySelectorAll(".ability-block"));
        if (!meta || !blocks.length) return;

        function findBlock(fieldName) {
            return blocks.filter(function (block) {
                return !!block.querySelector("[data-field=\"" + fieldName + "\"]");
            })[0] || null;
        }

        var left = document.createElement("div");
        left.className = "ability-column ability-column-left";

        var right = document.createElement("div");
        right.className = "ability-column ability-column-right";

        [
            meta,
            findBlock("str"),
            findBlock("dex"),
            findBlock("con")
        ].filter(Boolean).forEach(function (node) {
            left.appendChild(node);
        });

        [
            findBlock("int"),
            findBlock("wis"),
            findBlock("cha")
        ].filter(Boolean).forEach(function (node) {
            right.appendChild(node);
        });

        grid.innerHTML = "";
        grid.appendChild(left);
        grid.appendChild(right);
    }

    function parseNumber(value) {
        var parsed = parseInt(String(value || "").replace(/[^\d-]/g, ""), 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    function formatSigned(value) {
        return (value >= 0 ? "+" : "") + value;
    }

    function shortHitDie(value) {
        var match = String(value || "").match(/d\d+/i);
        return match ? match[0].toUpperCase() : String(value || "").trim();
    }

    function proficiencyFromLevel(level) {
        if (!level) return null;
        return Math.max(2, Math.min(6, Math.floor((level - 1) / 4) + 2));
    }

    function modifierFromScore(score) {
        if (!score) return null;
        if (modifierTable[score] !== undefined) return modifierTable[score];
        return Math.floor((score - 10) / 2);
    }

    function setFieldValue(key, value) {
        var field = getField(key);
        if (field) field.value = value;
    }

    function fieldChecked(key) {
        var field = getField(key);
        return Boolean(field && field.checked);
    }

    function setFieldChecked(key, checked) {
        var field = getField(key);
        if (field) field.checked = checked;
    }

    function appendLine(lines, label, value) {
        var clean = normalizeListText(value);
        if (clean) lines.push(label + ": " + clean);
    }

    function autoMarkers(label) {
        var hash = 0;
        var text = String(label || "");
        for (var i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash + text.charCodeAt(i)) >>> 0;
        }
        var bits = hash.toString(2).replace(/0/g, "\u200b").replace(/1/g, "\u200c");
        var token = "\u2063" + bits + "\u2063";
        return {
            start: token + "\u200d",
            end: token + "\u200e"
        };
    }

    function stripAutoMarkers(value) {
        return String(value || "")
            .replace(/\[Auto - [^\]]+\]\s*\n?/g, "")
            .replace(/\[\/Auto - [^\]]+\]\s*\n?/g, "")
            .replace(/\u2063[\u200b\u200c]+\u2063[\u200d\u200e]/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function autoBlock(label, content) {
        var clean = String(content || "").trim();
        if (!clean) return "";
        var markers = autoMarkers(label);
        return markers.start + clean + markers.end;
    }

    function setAutoBlock(fieldKey, label, content) {
        var field = getField(fieldKey);
        if (!field) return;
        var markers = autoMarkers(label);
        var start = markers.start;
        var end = markers.end;
        var block = autoBlock(label, content);
        var value = field.value || "";
        var startIndex = value.indexOf(start);
        var endIndex = value.indexOf(end);
        if (startIndex !== -1) {
            var before = stripAutoMarkers(value.slice(0, startIndex));
            var replaceEnd = -1;
            if (endIndex !== -1 && endIndex >= startIndex) {
                replaceEnd = endIndex + end.length;
            } else {
                replaceEnd = value.length;
            }
            var after = stripAutoMarkers(value.slice(replaceEnd));
            field.value = [before, block, after].filter(Boolean).join("\n\n");
            return;
        }
        value = stripAutoMarkers(value);
        if (!block) return;
        field.value = [value.trim(), block].filter(Boolean).join("\n\n");
    }

    function getSelectedItem(select, options) {
        if (!select || !select.value) return null;
        var option = select.options[select.selectedIndex];
        var href = option ? option.getAttribute("data-href") : "";
        return options.filter(function (item) {
            return item.name === select.value;
        })[0] || { name: select.value, href: href || "" };
    }

    function expandScoreRange(text) {
        var clean = String(text || "").replace(/\s/g, "");
        var range = clean.match(/^(\d+)-(\d+)$/);
        if (range) {
            var scores = [];
            var start = parseInt(range[1], 10);
            var end = parseInt(range[2], 10);
            for (var score = start; score <= end; score += 1) scores.push(score);
            return scores;
        }
        var single = parseInt(clean, 10);
        return Number.isNaN(single) ? [] : [single];
    }

    function extractModifierTable(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var heading = Array.prototype.slice.call(doc.querySelectorAll("h3")).filter(function (item) {
            return item.textContent.indexOf("Modificateurs de caractéristique") !== -1;
        })[0];
        var table = heading ? heading.nextElementSibling : null;
        while (table && table.tagName !== "TABLE") table = table.nextElementSibling;
        if (!table) return {};

        var modifiers = {};
        Array.prototype.slice.call(table.querySelectorAll("tr")).forEach(function (row) {
            var cells = Array.prototype.slice.call(row.querySelectorAll("td")).map(function (cell) {
                return cell.textContent.trim();
            });
            for (var i = 0; i + 1 < cells.length; i += 2) {
                var modifier = parseInt(cells[i + 1].replace("+", ""), 10);
                if (Number.isNaN(modifier)) continue;
                expandScoreRange(cells[i]).forEach(function (score) {
                    modifiers[score] = modifier;
                });
            }
        });
        return modifiers;
    }

    function loadModifierTable() {
        if (!window.fetch) {
            updateDerivedStats();
            return;
        }
        fetch("rules-2024.html")
            .then(function (response) {
                if (!response.ok) throw new Error("rules unavailable");
                return response.text();
            })
            .then(function (html) {
                var parsed = extractModifierTable(html);
                if (Object.keys(parsed).length) modifierTable = parsed;
                updateDerivedStats();
            })
            .catch(updateDerivedStats);
    }

    function extractSaveProficienciesFromClassPage(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var cells = Array.prototype.slice.call(doc.querySelectorAll("td"));
        var label = cells.filter(function (cell) {
            return cell.textContent.indexOf("Maîtrise des jets de sauvegarde") !== -1;
        })[0];
        var value = label && label.nextElementSibling ? label.nextElementSibling.textContent : "";
        return Object.keys(abilityNames).filter(function (name) {
            return value.indexOf(name) !== -1;
        }).map(function (name) {
            return abilityNames[name];
        });
    }

    function extractClassTrait(html, labels) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var cells = Array.prototype.slice.call(doc.querySelectorAll("td"));
        var label = cells.filter(function (cell) {
            var text = cell.textContent.trim();
            return labels.indexOf(text) !== -1;
        })[0];
        return label && label.nextElementSibling ? label.nextElementSibling.textContent.trim() : "";
    }

    function cellText(cell) {
        return cell ? normalizeListText(cell.textContent) : "";
    }

    function formatSpellSlotMap(slots) {
        var entries = Object.keys(slots).filter(function (level) {
            var value = slots[level];
            return value && value !== "-" && value !== "0";
        }).map(function (level) {
            return level + ": " + slots[level];
        });
        return entries.join(" / ");
    }

    function extractSpellSlotsByLevel(doc) {
        var slotsByLevel = {};
        Array.prototype.slice.call(doc.querySelectorAll("table")).some(function (table) {
            var rows = Array.prototype.slice.call(table.querySelectorAll("tr"));
            var headerIndex = -1;
            var headerCells = [];
            rows.some(function (row, index) {
                var cells = Array.prototype.slice.call(row.querySelectorAll("th,td")).map(cellText);
                var hasLevel = cells.some(function (text) { return text === "Niveau"; });
                var numericHeaders = cells.filter(function (text) { return /^\d+$/.test(text); });
                if (hasLevel && numericHeaders.length) {
                    headerIndex = index;
                    headerCells = cells;
                    return true;
                }
                return false;
            });

            if (headerIndex !== -1) {
                var slotIndexes = [];
                headerCells.forEach(function (text, index) {
                    if (/^\d+$/.test(text)) slotIndexes.push({ index: index, level: text });
                });
                rows.slice(headerIndex + 1).forEach(function (row) {
                    var cells = Array.prototype.slice.call(row.querySelectorAll("td")).map(cellText);
                    if (!/^\d+$/.test(cells[0] || "")) return;
                    var slots = {};
                    slotIndexes.forEach(function (slot) {
                        slots[slot.level] = cells[slot.index] || "";
                    });
                    slotsByLevel[cells[0]] = formatSpellSlotMap(slots);
                });
                return Object.keys(slotsByLevel).length > 0;
            }

            var basicHeader = Array.prototype.slice.call(table.querySelectorAll("tr")).map(function (row) {
                return Array.prototype.slice.call(row.querySelectorAll("th,td")).map(cellText);
            }).filter(function (cells) {
                function compactIncludes(text, expected) {
                    return text.replace(/\s/g, "").indexOf(expected.replace(/\s/g, "")) !== -1;
                }
                return cells.indexOf("Niveau") !== -1 &&
                    cells.some(function (text) { return compactIncludes(text, "Emplacements de sort"); }) &&
                    cells.some(function (text) { return compactIncludes(text, "Niveau des emplacements"); });
            })[0];

            if (basicHeader) {
                function compactIncludes(text, expected) {
                    return text.replace(/\s/g, "").indexOf(expected.replace(/\s/g, "")) !== -1;
                }
                var levelIndex = basicHeader.indexOf("Niveau");
                var countIndex = basicHeader.findIndex(function (text) { return compactIncludes(text, "Emplacements de sort"); });
                var slotLevelIndex = basicHeader.findIndex(function (text) { return compactIncludes(text, "Niveau des emplacements"); });
                rows.forEach(function (row) {
                    var cells = Array.prototype.slice.call(row.querySelectorAll("td")).map(cellText);
                    if (!/^\d+$/.test(cells[levelIndex] || "")) return;
                    var count = cells[countIndex] || "";
                    var slotLevel = cells[slotLevelIndex] || "";
                    slotsByLevel[cells[levelIndex]] = slotLevel && count ? slotLevel + ": " + count : "";
                });
                return Object.keys(slotsByLevel).length > 0;
            }
            return false;
        });
        return slotsByLevel;
    }

    function armorFlagsFromText(text) {
        var lower = String(text || "").toLowerCase();
        return {
            light: lower.indexOf("légère") !== -1,
            medium: lower.indexOf("intermédiaire") !== -1,
            heavy: lower.indexOf("lourde") !== -1,
            shield: lower.indexOf("bouclier") !== -1
        };
    }

    function weaponFlagsFromText(text) {
        var lower = String(text || "").toLowerCase();
        return {
            simple: lower.indexOf("courante") !== -1,
            martial: lower.indexOf("guerre") !== -1
        };
    }

    function normalizeListText(text) {
        return String(text || "").replace(/\s+/g, " ").replace(/\s+,/g, ",").replace(/,+$/g, "").trim();
    }

    function extractClassMasteriesFromClassPage(html) {
        var weapons = extractClassTrait(html, ["Maîtrises d'arme", "Maîtrise d'arme"]);
        var armor = extractClassTrait(html, ["Formation aux armures"]);
        return {
            weapons: normalizeListText(weapons),
            armor: normalizeListText(armor)
        };
    }

    function extractClassDetailsFromClassPage(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var subclassSection = doc.querySelector("#sous-classes");
        var removable = subclassSection;
        while (removable) {
            var next = removable.nextElementSibling;
            removable.remove();
            removable = next;
        }
        var spellAbility = "";
        var spellFocus = "";
        Array.prototype.slice.call(doc.querySelectorAll("p")).some(function (item) {
            var text = item.textContent.trim();
            if (text.indexOf("Caractéristique d'incantation") === -1) return false;
            Object.keys(abilityNames).some(function (name) {
                if (text.indexOf(name) !== -1) {
                    spellAbility = name;
                    return true;
                }
                return false;
            });
            return true;
        });
        Array.prototype.slice.call(doc.querySelectorAll("p")).some(function (item) {
            var strong = item.querySelector("strong");
            if (!strong || strong.textContent.indexOf("Focaliseur d'incantation") === -1) return false;
            var clone = item.cloneNode(true);
            var cloneStrong = clone.querySelector("strong");
            if (cloneStrong) cloneStrong.remove();
            spellFocus = normalizeListText(clone.textContent.replace(/^\s*\.\s*/, ""));
            return true;
        });
        return {
            primary: normalizeListText(extractClassTrait(html, ["Caractéristique principale"])),
            hitDie: normalizeListText(extractClassTrait(html, ["Dé de vie"])),
            tools: normalizeListText(extractClassTrait(html, ["Maîtrise d'outils", "Maîtrises d'outils"])),
            equipment: normalizeListText(extractClassTrait(html, ["Équipement de départ"])),
            spellAbility: spellAbility,
            spellFocus: spellFocus,
            spellSlotsByLevel: extractSpellSlotsByLevel(doc)
        };
    }

    function getBackgroundParagraph(section, label) {
        var paragraph = Array.prototype.slice.call(section ? section.querySelectorAll("p") : []).filter(function (item) {
            var strong = item.querySelector("strong");
            return strong && strong.textContent.trim() === label;
        })[0];
        if (!paragraph) return "";
        var clone = paragraph.cloneNode(true);
        var strong = clone.querySelector("strong");
        if (strong) strong.remove();
        return normalizeListText(clone.textContent.replace(/^\s*\.\s*/, ""));
    }

    function extractBackgroundDetailsFromPage(html, id) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var heading = doc.getElementById(id);
        var wrapper = document.createElement("div");
        var node = heading ? heading.nextElementSibling : null;
        while (node && node.tagName !== "H3") {
            wrapper.appendChild(node.cloneNode(true));
            node = node.nextElementSibling;
        }
        return {
            abilities: getBackgroundParagraph(wrapper, "Valeurs de caractéristique"),
            feat: getBackgroundParagraph(wrapper, "Don"),
            skills: getBackgroundParagraph(wrapper, "Maîtrises de compétence"),
            tools: getBackgroundParagraph(wrapper, "Maîtrise d'outils"),
            equipment: getBackgroundParagraph(wrapper, "Équipement")
        };
    }

    function extractSpeciesDetailsFromPage(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var traits = Array.prototype.slice.call(doc.querySelectorAll(".trait")).map(function (item) {
            var strong = item.querySelector("strong");
            var label = strong ? strong.textContent.replace(":", "").trim() : "";
            var clone = item.cloneNode(true);
            var cloneStrong = clone.querySelector("strong");
            if (cloneStrong) cloneStrong.remove();
            return {
                label: label,
                value: normalizeListText(clone.textContent.replace(/^\s*:/, ""))
            };
        }).filter(function (item) {
            return item.label && item.value;
        });
        var size = traits.filter(function (item) { return item.label === "Taille"; })[0];
        var speed = traits.filter(function (item) { return item.label === "Vitesse"; })[0];
        var notes = traits.filter(function (item) {
            return ["Type de créature", "Taille", "Vitesse"].indexOf(item.label) === -1;
        }).map(function (item) {
            return item.label + ": " + item.value;
        }).join("\n");
        return {
            size: size ? size.value : "",
            speed: speed ? speed.value : "",
            traits: notes
        };
    }

    function applyClassSaveProficiencies(saves) {
        ["str", "dex", "con", "int", "wis", "cha"].forEach(function (ability) {
            setFieldChecked(ability + "_save_prof", saves.indexOf(ability) !== -1);
        });
        updateDerivedStats();
    }

    function applyClassMasteries(masteries) {
        var armor = armorFlagsFromText(masteries && masteries.armor);
        setFieldChecked("armor_light_prof", armor.light);
        setFieldChecked("armor_medium_prof", armor.medium);
        setFieldChecked("armor_heavy_prof", armor.heavy);
        setFieldChecked("shield_prof", armor.shield);
        var weapons = weaponFlagsFromText(masteries && masteries.weapons);
        setFieldChecked("weapon_simple_prof", weapons.simple);
        setFieldChecked("weapon_martial_prof", weapons.martial);
    }

    function applyClassDetails(details) {
        currentClassDetails = details || null;
        if (!details) return;
        if (details.hitDie) setFieldValue("hit_dice", shortHitDie(details.hitDie));
        if (details.tools) setAutoBlock("tool_proficiencies", "Classe", details.tools);
        if (details.equipment) setAutoBlock("gear", "Équipement de classe", details.equipment);
        var featureLines = [];
        appendLine(featureLines, "Caractéristique principale", details.primary);
        appendLine(featureLines, "Focaliseur d'incantation", details.spellFocus);
        setAutoBlock("features", "Classe", featureLines.join("\n"));
        var spellStat = getField("spell_stat");
        if (spellStat && details.spellAbility && (!spellStat.value || spellStat.dataset.autoClassSpell === "true")) {
            spellStat.value = details.spellAbility;
            spellStat.dataset.autoClassSpell = "true";
        } else if (spellStat && !details.spellAbility && spellStat.dataset.autoClassSpell === "true") {
            spellStat.value = "";
            delete spellStat.dataset.autoClassSpell;
        }
        updateDerivedStats();
    }

    function clearBackgroundSkillProficiencies() {
        Object.keys(skillNames).forEach(function (name) {
            var field = getField(skillNames[name] + "_prof");
            if (field && field.dataset.autoBackground === "true") {
                field.checked = false;
                delete field.dataset.autoBackground;
            }
        });
    }

    function applyBackgroundDetails(details) {
        clearBackgroundSkillProficiencies();
        if (!details) return;
        Object.keys(skillNames).forEach(function (name) {
            if (details.skills.indexOf(name) === -1) return;
            var field = getField(skillNames[name] + "_prof");
            if (!field) return;
            if (!field.checked) field.dataset.autoBackground = "true";
            field.checked = true;
        });
        setAutoBlock("tool_proficiencies", "Historique", details.tools);
        setAutoBlock("feats", "Don d'historique", details.feat);
        setAutoBlock("gear", "Équipement d'historique", details.equipment);
        var featureLines = [];
        appendLine(featureLines, "Valeurs de caractéristique proposées", details.abilities);
        setAutoBlock("features", "Historique", featureLines.join("\n"));
        updateDerivedStats();
    }

    function applySpeciesDetails(details) {
        if (!details) return;
        if (details.size) setFieldValue("size", details.size);
        if (details.speed) setFieldValue("speed", details.speed);
        setAutoBlock("species_traits", "Espèce", details.traits);
    }

    function updateClassSaveProficiencies() {
        var selectedClass = getSelectedClassOption();
        var className = classSelect ? classSelect.value : "";
        var fallback = fallbackClassSaves[className] || [];
        applyClassSaveProficiencies(fallback);
        if (!selectedClass || !window.fetch) return;
        if (classSaveCache[selectedClass.href]) {
            applyClassSaveProficiencies(classSaveCache[selectedClass.href]);
            return;
        }
        fetch(selectedClass.href)
            .then(function (response) {
                if (!response.ok) throw new Error("class page unavailable");
                return response.text();
            })
            .then(function (html) {
                var saves = extractSaveProficienciesFromClassPage(html);
                if (saves.length) {
                    classSaveCache[selectedClass.href] = saves;
                    applyClassSaveProficiencies(saves);
                }
            })
            .catch(function () {});
    }

    function updateClassMasteries() {
        var selectedClass = getSelectedClassOption();
        var className = classSelect ? classSelect.value : "";
        var fallback = fallbackClassMasteries[className];
        applyClassMasteries(fallback || { weapons: "", armor: "" });
        if (!selectedClass || !window.fetch) return;
        if (classMasteryCache[selectedClass.href]) {
            applyClassMasteries(classMasteryCache[selectedClass.href]);
            return;
        }
        fetch(selectedClass.href)
            .then(function (response) {
                if (!response.ok) throw new Error("class page unavailable");
                return response.text();
            })
            .then(function (html) {
                var masteries = extractClassMasteriesFromClassPage(html);
                if (masteries.weapons || masteries.armor) {
                    classMasteryCache[selectedClass.href] = masteries;
                    applyClassMasteries(masteries);
                }
            })
            .catch(function () {});
    }

    function updateClassDetails() {
        var selectedClass = getSelectedClassOption();
        if (!selectedClass || !window.fetch) {
            currentClassDetails = null;
            updateDerivedStats();
            return;
        }
        if (classDetailCache[selectedClass.href]) {
            applyClassDetails(classDetailCache[selectedClass.href]);
            return;
        }
        fetch(selectedClass.href)
            .then(function (response) {
                if (!response.ok) throw new Error("class page unavailable");
                return response.text();
            })
            .then(function (html) {
                var details = extractClassDetailsFromClassPage(html);
                classDetailCache[selectedClass.href] = details;
                applyClassDetails(details);
            })
            .catch(function () {});
    }

    function updateBackgroundDetails() {
        var selected = getSelectedItem(backgroundSelect, fallbackBackgrounds);
        clearBackgroundSkillProficiencies();
        if (!selected || !selected.href || !window.fetch) {
            applyBackgroundDetails({ abilities: "", feat: "", skills: "", tools: "", equipment: "" });
            return;
        }
        var parts = selected.href.split("#");
        var id = parts[1] || "";
        if (!id) return;
        if (backgroundDetailCache[id]) {
            applyBackgroundDetails(backgroundDetailCache[id]);
            return;
        }
        fetch(parts[0])
            .then(function (response) {
                if (!response.ok) throw new Error("background page unavailable");
                return response.text();
            })
            .then(function (html) {
                var details = extractBackgroundDetailsFromPage(html, id);
                backgroundDetailCache[id] = details;
                applyBackgroundDetails(details);
            })
            .catch(function () {});
    }

    function updateSpeciesDetails() {
        var selected = getSelectedItem(speciesSelect, fallbackSpecies);
        if (!selected || !selected.href || !window.fetch) {
            applySpeciesDetails({ size: "", speed: "", traits: "" });
            return;
        }
        if (speciesDetailCache[selected.href]) {
            applySpeciesDetails(speciesDetailCache[selected.href]);
            return;
        }
        fetch(selected.href)
            .then(function (response) {
      if (!response.ok) throw new Error("page d'espèce indisponible");
                return response.text();
            })
            .then(function (html) {
                var details = extractSpeciesDetailsFromPage(html);
                speciesDetailCache[selected.href] = details;
                applySpeciesDetails(details);
            })
            .catch(function () {});
    }

    function updateDerivedStats() {
        var abilityMods = {};
        ["str", "dex", "con", "int", "wis", "cha"].forEach(function (ability) {
            var score = parseNumber(getField(ability) ? getField(ability).value : "");
            var modifier = modifierFromScore(score);
            abilityMods[ability] = modifier;
            setFieldValue(ability + "_mod", modifier === null ? "" : formatSigned(modifier));
        });

        var level = parseNumber(levelInput ? levelInput.value : "");
        var levelProficiency = proficiencyFromLevel(level);
        var manualProficiency = parseNumber(getField("proficiency_bonus") ? getField("proficiency_bonus").value : "");
        var proficiency = levelProficiency !== null ? levelProficiency : (manualProficiency || 0);
        if (levelProficiency !== null) setFieldValue("proficiency_bonus", formatSigned(levelProficiency));

        ["str", "dex", "con", "int", "wis", "cha"].forEach(function (ability) {
            var modifier = abilityMods[ability];
            var total = modifier === null ? "" : formatSigned(modifier + (fieldChecked(ability + "_save_prof") ? proficiency : 0));
            setFieldValue(ability + "_save", total);
        });

        Object.keys(skillAbilities).forEach(function (skill) {
            var ability = skillAbilities[skill];
            var modifier = abilityMods[ability];
            var total = modifier === null ? "" : formatSigned(modifier + (fieldChecked(skill + "_prof") ? proficiency : 0));
            setFieldValue(skill, total);
        });

        var initiativeField = getField("initiative");
        if (initiativeField && abilityMods.dex !== null && abilityMods.dex !== undefined && (!initiativeField.value || initiativeField.dataset.autoInitiative === "true")) {
            initiativeField.value = formatSigned(abilityMods.dex);
            initiativeField.dataset.autoInitiative = "true";
        }

        var perception = parseNumber(getField("skill_perception") ? getField("skill_perception").value : "");
        if (perception !== null) setFieldValue("passive_perception", String(10 + perception));

        var spellStat = getField("spell_stat") ? getField("spell_stat").value.trim() : "";
        var spellAbility = abilityNames[spellStat] || "";
        var spellModifier = spellAbility ? abilityMods[spellAbility] : null;
        if (spellModifier !== null && spellModifier !== undefined) {
            setFieldValue("spell_mod", formatSigned(spellModifier));
            setFieldValue("spell_dc", String(8 + proficiency + spellModifier));
            setFieldValue("spell_attack_bonus", formatSigned(proficiency + spellModifier));
        }

        var slotsField = getField("spell_slots");
        var slotsByLevel = currentClassDetails && currentClassDetails.spellSlotsByLevel ? currentClassDetails.spellSlotsByLevel : {};
        var slots = level ? slotsByLevel[String(level)] : "";
        if (slotsField && slots && (!slotsField.value || slotsField.dataset.autoClassSlots === "true")) {
            slotsField.value = slots;
            slotsField.dataset.autoClassSlots = "true";
        } else if (slotsField && !slots && slotsField.dataset.autoClassSlots === "true") {
            slotsField.value = "";
            delete slotsField.dataset.autoClassSlots;
        }
    }

    function loadDynamicOptions() {
        populateClassOptions(fallbackClasses);
        populateSelect(speciesSelect, fallbackSpecies, "Choisir une espèce");
        populateSelect(backgroundSelect, fallbackBackgrounds, "Choisir un historique");
        updateSubclassOptions();
        updateClassSaveProficiencies();
        updateClassMasteries();
        updateClassDetails();
        updateBackgroundDetails();
        updateSpeciesDetails();
        updateDerivedStats();
        if (!window.fetch) return;

        fetch("classes/index.html")
            .then(function (response) {
                if (!response.ok) throw new Error("classes index unavailable");
                return response.text();
            })
            .then(function (html) {
                var classes = extractClassesFromIndex(html);
                if (classes.length) {
                    populateClassOptions(classes);
                    syncClassLevel();
                    updateSubclassOptions();
                    updateClassSaveProficiencies();
                    updateClassMasteries();
                    updateClassDetails();
                }
            })
            .catch(function () {
                syncClassLevel();
                updateClassSaveProficiencies();
                updateClassMasteries();
                updateClassDetails();
            });

        fetch("races/index.html")
            .then(function (response) {
                if (!response.ok) throw new Error("races index unavailable");
                return response.text();
            })
            .then(function (html) {
                var species = extractSpeciesFromIndex(html);
                if (species.length) {
                    populateSelect(speciesSelect, species, "Choisir une espèce");
                    updateSpeciesDetails();
                }
            })
            .catch(function () {});

        fetch("historique.html")
            .then(function (response) {
                if (!response.ok) throw new Error("backgrounds unavailable");
                return response.text();
            })
            .then(function (html) {
                var backgrounds = extractBackgroundsFromPage(html);
                if (backgrounds.length) {
                    populateSelect(backgroundSelect, backgrounds, "Choisir un historique");
                    updateBackgroundDetails();
                }
            })
            .catch(function () {});
    }

    function parseClassLevel(value) {
        var text = String(value || "").trim();
        var match = text.match(/^(.*?)(?:\s+(\d+))?$/);
        return {
            className: match ? match[1].trim() : text,
            level: match && match[2] ? match[2] : ""
        };
    }

    function syncClassLevel() {
        if (!classLevelField || !classSelect || !levelInput) return;
        var parts = [];
        if (classSelect.value) parts.push(classSelect.value);
        if (levelInput.value.trim()) parts.push(levelInput.value.trim());
        classLevelField.value = parts.join(" ");
    }

    function getSelectedClassOption() {
        var className = classSelect ? classSelect.value : "";
        return classOptions.filter(function (item) {
            return item.name === className;
        })[0] || null;
    }

    function updateSubclassOptions() {
        if (!subclassSelect) return;
        var className = classSelect ? classSelect.value : "";
        var fallback = (fallbackSubclasses[className] || []).map(function (name) {
            return { name: name, href: "" };
        });
        populateSelect(subclassSelect, fallback, className ? "Choisir une sous-classe" : "Choisir une classe d'abord");

        var selectedClass = getSelectedClassOption();
        if (!selectedClass || !window.fetch) return;
        if (subclassCache[selectedClass.href]) {
            populateSelect(subclassSelect, subclassCache[selectedClass.href], "Choisir une sous-classe");
            return;
        }

        fetch(selectedClass.href)
            .then(function (response) {
                if (!response.ok) throw new Error("class page unavailable");
                return response.text();
            })
            .then(function (html) {
                var subclasses = extractSubclassesFromClassPage(html, selectedClass.href);
                if (subclasses.length) {
                    subclassCache[selectedClass.href] = subclasses;
                    populateSelect(subclassSelect, subclasses, "Choisir une sous-classe");
                }
            })
            .catch(function () {});
    }

    setupAbilityColumns();
    loadDynamicOptions();

    var fields = Array.prototype.slice.call(document.querySelectorAll("[data-field]"));

    function setStatus(msg) {
        statusEl.textContent = msg;
    }

    function nowText() {
        return new Date().toLocaleTimeString();
    }

    function collect() {
        syncClassLevel();
        updateDerivedStats();
        var data = {};
        fields.forEach(function (el) {
            var key = el.getAttribute("data-field");
            data[key] = el.type === "checkbox" ? el.checked : el.value;
        });
        if (levelInput) data.character_level = levelInput.value;
        return data;
    }

    function normalizePayload(payload) {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
        if (payload.version && payload.version !== SHEET_VERSION && payload.version !== "standalone_v1") {
            return null;
        }
        if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) return null;

        var data = {};
        fields.forEach(function (el) {
            var key = el.getAttribute("data-field");
            if (!Object.prototype.hasOwnProperty.call(payload.data, key)) return;
            var value = payload.data[key];
            if (el.type === "checkbox") {
                if (typeof value === "boolean") data[key] = value;
            } else if (typeof value === "string" || typeof value === "number") {
                data[key] = String(value);
            }
        });
        if (typeof payload.data.character_level === "string" || typeof payload.data.character_level === "number") {
            data.character_level = String(payload.data.character_level);
        }

        return Object.keys(data).length ? data : null;
    }

    function apply(data) {
        fields.forEach(function (el) {
            var key = el.getAttribute("data-field");
            if (!(key in data)) return;
            if (el.type === "checkbox") {
                el.checked = Boolean(data[key]);
            } else {
                el.value = stripAutoMarkers(data[key]);
            }
        });
        if (classSelect && data.class_level && !data.character_class) {
            var parsed = parseClassLevel(data.class_level);
            ensureOption(classSelect, parsed.className);
            if (levelInput && parsed.level && !levelInput.value) {
                levelInput.value = parsed.level;
            }
        }
        if (classSelect && data.character_class) ensureOption(classSelect, data.character_class);
        if (speciesSelect && data.species) ensureOption(speciesSelect, data.species);
        if (backgroundSelect && data.background) ensureOption(backgroundSelect, data.background);
        if (subclassSelect && data.subclass) ensureOption(subclassSelect, data.subclass);
        if (levelInput && data.character_level && !data.Niveau) {
            levelInput.value = data.character_level;
        }
        updateSubclassOptions();
        updateClassSaveProficiencies();
        updateClassMasteries();
        updateClassDetails();
        updateBackgroundDetails();
        updateSpeciesDetails();
        syncClassLevel();
        updateDerivedStats();
    }

    function save() {
        var payload = {
            updated_at: new Date().toISOString(),
            version: SHEET_VERSION,
            data: collect()
        };
        if (storage.setJson(STORAGE_KEY, payload)) {
            storageFailed = false;
            setStatus("Sauvegardé à " + nowText());
            return true;
        }
        storageFailed = true;
        setStatus("Sauvegarde locale impossible. Exporte la fiche en JSON.");
        return false;
    }

    function loadFromKey(key) {
        var parsed = storage.getJson(key, null);
        if (parsed === null) {
            if (!storage.isPersistent()) storageFailed = true;
            return false;
        }
        try {
            var data = normalizePayload(parsed);
            if (data) {
                apply(data);
                return true;
            }
        } catch (err) {
            return false;
        }
        return false;
    }

    function load() {
        if (loadFromKey(STORAGE_KEY)) {
            setStatus("Dernière sauvegarde chargée.");
            return;
        }
        if (loadFromKey(LEGACY_STORAGE_KEY)) {
            save();
            setStatus("Ancienne sauvegarde reprise et convertie.");
            return;
        }
        setStatus(storageFailed
            ? "Stockage local indisponible. Utilise l'export JSON."
            : "Aucune sauvegarde trouvée.");
    }

    function scheduleAutoSave() {
        clearTimeout(saveTimer);
        setStatus("Modifications en attente...");
        saveTimer = setTimeout(save, 450);
    }

    function resetAll() {
        if (!confirm("Réinitialiser tous les champs de cette feuille ?")) return;
        fields.forEach(function (el) {
            if (el.type === "checkbox") {
                el.checked = false;
            } else {
                el.value = "";
            }
        });
        if (storage.remove(STORAGE_KEY)) {
            setStatus("Feuille réinitialisée.");
        } else {
            storageFailed = true;
            setStatus("Champs vidés, mais la sauvegarde locale n'a pas pu être supprimée.");
        }
    }

    function exportJson() {
        var payload = {
            exported_at: new Date().toISOString(),
            version: SHEET_VERSION,
            data: collect()
        };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "dnd-character-standalone.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
        setStatus("Export JSON généré.");
    }

    function importJson(file) {
        if (!file || file.size > MAX_IMPORT_BYTES) {
            alert("Le fichier JSON est absent ou trop volumineux (maximum 1 Mo).");
            return;
        }
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var parsed = JSON.parse(String(reader.result || "{}"));
                var data = normalizePayload(parsed);
                if (!data) {
                    alert("Format ou version de fiche JSON invalide.");
                    return;
                }
                apply(data);
                if (save()) setStatus("Import terminé.");
            } catch (err) {
                alert("Le fichier n'est pas un JSON valide.");
            }
        };
        reader.onerror = function () {
            alert("Impossible de lire le fichier JSON.");
        };
        reader.readAsText(file);
    }

    function showPage(targetId) {
        document.querySelectorAll("[data-page]").forEach(function (page) {
            page.classList.toggle("active", page.id === targetId);
        });
        document.querySelectorAll("[data-page-target]").forEach(function (button) {
            button.classList.toggle("active", button.getAttribute("data-page-target") === targetId);
        });
    }

    fields.forEach(function (el) {
        el.addEventListener("input", function () {
            if (el.getAttribute("data-field") === "initiative") {
                delete el.dataset.autoInitiative;
            }
            if (el.getAttribute("data-field") === "spell_slots") {
                delete el.dataset.autoClassSlots;
            }
            if (el.getAttribute("data-field") === "spell_stat") {
                delete el.dataset.autoClassSpell;
            }
            updateDerivedStats();
            scheduleAutoSave();
        });
        el.addEventListener("change", function () {
            if (el.getAttribute("data-field") && el.getAttribute("data-field").indexOf("skill_") === 0) {
                delete el.dataset.autoBackground;
            }
            if (el.getAttribute("data-field") === "initiative") {
                delete el.dataset.autoInitiative;
            }
            if (el.getAttribute("data-field") === "spell_slots") {
                delete el.dataset.autoClassSlots;
            }
            if (el.getAttribute("data-field") === "spell_stat") {
                delete el.dataset.autoClassSpell;
            }
            updateDerivedStats();
            scheduleAutoSave();
        });
    });

    if (classSelect) {
        classSelect.addEventListener("change", function () {
            if (subclassSelect) subclassSelect.value = "";
            updateSubclassOptions();
            updateClassSaveProficiencies();
            updateClassMasteries();
            updateClassDetails();
            syncClassLevel();
            updateDerivedStats();
        });
    }

    if (backgroundSelect) {
        backgroundSelect.addEventListener("change", function () {
            updateBackgroundDetails();
            updateDerivedStats();
        });
    }

    if (speciesSelect) {
        speciesSelect.addEventListener("change", function () {
            updateSpeciesDetails();
        });
    }

    document.querySelectorAll("[data-page-target]").forEach(function (button) {
        button.addEventListener("click", function () {
            showPage(button.getAttribute("data-page-target"));
        });
    });

    saveBtn.addEventListener("click", save);
    resetBtn.addEventListener("click", resetAll);
    exportBtn.addEventListener("click", exportJson);
    printBtn.addEventListener("click", function () {
        save();
        window.print();
    });
    importFile.addEventListener("change", function () {
        if (importFile.files && importFile.files[0]) {
            importJson(importFile.files[0]);
            importFile.value = "";
        }
    });

    loadModifierTable();
    load();
})();
