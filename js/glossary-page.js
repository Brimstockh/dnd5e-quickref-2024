function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function readGlossaryState(search = globalThis.location?.search || "") {
  const params = new URLSearchParams(search);
  return {
    query: params.get("q") || "",
    category: params.get("category") || "",
    letter: (params.get("letter") || "").toLocaleUpperCase("fr"),
    term: params.get("term") || "",
  };
}

export function buildGlossarySearch(state) {
  const params = new URLSearchParams();
  if (state.query?.trim()) params.set("q", state.query.trim());
  if (state.category) params.set("category", state.category);
  if (state.letter) params.set("letter", state.letter);
  if (state.term) params.set("term", state.term);
  return params.toString();
}

export function filterGlossaryEntries(entries, state) {
  const query = normalize(state.query);
  return entries.filter((entry) => {
    if (state.category && entry.category !== state.category) return false;
    if (state.letter && normalize(entry.label).charAt(0).toLocaleUpperCase("fr") !== normalize(state.letter).charAt(0).toLocaleUpperCase("fr")) return false;
    if (!query) return true;
    return normalize([
      entry.label,
      entry.category,
      entry.summary,
      ...(entry.aliases || []),
    ].join(" ")).includes(query);
  });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function assignDefinitionAnchors(entries) {
  const headings = Array.from(document.querySelectorAll("#termes h4, #actions h4, #etats h4"));
  for (const entry of entries) {
    const heading = headings.find((candidate) => (
      normalize(candidate.textContent.replace(/\s*\[[^\]]+\]\s*$/, "")) === normalize(entry.label)
    ));
    if (!heading) continue;
    if (!heading.id) heading.id = entry.anchor;
    heading.dataset.glossaryId = entry.id;
  }
}

function focusTerm(entries, term) {
  if (!term) return;
  const entry = entries.find((candidate) => candidate.id === `glossary-${term}`);
  const heading = entry ? document.getElementById(entry.anchor) : null;
  if (!heading) return;
  heading.tabIndex = -1;
  requestAnimationFrame(() => {
    heading.scrollIntoView({ block: "start" });
    heading.focus({ preventScroll: true });
  });
}

export async function initGlossaryPage() {
  const response = await fetch(new URL("../data/glossary.json", import.meta.url));
  if (!response.ok) return;
  const data = await response.json();
  const intro = document.querySelector("main > .card");
  if (!intro) return;
  assignDefinitionAnchors(data.entries);

  const browser = element("section", "glossary-browser");
  const heading = element("h2", "", "Explorer le glossaire");
  const toolbar = element("div", "glossary-browser__toolbar");
  const searchLabel = element("label", "visually-hidden", "Rechercher un terme");
  const search = element("input", "glossary-browser__search");
  const categoryLabel = element("label", "visually-hidden", "Catégorie");
  const category = element("select", "glossary-browser__category");
  const alphabet = element("div", "glossary-browser__alphabet");
  const status = element("p", "glossary-browser__status");
  const results = element("div", "glossary-browser__results");
  const empty = element("p", "glossary-browser__empty", "Aucun terme ne correspond à cette recherche.");
  let state = readGlossaryState();

  heading.id = "glossary-browser-title";
  browser.setAttribute("aria-labelledby", heading.id);
  search.id = "glossary-search";
  search.type = "search";
  search.placeholder = "Rechercher un terme, un synonyme…";
  search.value = state.query;
  searchLabel.htmlFor = search.id;
  category.id = "glossary-category";
  categoryLabel.htmlFor = category.id;
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  results.setAttribute("aria-label", "Résultats du glossaire");
  alphabet.setAttribute("aria-label", "Filtrer par initiale");

  ["", ...Array.from(new Set(data.entries.map((entry) => entry.category))).sort((first, second) => first.localeCompare(second, "fr"))]
    .forEach((value) => {
      const option = element("option", "", value || "Toutes les catégories");
      option.value = value;
      option.selected = value === state.category;
      category.appendChild(option);
    });

  const letters = Array.from(new Set(data.entries.map((entry) => (
    normalize(entry.label).charAt(0).toLocaleUpperCase("fr")
  )))).sort((first, second) => first.localeCompare(second, "fr"));
  [["", "Tout"], ...letters.map((letter) => [letter, letter])].forEach(([value, label]) => {
    const button = element("button", "glossary-browser__letter", label);
    button.type = "button";
    button.dataset.letter = value;
    button.setAttribute("aria-pressed", String(state.letter === value));
    button.addEventListener("click", () => {
      state = { ...state, letter: value, term: "" };
      render(true);
    });
    alphabet.appendChild(button);
  });

  function updateUrl() {
    const query = buildGlossarySearch(state);
    const next = `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
    history.replaceState(null, "", next);
  }

  function render(syncUrl = false) {
    const filtered = filterGlossaryEntries(data.entries, state);
    results.replaceChildren();
    status.textContent = `${filtered.length} terme${filtered.length > 1 ? "s" : ""} sur ${data.entries.length}.`;
    empty.hidden = filtered.length !== 0;
    alphabet.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.letter === state.letter));
    });

    for (const entry of filtered) {
      const card = element("article", "glossary-entry");
      const title = element("h3", "", entry.label);
      const alias = element("p", "glossary-entry__aliases");
      const summary = element("p", "glossary-entry__summary", entry.summary);
      const footer = element("footer", "glossary-entry__footer");
      const badge = element("span", "glossary-entry__category", entry.category);
      const full = element("a", "glossary-entry__link", "Lire la définition complète");
      card.id = `glossary-card-${entry.id.replace(/^glossary-/, "")}`;
      card.dataset.contextShareParameter = "term";
      card.dataset.contextShareValue = entry.id.replace(/^glossary-/, "");
      card.dataset.contextShareTitle = entry.label;
      alias.textContent = entry.aliases.length ? `Aussi : ${entry.aliases.join(", ")}` : "";
      alias.hidden = entry.aliases.length === 0;
      full.href = `glossaire.html?term=${encodeURIComponent(entry.id.replace(/^glossary-/, ""))}`;
      footer.append(badge, full);
      if (entry.related.length) {
        const related = element("a", "glossary-entry__related", "Référence rapide");
        related.href = `quickref.html?q=${encodeURIComponent(entry.label)}`;
        footer.insertBefore(related, full);
      }
      card.append(title, alias, summary, footer);
      results.appendChild(card);
    }
    if (syncUrl) updateUrl();
  }

  search.addEventListener("input", () => {
    state = { ...state, query: search.value, term: "" };
    render(true);
  });
  category.addEventListener("change", () => {
    state = { ...state, category: category.value, term: "" };
    render(true);
  });
  window.addEventListener("popstate", () => {
    state = readGlossaryState();
    search.value = state.query;
    category.value = state.category;
    render(false);
    focusTerm(data.entries, state.term);
  });

  toolbar.append(searchLabel, search, categoryLabel, category);
  browser.append(heading, toolbar, alphabet, status, results, empty);
  intro.insertAdjacentElement("afterend", browser);
  render(false);
  focusTerm(data.entries, state.term);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlossaryPage, { once: true });
  } else {
    initGlossaryPage();
  }
}
