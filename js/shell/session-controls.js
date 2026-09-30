const SESSION_KEY = "dnd2024_session_mode";

export function createSessionController({ document, storage, view = globalThis, pageUrl, createIcon }) {
    function setMode(enabled, persist) {
        document.documentElement.dataset.session = enabled ? "true" : "false";
        if (persist) storage.set(SESSION_KEY, enabled ? "true" : "false");
        return enabled;
    }

    function applyInitial() {
        return setMode(storage.get(SESSION_KEY, "false") === "true", false);
    }

    function createPanel() {
        const panel = document.createElement("aside");
        const backdrop = document.createElement("button");
        const header = document.createElement("header");
        const heading = document.createElement("div");
        const eyebrow = document.createElement("span");
        const title = document.createElement("h2");
        const closeButton = document.createElement("button");
        const quickTitle = document.createElement("h3");
        const quickActions = document.createElement("nav");
        const library = document.createElement("div");
        const favoritesSection = document.createElement("section");
        const favoritesTitle = document.createElement("h3");
        const favoritesList = document.createElement("ul");
        const recentSection = document.createElement("section");
        const recentHead = document.createElement("div");
        const recentTitle = document.createElement("h3");
        const clearRecent = document.createElement("button");
        const recentList = document.createElement("ul");
        const exitButton = document.createElement("button");

        function iconButton(className, label, iconName) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "icon-button " + className;
            button.setAttribute("aria-label", label);
            button.appendChild(createIcon(iconName));
            return button;
        }

        const actionEntries = [
            ["quick-reference", "Référence rapide", "Actions et états", "quickref.html"],
            ["spells", "Sorts", "Catalogue complet", "spells.html"],
            ["monsters", "Monstres", "Bestiaire", "monstres.html"],
            ["combat", "Combat", "Règles essentielles", "combat-2024.html"],
        ];

        const openButton = iconButton("session-panel-toggle", "Ouvrir le panneau de session", "session");
        openButton.setAttribute("aria-controls", "sessionPanel");
        openButton.setAttribute("aria-expanded", "false");

        panel.id = "sessionPanel";
        panel.className = "session-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-labelledby", "sessionPanelTitle");
        panel.setAttribute("aria-hidden", "true");
        panel.setAttribute("inert", "");
        backdrop.type = "button";
        backdrop.className = "session-panel-backdrop";
        backdrop.setAttribute("aria-label", "Fermer le panneau de session");
        header.className = "session-panel__header";
        heading.className = "session-panel__heading";
        eyebrow.className = "session-panel__eyebrow";
        eyebrow.textContent = "Mode session actif";
        title.id = "sessionPanelTitle";
        title.textContent = "Table de jeu";
        heading.append(eyebrow, title);
        header.append(heading, closeButton);

        Object.assign(closeButton, { type: "button", className: "icon-button session-panel__close" });
        closeButton.setAttribute("aria-label", "Fermer le panneau de session");
        closeButton.appendChild(createIcon("close"));
        quickTitle.textContent = "Actions rapides";
        quickActions.className = "session-panel__quick-actions";
        quickActions.setAttribute("aria-labelledby", "sessionQuickActionsTitle");
        quickTitle.id = "sessionQuickActionsTitle";
        actionEntries.forEach(function (entry) {
            const link = document.createElement("a");
            const icon = document.createElement("span");
            const text = document.createElement("span");
            const strong = document.createElement("strong");
            const small = document.createElement("small");
            link.href = pageUrl(entry[3]);
            icon.setAttribute("aria-hidden", "true");
            icon.appendChild(createIcon(entry[0]));
            strong.textContent = entry[1];
            small.textContent = entry[2];
            text.append(strong, small);
            link.append(icon, text);
            quickActions.appendChild(link);
        });

        library.className = "session-panel__library";
        favoritesTitle.textContent = "Favoris";
        favoritesList.className = "session-panel__list";
        favoritesSection.append(favoritesTitle, favoritesList);
        recentHead.className = "session-panel__section-head";
        recentTitle.textContent = "Consultés récemment";
        clearRecent.type = "button";
        clearRecent.textContent = "Effacer";
        recentHead.append(recentTitle, clearRecent);
        recentList.className = "session-panel__list";
        recentSection.append(recentHead, recentList);
        library.append(favoritesSection, recentSection);
        exitButton.type = "button";
        exitButton.className = "session-panel__exit";
        exitButton.textContent = "Quitter le mode session";

        function appendEntries(container, entries, emptyText) {
            container.replaceChildren();
            if (!entries.length) {
                const empty = document.createElement("li");
                empty.className = "session-panel__empty";
                empty.textContent = emptyText;
                container.appendChild(empty);
                return;
            }
            entries.slice(0, 4).forEach(function (entry) {
                const item = document.createElement("li");
                const link = document.createElement("a");
                const text = document.createElement("span");
                const meta = document.createElement("small");
                link.href = pageUrl(entry.url);
                text.textContent = entry.title;
                meta.textContent = entry.category || "Page";
                link.append(text, meta);
                item.appendChild(link);
                container.appendChild(item);
            });
        }

        function render() {
            const api = view.DndLibrary;
            const favorites = api && typeof api.getFavorites === "function" ? api.getFavorites() : [];
            const recent = api && typeof api.getRecent === "function" ? api.getRecent() : [];
            appendEntries(favoritesList, favorites, "Ajoutez des pages avec l’étoile.");
            appendEntries(recentList, recent, "Vos dernières consultations apparaîtront ici.");
            clearRecent.disabled = !api || recent.length === 0;
        }

        clearRecent.addEventListener("click", function () {
            if (view.DndLibrary) view.DndLibrary.clearRecent();
            render();
        });
        view.addEventListener("dndlibrarychange", render);
        panel.append(header, quickTitle, quickActions, library, exitButton);
        render();
        return {
            openButton,
            panel,
            backdrop,
            closeButton,
            exitButton,
            render,
        };
    }

    return Object.freeze({ applyInitial, createPanel, setMode });
}
