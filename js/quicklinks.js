(function () {
    "use strict";

    var DEFAULT_LINKS = [
        { label: "Référence rapide", url: "quickref.html" },
        { label: "Guides de classes", url: "classes/index.html" },
        { label: "Règles 2024", url: "rules-2024.html" },
        { label: "Combat", url: "combat-2024.html" }
    ];

    function getScope(el) {
        return el.getAttribute("data-quicklinks-key") || window.location.pathname;
    }

    function getStorageKey(scope) {
        return "dnd_quicklinks_" + scope;
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function loadLinks(scope) {
        try {
            var raw = localStorage.getItem(getStorageKey(scope));
            if (!raw) return DEFAULT_LINKS.slice();
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return DEFAULT_LINKS.slice();
            return parsed.filter(function (x) {
                return x && typeof x.label === "string" && typeof x.url === "string";
            });
        } catch (err) {
            return DEFAULT_LINKS.slice();
        }
    }

    function saveLinks(scope, links) {
        localStorage.setItem(getStorageKey(scope), JSON.stringify(links));
    }

    function linksToText(links) {
        return links.map(function (l) { return l.label + " | " + l.url; }).join("\n");
    }

    function textToLinks(text) {
        return text
            .split("\n")
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line.length > 0 && line.indexOf("|") !== -1; })
            .map(function (line) {
                var parts = line.split("|");
                var label = parts.shift().trim();
                var url = parts.join("|").trim();
                return { label: label, url: url };
            })
            .filter(function (item) { return item.label && item.url; });
    }

    function render(el) {
        var scope = getScope(el);
        var list = el.querySelector("[data-quicklinks-list]");
        if (!list) return;

        var links = loadLinks(scope);
        if (!links.length) {
            list.innerHTML = "<p class=\"quicklinks-help\">Aucun lien pour le moment. Clique sur Modifier.</p>";
            return;
        }

        list.innerHTML = links.map(function (link) {
            return "<a class=\"quicklinks-pill\" href=\"" +
                escapeHtml(link.url) +
                "\" target=\"_blank\" rel=\"noopener\">" +
                escapeHtml(link.label) +
                "</a>";
        }).join("");
    }

    function openEditor(el) {
        if (document.getElementById("quicklinks-modal")) return;

        var scope = getScope(el);
        var links = loadLinks(scope);
        var modal = document.createElement("div");
        modal.id = "quicklinks-modal";
        modal.className = "quicklinks-modal";
        modal.innerHTML =
            "<div class=\"quicklinks-dialog\">" +
            "<h3>Modifier les liens rapides</h3>" +
            "<p>Format: <strong>Nom | URL</strong>, une ligne par lien.</p>" +
            "<textarea>" + escapeHtml(linksToText(links)) + "</textarea>" +
            "<div class=\"quicklinks-actions\">" +
            "<button type=\"button\" class=\"quicklinks-cancel\">Annuler</button>" +
            "<button type=\"button\" class=\"quicklinks-save\">Enregistrer</button>" +
            "</div>" +
            "</div>";

        document.body.appendChild(modal);

        modal.querySelector(".quicklinks-cancel").addEventListener("click", function () {
            modal.remove();
        });

        modal.querySelector(".quicklinks-save").addEventListener("click", function () {
            var value = modal.querySelector("textarea").value;
            var next = textToLinks(value);
            if (!next.length) {
                alert("Ajoute au moins un lien valide.");
                return;
            }
            saveLinks(scope, next);
            modal.remove();
            render(el);
        });
    }

    function initQuickLinks() {
        var blocks = document.querySelectorAll("[data-quicklinks]");
        blocks.forEach(function (el) {
            var editBtn = el.querySelector("[data-quicklinks-edit]");
            if (editBtn) {
                editBtn.addEventListener("click", function () {
                    openEditor(el);
                });
            }
            render(el);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initQuickLinks);
    } else {
        initQuickLinks();
    }
})();
