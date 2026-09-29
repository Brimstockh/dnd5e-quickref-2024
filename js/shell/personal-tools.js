export function createPersonalTools({ document, view = globalThis, profileSelect, noteButton, noteDialog, noteTitle, noteLabel, noteField, noteHelp, noteClose, noteId }) {
    profileSelect.className = "active-profile-select";
    profileSelect.setAttribute("aria-label", "Profil de personnage actif");

    function renderProfileSelect() {
        const api = view.DndProfiles;
        const profiles = api && typeof api.getAll === "function" ? api.getAll() : [];
        const active = api && typeof api.getActive === "function" ? api.getActive() : null;
        const empty = document.createElement("option");
        empty.textContent = "Sans profil";
        empty.value = "";
        profileSelect.replaceChildren(empty);
        profiles.forEach(function (profile) {
            const option = document.createElement("option");
            option.textContent = profile.name;
            option.value = profile.id;
            profileSelect.appendChild(option);
        });
        profileSelect.value = active?.id || "";
        profileSelect.hidden = profiles.length === 0;
    }

    profileSelect.addEventListener("change", function () {
        if (view.DndProfiles) view.DndProfiles.setActive(profileSelect.value);
    });
    view.addEventListener("dndpersonalchange", renderProfileSelect);
    renderProfileSelect();

    noteDialog.className = "personal-note-dialog";
    noteTitle.textContent = "Note personnelle";
    noteLabel.textContent = "Votre note sur cette page";
    noteLabel.htmlFor = "personal-page-note";
    noteField.id = "personal-page-note";
    noteField.rows = 7;
    noteField.maxLength = 5000;
    noteHelp.textContent = "Enregistrée automatiquement sur cet appareil. Elle ne fait pas partie des règles officielles.";
    noteClose.className = "button";
    noteClose.type = "button";
    noteClose.textContent = "Fermer";
    noteDialog.append(noteTitle, noteHelp, noteLabel, noteField, noteClose);

    function updateNoteButton() {
        const hasNote = Boolean(view.DndPersonal?.getNote(noteId));
        noteButton.classList.toggle("is-active", hasNote);
        noteButton.setAttribute("aria-label", hasNote ? "Modifier la note personnelle" : "Ajouter une note personnelle");
    }

    noteButton.addEventListener("click", function () {
        noteField.value = view.DndPersonal?.getNote(noteId) || "";
        noteDialog.showModal();
        noteField.focus();
    });
    noteField.addEventListener("input", function () {
        if (view.DndPersonal) view.DndPersonal.setNote(noteId, noteField.value);
    });
    noteClose.addEventListener("click", function () { noteDialog.close(); });
    view.addEventListener("dndpersonalchange", updateNoteButton);
    updateNoteButton();

    return Object.freeze({ renderProfileSelect, updateNoteButton });
}
