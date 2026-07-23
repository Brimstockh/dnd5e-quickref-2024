(function () {
    "use strict";

    var doc = document;
    var script = doc.currentScript;
    var siteRoot = new URL("../", script ? script.src : window.location.href);
    var statusLabels = {
        editorial: "Synthèse éditoriale",
        structured: "Catalogue structuré",
        reviewed: "Contenu relu",
    };

    function currentPath() {
        var rootPath = decodeURIComponent(siteRoot.pathname);
        var pagePath = decodeURIComponent(window.location.pathname);
        var relativePath = pagePath.indexOf(rootPath) === 0
            ? pagePath.slice(rootPath.length)
            : pagePath.replace(/^\/+/, "");
        if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";
        return relativePath;
    }

    function findEntry(registry, path) {
        var exact = registry.entries.find(function (entry) {
            return entry.path === path;
        });
        if (exact) return exact;
        return registry.entries.find(function (entry) {
            return entry.prefix && path.indexOf(entry.prefix) === 0;
        });
    }

    function addRow(list, label, value, options) {
        if (!value) return;
        var term = doc.createElement("dt");
        var description = doc.createElement("dd");
        term.textContent = label;
        if (options && options.dateTime) {
            var time = doc.createElement("time");
            time.dateTime = options.dateTime;
            time.textContent = value;
            description.appendChild(time);
        } else {
            description.textContent = value;
        }
        list.append(term, description);
    }

    function createBadge(text, modifier) {
        var badge = doc.createElement("span");
        badge.className = "source-meta__badge" + (modifier ? " source-meta__badge--" + modifier : "");
        badge.textContent = text;
        return badge;
    }

    function render(metadata) {
        var host = doc.querySelector("main, .rules-wrap, .combat-wrap, .mastery-wrap, .wrap, .page");
        if (!host || doc.querySelector(".source-meta")) return false;

        var aside = doc.createElement("aside");
        var details = doc.createElement("details");
        var summary = doc.createElement("summary");
        var title = doc.createElement("span");
        var badges = doc.createElement("span");
        var list = doc.createElement("dl");

        aside.className = "source-meta";
        aside.id = "source-et-version";
        aside.setAttribute("aria-label", "Source et version du contenu");
        title.className = "source-meta__title";
        title.textContent = "Source et version";
        badges.className = "source-meta__badges";
        badges.append(
            createBadge(metadata.edition),
            createBadge(statusLabels[metadata.status] || metadata.status, "status"),
        );
        summary.append(title, badges);

        list.className = "source-meta__details";
        addRow(list, "Édition", metadata.edition);
        addRow(list, "Source", metadata.document);
        addRow(list, "Type", metadata.type);
        addRow(list, "Statut", statusLabels[metadata.status] || metadata.status);
        addRow(list, "Dernière révision", metadata.updated, { dateTime: metadata.updated });
        addRow(list, "Langue", metadata.language === "fr" ? "Français" : metadata.language);
        addRow(list, "Note de traduction", metadata.translationNote);

        details.append(summary, list);
        aside.appendChild(details);
        var support = host.querySelector(":scope > .page-support");
        if (support) host.insertBefore(aside, support);
        else host.appendChild(aside);
        return true;
    }

    doc.documentElement.dataset.sourceMetaStatus = "loading";
    fetch(new URL("data/source-metadata.json", siteRoot))
        .then(function (response) {
            if (!response.ok) throw new Error("Métadonnées indisponibles");
            return response.json();
        })
        .then(function (registry) {
            var entry = findEntry(registry, currentPath());
            if (!entry) {
                doc.documentElement.dataset.sourceMetaStatus = "none";
                return;
            }
            var rendered = render(Object.assign({}, registry.defaults, entry));
            doc.documentElement.dataset.sourceMetaStatus = rendered ? "ready" : "failed";
        })
        .catch(function () {
            doc.documentElement.dataset.sourceMetaStatus = "failed";
        });
}());
