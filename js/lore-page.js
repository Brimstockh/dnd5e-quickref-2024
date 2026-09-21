import { fetchJson } from "./fetch-json.js";

export const LORE_CATEGORY_LABELS = Object.freeze({
  person: "Personnage",
  deity: "Divinité",
  place: "Lieu",
  group: "Groupe / Faction",
  concept: "Concept",
  event: "Événement",
  material: "Matériau",
});

export function loreCategoryLabel(category) {
  return LORE_CATEGORY_LABELS[category] || "Autre";
}

export function validateLoreData(data) {
  return Boolean(data && data.schemaVersion === 1 && Array.isArray(data.entries) && data.entries.every((entry) => (
    entry && typeof entry.id === "string" && typeof entry.name === "string" && Array.isArray(entry.details)
  )));
}

export async function loadLoreResources({
  lorePath = new URL("../data/lore.json", import.meta.url),
  relationsPath = new URL("../data/content-relations.json", import.meta.url),
  fetchImpl = globalThis.fetch,
} = {}) {
  let data;
  try {
    data = await fetchJson(lorePath, { fetchImpl });
  } catch (error) {
    return { data: null, relationIndex: { targets: {} }, primaryError: error, relationsError: null };
  }
  if (!validateLoreData(data)) {
    return { data: null, relationIndex: { targets: {} }, primaryError: new Error("Données Lore invalides."), relationsError: null };
  }
  try {
    const relationIndex = await fetchJson(relationsPath, { fetchImpl });
    return { data, relationIndex: relationIndex && typeof relationIndex === "object" ? relationIndex : { targets: {} }, primaryError: null, relationsError: null };
  } catch (error) {
    return { data, relationIndex: { targets: {} }, primaryError: null, relationsError: error };
  }
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugFor(entry) {
  return entry.id.replace(/^lore-/, "");
}

export function loreEntryUrl(entry) {
  return entry.target || `lore.html?term=${encodeURIComponent(slugFor(entry))}`;
}

export function readLoreState(search = globalThis.location?.search || "", hash = globalThis.location?.hash || "") {
  const params = new URLSearchParams(search);
  const hashTerm = decodeURIComponent(String(hash).replace(/^#/, ""));
  return {
    query: params.get("q") || "",
    category: params.get("category") || "",
    setting: params.get("setting") || "",
    letter: (params.get("letter") || "").toLocaleUpperCase("fr"),
    term: params.get("term") || hashTerm,
  };
}

export function filterLoreEntries(entries, state) {
  const query = normalize(state.query);
  const term = normalize(state.term);
  return entries.filter((entry) => {
    if (state.category && entry.category !== state.category) return false;
    if (state.setting && !(entry.setting || []).includes(state.setting)) return false;
    if (state.letter && normalize(entry.name).charAt(0).toLocaleUpperCase("fr") !== normalize(state.letter).charAt(0).toLocaleUpperCase("fr")) return false;
    if (term && slugFor(entry) !== term) return false;
    if (!query) return true;
    return normalize([
      entry.name,
      ...(entry.aliases || []),
      entry.category,
      ...(entry.setting || []),
      entry.summary,
      ...(entry.details || []),
    ].join(" ")).includes(query);
  });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function updateUrl(state) {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.category) params.set("category", state.category);
  if (state.setting) params.set("setting", state.setting);
  if (state.letter) params.set("letter", state.letter);
  if (state.term) params.set("term", state.term);
  const query = params.toString();
  history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
}

function focusEntry(state) {
  if (!state.term) return;
  const target = document.getElementById(normalize(state.term));
  if (!target) return;
  target.tabIndex = -1;
  requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start" });
    target.focus({ preventScroll: true });
  });
}

export async function initLorePage() {
  const intro = document.querySelector("main > .card");
  if (!intro) return;
  const resources = await loadLoreResources();
  if (resources.primaryError) {
    const error = element("p", "lore-browser__error", "Le catalogue Lore est momentanément indisponible. Réessayez lorsque les données seront à nouveau accessibles.");
    error.setAttribute("role", "alert");
    intro.querySelector(".content")?.append(error);
    return;
  }
  const data = resources.data;
  const relationIndex = resources.relationIndex;

  const entriesById = new Map(data.entries.map((entry) => [entry.id, entry]));
  const browser = element("section", "lore-browser");
  const heading = element("h2", "", "Explorer le lore");
  const toolbar = element("div", "lore-browser__toolbar");
  const searchField = element("div", "lore-browser__field");
  const searchLabel = element("label", "", "Rechercher dans le lore");
  const search = element("input", "lore-browser__search");
  const categoryField = element("div", "lore-browser__field");
  const categoryLabel = element("label", "", "Type");
  const category = element("select", "lore-browser__category");
  const settingField = element("div", "lore-browser__field");
  const settingLabel = element("label", "", "Univers / cadre");
  const setting = element("select", "lore-browser__setting");
  const alphabet = element("div", "lore-browser__alphabet");
  const status = element("p", "lore-browser__status");
  const relationStatus = element("p", "lore-browser__relation-status", "Les relations externes sont momentanément indisponibles ; les entrées principales restent consultables.");
  const results = element("div", "lore-browser__results");
  const empty = element("p", "lore-browser__empty", "Aucune entrée de lore ne correspond à cette recherche.");
  let state = readLoreState();

  heading.id = "lore-browser-title";
  browser.setAttribute("aria-labelledby", heading.id);
  search.id = "lore-search";
  search.type = "search";
  search.placeholder = "Rechercher un personnage, un lieu, une faction…";
  search.setAttribute("data-page-search", "");
  search.value = state.query;
  searchLabel.htmlFor = search.id;
  category.id = "lore-category";
  categoryLabel.htmlFor = category.id;
  setting.id = "lore-setting";
  settingLabel.htmlFor = setting.id;
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  relationStatus.setAttribute("role", "status");
  relationStatus.hidden = !resources.relationsError;
  results.setAttribute("aria-label", "Résultats du lore");
  alphabet.setAttribute("aria-label", "Filtrer le lore par initiale");

  const categories = ["", ...Array.from(new Set(data.entries.map((entry) => entry.category))).sort((a, b) => a.localeCompare(b, "fr"))];
  categories.forEach((value) => {
    const option = element("option", "", value ? loreCategoryLabel(value) : "Tous les types");
    option.value = value;
    option.selected = value === state.category;
    category.appendChild(option);
  });
  const settings = ["", ...Array.from(new Set(data.entries.flatMap((entry) => entry.setting || []))).sort((a, b) => a.localeCompare(b, "fr"))];
  settings.forEach((value) => {
    const option = element("option", "", value || "Tous les univers");
    option.value = value;
    option.selected = value === state.setting;
    setting.appendChild(option);
  });

  const letters = Array.from(new Set(data.entries.map((entry) => normalize(entry.name).charAt(0).toLocaleUpperCase("fr")))).sort((a, b) => a.localeCompare(b, "fr"));
  [["", "Tout"], ...letters.map((letter) => [letter, letter])].forEach(([value, label]) => {
    const button = element("button", "lore-browser__letter", label);
    button.type = "button";
    button.dataset.letter = value;
    button.setAttribute("aria-pressed", String(state.letter === value));
    button.addEventListener("click", () => {
      state = { ...state, letter: value, term: "" };
      render(true);
    });
    alphabet.appendChild(button);
  });

  function render(syncUrl = false) {
    const filtered = filterLoreEntries(data.entries, state);
    results.replaceChildren();
    status.textContent = `${filtered.length} entrée${filtered.length > 1 ? "s" : ""} sur ${data.entries.length}.`;
    empty.hidden = filtered.length !== 0;
    alphabet.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.letter === state.letter)));

    for (const entry of filtered) {
      const card = element("article", "lore-entry");
      const title = element("h3", "", entry.name);
      const alias = element("p", "lore-entry__aliases");
      const meta = element("div", "lore-entry__meta");
      const summary = element("p", "lore-entry__summary", entry.summary);
      const details = element("ul", "lore-entry__details");
      const routeNote = element("p", "lore-entry__route-note", "Cette entrée est développée sur une page spécialisée.");
      const footer = element("footer", "lore-entry__footer");
      card.id = slugFor(entry);
      card.tabIndex = -1;
      card.classList.toggle("lore-entry--linked", Boolean(entry.target));
      alias.textContent = entry.aliases.length ? `Aussi : ${entry.aliases.join(", ")}` : "";
      alias.hidden = entry.aliases.length === 0;
      meta.append(element("span", "lore-entry__badge", loreCategoryLabel(entry.category)));
      for (const currentSetting of entry.setting || []) meta.append(element("span", "lore-entry__badge", currentSetting));
      if (entry.target) {
        routeNote.hidden = false;
      } else {
        routeNote.hidden = true;
        for (const detail of entry.details || []) details.append(element("li", "", detail));
      }
      for (const relatedId of entry.related || []) {
        const related = entriesById.get(relatedId) || relationIndex.targets?.[relatedId];
        if (!related) continue;
        const relatedLink = element("a", "", related.name || related.title);
        relatedLink.href = related.target || related.url || loreEntryUrl(related);
        relatedLink.setAttribute("aria-label", `Lore associé : ${related.name || related.title}`);
        footer.append(relatedLink);
      }
      if (entry.target) {
        const target = element("a", "", "Ouvrir la page spécialisée");
        target.href = loreEntryUrl(entry);
        footer.append(target);
      }
      card.append(title, alias, meta, summary);
      if (!details.hidden && details.childElementCount) card.append(details);
      if (!routeNote.hidden) card.append(routeNote);
      if (footer.childElementCount) card.append(footer);
      results.append(card);
    }
    if (syncUrl) updateUrl(state);
  }

  search.addEventListener("input", () => {
    state = { ...state, query: search.value, term: "" };
    render(true);
  });
  category.addEventListener("change", () => {
    state = { ...state, category: category.value, term: "" };
    render(true);
  });
  setting.addEventListener("change", () => {
    state = { ...state, setting: setting.value, term: "" };
    render(true);
  });
  window.addEventListener("popstate", () => {
    state = readLoreState();
    search.value = state.query;
    category.value = state.category;
    setting.value = state.setting;
    render(false);
    focusEntry(state);
  });
  window.addEventListener("hashchange", () => {
    state = readLoreState();
    render(false);
    focusEntry(state);
  });

  searchField.append(searchLabel, search);
  categoryField.append(categoryLabel, category);
  settingField.append(settingLabel, setting);
  toolbar.append(searchField, categoryField, settingField);
  browser.append(heading, toolbar, alphabet, status, relationStatus, results, empty);
  intro.insertAdjacentElement("afterend", browser);
  render(false);
  focusEntry(state);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLorePage, { once: true });
  else initLorePage();
}
