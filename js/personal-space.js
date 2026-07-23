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
        renderLists();
        renderNotes();
    }

    function backupPayload() {
        return {
            format: "dnd-companion-backup",
            version: 2,
            exportedAt: new Date().toISOString(),
            favorites: library.getFavorites(),
            recent: library.getRecent(),
            personal: personal.getState(),
            settings: {
                theme: storage.get("dnd2024_theme", null),
                sessionMode: storage.get("dnd2024_session_mode", null),
            },
            characterSheet: document.getElementById("includeSheet").checked
                ? storage.getJson("dnd_character_sheet_standalone_v2", null)
                : undefined,
            characterSession: document.getElementById("includeSheet").checked
                ? storage.getJson("dnd_character_session_v1", null)
                : undefined,
        };
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
        return data && data.format === "dnd-companion-backup" && [1, 2].includes(data.version)
            && data.personal && [1, 2].includes(data.personal.schemaVersion)
            && Array.isArray(data.favorites);
    }

    async function importBackup(file) {
        try {
            var data = JSON.parse(await file.text());
            if (!validBackup(data)) throw new Error("Format de sauvegarde non reconnu.");
            if (!window.confirm("Remplacer les données personnelles locales par cette sauvegarde ?")) return;
            storage.setJson("dnd2024_favorites_v1", data.favorites);
            storage.setJson("dnd2024_recent_v1", Array.isArray(data.recent) ? data.recent : []);
            personal.setState(data.personal);
            if (data.settings?.theme !== null) storage.set("dnd2024_theme", data.settings.theme);
            if (data.settings?.sessionMode !== null) storage.set("dnd2024_session_mode", data.settings.sessionMode);
            if (data.characterSheet) storage.setJson("dnd_character_sheet_standalone_v2", data.characterSheet);
            if (data.characterSession) storage.setJson("dnd_character_session_v1", data.characterSession);
            announce("Sauvegarde importée et validée.");
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
        announce("Profil enregistré.");
    });
    document.getElementById("duplicateProfileBtn").addEventListener("click", function () {
        var source = profileById(document.getElementById("profileId").value);
        if (!source) return;
        var duplicate = Object.assign({}, source, { id: "", name: source.name + " — copie" });
        var saved = profiles.save(duplicate);
        profiles.setActive(saved.id);
        announce("Profil dupliqué.");
    });
    document.getElementById("deleteProfileBtn").addEventListener("click", function () {
        var id = document.getElementById("profileId").value;
        var profile = profileById(id);
        if (!profile || !window.confirm("Supprimer le profil « " + profile.name + " » et ses listes ?")) return;
        profiles.remove(id);
        announce("Profil supprimé.");
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
