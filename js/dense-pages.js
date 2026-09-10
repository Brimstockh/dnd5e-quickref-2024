function textOf(element) {
    return element?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function nextElement(element) {
    return element?.nextElementSibling || null;
}

function isHeading(element) {
    return element && /^H[1-4]$/.test(element.tagName);
}

function createSection(document) {
    const section = document.createElement("section");
    const header = document.createElement("header");
    const body = document.createElement("div");

    section.className = "content-section";
    section.dataset.contentSection = "";
    header.className = "content-section__header";
    body.className = "content-section__body";
    section.append(header, body);
    return { section, header, body };
}

function wrapMainSections(document, root, primaryTag = "H1") {
    const headings = Array.from(root.children).filter((element) => element.tagName === primaryTag);
    headings.forEach((heading) => {
        if (heading.parentElement?.classList.contains("content-section__header")) return;
        const { section, header, body } = createSection(document);
        root.insertBefore(section, heading);
        header.append(heading);
        let node = section.nextElementSibling;
        while (node && node.tagName !== primaryTag) {
            const next = node.nextElementSibling;
            body.append(node);
            node = next;
        }
    });
}

function addLevelBadge(document, heading, header) {
    const match = textOf(heading).match(/^Niveau\s+(\d+)/i);
    if (!match) return;
    const badge = document.createElement("span");
    badge.className = "level-badge";
    badge.textContent = `Nv. ${match[1]}`;
    badge.setAttribute("aria-label", `Niveau ${match[1]}`);
    header.prepend(badge);
}

function wrapFeatureCards(document, root) {
    const headings = Array.from(root.querySelectorAll("h4"));
    headings.forEach((heading) => {
        if (!heading.parentElement || heading.closest(".feature-card")) return;
        const parent = heading.parentElement;
        const card = document.createElement("section");
        const header = document.createElement("header");
        const body = document.createElement("div");

        card.className = "feature-card";
        card.dataset.featureCard = "";
        header.className = "feature-card__header";
        body.className = "feature-card__body";
        parent.insertBefore(card, heading);
        addLevelBadge(document, heading, header);
        header.append(heading);
        card.append(header, body);

        let node = card.nextElementSibling;
        while (node && !isHeading(node)) {
            const next = node.nextElementSibling;
            body.append(node);
            node = next;
        }
    });
}

function groupFeatureLists(document, root) {
    Array.from(root.querySelectorAll(".feature-card")).forEach((card) => {
        if (card.classList.contains("option-card") || card.parentElement?.classList.contains("feature-list")) return;
        const parent = card.parentElement;
        if (!parent) return;
        const previous = card.previousElementSibling;
        if (previous?.classList.contains("feature-list")) {
            previous.append(card);
            return;
        }
        const list = document.createElement("div");
        list.className = "feature-list";
        parent.insertBefore(list, card);
        list.append(card);
        let next = list.nextElementSibling;
        while (next?.classList.contains("feature-card") && !next.classList.contains("option-card")) {
            const nextCard = next;
            next = next.nextElementSibling;
            list.append(nextCard);
        }
    });
}

function getSubclassesHeading(root) {
    return root.querySelector("h2#sous-classes") || Array.from(root.querySelectorAll("h2")).find((heading) => /sous-classes/i.test(textOf(heading)));
}

function wrapSubclasses(document, root) {
    const heading = getSubclassesHeading(root);
    if (!heading || heading.dataset.subclassesEnhanced === "true") return;
    heading.dataset.subclassesEnhanced = "true";
    let node = nextElement(heading);
    while (node && node.tagName !== "H1" && node.tagName !== "H2") {
        if (node.tagName !== "H3") {
            node = nextElement(node);
            continue;
        }
        const start = node;
        const anchor = start.querySelector("[id]") || start;
        const subclassId = anchor.id || "";
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        const title = document.createElement("span");
        const hint = document.createElement("span");
        const content = document.createElement("div");

        details.className = "subclass-details";
        details.dataset.subclassDetails = "";
        if (subclassId) details.dataset.subclassId = subclassId;
        title.className = "subclass-details__title";
        hint.className = "subclass-details__hint";
        content.className = "subclass-details__body";
        title.textContent = textOf(start).replace(/\s*#\s*$/, "");
        hint.textContent = "Sous-classe";
        summary.append(title, hint);
        details.append(summary, content);
        root.insertBefore(details, start);

        node = start;
        while (node && node !== heading && node.tagName !== "H1" && node.tagName !== "H2" && (node === start || node.tagName !== "H3")) {
            const next = nextElement(node);
            content.append(node);
            node = next;
        }
    }
}

function classifyCallouts(root) {
    root.querySelectorAll(".encadre").forEach((callout) => {
        if (callout.classList.contains("callout")) return;
        const content = textOf(callout);
        callout.classList.add("callout");
        if (/important|arrond/i.test(content)) callout.classList.add("callout--important");
        else if (/quadrillage|assommer|combat monté|subaquatique/i.test(content)) callout.classList.add("callout--variant");
        else if (/glossaire|voir|reportez-vous|repos/i.test(content)) callout.classList.add("callout--related");
        else callout.classList.add("callout--summary");
    });
}

function wrapGridVariant(document, root) {
    const candidates = Array.from(root.querySelectorAll(".callout")).filter((element) => /jeu sur quadrillage/i.test(textOf(element)));
    candidates.forEach((callout) => {
        if (callout.closest(".rule-details")) return;
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        details.className = "rule-details";
        summary.textContent = "Règles de combat sur quadrillage";
        const parent = callout.parentElement;
        parent?.insertBefore(details, callout);
        details.append(summary, callout);
    });
}

function addDeathFlow(document, root) {
    const target = root.querySelector("#opv");
    if (!target || root.querySelector(".death-flow")) return;
    const flow = document.createElement("ol");
    flow.className = "death-flow";
    flow.setAttribute("aria-label", "Parcours de résolution lorsque la créature tombe à 0 point de vie");
    ["0 PV", "Mort immédiate ?", "Inconscient", "Stabilisé ou mort"].forEach((label) => {
        const item = document.createElement("li");
        item.textContent = label;
        flow.append(item);
    });
    const heading = target.closest("h1, h2, h3, h4") || target;
    const section = heading.closest(".content-section");
    const sectionBody = section?.querySelector(":scope > .content-section__body");
    if (sectionBody) sectionBody.prepend(flow);
    else heading.parentElement?.insertBefore(flow, heading.nextSibling);
}

function decorateClass(document, hero) {
    const content = hero?.querySelector(".content");
    if (!hero?.matches("section.card") || !content) return null;
    hero.classList.add("class-hero");
    content.id ||= "class-overview";

    const imageParagraph = content.querySelector("p:has(.classe-illu)");
    if (imageParagraph) {
        imageParagraph.classList.add("class-hero__media");
        let lead = imageParagraph.nextElementSibling;
        while (lead && lead.tagName === "P" && !lead.querySelector(".classe-illu")) {
            lead.classList.add("class-hero__lead");
            lead = lead.nextElementSibling;
        }
    }

    const stats = Array.from(content.querySelectorAll("table")).find((table) => /traits de base/i.test(textOf(table)));
    if (stats) {
        stats.classList.add("class-stats");
        stats.id ||= "class-traits";
    }
    const progressionHeading = Array.from(content.querySelectorAll("h3")).find((heading) => /capacités de classe/i.test(textOf(heading)));
    if (progressionHeading) {
        progressionHeading.dataset.pageSection = "progression";
        const progression = progressionHeading.nextElementSibling;
        if (progression?.tagName === "TABLE") {
            progression.classList.add("progression-table");
            progression.id ||= "progression";
        }
    }

    wrapSubclasses(document, content);
    wrapFeatureCards(document, content);
    decorateOptionCatalogs(document, content);
    groupFeatureLists(document, content);
    return content;
}

function decorateOptionCatalogs(document, root) {
    const headings = Array.from(root.querySelectorAll("h3, h4")).filter((heading) => /options de (métamagie|manifestations occultes|manœuvre)/i.test(textOf(heading)));
    headings.forEach((heading) => {
        const parent = heading.parentElement;
        if (!parent) return;
        const cards = [];
        let node = nextElement(heading);
        while (node && !["H1", "H2", "H3"].includes(node.tagName)) {
            if (node.classList.contains("feature-card")) cards.push(node);
            node = nextElement(node);
        }
        if (cards.length >= 2) {
            const grid = document.createElement("div");
            grid.className = "option-grid";
            grid.dataset.optionGrid = "";
            parent.insertBefore(grid, cards[0]);
            cards.forEach((card) => {
                card.classList.add("option-card");
                const meta = Array.from(card.querySelectorAll("p")).find((paragraph) => /^(prérequis|coût)\b/i.test(textOf(paragraph)));
                meta?.classList.add("option-card__meta");
                grid.append(card);
            });
        }
    });

    root.querySelectorAll(".feature-card").forEach((card) => {
        const heading = card.querySelector(".feature-card__header h4");
        if (!heading || !/options de manœuvre/i.test(textOf(heading))) return;
        const body = card.querySelector(".feature-card__body");
        if (!body || body.querySelector(".option-grid")) return;
        const options = Array.from(body.children).filter((element) => element.tagName === "P" && element.querySelector("strong"));
        if (options.length < 2) return;
        const grid = document.createElement("div");
        grid.className = "option-grid";
        grid.dataset.optionGrid = "";
        options.forEach((paragraph) => {
            const option = document.createElement("article");
            const title = document.createElement("h3");
            const optionBody = document.createElement("div");
            const source = paragraph.cloneNode(true);
            const strong = source.querySelector("strong");
            title.className = "option-card__title";
            title.textContent = strong?.textContent || "Option";
            strong?.remove();
            option.className = "option-card";
            optionBody.className = "option-card__body";
            optionBody.append(source);
            option.append(title, optionBody);
            grid.append(option);
            paragraph.remove();
        });
        body.append(grid);
    });
}

function labelForTarget(target) {
    const source = target.matches(".feature-card, .subclass-details, .content-catalog-entry")
        ? target.querySelector("h3, h4, .subclass-details__title")
        : target;
    return textOf(source || target).replace(/\s*#\s*$/, "");
}

function findHeading(root, pattern) {
    return Array.from(root.querySelectorAll("h1, h2, h3, h4")).find((heading) => pattern.test(textOf(heading)));
}

function getTocTargets(document, variant, root) {
    if (variant === "combat") {
        return [
            ["Préparer une rencontre", "facteur-puissance"],
            ["Déroulement du combat", "ordre"],
            ["Déplacement et position", "deplacement"],
            ["Attaques et sorts", "attaque"],
            ["Dégâts et survie", "pv"],
            ["Situations particulières", "monte"],
        ];
    }
    if (variant === "rules") {
        const first = root.parentElement?.querySelector(":scope > h1") || findHeading(root, /six caractéristiques/i);
        if (first && !first.id) first.id = "caracteristiques";
        return [["Six caractéristiques", first?.id], ["Jets de d20", "d20"], ["Avantage et Désavantage", "avantage"]];
    }
    if (variant === "mastery") {
        const first = root.parentElement?.querySelector(":scope > h1") || findHeading(root, /^Maîtrise$/i);
        if (first && !first.id) first.id = "maitrise";
        return [["Maîtrise", first?.id], ["Actions", "actions"], ["Actions bonus", "bonus"], ["Réactions", "reactions"]];
    }
    if (variant === "backgrounds") {
        const entries = root.querySelectorAll(".content-catalog-entry[id], h3[id]");
        return Array.from(entries).map((entry) => [labelForTarget(entry), entry.id]);
    }
    const targets = [["Vue d’ensemble", root.id]];
    const traits = root.querySelector("#class-traits");
    const progression = root.querySelector("#progression");
    const abilities = findHeading(root, /capacités de classe/i);
    if (traits?.id) targets.push(["Traits de base", traits.id]);
    if (progression?.id) targets.push(["Progression", progression.id]);
    if (abilities?.id) targets.push(["Capacités", abilities.id]);
    const options = Array.from(root.querySelectorAll("h3[id], h4[id]")).find((heading) => /options de (métamagie|manifestations occultes|manœuvre)/i.test(textOf(heading)));
    if (options?.id) targets.push(["Options", options.id]);
    const subclasses = getSubclassesHeading(root);
    if (subclasses?.id) targets.push(["Sous-classes", subclasses.id]);
    root.querySelectorAll(".subclass-details[data-subclass-id]").forEach((details) => {
        const target = document.getElementById(details.dataset.subclassId);
        if (target && root.contains(target)) targets.push([labelForTarget(details), target.id, "sub"]);
    });
    return targets;
}

function renderToc(document, variant, root, host) {
    const title = document.createElement("span");
    const list = document.createElement("ul");
    const targets = getTocTargets(document, variant, root);
    title.className = "page-toc__title";
    title.textContent = "Sur cette page";
    list.className = "page-toc__list";
    list.setAttribute("role", "list");
    targets.forEach(([label, id, level]) => {
        if (!id || !document.getElementById(id)) return;
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.className = `page-toc__link${level === "sub" ? " page-toc__link--sub" : ""}`;
        link.href = `#${encodeURIComponent(id)}`;
        link.textContent = label;
        item.append(link);
        list.append(item);
    });
    host.replaceChildren(title, list);
}

function ensureLayout(document, variant) {
    const main = document.querySelector("main") || document.body;
    const content = main.querySelector(variant === "combat" ? "article.combat-content" : variant === "rules" ? "article.rules-content" : variant === "mastery" ? "article.mastery-content" : variant === "backgrounds" ? "section.card" : "section.card");
    if (!content) return null;
    let layout = content.parentElement?.classList.contains("dense-layout") ? content.parentElement : null;
    if (!layout) {
        layout = document.createElement("div");
        layout.className = "dense-layout";
        content.parentElement.insertBefore(layout, content);
        layout.append(content);
    }
    let toc = layout.querySelector(".page-toc");
    if (!toc) {
        toc = document.createElement("nav");
        toc.className = "page-toc";
        toc.setAttribute("aria-label", "Navigation locale");
        layout.prepend(toc);
    }
    return { content, layout, toc };
}

function revealHashTarget(document, window) {
    if (!window.location.hash) return;
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (error) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    document.querySelectorAll("details").forEach((details) => {
        if (details.contains(target)) details.open = true;
    });
    target.setAttribute("tabindex", "-1");
    target.scrollIntoView?.({ block: "start" });
    target.focus?.({ preventScroll: true });
}

function markActiveTocLink(document, window) {
    const links = Array.from(document.querySelectorAll(".page-toc__link"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    const observed = links.map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);
    const observer = new window.IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const link = links.find((candidate) => decodeURIComponent(candidate.hash.slice(1)) === entry.target.id);
            if (link && entry.isIntersecting) {
                links.forEach((candidate) => candidate.removeAttribute("aria-current"));
                link.setAttribute("aria-current", "true");
            }
        });
    }, { rootMargin: "-18% 0px -72% 0px", threshold: 0 });
    observed.forEach((target) => observer.observe(target));
}

