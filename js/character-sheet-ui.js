(function () {
    "use strict";

    function init() {
        var tabs = Array.from(document.querySelectorAll("[data-page-target]"));
        var previous = document.getElementById("previousPageBtn");
        var next = document.getElementById("nextPageBtn");
        var indicator = document.getElementById("pageIndicator");
        var status = document.getElementById("status");
        var labels = ["Session", "Essentiel", "Aventure", "Sorts I", "Sorts II"];

        function activeIndex() {
            var index = tabs.findIndex(function (tab) { return tab.classList.contains("active"); });
            return index < 0 ? 0 : index;
        }

        function updateNavigation() {
            var index = activeIndex();
            indicator.textContent = `Page ${index + 1} / ${tabs.length} · ${labels[index] || ""}`;
            previous.disabled = index === 0;
            next.disabled = index === tabs.length - 1;
            tabs.forEach(function (tab, tabIndex) {
                var selected = tabIndex === index;
                tab.setAttribute("aria-selected", String(selected));
                tab.setAttribute("tabindex", selected ? "0" : "-1");
            });
        }

        function goTo(index) {
            if (!tabs[index]) return;
            tabs[index].click();
            updateNavigation();
        }

        function updateMirrors() {
            document.querySelectorAll("[data-mirror-field]").forEach(function (mirror) {
                var key = mirror.getAttribute("data-mirror-field");
                var field = document.querySelector(`[data-field="${key}"]`);
                mirror.textContent = field && String(field.value || "").trim() ? field.value : "—";
            });
        }

        function updateStatusState() {
            var text = String(status.textContent || "").toLocaleLowerCase("fr");
            var state = text.includes("sauvegard") || text.includes("chargée") ? "saved"
                : text.includes("attente") ? "pending"
                : text.includes("impossible") || text.includes("indisponible") ? "error"
                : "idle";
            status.dataset.state = state;
        }

        previous.addEventListener("click", function () { goTo(activeIndex() - 1); });
        next.addEventListener("click", function () { goTo(activeIndex() + 1); });
        tabs.forEach(function (tab) { tab.addEventListener("click", updateNavigation); });
        document.addEventListener("input", updateMirrors);
        document.addEventListener("change", updateMirrors);
        document.addEventListener("keydown", function (event) {
            if (!event.altKey) return;
            if (event.key === "PageUp") {
                event.preventDefault();
                goTo(activeIndex() - 1);
            } else if (event.key === "PageDown") {
                event.preventDefault();
                goTo(activeIndex() + 1);
            }
        });

        if (typeof MutationObserver === "function") {
            new MutationObserver(updateStatusState).observe(status, { childList: true, characterData: true, subtree: true });
        }
        updateNavigation();
        updateMirrors();
        updateStatusState();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
