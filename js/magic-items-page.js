(function () {
  "use strict";

  var search = document.getElementById("searchInput");
  var rarity = document.getElementById("raritySelect");
  var type = document.getElementById("typeSelect");
  var attunement = document.getElementById("attunementSelect");
  var reset = document.getElementById("resetBtn");
  var filterPanel = document.getElementById("filterPanel");
  var openFilters = document.getElementById("openFiltersBtn");
  var closeFilters = document.getElementById("closeFiltersBtn");
  var filterBackdrop = document.getElementById("filterBackdrop");
  var grid = document.getElementById("itemsGrid");
  var summary = document.getElementById("summary");
  var sourceNote = document.getElementById("sourceNote");
  var stat = document.getElementById("catalogStat");
  var items = [];

  var rarityLabels = { common: "Commun", uncommon: "Peu commun", rare: "Rare", "very-rare": "Très rare", legendary: "Légendaire", artifact: "Artéfact", varies: "Variable" };
  var typeLabels = { weapon: "Arme", armor: "Armure", "wondrous-item": "Objet merveilleux", potion: "Potion", ring: "Anneau", rod: "Bâtonnet", staff: "Bâton", wand: "Baguette", scroll: "Parchemin", ammunition: "Munitions" };
  var activationLabels = { action: "Action Magie", "bonus-action": "Action bonus", reaction: "Réaction", passive: "Passif" };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value == null ? "" : value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  }

  function applyUrlState() {
    var params = new URLSearchParams(window.location.search);
    search.value = params.get("q") || "";
    rarity.value = params.get("rarity") || "";
    type.value = params.get("type") || "";
    attunement.value = params.get("attunement") || "";
  }

  function updateUrl() {
    var url = new URL(window.location.href);
    [["q", search.value], ["rarity", rarity.value], ["type", type.value], ["attunement", attunement.value]].forEach(function (pair) {
      if (pair[1]) url.searchParams.set(pair[0], pair[1]); else url.searchParams.delete(pair[0]);
    });
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function searchableText(item) {
    return normalize([
      item.name, item.officialName, item.typeLabel, item.subtype, item.rarityLabel, item.description,
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
      var rows = (table.rows || []).map(function (row) { return `<li>${escapeHtml(Object.values(row).join(" — "))}</li>`; }).join("");
      return `<div class="magic-item-table"><strong>${escapeHtml(table.title || "Tableau source")}</strong>${table.dice ? `<span>${escapeHtml(table.dice)}</span>` : ""}<ul>${rows}</ul></div>`;
    }).join("")}</section>`;
  }

  function renderCard(item) {
    var badges = [item.rarityLabel || rarityLabels[item.rarity] || item.rarity, typeLabels[item.type] || item.typeLabel, item.requiresAttunement ? "Harmonisation" : "Sans harmonisation"];
    var activation = (item.activationTypes || []).map(function (value) { return activationLabels[value] || value; });
    var properties = (item.properties || []).filter(function (property) { return property.label || property.key; }).map(function (property) { return `<li>${escapeHtml(property.label || property.key)}</li>`; }).join("");
    var propertyBlock = properties ? `<section class="magic-item-section"><h4>Propriétés</h4><ul>${properties}</ul></section>` : "";
    var chargeBlock = item.charges ? `<section class="magic-item-section"><h4>Charges</h4><p>${escapeHtml(item.charges.max)} charge(s)${item.charges.recovery ? ` — récupération : ${escapeHtml(item.charges.recovery)}` : ""}.</p></section>` : "";
    var spellBlock = item.spells && item.spells.length ? `<section class="magic-item-section"><h4>Sorts</h4><ul>${item.spells.map(function (spell) { return `<li>${escapeHtml(spell.name)}${spell.cost ? ` — ${escapeHtml(spell.cost)}` : ""}</li>`; }).join("")}</ul></section>` : "";
    var attunementText = item.requiresAttunement ? `requise${item.attunement && item.attunement.requirement ? ` (${escapeHtml(item.attunement.requirement)})` : ""}` : "non requise";
    var status = item.verificationStatus === "needs-verification" ? `<p class="magic-item-warning" role="note">Entrée recensée dans le PDF ; transcription détaillée à vérifier visuellement.</p>` : "";
    var source = item.source && item.source.page ? `DMG 2024, p. ${escapeHtml(item.source.page)}` : "DMG 2024";
    return `<details class="catalog-card" id="${escapeHtml(item.id)}"><summary><div class="catalog-card__head"><h3 class="catalog-card__title">${escapeHtml(item.name)}</h3><div class="catalog-card__badges">${badges.map(function (badge) { return `<span class="badge badge--muted">${escapeHtml(badge)}</span>`; }).join("")}</div><div class="catalog-card__quick-meta"><span>${escapeHtml(item.subtype || typeLabels[item.type] || "Type non précisé")}</span><span>${escapeHtml(activation.join(" · ") || "Propriété passive ou spéciale")}</span><span>${escapeHtml(source)}</span></div></div></summary><div class="catalog-card__body"><p data-glossary-richtext>${escapeHtml(item.description)}</p><p><strong>Harmonisation :</strong> ${attunementText}</p>${status}${propertyBlock}${chargeBlock}${spellBlock}${renderVariants(item)}${renderTables(item)}<dl class="catalog-card__details"><dt>Source</dt><dd>${escapeHtml(source)}</dd></dl>${item.aliases && item.aliases.length ? `<p><strong>Alias :</strong> ${escapeHtml(item.aliases.join(", "))}</p>` : ""}</div></details>`;
  }

  function render() {
    var visible = filteredItems();
    summary.textContent = `${visible.length} objet${visible.length > 1 ? "s" : ""} affiché${visible.length > 1 ? "s" : ""} sur ${items.length}.`;
    grid.innerHTML = visible.length ? visible.map(renderCard).join("") : `<div class="catalog-empty"><strong>Aucun objet magique</strong><span>Modifiez la recherche ou les filtres.</span></div>`;
    updateUrl();
  }

  function setFiltersOpen(isOpen) {
    filterPanel.classList.toggle("is-open", isOpen);
    filterBackdrop.classList.toggle("is-open", isOpen);
    openFilters.setAttribute("aria-expanded", String(isOpen));
  }

  function init(data) {
    items = Array.isArray(data.items) ? data.items : [];
    Array.from(new Map(items.map(function (item) { return [item.type, typeLabels[item.type] || item.typeLabel || item.type]; })).entries()).sort(function (first, second) { return first[1].localeCompare(second[1], "fr"); }).forEach(function (entry) {
      type.appendChild(new Option(entry[1], entry[0]));
    });
    applyUrlState();
    sourceNote.textContent = `Catalogue DMG 2024, transcrit depuis le PDF fourni (${items.length} entrées). Les entrées signalées restent explicitement à vérifier.`;
    stat.textContent = `${items.length} entrées`;
    [search, rarity, type, attunement].forEach(function (control) { control.addEventListener("input", render); control.addEventListener("change", render); });
    reset.addEventListener("click", function () { search.value = ""; rarity.value = ""; type.value = ""; attunement.value = ""; render(); });
    openFilters.addEventListener("click", function () { setFiltersOpen(true); });
    closeFilters.addEventListener("click", function () { setFiltersOpen(false); });
    filterBackdrop.addEventListener("click", function () { setFiltersOpen(false); });
    window.addEventListener("keydown", function (event) { if (event.key === "Escape") setFiltersOpen(false); });
    window.addEventListener("popstate", function () { applyUrlState(); render(); });
    render();
  }

  fetch("data/magic-items.json", { credentials: "omit" }).then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); }).then(init).catch(function () {
    sourceNote.textContent = "Impossible de charger les objets magiques.";
    grid.innerHTML = `<div class="catalog-empty"><strong>Données indisponibles</strong><span>Réessayez lorsque la page sera à nouveau en ligne.</span></div>`;
  });
}());
