(function () {
    "use strict";

    var STORAGE_KEY = "dnd_character_creator_draft_v1";
    var SHEET_KEY = "dnd_character_sheet_standalone_v2";
    var steps = [
        "Concept", "Niveau", "Classe", "Espèce", "Historique", "Caractéristiques",
        "Compétences", "Équipement", "Sorts", "Récapitulatif", "Créer la fiche",
    ];
    var skills = [
        "Acrobaties", "Arcanes", "Athlétisme", "Discrétion", "Dressage", "Escamotage",
        "Histoire", "Intimidation", "Intuition", "Investigation", "Médecine", "Nature",
        "Perception", "Persuasion", "Religion", "Représentation", "Survie", "Tromperie",
    ];
    var storage = window.DndStorage;
    var stateApi = window.DndCreationState;
    var panel = document.getElementById("wizardPanel");
    var status = document.getElementById("wizardStatus");
    var stepList = document.getElementById("wizardSteps");
    var progress = document.getElementById("wizardProgress");
    var expertToggle = document.getElementById("expertMode");
    var lastRenderedStep = -1;
    var model;
    var spells = [];
    var draft = stateApi.normalizeDraft(storage.getJson(STORAGE_KEY, null));

    function element(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function field(label, input) {
        var wrapper = element("label", "wizard-field");
        wrapper.append(element("span", "", label), input);
        return wrapper;
    }

    function input(type, name, value) {
        var control = document.createElement("input");
        control.type = type;
        control.name = name;
        if (value !== undefined) control.value = value;
        return control;
    }

    function select(name, options, value) {
        var control = document.createElement("select");
        control.name = name;
        options.forEach(function (optionValue) {
            var option = element("option", "", optionValue || "— Choisir —");
            option.value = optionValue;
            option.selected = optionValue === value;
            control.append(option);
        });
        return control;
    }

    function find(collection, id) {
        return collection.find(function (entry) { return entry.id === id; });
    }

    function save(message) {
        storage.setJson(STORAGE_KEY, draft);
        if (message) status.textContent = message;
    }

    function update(name, value) {
        if (name.startsWith("ability-")) draft.abilities[name.slice(8)] = Number(value);
        else draft[name] = value;
        save("Brouillon sauvegardé sur cet appareil.");
    }

    function choiceGrid(entries, fieldName, description) {
        var grid = element("div", "wizard-choice-grid");
        entries.forEach(function (entry) {
            var label = element("label", "wizard-choice");
            var radio = input("radio", fieldName, entry.id);
            radio.checked = draft[fieldName] === entry.id;
            radio.addEventListener("change", function () {
                update(fieldName, entry.id);
                render();
            });
            label.append(radio, element("strong", "", entry.name), element("small", "", description(entry)));
            grid.append(label);
        });
        return grid;
    }

    function renderConcept(container) {
        var grid = element("div", "wizard-grid");
        var name = input("text", "name", draft.name);
        name.autocomplete = "off";
        var concept = document.createElement("textarea");
        concept.name = "concept";
        concept.rows = 4;
        concept.value = draft.concept;
        grid.append(field("Nom du personnage", name), field("Concept en quelques mots", concept));
        grid.append(field("Alignement", select("alignment", [""].concat(model.alignments), draft.alignment)));
        var languages = select("language", model.languages, draft.languages[0] || "Commun");
        grid.append(field("Langue principale", languages));
        container.append(grid, element("p", "wizard-help", "Commencez par l’intention de jeu. Le nom peut rester provisoire."));
    }

    function renderLevel(container) {
        var level = input("number", "level", draft.level);
        level.min = "1";
        level.max = "20";
        container.append(field("Niveau de départ (1 à 20)", level));
        container.append(element("p", "wizard-help", draft.level >= 3
            ? "À ce niveau, pensez aussi au choix de sous-classe dans la fiche détaillée de votre classe."
            : "Le niveau détermine notamment le bonus de maîtrise et l’accès progressif aux capacités."));
    }

    function renderClass(container) {
        container.append(choiceGrid(model.classes, "classId", function (entry) {
            return entry.role + " · d" + entry.hitDie + " · " + entry.magic + " · Complexité " + entry.complexity;
        }));
        container.append(referenceLink("Comparer les classes", "comparateur.html?type=classes"));
    }

    function renderSpecies(container) {
        container.append(choiceGrid(model.species, "speciesId", function (entry) {
            return entry.size + " · " + entry.speed + " · " + entry.traits.join(", ");
        }));
        container.append(referenceLink("Comparer les espèces", "comparateur.html?type=species"));
    }

    function renderBackground(container) {
        container.append(choiceGrid(model.backgrounds, "backgroundId", function (entry) {
            return entry.feat + " · " + entry.skills.join(", ") + " · " + entry.abilities.join(", ");
        }));
        container.append(referenceLink("Comparer les historiques", "comparateur.html?type=backgrounds"));
    }

    function renderAbilities(container) {
        var grid = element("div", "ability-grid");
        stateApi.abilityKeys.forEach(function (key, index) {
            var score = input("number", "ability-" + key, draft.abilities[key]);
            score.min = "3";
            score.max = "20";
            var label = field(stateApi.abilityNames[index], score);
            label.append(element("small", "", "Mod. " + signed(stateApi.modifier(draft.abilities[key]))));
            grid.append(label);
        });
        var apply = element("button", "", "Appliquer la répartition conseillée");
        apply.type = "button";
        apply.disabled = !draft.classId;
        apply.addEventListener("click", function () {
            var characterClass = find(model.classes, draft.classId);
            if (!characterClass) return;
            stateApi.abilityKeys.forEach(function (key, index) { draft.abilities[key] = characterClass.standardArray[index]; });
            save("Répartition conseillée appliquée.");
            render();
        });
        container.append(grid, apply, element("p", "wizard-help", "La répartition conseillée utilise la série standard 15, 14, 13, 12, 10, 8. Les ajustements d’historique restent à appliquer selon votre choix de règle."));
    }

    function renderSkills(container) {
        var background = find(model.backgrounds, draft.backgroundId);
        if (background) container.append(element("p", "wizard-help", "Votre historique suggère : " + background.skills.join(" et ") + "."));
        var grid = element("div", "wizard-choice-grid");
        skills.forEach(function (skill) {
            var label = element("label", "wizard-choice");
            var checkbox = input("checkbox", "skills", skill);
            checkbox.checked = draft.skills.includes(skill);
            checkbox.addEventListener("change", function () {
                draft.skills = checkbox.checked
                    ? Array.from(new Set(draft.skills.concat(skill)))
                    : draft.skills.filter(function (entry) { return entry !== skill; });
                save();
            });
            label.append(checkbox, element("span", "", skill));
            grid.append(label);
        });
        container.append(grid, element("p", "wizard-warning", "Vérifiez le nombre de maîtrises autorisé par votre classe. Le mode expert permet de préparer une combinaison libre."));
    }

    function renderEquipment(container) {
        var equipment = document.createElement("textarea");
        equipment.name = "equipment";
        equipment.rows = 10;
        equipment.value = draft.equipment;
        equipment.placeholder = "Ex. épée longue, bouclier, sac d’explorateur…";
        container.append(field("Équipement de départ", equipment));
        container.append(element("p", "wizard-help", "Notez ici l’équipement choisi dans les options de votre classe et de votre historique. Cette zone reste libre pour ne pas imposer une interprétation des paquets de départ."));
    }

    function maximumSpellLevel() {
        var characterClass = find(model.classes, draft.classId);
        if (!characterClass || /^Aucune|Focus/.test(characterClass.magic)) return -1;
        if (/Demi/.test(characterClass.magic)) return Math.min(5, Math.ceil(draft.level / 4));
        return Math.min(9, Math.ceil(draft.level / 2));
    }

    function renderSpells(container) {
        var characterClass = find(model.classes, draft.classId);
        var maximum = maximumSpellLevel();
        if (!characterClass || maximum < 0) {
            container.append(element("p", "wizard-help", "La classe choisie ne possède pas de liste de sorts par défaut. Vous pourrez ajouter les sorts obtenus par un don ou une sous-classe directement sur la fiche."));
            return;
        }
        var search = input("search", "spellSearch", "");
        search.placeholder = "Filtrer les sorts…";
        var count = element("p", "wizard-help");
        var list = element("div", "wizard-choice-grid");
        function paint() {
            var query = search.value.trim().toLocaleLowerCase("fr");
            var available = spells.filter(function (spell) {
                return spell.level <= maximum
                    && spell.classes.includes(characterClass.name)
                    && (!query || spell.name.toLocaleLowerCase("fr").includes(query));
            });
            list.replaceChildren();
            available.slice(0, 80).forEach(function (spell) {
                var label = element("label", "wizard-choice");
                var checkbox = input("checkbox", "spells", spell.slug);
                checkbox.checked = draft.spells.includes(spell.slug);
                checkbox.addEventListener("change", function () {
                    draft.spells = checkbox.checked
                        ? Array.from(new Set(draft.spells.concat(spell.slug)))
                        : draft.spells.filter(function (slug) { return slug !== spell.slug; });
                    save();
                    count.textContent = draft.spells.length + " sort(s) dans votre sélection de travail.";
                });
                label.append(checkbox, element("strong", "", spell.name), element("small", "", (spell.level ? "Niveau " + spell.level : "Tour de magie") + " · " + spell.school));
                list.append(label);
            });
            count.textContent = draft.spells.length + " sort(s) sélectionné(s) · " + available.length + " résultat(s).";
        }
        search.addEventListener("input", paint);
        container.append(field("Recherche", search), count, list);
        container.append(element("p", "wizard-warning", "Cette sélection prépare votre liste de travail. Vérifiez dans votre classe le nombre exact de sorts connus ou préparés à ce niveau."));
        paint();
    }

    function summaryBlock(title, lines) {
        var block = element("section", "summary-block");
        block.append(element("h3", "", title));
        lines.forEach(function (line) { block.append(element("p", "", line)); });
        return block;
    }

    function renderSummary(container) {
        var characterClass = find(model.classes, draft.classId);
        var species = find(model.species, draft.speciesId);
        var background = find(model.backgrounds, draft.backgroundId);
        var derived = stateApi.derived(draft, model);
        var grid = element("div", "wizard-summary");
        grid.append(
            summaryBlock("Identité", [
                (draft.name || "Sans nom") + " — niveau " + draft.level,
                draft.concept || "Concept non renseigné",
                [species?.name, characterClass?.name, background?.name].filter(Boolean).join(" · ") || "Choix incomplets",
            ]),
            summaryBlock("Caractéristiques", stateApi.abilityKeys.map(function (key, index) {
                return stateApi.abilityNames[index] + " " + draft.abilities[key] + " (" + signed(stateApi.modifier(draft.abilities[key])) + ")";
            })),
            summaryBlock("Maîtrises et équipement", [
                draft.skills.length ? draft.skills.join(", ") : "Aucune compétence sélectionnée",
                draft.equipment || "Équipement non renseigné",
            ]),
            summaryBlock("Magie", [
                draft.spells.length ? draft.spells.length + " sort(s) sélectionné(s)" : "Aucun sort sélectionné",
            ])
        );
        var provenance = element("ul", "provenance-list");
        [
            "Bonus de maîtrise " + signed(derived.proficiency) + " : 2 + ⌊(niveau − 1) / 4⌋.",
            "Initiative " + signed(derived.initiative) + " : modificateur de Dextérité.",
            "PV estimés " + (derived.hp ?? "indisponibles") + " : dé de vie maximal au niveau 1, puis moyenne arrondie au-dessus + Constitution. Ce résultat reste éditable.",
            "Vitesse " + (species?.speed || "indisponible") + " : trait de l’espèce sélectionnée.",
        ].forEach(function (text) { provenance.append(element("li", "", text)); });
        container.append(grid, element("h3", "", "Origine des valeurs calculées"), provenance);
        var issues = allIssues();
        if (issues.length) container.append(element("p", "wizard-warning", "À compléter : " + issues.join(" ")));
    }

    function renderGeneration(container) {
        renderSummary(container);
        var actions = element("div", "wizard-actions");
        var sheet = element("button", "", "Générer la fiche");
        var profile = element("button", "", "Créer le profil");
        var download = element("button", "", "Exporter en JSON");
        var print = element("button", "", "Imprimer le résumé");
        [sheet, profile, download, print].forEach(function (button) { button.type = "button"; });
        sheet.addEventListener("click", generateSheet);
        profile.addEventListener("click", createProfile);
        download.addEventListener("click", exportDraft);
        print.addEventListener("click", function () { window.print(); });
        actions.append(sheet, profile, download, print);
        container.append(actions, element("p", "wizard-help", "La génération remplit la fiche locale sans supprimer vos ajustements ultérieurs."));
    }

    function referenceLink(label, href) {
        var paragraph = element("p", "wizard-help");
        var link = element("a", "", label);
        link.href = href;
        paragraph.append(link, document.createTextNode(" avant de décider."));
        return paragraph;
    }

    function allIssues() {
        return [0, 2, 3, 4, 5].flatMap(function (step) { return stateApi.validateStep(draft, step); });
    }

    function signed(value) {
        return value >= 0 ? "+" + value : String(value);
    }

    function generateSheet() {
        var issues = allIssues();
        if (issues.length && !draft.expert) {
            status.textContent = "Fiche non générée : " + issues.join(" ");
            return;
        }
        storage.setJson(SHEET_KEY, stateApi.sheetPayload(draft, model, spells));
        status.replaceChildren(document.createTextNode("Fiche générée. "));
        var link = element("a", "", "Ouvrir la fiche de personnage");
        link.href = "character-sheet-standalone.html";
        status.append(link);
    }

    function createProfile() {
        var characterClass = find(model.classes, draft.classId);
        var species = find(model.species, draft.speciesId);
        var profile = window.DndProfiles.save({
            name: draft.name || draft.concept || "Nouveau personnage",
            class: characterClass?.name || "",
            level: draft.level,
            species: species?.name || "",
            sheetUrl: "character-sheet-standalone.html",
            preparedSpells: draft.spells.map(function (slug) { return "spell-" + slug; }),
        });
        window.DndProfiles.setActive(profile.id);
        status.textContent = "Profil créé et activé dans votre espace personnel.";
    }

    function exportDraft() {
        var payload = {
            exportedAt: new Date().toISOString(),
            source: model.source,
            draft: draft,
            sheet: stateApi.sheetPayload(draft, model, spells),
        };
        var url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
        var link = document.createElement("a");
        link.href = url;
        link.download = (draft.name || "personnage").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".json";
        link.click();
        URL.revokeObjectURL(url);
        status.textContent = "Export JSON préparé.";
    }

    function renderNavigation() {
        stepList.replaceChildren();
        steps.forEach(function (label, index) {
            var button = element("button", "", (index + 1) + ". " + label);
            button.type = "button";
            if (index === draft.step) button.setAttribute("aria-current", "step");
            button.addEventListener("click", function () {
                if (index > draft.step && !draft.expert) {
                    var errors = stateApi.validateStep(draft, draft.step);
                    if (errors.length) {
                        status.textContent = errors.join(" ");
                        return;
                    }
                }
                draft.step = index;
                save();
                render();
            });
            stepList.append(button);
        });
    }

    function renderActions() {
        var actions = element("div", "wizard-actions");
        var previous = element("button", "", "Précédent");
        var end = element("div", "wizard-actions__end");
        previous.type = "button";
        previous.disabled = draft.step === 0;
        previous.addEventListener("click", function () { draft.step -= 1; save(); render(); });
        actions.append(previous);
        if (draft.step < steps.length - 1) {
            var next = element("button", "", draft.step === steps.length - 2 ? "Passer à la création" : "Suivant");
            next.type = "button";
            next.addEventListener("click", function () {
                var errors = stateApi.validateStep(draft, draft.step);
                if (errors.length && !draft.expert) {
                    status.textContent = errors.join(" ");
                    return;
                }
                draft.step += 1;
                save();
                render();
            });
            end.append(next);
        }
        actions.append(end);
        panel.append(actions);
    }

    function render() {
        var stepChanged = lastRenderedStep !== draft.step;
        draft = stateApi.normalizeDraft(draft);
        progress.value = draft.step + 1;
        expertToggle.checked = draft.expert;
        renderNavigation();
        panel.replaceChildren(element("h2", "", (draft.step + 1) + ". " + steps[draft.step]));
        var renderers = [
            renderConcept, renderLevel, renderClass, renderSpecies, renderBackground, renderAbilities,
            renderSkills, renderEquipment, renderSpells, renderSummary, renderGeneration,
        ];
        renderers[draft.step](panel);
        panel.querySelectorAll("[name]").forEach(function (control) {
            if (["skills", "spells", "spellSearch", "classId", "speciesId", "backgroundId"].includes(control.name)) return;
            function persistControl() {
                if (control.name === "language") draft.languages = [control.value];
                else update(control.name, control.value);
            }
            control.addEventListener(control.matches("input[type='text'], input[type='number'], textarea") ? "input" : "change", persistControl);
            if (control.name === "level") control.addEventListener("change", render);
        });
        if (draft.step < steps.length - 1) renderActions();
        if (stepChanged) {
            var heading = panel.querySelector("h2");
            heading.tabIndex = -1;
            heading.focus();
        }
        lastRenderedStep = draft.step;
    }

    expertToggle.addEventListener("change", function () {
        draft.expert = expertToggle.checked;
        save(draft.expert ? "Mode expert activé : les étapes incomplètes sont autorisées." : "Mode guidé activé.");
    });
    document.getElementById("resetDraft").addEventListener("click", function () {
        if (!window.confirm("Effacer ce brouillon et recommencer ?")) return;
        draft = stateApi.createDraft();
        save("Nouveau brouillon créé.");
        render();
    });

    Promise.all([
        fetch("data/character-creation.json").then(function (response) { return response.json(); }),
        fetch("data/spells_2024.json").then(function (response) { return response.json(); }),
    ]).then(function (results) {
        model = results[0];
        spells = results[1].spells;
        render();
    }).catch(function () {
        panel.textContent = "Les données de création n’ont pas pu être chargées.";
    });
})();
