(function () {
    "use strict";

    var personal = window.DndPersonal;
    var profiles = window.DndProfiles;
    var library = window.DndLibrary;
    var storage = window.DndStorage;
    var status = document.getElementById("personalStatus");
    var profileForm = document.getElementById("profileForm");
    var profileSelect = document.getElementById("activeProfileSelect");
    var listsHost = document.getElementById("personalLists");
    var notesHost = document.getElementById("notesList");
    var searchInput = document.getElementById("librarySearch");
    var profileSheetLink = document.getElementById("profileSheetLink");
    var legacySheetRecovery = document.getElementById("legacySheetRecovery");

    function announce(message, isError) {
        status.textContent = message;
        status.classList.toggle("is-error", Boolean(isError));
    }

    function textPrompt(label, initialValue) {
        var dialog = document.getElementById("personalPromptDialog");
        var input = document.getElementById("personalPromptInput");
        document.getElementById("personalPromptTitle").textContent = label;
        input.value = initialValue || "";
        dialog.showModal();
        input.focus();
        input.select();
        return new Promise(function (resolve) {
            dialog.addEventListener("close", function () {
                resolve(dialog.returnValue === "confirm" ? input.value.trim() : null);
            }, { once: true });
        });
    }

    function activeScopeId() {
        return profiles.getActive()?.id || null;
    }

    function profileById(id) {
        return profiles.getAll().find(function (profile) { return profile.id === id; }) || null;
    }

    function fillProfileForm(profile) {
        profileForm.hidden = !profile;
        document.getElementById("profileId").value = profile?.id || "";
        document.getElementById("profileName").value = profile?.name || "";
        document.getElementById("profileClass").value = profile?.class || "";
        document.getElementById("profileLevel").value = profile?.level || 1;
        document.getElementById("profileSpecies").value = profile?.species || "";
        document.getElementById("profileSheetUrl").value = profile?.sheetUrl || "";
        if (profile) {
            var href = profile.sheetUrl && profile.sheetUrl !== "character-sheet-standalone.html"
                ? profile.sheetUrl
                : "character-sheet-standalone.html?profile=" + encodeURIComponent(profile.id);
            profileSheetLink.href = href;
            profileSheetLink.hidden = false;
        } else {
            profileSheetLink.hidden = true;
        }
    }

    function renderProfiles() {
        var active = profiles.getActive();
        profileSelect.replaceChildren(new Option("Aucun profil", ""));
        profiles.getAll().forEach(function (profile) {
            profileSelect.appendChild(new Option(
                profile.name + (profile.class ? " — " + profile.class + " " + profile.level : ""),
                profile.id,
            ));
        });
        profileSelect.value = active?.id || "";
        fillProfileForm(active);
    }

    function renderLegacyRecovery() {
        legacySheetRecovery.replaceChildren();
        var legacy = window.DndSheets.getUnassigned();
        var active = profiles.getActive();
        if (!legacy || !active) {
            legacySheetRecovery.hidden = true;
            return;
        }
        legacySheetRecovery.hidden = false;
        legacySheetRecovery.appendChild(document.createTextNode("Une ancienne fiche n’est associée à aucun profil. Vous pouvez l’associer explicitement à « " + active.name + " ». "));
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn--secondary";
        button.textContent = "Associer cette fiche";
        button.addEventListener("click", function () {
            var result = window.DndSheets.claimUnassigned(active.id);
            announce(result.ok ? "Ancienne fiche associée au profil actif." : "Association impossible.", !result.ok);
            render();
        });
        legacySheetRecovery.appendChild(button);
    }

    function itemIdentity(entry) {
        return String(entry.contentId || entry.url || "");
    }

    function normalizedItem(entry) {
        return {
            contentId: String(entry.contentId || entry.url || ""),
            url: String(entry.url || ""),
            title: String(entry.title || "Contenu"),
            category: String(entry.category || "Page"),
            note: String(entry.note || ""),
            tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
            addedAt: entry.addedAt || new Date().toISOString(),
        };
    }

    function updateList(listId, callback) {
        var state = personal.getState();
        var list = state.lists.find(function (entry) { return entry.id === listId; });
        if (!list) return;
        callback(list, state);
        personal.setState(state);
    }

    function visibleLists(state) {
        var scopeId = activeScopeId();
        return state.lists.filter(function (list) {
            return (list.profileId || null) === scopeId;
        });
    }

    async function addFavoriteToList(entry) {
        var state = personal.getState();
        var lists = visibleLists(state);
        if (!lists.length) {
            announce("Créez d’abord une liste.", true);
            return;
        }
        var answer = await textPrompt(
            "Dans quelle liste ?\n" + lists.map(function (list, index) { return (index + 1) + ". " + list.name; }).join("\n"),
            "1",
        );
        if (answer === null) return;
        var list = lists[Number(answer) - 1];
        if (!list) {
            announce("Liste inconnue.", true);
            return;
        }
        if (!list.items.some(function (item) { return itemIdentity(item) === itemIdentity(entry); })) {
            list.items.push(normalizedItem(entry));
            personal.setState(state);
        }
        announce("Contenu ajouté à « " + list.name + " ».");
    }

    function createItemRow(item, list, index) {
        var row = document.createElement("li");
        var text = document.createElement("div");
        var link = document.createElement("a");
        var meta = document.createElement("small");
        var actions = document.createElement("div");
        row.className = "personal-item";
        text.className = "personal-item__text";
        link.href = item.url || "#";
        link.textContent = item.title;
        meta.textContent = [item.category, item.tags?.join(", "), item.note].filter(Boolean).join(" — ");
        text.append(link, meta);
        actions.className = "personal-item__actions";

        [
            ["↑", "Monter", function () {
                updateList(list.id, function (target) {
                    if (index > 0) [target.items[index - 1], target.items[index]] = [target.items[index], target.items[index - 1]];
                });
            }],
            ["↓", "Descendre", function () {
                updateList(list.id, function (target) {
                    if (index < target.items.length - 1) [target.items[index], target.items[index + 1]] = [target.items[index + 1], target.items[index]];
                });
            }],
            ["Modifier", "Modifier la note et les tags", async function () {
                var note = await textPrompt("Note personnelle", item.note);
                if (note === null) return;
                var tags = await textPrompt("Tags séparés par des virgules", item.tags?.join(", "));
                if (tags === null) return;
                updateList(list.id, function (target) {
                    target.items[index].note = note;
                    target.items[index].tags = tags.split(",").map(function (tag) { return tag.trim(); }).filter(Boolean);
                });
            }],
            ["Retirer", "Retirer de la liste", function () {
                if (!window.confirm("Retirer « " + item.title + " » de cette liste ?")) return;
                updateList(list.id, function (target) { target.items.splice(index, 1); });
            }],
        ].forEach(function (definition) {
            var button = document.createElement("button");
            button.type = "button";
            button.textContent = definition[0];
            button.setAttribute("aria-label", definition[1] + " : " + item.title);
            button.addEventListener("click", definition[2]);
            actions.appendChild(button);
        });
        row.append(text, actions);
        return row;
    }

    function createListSection(list, query) {
        var section = document.createElement("section");
        var head = document.createElement("div");
        var title = document.createElement("h3");
        var actions = document.createElement("div");
        var items = document.createElement("ul");
        section.className = "personal-list";
        head.className = "personal-list__head";
        title.textContent = list.name;
        actions.className = "personal-actions";
        items.className = "personal-items";

        [["Renommer", async function () {
            var name = await textPrompt("Nom de la liste", list.name);
            if (name) updateList(list.id, function (target) { target.name = name; });
        }], ["Dupliquer", function () {
            var state = personal.getState();
            state.lists.push({
                id: personal.createId("list"),
                name: list.name + " — copie",
                profileId: list.profileId || null,
                items: list.items.map(normalizedItem),
            });
            personal.setState(state);
        }], ["Supprimer", function () {
            if (!window.confirm("Supprimer la liste « " + list.name + " » ?")) return;
            var state = personal.getState();
            state.lists = state.lists.filter(function (entry) { return entry.id !== list.id; });
            personal.setState(state);
        }]].forEach(function (definition) {
            var button = document.createElement("button");
            button.className = definition[0] === "Supprimer" ? "btn btn--danger" : "btn btn--secondary";
            button.type = "button";
            button.textContent = definition[0];
            button.addEventListener("click", definition[1]);
            actions.appendChild(button);
        });

        list.items.map(normalizedItem).filter(function (item) {
            return !query || [item.title, item.category, item.note, item.tags.join(" ")].join(" ").toLocaleLowerCase("fr").includes(query);
        }).forEach(function (item) {
            items.appendChild(createItemRow(item, list, list.items.findIndex(function (source) {
                return itemIdentity(source) === itemIdentity(item);
            })));
        });
        if (!items.children.length) {
            var empty = document.createElement("li");
            empty.textContent = query ? "Aucun résultat." : "Cette liste est vide.";
            items.appendChild(empty);
        }
        head.append(title, actions);
        section.append(head, items);
        return section;
    }

    function renderLists() {
        var state = personal.getState();
        var query = searchInput.value.trim().toLocaleLowerCase("fr");
        listsHost.replaceChildren();

        var favorites = {
            id: "global-favorites",
            name: "Favoris globaux",
            items: library.getFavorites().map(normalizedItem),
        };
        var displayedFavorites = query ? favorites.items.filter(function (item) {
            return [item.title, item.category, item.note, item.tags.join(" ")].join(" ").toLocaleLowerCase("fr").includes(query);
        }) : favorites.items;
        var favoriteSection = createListSection(Object.assign({}, favorites, { items: displayedFavorites }), "");
        favoriteSection.querySelector(".personal-actions").replaceChildren();
        favoriteSection.querySelectorAll(".personal-item").forEach(function (row, index) {
            var actions = row.querySelector(".personal-item__actions");
            actions.replaceChildren();
            var button = document.createElement("button");
            button.type = "button";
            button.textContent = "Ajouter à une liste";
            button.addEventListener("click", function () { addFavoriteToList(displayedFavorites[index]); });
            actions.appendChild(button);
        });
        listsHost.appendChild(favoriteSection);
        visibleLists(state).forEach(function (list) { listsHost.appendChild(createListSection(list, query)); });
    }

    function renderNotes() {
        var notes = personal.getState().notes;
        notesHost.replaceChildren();
        Object.keys(notes).sort(function (a, b) { return a.localeCompare(b, "fr"); }).forEach(function (id) {
            var article = document.createElement("article");
            var button = document.createElement("button");
            var text = document.createElement("p");
            article.className = "personal-note";
            button.type = "button";
            button.textContent = id;
            button.addEventListener("click", function () {
                document.getElementById("noteContentId").value = id;
                document.getElementById("noteText").value = notes[id];
                document.getElementById("noteText").focus();
            });
            text.textContent = notes[id];
            article.append(button, text);
            notesHost.appendChild(article);
        });
    }

    function render() {
        renderProfiles();
        renderLegacyRecovery();
        renderLists();
        renderNotes();
    }

    function backupPayload() {
        return window.DndBackup.create(document.getElementById("includeSheet").checked);
    }

    function downloadBackup() {
        var blob = new Blob([JSON.stringify(backupPayload(), null, 2)], { type: "application/json" });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "dnd-companion-backup.json";
        link.click();
        window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
        announce("Sauvegarde exportée.");
    }

    function validBackup(data) {
        return window.DndBackup.validate(data);
    }

    async function importBackup(file) {
        try {
            var data = JSON.parse(await file.text());
            var validation = validBackup(data);
            if (!validation.ok) throw new Error(validation.error);
            var scope = data.included?.characterData === false ? "sans fiches ni brouillon" : "avec les fiches, le brouillon et l’état de session";
            if (!window.confirm("Cette sauvegarde v" + data.version + " remplacera les données personnelles locales " + scope + ". Continuer ?")) return;
            var result = window.DndBackup.apply(data);
            if (!result.ok) throw new Error("La sauvegarde locale n’a pas pu être remplacée.");
            announce(result.persistent ? "Sauvegarde importée et validée." : "Sauvegarde importée pour cette session, mais non persistante.", !result.persistent);
            render();
        } catch (error) {
            announce(error.message || "Import impossible.", true);
        }
    }

    profileSelect.addEventListener("change", function () {
        profiles.setActive(profileSelect.value);
    });
    document.getElementById("newProfileBtn").addEventListener("click", function () {
        fillProfileForm({ id: "", name: "", class: "", level: 1, species: "", sheetUrl: "" });
        document.getElementById("profileName").focus();
    });
    profileForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var saved = profiles.save({
            id: document.getElementById("profileId").value,
            name: document.getElementById("profileName").value,
            class: document.getElementById("profileClass").value,
            level: document.getElementById("profileLevel").value,
            species: document.getElementById("profileSpecies").value,
            sheetUrl: document.getElementById("profileSheetUrl").value,
        });
        profiles.setActive(saved.id);
        announce(storage.isPersistent() ? "Profil enregistré." : "Profil conservé en mémoire pour cette session.", !storage.isPersistent());
    });
    document.getElementById("duplicateProfileBtn").addEventListener("click", function () {
        var source = profileById(document.getElementById("profileId").value);
        if (!source) return;
        var saved = profiles.duplicate(source.id);
        if (!saved) return;
        profiles.setActive(saved.id);
        announce(storage.isPersistent() ? "Profil et fiche dupliqués indépendamment." : "Profil dupliqué en mémoire pour cette session.", !storage.isPersistent());
    });
    document.getElementById("deleteProfileBtn").addEventListener("click", function () {
        var id = document.getElementById("profileId").value;
        var profile = profileById(id);
        if (!profile || !window.confirm("Supprimer le profil « " + profile.name + " », sa fiche et ses listes ? Cette action est irréversible sur cet appareil.")) return;
        profiles.remove(id);
        announce(storage.isPersistent() ? "Profil, fiche et listes supprimés." : "Profil, fiche et listes supprimés pour cette session.", !storage.isPersistent());
    });
    document.getElementById("newListBtn").addEventListener("click", async function () {
        var name = await textPrompt("Nom de la nouvelle liste", "Sorts préparés");
        if (!name) return;
        var state = personal.getState();
        state.lists.push({ id: personal.createId("list"), name: name, profileId: activeScopeId(), items: [] });
        personal.setState(state);
        announce("Liste créée.");
    });
    searchInput.addEventListener("input", renderLists);
    document.getElementById("pageNoteForm").addEventListener("submit", function (event) {
        event.preventDefault();
        personal.setNote(document.getElementById("noteContentId").value, document.getElementById("noteText").value);
        announce("Note personnelle enregistrée.");
    });
    document.getElementById("deleteNoteBtn").addEventListener("click", function () {
        var id = document.getElementById("noteContentId").value;
        if (!id || !window.confirm("Supprimer cette note personnelle ?")) return;
        personal.setNote(id, "");
        document.getElementById("noteText").value = "";
        announce("Note supprimée.");
    });
    document.getElementById("exportBackupBtn").addEventListener("click", downloadBackup);
    document.getElementById("importBackupInput").addEventListener("change", function (event) {
        if (event.target.files[0]) importBackup(event.target.files[0]);
        event.target.value = "";
    });
    window.addEventListener("dndpersonalchange", render);
    window.addEventListener("dndlibrarychange", renderLists);
    render();
})();
