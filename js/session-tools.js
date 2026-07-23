(function () {
    "use strict";

    var STORAGE_KEY = "dnd_character_session_v1";
    var storage = window.DndStorage;
    var model = window.DndSessionState;
    var spellCatalog = [];
    var saveTimer = 0;
    var currentHp = "";

    function activeScopeKey() {
        return window.DndProfiles?.getActive()?.id || "global";
    }

    function readState() {
        return model.normalizeState(storage.getJson(STORAGE_KEY, null));
    }

    function readScope(state) {
        var key = activeScopeKey();
        if (!state.scopes[key]) state.scopes[key] = model.createScope();
        return state.scopes[key];
    }

    function saveState(state) {
        storage.setJson(STORAGE_KEY, model.normalizeState(state));
    }

    function updateScope(callback, historyLabel) {
        var state = readState();
        var key = activeScopeKey();
        var scope = readScope(state);
        callback(scope);
        scope = model.normalizeScope(scope);
        if (historyLabel) scope = model.recordHistory(scope, historyLabel);
        state.scopes[key] = scope;
        saveState(state);
        render();
    }

    function iconButton(label, text, callback, danger) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.setAttribute("aria-label", label);
        if (danger) button.className = "danger";
        button.addEventListener("click", callback);
        return button;
    }

    function renderMirrors() {
        document.querySelectorAll("[data-session-mirror]").forEach(function (mirror) {
            var field = document.querySelector('[data-field="' + mirror.dataset.sessionMirror + '"]');
            mirror.textContent = field && String(field.value).trim() ? field.value : "—";
        });
        document.querySelectorAll("[data-session-max]").forEach(function (mirror) {
            var field = document.querySelector('[data-field="' + mirror.dataset.sessionMax + '"]');
            mirror.textContent = field && String(field.value).trim() ? "/ " + field.value : "";
        });
    }

    function renderResources(scope) {
        var host = document.getElementById("sessionResources");
        host.replaceChildren();
        if (!scope.resources.length) {
            host.textContent = "Ajoutez une ressource générique pour commencer.";
            return;
        }
        scope.resources.forEach(function (resource) {
            var row = document.createElement("div");
            var text = document.createElement("div");
            var title = document.createElement("strong");
            var meta = document.createElement("div");
            var actions = document.createElement("div");
            row.className = "session-row";
            title.textContent = resource.label;
            meta.className = "session-row__meta";
            meta.textContent = resource.reset === "short-rest" ? "Repos court" : resource.reset === "long-rest" ? "Repos long" : "Recharge manuelle";
            text.append(title, meta);
            actions.className = "session-row__actions";
            actions.append(
                iconButton("Dépenser " + resource.label, "−", function () {
                    updateScope(function (target) {
                        var item = target.resources.find(function (entry) { return entry.id === resource.id; });
                        var before = item.current;
                        item.current = model.clamp(item.current - 1, 0, item.max);
                        if (before !== item.current) target.history.unshift({ label: resource.label + " : " + before + " → " + item.current, at: new Date().toISOString() });
                    });
                }),
            );
            var meter = document.createElement("strong");
            meter.className = "session-meter";
            meter.textContent = resource.current + " / " + resource.max;
            actions.append(meter);
            actions.append(
                iconButton("Restaurer une charge de " + resource.label, "+", function () {
                    updateScope(function (target) {
                        var item = target.resources.find(function (entry) { return entry.id === resource.id; });
                        var before = item.current;
                        item.current = model.clamp(item.current + 1, 0, item.max);
                        if (before !== item.current) target.history.unshift({ label: resource.label + " : " + before + " → " + item.current, at: new Date().toISOString() });
                    });
                }),
                iconButton("Supprimer " + resource.label, "×", function () {
                    if (!window.confirm("Supprimer la ressource « " + resource.label + " » ?")) return;
                    updateScope(function (target) {
                        target.resources = target.resources.filter(function (entry) { return entry.id !== resource.id; });
                    }, "Ressource supprimée : " + resource.label);
                }, true),
            );
            row.append(text, actions);
            host.appendChild(row);
        });
    }

    function renderSlots(scope) {
        var host = document.getElementById("sessionSlots");
        host.replaceChildren();
        scope.slots.forEach(function (slot) {
            var row = document.createElement("div");
            var label = document.createElement("strong");
            var pips = document.createElement("span");
            var controls = document.createElement("div");
            var maximum = document.createElement("input");
            row.className = "session-slot";
            label.textContent = "Niveau " + slot.level;
            pips.className = "session-pips";
            pips.textContent = "●".repeat(slot.current) + "○".repeat(Math.max(0, slot.max - slot.current)) || "—";
            maximum.type = "number";
            maximum.min = "0";
            maximum.max = "20";
            maximum.value = slot.max;
            maximum.setAttribute("aria-label", "Maximum d’emplacements niveau " + slot.level);
            maximum.addEventListener("change", function () {
                updateScope(function (target) {
                    var item = target.slots[slot.level - 1];
                    item.max = model.clamp(maximum.value, 0, 20);
                    item.current = model.clamp(item.current, 0, item.max);
                });
            });
            controls.className = "session-row__actions";
            controls.append(
                iconButton("Dépenser un emplacement niveau " + slot.level, "−", function () {
                    updateScope(function (target) {
                        var item = target.slots[slot.level - 1];
                        var before = item.current;
                        item.current = model.clamp(item.current - 1, 0, item.max);
                        if (before !== item.current) target.history.unshift({ label: "Emplacement niveau " + slot.level + " : " + before + " → " + item.current, at: new Date().toISOString() });
                    });
                }),
                maximum,
                iconButton("Restaurer un emplacement niveau " + slot.level, "+", function () {
                    updateScope(function (target) {
                        var item = target.slots[slot.level - 1];
                        item.current = model.clamp(item.current + 1, 0, item.max);
                    });
                }),
            );
            row.append(label, pips, controls);
            host.appendChild(row);
        });
    }

    function spellMeta(spell) {
        return [
            "Niv. " + spell.level,
            spell.school,
            spell.casting_time,
            spell.duration?.toLocaleLowerCase("fr").includes("concentration") ? "Concentration" : "",
            spell.description?.toLocaleLowerCase("fr").includes("rituel") ? "Rituel" : "",
            spell.components,
        ].filter(Boolean).join(" · ");
    }

    function spellRecord(spell) {
        return {
            slug: spell.slug,
            name: spell.name,
            level: spell.level,
            school: spell.school,
            casting_time: spell.casting_time,
            duration: spell.duration,
            components: spell.components,
            description: spell.description,
        };
    }

    function syncProfileSpells(scope) {
        var active = window.DndProfiles?.getActive();
        if (!active) return;
        window.DndProfiles.save(Object.assign({}, active, {
            preparedSpells: scope.preparedSpells.map(function (spell) { return "spell-" + spell.slug; }),
        }));
    }

    function renderPreparedSpells(scope) {
        var known = document.getElementById("knownSpells");
        var selected = document.getElementById("preparedSpells");
        known.replaceChildren();
        selected.replaceChildren();
        if (!scope.knownSpells.length) known.textContent = "Aucun sort connu.";
        scope.knownSpells.forEach(function (spell) {
            var row = document.createElement("div");
            var text = document.createElement("div");
            var link = document.createElement("a");
            var meta = document.createElement("div");
            var actions = document.createElement("div");
            var prepared = scope.preparedSpells.some(function (entry) { return entry.slug === spell.slug; });
            row.className = "session-row";
            link.href = "spells.html?spell=" + encodeURIComponent(spell.slug);
            link.textContent = spell.name;
            meta.className = "session-row__meta";
            meta.textContent = spellMeta(spell);
            text.append(link, meta);
            actions.className = "session-row__actions";
            actions.append(iconButton(
                prepared ? "Retirer " + spell.name + " des sorts préparés" : "Préparer " + spell.name,
                prepared ? "Dépréparer" : "Préparer",
                function () {
                    updateScope(function (target) {
                        if (prepared) {
                            target.preparedSpells = target.preparedSpells.filter(function (entry) { return entry.slug !== spell.slug; });
                        } else {
                            target.preparedSpells.push(spellRecord(spell));
                        }
                        syncProfileSpells(target);
                    }, prepared ? "Sort dépréparé : " + spell.name : "Sort préparé : " + spell.name);
                },
            ));
            actions.append(iconButton("Oublier " + spell.name, "Oublier", function () {
                updateScope(function (target) {
                    target.knownSpells = target.knownSpells.filter(function (entry) { return entry.slug !== spell.slug; });
                    target.preparedSpells = target.preparedSpells.filter(function (entry) { return entry.slug !== spell.slug; });
                    syncProfileSpells(target);
                }, "Sort retiré des sorts connus : " + spell.name);
            }, true));
            row.append(text, actions);
            known.appendChild(row);
        });
        if (!scope.preparedSpells.length) selected.textContent = "Aucun sort préparé.";
        scope.preparedSpells.forEach(function (spell) {
            var row = document.createElement("div");
            var text = document.createElement("div");
            var link = document.createElement("a");
            var meta = document.createElement("div");
            row.className = "session-row";
            link.href = "spells.html?spell=" + encodeURIComponent(spell.slug);
            link.textContent = spell.name;
            meta.className = "session-row__meta";
            meta.textContent = spellMeta(spell);
            text.append(link, meta);
            row.append(text, iconButton("Retirer " + spell.name, "Retirer", function () {
                updateScope(function (target) {
                    target.preparedSpells = target.preparedSpells.filter(function (entry) { return entry.slug !== spell.slug; });
                    syncProfileSpells(target);
                }, "Sort retiré : " + spell.name);
            }, true));
            selected.appendChild(row);
        });
        renderSpellResults(scope);
    }

    function renderSpellResults(scope) {
        var host = document.getElementById("preparedSpellResults");
        var query = document.getElementById("preparedSpellSearch").value.trim().toLocaleLowerCase("fr");
        var className = document.getElementById("preparedSpellClass").value;
        var level = document.getElementById("preparedSpellLevel").value;
        var known = new Set(scope.knownSpells.map(function (spell) { return spell.slug; }));
        var matches = spellCatalog.filter(function (spell) {
            if (known.has(spell.slug)) return false;
            if (className && !spell.classes.includes(className)) return false;
            if (level !== "" && String(spell.level) !== level) return false;
            return !query || [spell.name, spell.school, spell.description].join(" ").toLocaleLowerCase("fr").includes(query);
        }).slice(0, 30);
        host.replaceChildren();
        matches.forEach(function (spell) {
            var row = document.createElement("div");
            var text = document.createElement("div");
            var title = document.createElement("strong");
            var meta = document.createElement("div");
            row.className = "session-spell-result";
            title.textContent = spell.name;
            meta.className = "session-row__meta";
            meta.textContent = spellMeta(spell);
            text.append(title, meta);
            row.append(text, iconButton("Ajouter " + spell.name + " aux sorts connus", "Connaître", function () {
                updateScope(function (target) {
                    target.knownSpells.push(spellRecord(spell));
                }, "Sort connu ajouté : " + spell.name);
            }));
            host.appendChild(row);
        });
        if (!matches.length) host.textContent = "Aucun sort correspondant.";
    }

    function syncProfileShortcuts(scope) {
        var active = window.DndProfiles?.getActive();
        if (!active) return;
        window.DndProfiles.save(Object.assign({}, active, {
            shortcuts: scope.shortcuts.map(function (shortcut) { return shortcut.url || shortcut.label; }),
        }));
    }

    function renderShortcuts(scope) {
        var host = document.getElementById("sessionShortcuts");
        host.replaceChildren();
        if (!scope.shortcuts.length) host.textContent = "Aucun raccourci épinglé.";
        scope.shortcuts.forEach(function (shortcut) {
            var row = document.createElement("div");
            var text = document.createElement("div");
            var label = shortcut.url ? document.createElement("a") : document.createElement("strong");
            var meta = document.createElement("div");
            row.className = "session-row";
            label.textContent = shortcut.label;
            if (shortcut.url) label.href = shortcut.url;
            meta.className = "session-row__meta";
            meta.textContent = shortcut.type;
            text.append(label, meta);
            row.append(text, iconButton("Retirer " + shortcut.label, "Retirer", function () {
                updateScope(function (target) {
                    target.shortcuts = target.shortcuts.filter(function (entry) { return entry.id !== shortcut.id; });
                    syncProfileShortcuts(target);
                }, "Raccourci retiré : " + shortcut.label);
            }, true));
            host.appendChild(row);
        });
    }

    function renderHistory(scope) {
        var host = document.getElementById("sessionHistory");
        host.replaceChildren();
        scope.history.forEach(function (entry) {
            var item = document.createElement("li");
            var text = document.createElement("span");
            var time = document.createElement("time");
            text.textContent = entry.label + " ";
            time.dateTime = entry.at;
            time.textContent = new Date(entry.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
            item.append(text, time);
            host.appendChild(item);
        });
        if (!scope.history.length) host.innerHTML = "<li>Aucune opération enregistrée.</li>";
    }

    function render() {
        var state = readState();
        var scope = readScope(state);
        renderMirrors();
        renderResources(scope);
        renderSlots(scope);
        renderPreparedSpells(scope);
        renderShortcuts(scope);
        renderHistory(scope);
        document.getElementById("sessionNotes").value = scope.notes;
        applyMode(state.mode);
    }

    function applyMode(mode) {
        var read = mode === "read";
        document.body.dataset.sheetMode = read ? "read" : "edit";
        document.getElementById("sheetModeRead").setAttribute("aria-pressed", String(read));
        document.getElementById("sheetModeEdit").setAttribute("aria-pressed", String(!read));
        document.querySelectorAll(".sheet-page:not(.session-page) [data-field]").forEach(function (field) {
            if (field.matches("select, input[type='checkbox']")) field.disabled = read;
            else field.readOnly = read;
        });
    }

    function setMode(mode) {
        var state = readState();
        state.mode = mode;
        saveState(state);
        applyMode(mode);
    }

    function restPreview(type) {
        var scope = readScope(readState());
        return model.applyRest(scope, type).changes;
    }

    function confirmRest(type) {
        var dialog = document.getElementById("restDialog");
        var preview = document.getElementById("restPreview");
        var changes = restPreview(type);
        document.getElementById("restDialogTitle").textContent = type === "long-rest" ? "Confirmer le repos long" : "Confirmer le repos court";
        preview.replaceChildren();
        changes.forEach(function (change) {
            var item = document.createElement("li");
            item.textContent = change;
            preview.appendChild(item);
        });
        if (!changes.length) preview.innerHTML = "<li>Aucune ressource concernée.</li>";
        dialog.showModal();
        dialog.addEventListener("close", function () {
            if (dialog.returnValue !== "confirm" || !changes.length) return;
            var state = readState();
            var key = activeScopeKey();
            state.scopes[key] = model.applyRest(readScope(state), type).scope;
            saveState(state);
            render();
        }, { once: true });
    }

    function initFilters() {
        var classSelect = document.getElementById("preparedSpellClass");
        var levelSelect = document.getElementById("preparedSpellLevel");
        Array.from({ length: 10 }, function (_, level) {
            levelSelect.appendChild(new Option(level === 0 ? "Tours de magie" : "Niveau " + level, String(level)));
        });
        fetch("data/spells_2024.json").then(function (response) { return response.json(); }).then(function (data) {
            spellCatalog = Array.isArray(data.spells) ? data.spells : [];
            Array.from(new Set(spellCatalog.flatMap(function (spell) { return spell.classes; }))).sort(function (a, b) {
                return a.localeCompare(b, "fr");
            }).forEach(function (className) { classSelect.appendChild(new Option(className, className)); });
            var sheetClass = document.querySelector("[data-class-select]")?.value;
            if (sheetClass && Array.from(classSelect.options).some(function (option) { return option.value === sheetClass; })) classSelect.value = sheetClass;
            renderSpellResults(readScope(readState()));
        }).catch(function () {
            document.getElementById("preparedSpellResults").textContent = "Catalogue de sorts indisponible hors cache.";
        });
    }

    document.getElementById("sheetModeRead").addEventListener("click", function () { setMode("read"); });
    document.getElementById("sheetModeEdit").addEventListener("click", function () { setMode("edit"); });
    document.getElementById("shortRestBtn").addEventListener("click", function () { confirmRest("short-rest"); });
    document.getElementById("longRestBtn").addEventListener("click", function () { confirmRest("long-rest"); });
    document.getElementById("resourceForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var label = document.getElementById("resourceLabel").value.trim();
        var maximum = model.clamp(document.getElementById("resourceMax").value, 0, 999);
        if (!label) return;
        updateScope(function (scope) {
            scope.resources.push({
                id: "resource-" + Date.now().toString(36),
                label: label,
                current: model.clamp(document.getElementById("resourceCurrent").value, 0, maximum),
                max: maximum,
                reset: document.getElementById("resourceReset").value,
            });
        }, "Ressource ajoutée : " + label);
        event.target.reset();
        document.getElementById("resourceCurrent").value = "1";
        document.getElementById("resourceMax").value = "1";
    });
    document.getElementById("shortcutForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var label = document.getElementById("shortcutLabel").value.trim();
        if (!label) return;
        updateScope(function (scope) {
            scope.shortcuts.push({
                id: "shortcut-" + Date.now().toString(36),
                label: label,
                type: document.getElementById("shortcutType").value,
                url: document.getElementById("shortcutUrl").value.trim(),
            });
            syncProfileShortcuts(scope);
        }, "Raccourci ajouté : " + label);
        event.target.reset();
    });
    document.getElementById("sessionNotes").addEventListener("input", function (event) {
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(function () {
            updateScope(function (scope) { scope.notes = event.target.value; });
        }, 350);
    });
    document.getElementById("clearSessionHistory").addEventListener("click", function () {
        if (!window.confirm("Effacer l’historique de session ?")) return;
        updateScope(function (scope) { scope.history = []; });
    });
    ["preparedSpellSearch", "preparedSpellClass", "preparedSpellLevel"].forEach(function (id) {
        document.getElementById(id).addEventListener(id === "preparedSpellSearch" ? "input" : "change", function () {
            renderSpellResults(readScope(readState()));
        });
    });
    document.addEventListener("input", renderMirrors);
    document.addEventListener("change", function (event) {
        renderMirrors();
        if (event.target.matches('[data-field="hp_current"]')) {
            var next = event.target.value;
            if (currentHp !== "" && currentHp !== next) {
                updateScope(function () {}, "PV : " + currentHp + " → " + next);
            }
            currentHp = next;
        }
    });
    window.addEventListener("dndpersonalchange", render);
    currentHp = document.querySelector('[data-field="hp_current"]')?.value || "";
    initFilters();
    var initialState = readState();
    render();
    if (initialState.mode === "read") document.querySelector('[data-page-target="sessionPage"]')?.click();
})();
