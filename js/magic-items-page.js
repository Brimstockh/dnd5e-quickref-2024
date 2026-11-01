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
  var translationsById = Object.create(null);
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

  function translationFor(item) {
    return translationsById[item.id] || {};
  }

  function displayName(item) {
    return translationFor(item).nameFr || item.name || item.officialName;
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
    var translated = translationFor(item);
    return normalize([
      item.name, item.officialName, translated.nameFr, item.typeLabel, typeLabels[item.type], translated.typeLabelFr,
      item.subtype, translated.subtypeFr, item.rarityLabel, rarityLabels[item.rarity], item.description, item.descriptionOriginal,
      translated.descriptionFr, verificationLabels[item.verificationStatus],
      item.attunement && item.attunement.requirement, translated.attunementRequirementFr,
      item.charges && item.charges.recovery, translated.chargeRecoveryFr,
      ...(item.aliases || []),
      ...(item.properties || []).flatMap(function (property) { return [property.label || property.key, translated.propertiesFr && translated.propertiesFr[property.key]]; }),
      ...(item.spells || []).flatMap(function (spell, index) { return [spell.name, translated.spellsFr && translated.spellsFr[index]]; }),
      ...(item.variants || []).flatMap(function (variant, index) { return [variant.name, translated.variantsFr && translated.variantsFr[index]]; }),
      ...(item.tables || []).flatMap(function (table, tableIndex) {
        var tableFr = translated.tablesFr && translated.tablesFr[tableIndex] || {};
        return [table.title, tableFr.titleFr, ...Object.values(tableFr.columnsFr || {}), ...(tableFr.rowsFr || []).flatMap(function (row) { return Object.values(row || {}); })];
      }),
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
    }).sort(function (first, second) { return String(displayName(first)).localeCompare(String(displayName(second)), "fr"); });
  }

  function renderVariants(item, translated) {
    if (!item.variants || !item.variants.length) return "";
    return `<section class="magic-item-section"><h4>Variantes</h4><ul>${item.variants.map(function (variant, index) {
      var name = translated.variantsFr && translated.variantsFr[index] || variant.name;
      return `<li><strong>${escapeHtml(name)}</strong> — ${escapeHtml(rarityLabels[variant.rarity] || variant.rarity || "Rareté variable")}</li>`;
    }).join("")}</ul></section>`;
  }

  function renderTables(item, translated) {
    if (!item.tables || !item.tables.length) return "";
    return `<section class="magic-item-section"><h4>Tableaux</h4>${item.tables.map(function (table, tableIndex) {
      var tableFr = translated.tablesFr && translated.tablesFr[tableIndex] || {};
      var columns = Array.isArray(table.columns) ? table.columns.map(function (column) {
        var value = typeof column === "string" ? { key: column, label: column } : { key: column.key, label: column.label || column.key };
        return { key: value.key, label: tableFr.columnsFr && tableFr.columnsFr[value.key] || value.label };
      }).filter(function (column) { return column.key; }) : [];
      var title = escapeHtml(tableFr.titleFr || table.title || "Tableau source");
      var diceText = tableFr.diceFr || table.dice;
      var dice = diceText ? `<p class="magic-item-table__dice">${escapeHtml(diceText)}</p>` : "";
      if (columns.length) {
        var head = columns.map(function (column) { return `<th scope="col">${escapeHtml(column.label)}</th>`; }).join("");
        var body = (table.rows || []).map(function (row, rowIndex) {
          var rowFr = tableFr.rowsFr && tableFr.rowsFr[rowIndex] || {};
          return `<tr>${columns.map(function (column) { return `<td>${escapeHtml(rowFr[column.key] != null ? rowFr[column.key] : row && row[column.key] != null ? row[column.key] : "")}</td>`; }).join("")}</tr>`;
        }).join("");
        return `<div class="magic-item-table"><div class="magic-item-table__scroll"><table><caption>${title}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${dice}</div>`;
      }
      var rows = (table.rows || []).map(function (row, rowIndex) {
        var rowFr = tableFr.rowsFr && tableFr.rowsFr[rowIndex] || {};
        return `<li>${escapeHtml(Object.keys(row || {}).map(function (key) { return rowFr[key] != null ? rowFr[key] : row[key]; }).join(" — "))}</li>`;
      }).join("");
      return `<div class="magic-item-table"><strong>${title}</strong>${dice}<ul>${rows}</ul></div>`;
    }).join("")}</section>`;
  }

  function renderDescription(item) {
    var itemTranslation = translationFor(item);
    var translated = itemTranslation.descriptionFr || item.descriptionTranslated || item.descriptionFr || "";
    var original = item.descriptionOriginal || item.description || "";
    var originalLabel = localization.originalDescriptionField === "description" ? "Texte original (anglais)" : "Texte source";
    var content = translated ? `<p class="magic-item-content-label">Description</p><p data-glossary-richtext>${escapeHtml(translated)}</p><details class="magic-item-original"><summary>${originalLabel}</summary><p data-glossary-richtext>${escapeHtml(original)}</p></details>` : `<p class="magic-item-content-label">${originalLabel}</p><p data-glossary-richtext>${escapeHtml(original)}</p>`;
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
    var translated = translationFor(item);
    var itemName = displayName(item);
    var quality = verificationLabels[item.verificationStatus] || "Qualité non précisée";
    var rarity = rarityLabels[item.rarity] || item.rarity || "Rareté non précisée";
    var badges = [typeLabels[item.type] || item.typeLabel || item.type, item.requiresAttunement ? "Harmonisation" : "Sans harmonisation"];
    var activation = (item.activationTypes || []).map(function (value) { return activationLabels[value] || value; });
    var properties = (item.properties || []).filter(function (property) { return property.label || property.key; }).map(function (property) { return `<li>${escapeHtml(translated.propertiesFr && translated.propertiesFr[property.key] || property.label || property.key)}</li>`; }).join("");
    var propertyBlock = properties ? `<section class="magic-item-section"><h4>Propriétés</h4><ul>${properties}</ul></section>` : "";
    var chargeRecovery = translated.chargeRecoveryFr || item.charges && item.charges.recovery;
    var chargeBlock = item.charges ? `<section class="magic-item-section"><h4>Charges</h4><p>${escapeHtml(item.charges.max)} charge(s)${chargeRecovery ? ` — récupération : ${escapeHtml(chargeRecovery)}` : ""}.</p></section>` : "";
    var spellBlock = item.spells && item.spells.length ? `<section class="magic-item-section"><h4>Sorts</h4><ul>${item.spells.map(function (spell, index) { return `<li>${escapeHtml(translated.spellsFr && translated.spellsFr[index] || spell.name)}${spell.cost ? ` — ${escapeHtml(spell.cost)}` : ""}</li>`; }).join("")}</ul></section>` : "";
    var attunementRequirement = translated.attunementRequirementFr || item.attunement && item.attunement.requirement;
    var attunementText = item.requiresAttunement ? `requise${attunementRequirement ? ` (${escapeHtml(attunementRequirement)})` : ""}` : "non requise";
    var source = item.source && item.source.page ? `DMG 2024, p. ${escapeHtml(item.source.page)}` : "DMG 2024";
    return `<details class="catalog-card" id="${escapeHtml(item.id)}"><summary><div class="catalog-card__head"><h3 class="catalog-card__title">${escapeHtml(itemName)}</h3><div class="catalog-card__badges"><span class="badge badge--accent">${escapeHtml(rarity)}</span>${badges.map(function (badge) { return `<span class="badge badge--muted">${escapeHtml(badge)}</span>`; }).join("")}<span class="badge badge--quality badge--quality-${escapeHtml(item.verificationStatus || "unknown")}">${escapeHtml(quality)}</span></div><div class="catalog-card__quick-meta"><span>${escapeHtml(translated.subtypeFr || item.subtype || typeLabels[item.type] || "Type non précisé")}</span><span>${escapeHtml(activation.join(" · ") || "Propriété passive ou spéciale")}</span><span>${escapeHtml(source)}</span></div></div></summary><div class="catalog-card__body"><p class="magic-item-source-name"><strong>Nom anglais d'origine :</strong> ${escapeHtml(item.name || item.officialName)}</p>${renderDescription(item)}${renderQualityNote(item)}<p><strong>Harmonisation :</strong> ${attunementText}</p>${propertyBlock}${chargeBlock}${spellBlock}${renderVariants(item, translated)}${renderTables(item, translated)}<dl class="catalog-card__details"><dt>Source</dt><dd>${escapeHtml(source)}</dd></dl>${item.aliases && item.aliases.length ? `<p><strong>Alias :</strong> ${escapeHtml(item.aliases.join(", "))}</p>` : ""}</div></details>`;
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

  function init(data, translationData) {
    items = Array.isArray(data.items) ? data.items : [];
    localization = data.localization || {};
    (Array.isArray(translationData.items) ? translationData.items : []).forEach(function (translation) {
      if (translation && translation.id) translationsById[translation.id] = translation;
    });
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

  Promise.all(["data/magic-items.json", "data/magic-items-fr.json"].map(function (path) {
    return fetch(path, { credentials: "omit" }).then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); });
  })).then(function (data) { init(data[0], data[1]); }).catch(function () {
    sourceNote.textContent = "Impossible de charger les objets magiques.";
    grid.innerHTML = `<div class="catalog-empty"><strong>Données indisponibles</strong><span>Réessayez lorsque la page sera à nouveau en ligne.</span></div>`;
    if (loadMore) loadMore.hidden = true;
  });
}());
