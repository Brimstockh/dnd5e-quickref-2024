(function () {
    "use strict";

    var records = [];
    var recordByKey = Object.create(null);
    var intentions = [];
    var intentionsById = Object.create(null);
    var lastTrigger = null;
    var lastRecord = null;
    var lastIntentTrigger = null;
    var activeIntentId = "";
    var currentView = "";
    var selectionParameters = ["movement", "action", "bonus", "reaction", "condition", "environment", "general"];
    var intentCategories = [
        { id: "combat-defense", label: "Combat et défense", icon: "⚔" },
        { id: "movement", label: "Déplacement", icon: "↗" },
        { id: "magic", label: "Magie", icon: "✦" },
        { id: "allies-states", label: "Alliés et états", icon: "✚" },
        { id: "exploration", label: "Exploration et interactions", icon: "⌕" },
    ];

    function normalize(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function element(id) {
        return document.getElementById(id);
    }

    function getSectionColor(parent) {
        var section = parent && parent.closest ? parent.closest(".section-container") : parent && parent.parentNode && parent.parentNode.parentNode;
        var style = window.getComputedStyle(section || parent);
        return style.getPropertyValue && style.getPropertyValue("--category-color").trim()
            ? style.getPropertyValue("--category-color").trim()
            : style.backgroundColor || "#7f6635";
    }

    function typeLabel(parameter) {
        return {
            movement: "Déplacement",
            action: "Action",
            bonus: "Action bonus",
            reaction: "Réaction",
            condition: "État",
            environment: "Environnement",
            general: "Règle générale",
        }[parameter] || "Règle";
    }

    function catalogItems(parameter) {
        var catalogs = {
            movement: typeof data_movement !== "undefined" ? data_movement : [],
            action: typeof data_action !== "undefined" ? data_action : [],
            bonus: typeof data_bonusaction !== "undefined" ? data_bonusaction : [],
            reaction: typeof data_reaction !== "undefined" ? data_reaction : [],
            condition: typeof data_condition !== "undefined" ? data_condition : [],
            general: typeof data_general !== "undefined" ? data_general : [],
            environment: [
                ...(typeof data_environment_obscurance !== "undefined" ? data_environment_obscurance : []),
                ...(typeof data_environment_light !== "undefined" ? data_environment_light : []),
                ...(typeof data_environment_vision !== "undefined" ? data_environment_vision : []),
                ...(typeof data_environment_cover !== "undefined" ? data_environment_cover : []),
            ],
        };
        return catalogs[parameter] || [];
    }

    function resolveRule(parameter, slug) {
        var items = catalogItems(parameter);
        var normalizedSlug = String(slug || "");
        var data = items.find(function (item) {
            return window.DndCatalogUI.slugify(item.title) === normalizedSlug;
        });
        if (!data) return null;
        return { data: data, parameter: parameter, slug: normalizedSlug, type: typeLabel(parameter) };
    }

    function addQuickrefItem(parent, data, type, parameter) {
        if (!parent || !data) return;
        var icon = data.icon || "perspective-dice-six-faces-one";
        var subtitle = data.subtitle || data.description || "";
        var title = data.title || "[sans titre]";
        var item = document.createElement("button");
        var iconEl = document.createElement("span");
        var textContainer = document.createElement("span");
        var titleEl = document.createElement("span");
        var subtitleEl = document.createElement("span");
        var typeEl = document.createElement("span");
        var section = parent.closest ? parent.closest(".section-container") : parent.parentNode && parent.parentNode.parentNode;
        var slug = window.DndCatalogUI.slugify(title);

        item.type = "button";
        item.className = "item itemsize";
        item.id = "quickref-" + parameter + "-" + slug;
        item.setAttribute("data-content-id", slug);
        item.setAttribute("aria-haspopup", "dialog");
        item.setAttribute("aria-expanded", "false");
        iconEl.className = "item-icon iconsize icon-" + icon;
        iconEl.setAttribute("aria-hidden", "true");
        textContainer.className = "item-text-container text";
        titleEl.className = "item-title";
        titleEl.textContent = title;
        subtitleEl.className = "item-desc";
        subtitleEl.textContent = subtitle;
        typeEl.className = "item-meta";
        typeEl.textContent = type;
        textContainer.appendChild(titleEl);
        textContainer.appendChild(subtitleEl);
        textContainer.appendChild(typeEl);
        item.appendChild(iconEl);
        item.appendChild(textContainer);
        var record = {
            data: data,
            element: item,
            parameter: parameter,
            section: section,
            slug: slug,
            type: type,
            color: getSectionColor(parent),
            searchText: normalize([
                title, type, data.subtitle, data.description, data.reference,
                ...(Array.isArray(data.bullets) ? data.bullets : []),
            ].join(" ").replace(/<[^>]*>/g, " ")),
        };
        recordByKey[parameter + ":" + slug] = record;
        item.addEventListener("click", function () {
            showRuleDetail(data, record.color, type, item, record, true, activeIntentId || getIntentFromUrl());
        });
        parent.appendChild(item);
        records.push(record);
    }

    function renderBullets(bullets) {
        var bulletsEl = element("quickref-detail-bullets");
        if (!bulletsEl) return;
        bulletsEl.replaceChildren();
        var values = Array.isArray(bullets) ? bullets : [];
        if (!values.length) {
            var empty = document.createElement("p");
            empty.className = "quickref-detail__bullet";
            empty.textContent = "Aucune précision supplémentaire.";
            bulletsEl.appendChild(empty);
            return;
        }
        values.forEach(function (bullet) {
            var paragraph = document.createElement("div");
            paragraph.className = "quickref-detail__bullet";
            paragraph.setAttribute("data-glossary-richtext", "");
            paragraph.innerHTML = bullet;
            bulletsEl.appendChild(paragraph);
        });
    }

    function renderRuleLinks(intent) {
        var section = element("quickref-detail-links-section");
        var links = element("quickref-detail-links");
        if (!section || !links) return;
        links.replaceChildren();
        var refs = [];
        if (intent.primaryRule) refs.push({ ref: intent.primaryRule, primary: true });
        (intent.relatedRules || []).forEach(function (ref) { refs.push({ ref: ref, primary: false }); });
        refs.forEach(function (entry) {
            var resolved = resolveRule(entry.ref.parameter, entry.ref.slug);
            if (!resolved) return;
            var link = document.createElement("a");
            var meta = document.createElement("span");
            link.className = "quickref-detail__link";
            link.href = "quickref.html?" + encodeURIComponent(entry.ref.parameter) + "=" + encodeURIComponent(resolved.slug) + "&intent=" + encodeURIComponent(intent.id);
            link.setAttribute("data-rule-parameter", resolved.parameter);
            link.setAttribute("data-rule-slug", resolved.slug);
            link.setAttribute("aria-label", "Consulter " + resolved.data.title);
            link.textContent = resolved.data.title;
            meta.textContent = entry.primary ? "Règle principale ›" : resolved.type + " ›";
            link.appendChild(meta);
            link.addEventListener("click", function (event) {
                event.preventDefault();
                var record = recordByKey[resolved.parameter + ":" + resolved.slug];
                showRuleDetail(resolved.data, record ? record.color : "#9a7c48", resolved.type, link, record, true, intent.id);
            });
            links.appendChild(link);
        });
        section.hidden = links.children.length === 0;
    }

    function showRuleDetail(data, color, type, trigger, record, syncUrl, intentId) {
        var layer = element("quickref-detail-layer");
        var panel = element("quickref-detail-panel");
        if (!layer || !panel) return;
        var safeTrigger = trigger || element("quickref-detail-close") || panel;
        if (lastTrigger && lastTrigger !== safeTrigger) lastTrigger.setAttribute("aria-expanded", "false");
        lastTrigger = safeTrigger;
        lastRecord = record || null;
        activeIntentId = intentId || "";
        currentView = "rule";
        if (safeTrigger.setAttribute) safeTrigger.setAttribute("aria-expanded", "true");
        element("quickref-detail-title").textContent = data.title || "[sans titre]";
        element("quickref-detail-type").textContent = type || "Règle";
        element("quickref-detail-cost").textContent = type || "Règle";
        element("quickref-detail-summary").textContent = data.description || data.subtitle || "";
        element("quickref-detail-reference").textContent = data.reference || "Non précisée";
        panel.setAttribute("data-context-share-parameter", record ? record.parameter : "");
        panel.setAttribute("data-context-share-value", record ? record.slug : "");
        panel.setAttribute("data-context-share-title", data.title || "[sans titre]");
        panel.style.setProperty("--category-color", color || "#7f6635");
        renderBullets(data.bullets);
        var linksSection = element("quickref-detail-links-section");
        if (linksSection) linksSection.hidden = true;
        var backButton = element("quickref-detail-back-intent");
        if (backButton) backButton.hidden = !activeIntentId;
        document.body.classList.add("quickref-detail-open");
        layer.classList.add("is-open");
        layer.setAttribute("aria-hidden", "false");
        layer.removeAttribute("inert");
        if (syncUrl !== false && record) {
            window.DndCatalogUI.updateSelection(record.parameter, record.slug, { clear: selectionParameters, mode: "push" });
        }
        var closeButton = element("quickref-detail-close");
        if (closeButton) closeButton.focus();
    }

    function syncIntentUrl(intentId, mode) {
        window.DndCatalogUI.updateSelection("intent", intentId, {
            clear: selectionParameters.concat(["intent"]),
            mode: mode || "push",
        });
    }

    function showIntentDetail(intent, trigger, syncUrl, historyMode) {
        var layer = element("quickref-detail-layer");
        var panel = element("quickref-detail-panel");
        if (!layer || !panel || !intent) return;
        var safeTrigger = trigger || element("quickref-detail-close") || panel;
        if (lastTrigger && lastTrigger !== safeTrigger) lastTrigger.setAttribute("aria-expanded", "false");
        lastTrigger = safeTrigger;
        lastIntentTrigger = trigger || lastIntentTrigger;
        lastRecord = null;
        activeIntentId = intent.id;
        currentView = "intent";
        if (safeTrigger.setAttribute) safeTrigger.setAttribute("aria-expanded", "true");
        element("quickref-detail-title").textContent = intent.title;
        element("quickref-detail-type").textContent = "Situation";
        element("quickref-detail-cost").textContent = intent.cost || "Selon la situation";
        element("quickref-detail-summary").textContent = intent.description;
        element("quickref-detail-reference").textContent = intentCategories.find(function (category) { return category.id === intent.category; })?.label || "Référence rapide";
        panel.removeAttribute("data-context-share-parameter");
        panel.removeAttribute("data-context-share-value");
        panel.setAttribute("data-context-share-title", intent.title);
        panel.style.setProperty("--category-color", "#9a7c48");
        renderBullets([intent.description]);
        renderRuleLinks(intent);
        var backButton = element("quickref-detail-back-intent");
        if (backButton) backButton.hidden = true;
        document.body.classList.add("quickref-detail-open");
        layer.classList.add("is-open");
        layer.setAttribute("aria-hidden", "false");
        layer.removeAttribute("inert");
        if (syncUrl !== false) syncIntentUrl(intent.id, historyMode || "push");
        var closeButton = element("quickref-detail-close");
        if (closeButton) closeButton.focus();
    }

    function hideDetail(restoreFocus, syncUrl) {
        var layer = element("quickref-detail-layer");
        if (!layer || !layer.classList.contains("is-open")) return;
        layer.classList.remove("is-open");
        layer.setAttribute("aria-hidden", "true");
        layer.setAttribute("inert", "");
        document.body.classList.remove("quickref-detail-open");
        if (lastTrigger) {
            lastTrigger.setAttribute("aria-expanded", "false");
            if (restoreFocus !== false && lastTrigger.focus) lastTrigger.focus();
        }
        if (syncUrl !== false) {
            if (currentView === "rule" && lastRecord) {
                window.DndCatalogUI.updateSelection(lastRecord.parameter, "", { clear: selectionParameters, mode: "replace" });
            } else if (currentView === "intent") {
                window.DndCatalogUI.updateSelection("intent", "", {
                    clear: selectionParameters.concat(["intent"]),
                    mode: "replace",
                });
            }
        }
        lastRecord = null;
        activeIntentId = "";
        currentView = "";
    }

    function filterItems() {
        var search = element("quickref-search");
        if (!search) return;
        var query = normalize(search.value).trim();
        var visible = 0;
        var sections = new Set();
        records.forEach(function (record) {
            var matches = !query || record.searchText.includes(query);
            record.element.hidden = !matches;
            if (matches) visible += 1;
            if (record.section) sections.add(record.section);
        });
        sections.forEach(function (section) {
            section.hidden = !records.some(function (record) {
                return record.section === section && !record.element.hidden;
            });
        });
        var count = element("quickref-result-count");
        if (count) count.textContent = visible + " " + (visible > 1 ? "entrées" : "entrée");
        var empty = element("quickref-empty");
        if (empty) empty.hidden = visible !== 0;
    }

    function fillSection(data, parentId, type, parameter) {
        var parent = element(parentId);
        if (!parent || !Array.isArray(data)) return;
        parent.classList.add("quickref-grid");
        data.forEach(function (item) { addQuickrefItem(parent, item, type, parameter); });
    }

    function renderIntentCards(categoryId) {
        var container = element("quickref-intentions");
        if (!container) return;
        container.replaceChildren();
        intentions.filter(function (intent) { return intent.category === categoryId; }).forEach(function (intent) {
            var article = document.createElement("article");
            var link = document.createElement("a");
            var description = document.createElement("p");
            var rules = document.createElement("span");
            var refs = [];
            if (intent.primaryRule) refs.push(intent.primaryRule);
            (intent.relatedRules || []).forEach(function (ref) { refs.push(ref); });
            refs.forEach(function (ref, index) {
                var resolved = resolveRule(ref.parameter, ref.slug);
                var duplicate = refs.slice(0, index).some(function (previous) {
                    return previous.parameter === ref.parameter && previous.slug === ref.slug;
                });
                if (resolved && !duplicate) rules.textContent += (rules.textContent ? " · " : "") + resolved.data.title;
            });
            article.className = "quickref-intent-card";
            link.className = "quickref-situation";
            link.href = "quickref.html?intent=" + encodeURIComponent(intent.id);
            link.setAttribute("data-intent-id", intent.id);
            link.setAttribute("aria-haspopup", "dialog");
            link.textContent = intent.title;
            link.addEventListener("click", function (event) {
                event.preventDefault();
                showIntentDetail(intent, link, true);
            });
            description.className = "quickref-intent-description";
            description.textContent = intent.description;
            rules.className = "quickref-intent-rules";
            article.appendChild(link);
            article.appendChild(description);
            article.appendChild(rules);
            container.appendChild(article);
        });
    }

    function setIntentCategory(categoryId) {
        var selected = intentCategories.some(function (category) { return category.id === categoryId; }) ? categoryId : intentCategories[0].id;
        var nav = element("quickref-intent-categories");
        if (nav && nav.querySelectorAll) {
            Array.from(nav.querySelectorAll("[role='tab']")).forEach(function (tab) {
                var active = tab.getAttribute("data-category") === selected;
                tab.setAttribute("aria-selected", active ? "true" : "false");
                tab.tabIndex = active ? 0 : -1;
            });
        }
        var container = element("quickref-intentions");
        var activeTab = nav && nav.querySelector ? nav.querySelector("[data-category='" + selected + "']") : null;
        if (container && activeTab) container.setAttribute("aria-labelledby", activeTab.id);
        renderIntentCards(selected);
    }

    function renderIntentNavigation() {
        var nav = element("quickref-intent-categories");
        var container = element("quickref-intentions");
        if (!nav || !container || typeof data_intentions === "undefined") return;
        intentions = Array.isArray(data_intentions) ? data_intentions.slice().sort(function (a, b) { return a.order - b.order; }) : [];
        intentions.forEach(function (intent) { intentionsById[intent.id] = intent; });
        nav.replaceChildren();
        intentCategories.forEach(function (category) {
            var tab = document.createElement("button");
            tab.type = "button";
            tab.className = "quickref-intent-category";
            tab.id = "quickref-intent-tab-" + category.id;
            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-selected", "false");
            tab.setAttribute("aria-controls", "quickref-intentions");
            tab.setAttribute("data-category", category.id);
            tab.textContent = category.icon + " " + category.label;
            tab.addEventListener("click", function () { setIntentCategory(category.id); });
            tab.addEventListener("keydown", function (event) {
                if (event.key !== "ArrowRight" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowUp") return;
                event.preventDefault();
                var currentIndex = intentCategories.findIndex(function (item) { return item.id === category.id; });
                var direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
                var nextIndex = (currentIndex + direction + intentCategories.length) % intentCategories.length;
                setIntentCategory(intentCategories[nextIndex].id);
                var nextTab = nav.querySelector("[data-category='" + intentCategories[nextIndex].id + "']");
                if (nextTab) nextTab.focus();
            });
            nav.appendChild(tab);
        });
        setIntentCategory(intentCategories[0].id);
    }

    function updateQueryUrl() {
        if (!window.history || typeof URL === "undefined") return;
        var url = new URL(window.location.href);
        var search = element("quickref-search");
        var query = search ? search.value.trim() : "";
        if (query) url.searchParams.set("q", query);
        else url.searchParams.delete("q");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }

    function getIntentFromUrl() {
        return new URLSearchParams(window.location.search).get("intent") || "";
    }

    function intentTrigger(intentId) {
        var root = element("quickref-intentions");
        if (!root || !root.querySelector) return null;
        return root.querySelector("[data-intent-id='" + intentId.replace(/'/g, "\\'") + "']");
    }

    function restoreFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var search = element("quickref-search");
        if (search) search.value = params.get("q") || "";
        filterItems();
        var intent = intentionsById[params.get("intent") || ""];
        var selected = records.find(function (record) { return params.get(record.parameter) === record.slug; });
        if (intent) setIntentCategory(intent.category);
        if (selected && (!selected.element.hidden || !params.get("q"))) {
            showRuleDetail(selected.data, selected.color, selected.type, selected.element, selected, false, intent ? intent.id : "");
            if (typeof selected.element.scrollIntoView === "function") selected.element.scrollIntoView({ block: "center" });
            return;
        }
        if (intent) {
            showIntentDetail(intent, intentTrigger(intent.id), false);
            return;
        }
        hideDetail(false, false);
    }

    function trapPanelFocus(event) {
        var layer = element("quickref-detail-layer");
        if (!layer || !layer.classList.contains("is-open")) return;
        if (event.key === "Escape") {
            event.preventDefault();
            hideDetail(true);
            return;
        }
        if (event.key !== "Tab") return;
        var panel = element("quickref-detail-panel");
        var focusable = Array.from(panel.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")).filter(function (item) {
            return !item.disabled && !item.hidden;
        });
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function init() {
        fillSection(typeof data_movement !== "undefined" ? data_movement : [], "basic-movement", "Déplacement", "movement");
        fillSection(typeof data_action !== "undefined" ? data_action : [], "basic-actions", "Action", "action");
        fillSection(typeof data_bonusaction !== "undefined" ? data_bonusaction : [], "basic-bonus-actions", "Action bonus", "bonus");
        fillSection(typeof data_reaction !== "undefined" ? data_reaction : [], "basic-reactions", "Réaction", "reaction");
        fillSection(typeof data_condition !== "undefined" ? data_condition : [], "basic-conditions", "État", "condition");
        fillSection(typeof data_general !== "undefined" ? data_general : [], "basic-general", "Règle générale", "general");
        fillSection(typeof data_environment_obscurance !== "undefined" ? data_environment_obscurance : [], "environment-obscurance", "Environnement", "environment");
        fillSection(typeof data_environment_light !== "undefined" ? data_environment_light : [], "environment-light", "Environnement", "environment");
        fillSection(typeof data_environment_vision !== "undefined" ? data_environment_vision : [], "environment-vision", "Environnement", "environment");
        fillSection(typeof data_environment_cover !== "undefined" ? data_environment_cover : [], "environment-cover", "Environnement", "environment");
        renderIntentNavigation();
        var search = element("quickref-search");
        if (search) search.addEventListener("input", function () { filterItems(); updateQueryUrl(); });
        var close = element("quickref-detail-close");
        var backdrop = element("quickref-detail-backdrop");
        if (close) close.addEventListener("click", function () { hideDetail(true, true); });
        if (backdrop) backdrop.addEventListener("click", function () { hideDetail(true, true); });
        var backIntent = element("quickref-detail-back-intent");
        if (backIntent) backIntent.addEventListener("click", function () {
            var intent = intentionsById[activeIntentId];
            if (intent) showIntentDetail(intent, lastIntentTrigger || intentTrigger(intent.id), true, "replace");
        });
        document.addEventListener("keydown", trapPanelFocus);
        if (typeof window.addEventListener === "function") window.addEventListener("popstate", restoreFromUrl);
        restoreFromUrl();
    }

    window.DndQuickref = {
        resolveRule: resolveRule,
        getIntent: function (id) { return intentionsById[id] || null; },
    };

    document.addEventListener("DOMContentLoaded", init, { once: true });
})();
