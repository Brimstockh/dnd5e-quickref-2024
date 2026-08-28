(function () {
  "use strict";

  var search = document.getElementById("searchInput");
  var rarity = document.getElementById("raritySelect");
  var type = document.getElementById("typeSelect");
  var attunement = document.getElementById("attunementSelect");
  var reset = document.getElementById("resetBtn");
  var grid = document.getElementById("itemsGrid");
  var summary = document.getElementById("summary");
  var sourceNote = document.getElementById("sourceNote");
  var stat = document.getElementById("catalogStat");
  var items = [];

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  }

  function slug(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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

  function filteredItems() {
    var query = normalize(search.value.trim());
    return items.filter(function (item) {
      if (rarity.value && item.rarity !== rarity.value) return false;
      if (type.value && item.type !== type.value) return false;
      if (attunement.value === "yes" && !item.requiresAttunement) return false;
      if (attunement.value === "no" && item.requiresAttunement) return false;
      if (!query) return true;
      return normalize([item.name, item.type, item.rarity, item.description, ...(item.aliases || [])].join(" ")).includes(query);
    }).sort(function (first, second) { return String(first.name).localeCompare(String(second.name), "fr"); });
  }

  function renderCard(item) {
    var badges = [item.rarity, item.type, item.requiresAttunement ? "Harmonisation" : "Sans harmonisation"];
    var charges = item.charges == null ? "Aucune charge indiquée" : `${item.charges} charge(s)`;
    var aliases = item.aliases?.length ? `<p><strong>Alias :</strong> ${escapeHtml(item.aliases.join(", "))}</p>` : "";
    return `<details class="catalog-card" id="${escapeHtml(slug(item.name))}">
      <summary><div class="catalog-card__head"><h3 class="catalog-card__title">${escapeHtml(item.name)}</h3><div class="catalog-card__badges">${badges.map(function (badge) { return `<span class="badge badge--muted">${escapeHtml(badge)}</span>`; }).join("")}</div></div></summary>
      <div class="catalog-card__body"><p>${escapeHtml(item.description)}</p><dl class="catalog-card__details"><dt>Charges</dt><dd>${escapeHtml(charges)}</dd><dt>Source</dt><dd>${escapeHtml(item.sourceSection || item.sourceRef || "Non précisée")}</dd></dl>${aliases}</div>
    </details>`;
  }

  function render() {
    var visible = filteredItems();
    summary.textContent = `${visible.length} objet${visible.length > 1 ? "s" : ""} affiché${visible.length > 1 ? "s" : ""} sur ${items.length}.`;
    grid.innerHTML = visible.length ? visible.map(renderCard).join("") : `<div class="catalog-empty"><strong>Aucun objet magique</strong><span>Modifiez la recherche ou les filtres.</span></div>`;
    updateUrl();
  }

  function init(data) {
    items = Array.isArray(data.items) ? data.items : [];
    Array.from(new Set(items.map(function (item) { return item.type; }).filter(Boolean))).sort().forEach(function (value) {
      type.appendChild(new Option(value, value));
    });
    applyUrlState();
    sourceNote.textContent = "Les objets sont référencés avec leur source ; les entrées de campagne restent identifiées comme telles.";
    stat.textContent = `${items.length} entrée${items.length > 1 ? "s" : ""}`;
    [search, rarity, type, attunement].forEach(function (control) { control.addEventListener("input", render); control.addEventListener("change", render); });
    reset.addEventListener("click", function () { search.value = ""; rarity.value = ""; type.value = ""; attunement.value = ""; render(); });
    window.addEventListener("popstate", function () { applyUrlState(); render(); });
    render();
  }

  fetch("data/magic-items.json", { credentials: "omit" }).then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); }).then(init).catch(function () {
    sourceNote.textContent = "Impossible de charger les objets magiques.";
    grid.innerHTML = `<div class="catalog-empty"><strong>Données indisponibles</strong><span>Réessayez lorsque la page sera à nouveau en ligne.</span></div>`;
  });
}());
