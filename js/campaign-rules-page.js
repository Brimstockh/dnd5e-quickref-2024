(function () {
  "use strict";

  var search = document.getElementById("searchInput");
  var grid = document.getElementById("rulesGrid");
  var summary = document.getElementById("summary");
  var entries = [];
  var targets = new Map();

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function norm(value) { return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr"); }
  function slug(value) { return norm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

  function renderRule(rule) {
    var related = (rule.related || []).map(function (id) {
      var target = targets.get(id);
      return target ? `<a href="${esc(target.url)}">${esc(target.title)}</a>` : `<span>${esc(id)}</span>`;
    }).join(" · ");
    return `<details class="catalog-card campaign-rule-card" id="${esc(slug(rule.title))}"><summary><div class="catalog-card__head"><h3 class="catalog-card__title">${esc(rule.title)}</h3><div class="catalog-card__badges"><span class="badge badge--campaign">RÈGLE DE TABLE</span><span class="badge badge--muted">${esc(rule.status)}</span></div></div></summary><div class="catalog-card__body"><p>${esc(rule.summary)}</p><p class="campaign-rule-card__note">Source : règles propres à la campagne · statut : ${esc(rule.status)}</p>${related ? `<p class="campaign-rule-card__related"><strong>Références :</strong> ${related}</p>` : ""}</div></details>`;
  }

  function render() {
    var query = norm(search.value.trim());
    var visible = entries.filter(function (rule) { return !query || norm([rule.title, rule.summary, ...(rule.aliases || [])].join(" ")).includes(query); });
    summary.textContent = `${visible.length} règle${visible.length > 1 ? "s" : ""} affichée${visible.length > 1 ? "s" : ""} sur ${entries.length}.`;
    grid.innerHTML = visible.length ? visible.map(renderRule).join("") : `<div class="catalog-empty"><strong>Aucune règle de campagne</strong><span>Ajoutez les décisions de la table dans data/campaign-rules.json.</span></div>`;
  }

  Promise.all([
    fetch("data/campaign-rules.json", { credentials: "omit" }).then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); }),
    fetch("data/search-index.json", { credentials: "omit" }).then(function (response) { return response.ok ? response.json() : { entries: [] }; }),
    fetch("data/search-index-deep.json", { credentials: "omit" }).then(function (response) { return response.ok ? response.json() : { entries: [] }; }),
  ]).then(function (payloads) {
    entries = Array.isArray(payloads[0].entries) ? payloads[0].entries : [];
    (payloads[1].entries || []).forEach(function (entry) { targets.set(entry.id, entry); });
    (payloads[2].entries || []).forEach(function (entry) { targets.set(entry.id, entry); });
    entries.forEach(function (rule) { if (rule.status !== "house-rule") throw new Error("Invalid campaign rule status"); });
    search.addEventListener("input", render);
    render();
  }).catch(function () {
    summary.textContent = "Données indisponibles.";
    grid.innerHTML = `<div class="catalog-empty"><strong>Impossible de charger les règles de campagne</strong><span>Vérifiez data/campaign-rules.json.</span></div>`;
  });
}());
