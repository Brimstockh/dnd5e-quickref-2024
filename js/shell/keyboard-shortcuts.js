function isEditable(element) {
    return /^(INPUT|TEXTAREA|SELECT)$/.test(element?.tagName || "");
}

function focusCycle(event, container, selector) {
    const focusable = container.querySelectorAll(selector);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && container.ownerDocument.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && container.ownerDocument.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

export function bindKeyboardShortcuts({ document, search, sessionPanel, drawer, setSessionPanel, setDrawer }) {
    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
            event.preventDefault();
            search.open();
        } else if (event.key === "/" && !isEditable(document.activeElement)) {
            event.preventDefault();
            const pageSearch = document.querySelector("[data-page-search]");
            if (pageSearch) {
                pageSearch.focus();
                if (typeof pageSearch.select === "function") pageSearch.select();
            } else {
                search.open();
            }
        } else if (event.key === "Escape" && sessionPanel.panel.classList.contains("is-open")) {
            setSessionPanel(false);
        } else if (event.key === "Tab" && sessionPanel.panel.classList.contains("is-open")) {
            focusCycle(event, sessionPanel.panel, "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])");
        } else if (event.key === "Escape" && drawer.classList.contains("is-open")) {
            setDrawer(false);
        } else if (event.key === "Tab" && drawer.classList.contains("is-open")) {
            focusCycle(event, drawer, "a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex='-1'])");
        }
    });
}

export { isEditable };
