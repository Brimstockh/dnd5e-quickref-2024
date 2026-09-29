function announce(status, view, message, isError) {
    if (!status) return;
    view.clearTimeout(status.timer || 0);
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
    status.classList.add("is-visible");
    status.timer = view.setTimeout(() => {
        status.classList.remove("is-visible");
    }, 2600);
}

function fallbackCopy(document, text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.className = "share-copy-field";
    document.body.appendChild(field);
    field.select();
    const copied = typeof document.execCommand === "function" && document.execCommand("copy");
    field.remove();
    if (!copied) throw new Error("Copy unavailable");
}

export function createSharingController({ document, view = globalThis, status }) {
    async function copyLink(url, successMessage) {
        try {
            if (view.navigator?.clipboard && typeof view.navigator.clipboard.writeText === "function") {
                await view.navigator.clipboard.writeText(url);
            } else {
                fallbackCopy(document, url);
            }
            announce(status, view, successMessage || "Lien copié dans le presse-papiers.", false);
            return true;
        } catch (error) {
            try {
                fallbackCopy(document, url);
                announce(status, view, successMessage || "Lien copié dans le presse-papiers.", false);
                return true;
            } catch (fallbackError) {
                announce(status, view, "Impossible de copier le lien.", true);
                return false;
            }
        }
    }

    function currentShareTitle() {
        let activeContext = document.querySelector("#quickref-detail-layer.is-open [data-context-share-root]")
            || Array.from(document.querySelectorAll("details[open][data-context-share-root]")).pop();
        if (!activeContext) {
            const parameters = new URLSearchParams(view.location.search);
            activeContext = Array.from(document.querySelectorAll("[data-context-share-root]")).find((element) => {
                const parameter = element.dataset.contextShareParameter;
                return parameter && parameters.get(parameter) === element.dataset.contextShareValue;
            });
        }
        const contextTitle = activeContext && (
            activeContext.dataset.contextShareTitle
            || activeContext.querySelector(".catalog-card__title, .feat-title, .monster-title, summary h3, h2, h3")?.textContent?.trim()
        );
        const libraryTitle = document.body.dataset.libraryTitle || document.title;
        return contextTitle ? contextTitle + " — " + libraryTitle : libraryTitle;
    }

    async function shareLink(url, title) {
        if (typeof view.navigator?.share === "function") {
            try {
                await view.navigator.share({ title: title || currentShareTitle(), url });
                announce(status, view, "Lien partagé.", false);
                return true;
            } catch (error) {
                if (error && error.name === "AbortError") return false;
            }
        }
        return copyLink(url);
    }

    function shareCurrentPage() {
        return shareLink(view.location.href, currentShareTitle());
    }

    return Object.freeze({
        announce: (message, isError) => announce(status, view, message, isError),
        copyLink,
        currentShareTitle,
        shareCurrentPage,
        shareLink,
    });
}