export function initDensePage(document, window) {
    const variant = document.body?.dataset.denseVariant;
    if (!variant) return;
    const layout = ensureLayout(document, variant);
    if (!layout) return;
    const root = variant === "class" ? decorateClass(document, layout.content) : layout.content.querySelector(".content") || layout.content;
    if (!root) return;

    if (variant !== "class" && variant !== "backgrounds") {
        wrapMainSections(document, root, variant === "combat" ? "H3" : "H1");
    }
    if (variant !== "backgrounds") {
        wrapFeatureCards(document, root);
        groupFeatureLists(document, root);
    }
    classifyCallouts(root);
    if (variant === "combat") {
        wrapGridVariant(document, root);
        addDeathFlow(document, root);
    }
    if (variant === "backgrounds" && !document.body.dataset.catalogKind) {
        root.classList.add("history-grid");
        Array.from(root.querySelectorAll(":scope > h3")).forEach((heading) => {
            const card = document.createElement("article");
            card.className = "history-card";
            root.insertBefore(card, heading);
            let node = heading;
            while (node && (node.tagName !== "H3" || node === heading)) {
                const next = nextElement(node);
                card.append(node);
                node = next;
            }
        });
    }
    renderToc(document, variant, root, layout.toc);
    window.requestAnimationFrame(() => revealHashTarget(document, window));
    window.addEventListener("hashchange", () => revealHashTarget(document, window));
    markActiveTocLink(document, window);
}
