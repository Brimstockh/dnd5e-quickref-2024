export function bindSearchTriggers({ document, search, searchButton, setSessionPanel }) {
    searchButton.addEventListener("click", function () {
        setSessionPanel(false);
        search.open();
    });
    document.querySelectorAll("[data-open-site-search]").forEach(function (button) {
        button.addEventListener("click", search.open);
    });

    return Object.freeze({ open: search.open });
}
