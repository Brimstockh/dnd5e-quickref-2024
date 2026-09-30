export function createMobileNavigationController({ document, drawer, backdrop, menuButton, closeButton, setSessionPanel }) {
    function setOpen(open) {
        if (open) setSessionPanel(false);
        drawer.classList.toggle("is-open", open);
        backdrop.classList.toggle("is-open", open);
        drawer.setAttribute("aria-hidden", String(!open));
        if (open) drawer.removeAttribute("inert");
        else drawer.setAttribute("inert", "");
        menuButton.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("has-open-drawer", open);
        if (open) closeButton.focus();
        else menuButton.focus();
    }

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.addEventListener("click", () => setOpen(true));
    closeButton.addEventListener("click", () => setOpen(false));
    backdrop.addEventListener("click", () => setOpen(false));
    drawer.addEventListener("click", (event) => {
        if (event.target.closest("a, .mobile-share-link")) setOpen(false);
    });

    return Object.freeze({ setOpen });
}
