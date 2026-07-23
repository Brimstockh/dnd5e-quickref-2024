(function () {
    "use strict";

    var doc = document;
    var script = doc.currentScript;
    var siteRoot = new URL("../", script ? script.src : window.location.href);
    var repositoryUrl = "https://github.com/Brimstockh/dnd5e-quickref-2024";
    var contentParameters = ["spell", "monster", "feat", "equipment", "class", "species", "background"];

    function sourcePath(currentUrl, rootUrl) {
        var page = new URL(currentUrl);
        var root = new URL(rootUrl || siteRoot);
        var rootPath = decodeURIComponent(root.pathname);
        var pagePath = decodeURIComponent(page.pathname);
        var relativePath = pagePath.indexOf(rootPath) === 0
            ? pagePath.slice(rootPath.length)
            : pagePath.replace(/^\/+/, "");
        if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";
        return relativePath;
    }

    function selectedContent(currentUrl, fallbackPath) {
        var url = new URL(currentUrl);
        for (var index = 0; index < contentParameters.length; index += 1) {
            var parameter = contentParameters[index];
            var value = url.searchParams.get(parameter);
            if (value) return parameter + ":" + value;
        }
        if (url.hash) {
            try {
                return "section:" + decodeURIComponent(url.hash.slice(1));
            } catch (error) {
                return "section:" + url.hash.slice(1);
            }
        }
        return "page:" + String(fallbackPath || "index.html").replace(/\.html$/, "");
    }

    function githubSourceUrl(path) {
        var encodedPath = String(path)
            .split("/")
            .map(encodeURIComponent)
            .join("/");
        return repositoryUrl + "/blob/main/" + encodedPath;
    }

    function buildIssueUrl(context) {
        var issueUrl = new URL(repositoryUrl + "/issues/new");
        var body = [
            "## Type de signalement",
            "",
            "- [ ] Faute ou typographie",
            "- [ ] Erreur de règle",
            "- [ ] Lien cassé",
            "- [ ] Traduction discutable",
            "- [ ] Incohérence de données",
            "",
            "## Description",
            "",
            "<!-- Décrivez le problème observé et, si possible, la correction proposée. -->",
            "",
            "## Contexte",
            "",
            "- Page : " + context.title,
            "- URL : " + context.url,
            "- Contenu : `" + context.contentId + "`",
            "- Catégorie : " + context.category,
            "- Fichier source : `" + context.sourcePath + "`",
            context.userAgent ? "- Navigateur : " + context.userAgent : null,
            "",
            "## Proposition de correction",
            "",
            "<!-- Facultatif : indiquez ici la formulation ou la donnée attendue. -->",
        ].filter(function (line) { return line !== null; }).join("\n");

        issueUrl.searchParams.set("title", "[Signalement] " + context.title);
        issueUrl.searchParams.set("body", body);
        return issueUrl.href;
    }

    function currentContext(path) {
        return {
            title: doc.body.dataset.libraryTitle || doc.title || path,
            url: window.location.href,
            contentId: selectedContent(window.location.href, path),
            category: doc.body.dataset.libraryCategory || doc.body.dataset.catalogKind || "Page",
            sourcePath: path,
            userAgent: navigator.userAgent || "",
        };
    }

    function createLink(label, className) {
        var link = doc.createElement("a");
        link.className = className;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = label;
        return link;
    }

    function init() {
        if (!doc.body || doc.querySelector(".page-support")) return;
        var host = doc.querySelector("main, .rules-wrap, .combat-wrap, .mastery-wrap, .wrap, .page");
        if (!host) return;

        var path = sourcePath(window.location.href, siteRoot);
        var aside = doc.createElement("aside");
        var prompt = doc.createElement("span");
        var links = doc.createElement("span");
        var sourceLink = createLink("Voir cette page sur GitHub", "page-support__link");
        var reportLink = createLink("Signaler une erreur", "page-support__link page-support__link--report");

        aside.className = "page-support";
        aside.setAttribute("aria-label", "Contribuer à cette page");
        prompt.className = "page-support__prompt";
        prompt.textContent = "Une anomalie dans ce contenu ?";
        links.className = "page-support__links";
        sourceLink.href = githubSourceUrl(path);
        reportLink.href = buildIssueUrl(currentContext(path));
        reportLink.dataset.reportIssue = "";
        reportLink.addEventListener("click", function () {
            reportLink.href = buildIssueUrl(currentContext(path));
        });

        links.append(sourceLink, reportLink);
        aside.append(prompt, links);
        host.appendChild(aside);
    }

    window.DndGithubReport = {
        buildIssueUrl: buildIssueUrl,
        githubSourceUrl: githubSourceUrl,
        selectedContent: selectedContent,
        sourcePath: sourcePath,
    };

    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
}());
