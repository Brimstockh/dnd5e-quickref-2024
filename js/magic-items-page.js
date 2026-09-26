(function () {
  "use strict";

  var search = document.getElementById("searchInput");
  var rarity = document.getElementById("raritySelect");
  var type = document.getElementById("typeSelect");
  var attunement = document.getElementById("attunementSelect");
  var verification = document.getElementById("verificationSelect");
  var reset = document.getElementById("resetBtn");
  var filterPanel = document.getElementById("filterPanel");
  var openFilters = document.getElementById("openFiltersBtn");
  var closeFilters = document.getElementById("closeFiltersBtn");
  var filterBackdrop = document.getElementById("filterBackdrop");
  var grid = document.getElementById("itemsGrid");
  var loadMore = document.getElementById("loadMoreBtn");
  var summary = document.getElementById("summary");
  var sourceNote = document.getElementById("sourceNote");
  var stat = document.getElementById("catalogStat");
  var items = [];
  var localization = {};
  var progressive = null;
  var previousFocus = null;

  var rarityLabels = { common: "Commun", uncommon: "Peu commun", rare: "Rare", "very-rare": "Très rare", legendary: "Légendaire", artifact: "Artéfact", varies: "Variable" };
  var typeLabels = { weapon: "Arme", armor: "Armure", "wondrous-item": "Objet merveilleux", potion: "Potion", ring: "Anneau", rod: "Bâtonnet", staff: "Bâton", wand: "Baguette", scroll: "Parchemin", ammunition: "Munitions" };
  var activationLabels = { action: "Action Magie", "bonus-action": "Action bonus", reaction: "Réaction", passive: "Passif" };
  var verificationLabels = { "raw-transcription": "Transcription brute", cleaned: "Nettoyé", verified: "Vérifié", "needs-verification": "À vérifier" };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value == null ? "" : value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  }

  function isMobileDrawer() {
    return window.matchMedia ? window.matchMedia("(max-width: 820px)").matches : window.innerWidth <= 820;
  }

  function applyUrlState() {
    var params = new URLSearchParams(window.location.search);
    search.value = params.get("q") || "";
    rarity.value = params.get("rarity") || "";
    type.value = params.get("type") || "";
    attunement.value = params.get("attunement") || "";
    if (verification) verification.value = params.get("verification") || "";
  }

  function updateUrl() {
    var url = new URL(window.location.href);
    [["q", search.value], ["rarity", rarity.value], ["type", type.value], ["attunement", attunement.value], ["verification", verification ? verification.value : ""]].forEach(function (pair) {
      if (pair[1]) url.searchParams.set(pair[0], pair[1]); else url.searchParams.delete(pair[0]);
    });
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function searchableText(item) {
    return normalize([
      item.name, item.officialName, item.typeLabel, typeLabels[item.type], item.subtype, item.rarityLabel, rarityLabels[item.rarity], item.description, item.descriptionOriginal, verificationLabels[item.verificationStatus],
      item.attunement && item.attunement.requirement,
      ...(item.aliases || []),
      ...(item.properties || []).map(function (property) { return property.label || property.key; }),
      ...(item.spells || []).map(function (spell) { return spell.name; }),
    ].join(" "));
  }

  function filteredItems() {
    var query = normalize(search.value.trim());
    return items.filter(function (item) {
      if (rarity.value && item.rarity !== rarity.value) return false;
      if (type.value && item.type !== type.value) return false;
      if (attunement.value === "yes" && !item.requiresAttunement) return false;
      if (attunement.value === "no" && item.requiresAttunement) return false;
      if (verification && verification.value && item.verificationStatus !== verification.value) return false;
      return !query || searchableText(item).includes(query);
    }).sort(function (first, second) { return String(first.name).localeCompare(String(second.name), "fr"); });
  }

  function renderVariants(item) {
    if (!item.variants || !item.variants.length) return "";
    return `<section class="magic-item-section"><h4>Variantes</h4><ul>${item.variants.map(function (variant) {
      return `<li><strong>${escapeHtml(variant.name)}</strong> — ${escapeHtml(rarityLabels[variant.rarity] || variant.rarity || "Rareté variable")}</li>`;
    }).join("")}</ul></section>`;
  }

  function renderTables(item) {
    if (!item.tables || !item.tables.length) return "";
    return `<section class="magic-item-section"><h4>Tableaux</h4>${item.tables.map(function (table) {
      var columns = Array.isArray(table.columns) ? table.columns.map(function (column) {
        return typeof column === "string" ? { key: column, label: column } : { key: column.key, label: column.label || column.key };
      }).filter(function (column) { return column.key; }) : [];
      var title = escapeHtml(table.title || "Tableau source");
      var dice = table.dice ? `<p class="magic-item-table__dice">${escapeHtml(table.dice)}</p>` : "";
      if (columns.length) {
        var head = columns.map(function (column) { return `<th scope="col">${escapeHtml(column.label)}</th>`; }).join("");
        var body = (table.rows || []).map(function (row) {
          return `<tr>${columns.map(function (column) { return `<td>${escapeHtml(row && row[column.key] != null ? row[column.key] : "")}</td>`; }).join("")}</tr>`;
        }).join("");
        return `<div class="magic-item-table"><div class="magic-item-table__scroll"><table><caption>${title}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${dice}</div>`;
      }
      var rows = (table.rows || []).map(function (row) { return `<li>${escapeHtml(Object.values(row || {}).join(" — "))}</li>`; }).join("");
      return `<div class="magic-item-table"><strong>${title}</strong>${dice}<ul>${rows}</ul></div>`;
    }).join("")}</section>`;
  }

  function renderDescription(item) {
    var translated = item.descriptionTranslated || item.descriptionFr || "";
    var original = item.descriptionOriginal || item.description || "";
    var originalLabel = localization.originalDescriptionField === "description" ? "Transcription originale (anglais)" : "Texte source";
    var content = translated ? `<p class="magic-item-content-label">Description</p><p data-glossary-richtext>${escapeHtml(translated)}</p><p class="magic-item-content-label">${originalLabel}</p><p data-glossary-richtext>${escapeHtml(original)}</p>` : `<p class="magic-item-content-label">${originalLabel}</p><p data-glossary-richtext>${escapeHtml(original)}</p>`;
    return `<div class="magic-item-description">${content}</div>`;
  }

  function renderQualityNote(item) {
    var messages = {
      "raw-transcription": "Transcription brute : contenu original non vérifié visuellement.",
      cleaned: "Texte nettoyé syntaxiquement ; contrôle visuel encore requis.",
      verified: "Contenu contrôlé contre la source.",
      "needs-verification": "À vérifier : une anomalie ou un doute éditorial a été identifié.",
    };
    var label = verificationLabels[item.verificationStatus] || "Qualité non précisée";
    var message = messages[item.verificationStatus] || "Le niveau de vérification de cette entrée est inconnu.";
    return `<p class="magic-item-warning magic-item-warning--${escapeHtml(item.verificationStatus || "unknown")}" role="note"><strong>${escapeHtml(label)} :</strong> ${escapeHtml(message)}</p>`;
  }

  function renderCard(item) {
    var quality = verificationLabels[item.verificationStatus] || "Qualité non précisée";
    var rarity = rarityLabels[item.rarity] || item.rarity || "Rareté non précisée";
    var badges = [typeLabels[item.type] || item.typeLabel || item.type, item.requiresAttunement ? "Harmonisation" : "Sans harmonisation"];
    var activation = (item.activationTypes || []).map(function (value) { return activationLabels[value] || value; });
    var properties = (item.properties || []).filter(function (property) { return property.label || property.key; }).map(function (property) { return `<li>${escapeHtml(property.label || property.key)}</li>`; }).join("");
    var propertyBlock = properties ? `<section class="magic-item-section"><h4>Propriétés</h4><ul>${properties}</ul></section>` : "";
    var chargeBlock = item.charges ? `<section class="magic-item-section"><h4>Charges</h4><p>${escapeHtml(item.charges.max)} charge(s)${item.charges.recovery ? ` — récupération : ${escapeHtml(item.charges.recovery)}` : ""}.</p></section>` : "";
    var spellBlock = item.spells && item.spells.length ? `<section class="magic-item-section"><h4>Sorts</h4><ul>${item.spells.map(function (spell) { return `<li>${escapeHtml(spell.name)}${spell.cost ? ` — ${escapeHtml(spell.cost)}` : ""}</li>`; }).join("")}</ul></section>` : "";
    var attunementText = item.requiresAttunement ? `requise${item.attunement && item.attunement.requirement ? ` (${escapeHtml(item.attunement.requirement)})` : ""}` : "non requise";
    var source = item.source && item.source.page ? `DMG 2024, p. ${escapeHtml(item.source.page)}` : "DMG 2024";
    return `<details class="catalog-card" id="${escapeHtml(item.id)}"><summary><div class="catalog-card__head"><h3 class="catalog-card__title">${escapeHtml(item.name || item.officialName)}</h3><div class="catalog-card__badges"><span class="badge badge--accent">${escapeHtml(rarity)}</span>${badges.map(function (badge) { return `<span class="badge badge--muted">${escapeHtml(badge)}</span>`; }).join("")}<span class="badge badge--quality badge--quality-${escapeHtml(item.verificationStatus || "unknown")}">${escapeHtml(quality)}</span></div><div class="catalog-card__quick-meta"><span>${escapeHtml(item.subtype || typeLabels[item.type] || "Type non précisé")}</span><span>${escapeHtml(activation.join(" · ") || "Propriété passive ou spéciale")}</span><span>${escapeHtml(source)}</span></div></div></summary><div class="catalog-card__body">${renderDescription(item)}${renderQualityNote(item)}<p><strong>Harmonisation :</strong> ${attunementText}</p>${propertyBlock}${chargeBlock}${spellBlock}${renderVariants(item)}${renderTables(item)}<dl class="catalog-card__details"><dt>Source</dt><dd>${escapeHtml(source)}</dd></dl>${item.aliases && item.aliases.length ? `<p><strong>Alias :</strong> ${escapeHtml(item.aliases.join(", "))}</p>` : ""}</div></details>`;
  }

  function render(resetProgressive) {
    var visible = filteredItems();
    if (resetProgressive && progressive) progressive.reset();
    var batch = progressive ? progressive.take(visible) : visible;
    summary.textContent = `${visible.length} objet${visible.length > 1 ? "s" : ""} correspondant${visible.length > 1 ? "s" : ""} sur ${items.length}.`;
    grid.innerHTML = batch.length ? batch.map(renderCard).join("") : `<div class="catalog-empty"><strong>Aucun objet magique</strong><span>Modifiez la recherche ou les filtres.</span></div>`;
    updateUrl();
  }

  function focusableInPanel() {
    return Array.from(filterPanel.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])")).filter(function (element) {
      return !element.disabled && element.offsetParent !== null;
    });
  }

  function setBackgroundInert(isInert) {
    [document.querySelector("header[data-site-header]"), document.querySelector(".page-feature"), document.querySelector(".catalog-toolbar"), document.querySelector(".catalog-results"), filterBackdrop].filter(Boolean).forEach(function (element) {
      if ("inert" in element) element.inert = isInert;
    });
  }

  function setFiltersOpen(isOpen) {
    if (isOpen && isMobileDrawer()) previousFocus = document.activeElement;
    filterPanel.classList.toggle("is-open", isOpen);
    filterBackdrop.classList.toggle("is-open", isOpen);
    openFilters.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("has-open-filters", isOpen);
    if (isMobileDrawer()) {
      setBackgroundInert(isOpen);
      filterPanel.setAttribute("aria-hidden", String(!isOpen));
      if (isOpen) window.requestAnimationFrame(function () { (document.getElementById("closeFiltersBtn") || filterPanel).focus(); });
      else if (previousFocus && typeof previousFocus.focus === "function") window.requestAnimationFrame(function () { previousFocus.focus(); });
    }
  }

  function trapFilters(event) {
    if (!filterPanel.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setFiltersOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    var focusable = focusableInPanel();
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

  function init(data) {
    items = Array.isArray(data.items) ? data.items : [];
    localization = data.localization || {};
    Array.from(new Map(items.map(function (item) { return [item.type, typeLabels[item.type] || item.typeLabel || item.type]; })).entries()).sort(function (first, second) { return first[1].localeCompare(second[1], "fr"); }).forEach(function (entry) {
      type.appendChild(new Option(entry[1], entry[0]));
    });
    applyUrlState();
    sourceNote.textContent = `Catalogue DMG 2024, transcrit depuis le PDF fourni (${items.length} entrées). Les niveaux de vérification sont affichés sur chaque carte.`;
    stat.textContent = `${items.length} entrées`;
    progressive = window.DndProgressiveList ? window.DndProgressiveList.create({ button: loadMore, batchSize: 40, onChange: function () { render(false); } }) : null;
    [search, rarity, type, attunement, verification].filter(Boolean).forEach(function (control) { control.addEventListener("input", function () { render(true); }); control.addEventListener("change", function () { render(true); }); });
    reset.addEventListener("click", function () { search.value = ""; rarity.value = ""; type.value = ""; attunement.value = ""; if (verification) verification.value = ""; render(true); });
    openFilters.addEventListener("click", function () { setFiltersOpen(true); });
    closeFilters.addEventListener("click", function () { setFiltersOpen(false); });
    filterBackdrop.addEventListener("click", function () { setFiltersOpen(false); });
    window.addEventListener("keydown", trapFilters);
    window.addEventListener("popstate", function () { applyUrlState(); render(true); });
    render(true);
  }

  fetch("data/magic-items.json", { credentials: "omit" }).then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); }).then(init).catch(function () {
    sourceNote.textContent = "Impossible de charger les objets magiques.";
    grid.innerHTML = `<div class="catalog-empty"><strong>Données indisponibles</strong><span>Réessayez lorsque la page sera à nouveau en ligne.</span></div>`;
    if (loadMore) loadMore.hidden = true;
  });
}());
