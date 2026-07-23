const [creationResponse, searchResponse] = await Promise.all([
  fetch(new URL("../data/character-creation.json", import.meta.url)),
  fetch(new URL("../data/search-index.json", import.meta.url)),
]);
const creation = await creationResponse.json();
const searchIndex = await searchResponse.json();
const typeSelect = document.getElementById("compareType");
const searchInput = document.getElementById("compareSearch");
const picker = document.getElementById("comparePicker");
const table = document.getElementById("compareTable");
const status = document.getElementById("compareStatus");
let selected = [];

const labels = {
  hitDie: "Dé de vie", primary: "Caractéristique principale", savingThrows: "Sauvegardes",
  armor: "Armures", weapons: "Armes", magic: "Magie", complexity: "Complexité (éditoriale)",
  role: "Rôle (éditorial)", mobility: "Mobilité (éditoriale)", support: "Soutien (éditorial)",
  resilience: "Résistance (éditoriale)", size: "Taille", speed: "Vitesse", traits: "Traits principaux",
  abilities: "Caractéristiques", feat: "Don d’origine", skills: "Compétences",
  category: "Catégorie", excerpt: "Résumé", keywords: "Propriétés",
};

function entriesForType(type) {
  if (type === "classes") return creation.classes;
  if (type === "species") return creation.species;
  if (type === "backgrounds") return creation.backgrounds;
  return searchIndex.entries.filter((entry) => entry.type === type).map((entry) => ({
    id: entry.id, name: entry.title, category: entry.category, excerpt: entry.excerpt || "",
    keywords: entry.keywords || [], url: entry.url,
  }));
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  if ([...typeSelect.options].some((option) => option.value === params.get("type"))) typeSelect.value = params.get("type");
  selected = (params.get("compare") || "").split(",").filter(Boolean).slice(0, 4);
}

function writeUrl() {
  const params = new URLSearchParams();
  params.set("type", typeSelect.value);
  if (selected.length) params.set("compare", selected.join(","));
  history.replaceState(null, "", `${location.pathname}?${params}`);
}

function valueText(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function renderTable(entries) {
  const chosen = selected.map((id) => entries.find((entry) => entry.id === id)).filter(Boolean);
  table.className = "compare-table";
  table.replaceChildren();
  if (chosen.length < 2) {
    status.textContent = "Sélectionnez au moins deux éléments.";
    return;
  }
  status.textContent = `${chosen.length} éléments comparés.`;
  const ignored = new Set(["id", "name", "url", "standardArray"]);
  const fields = [...new Set(chosen.flatMap((entry) => Object.keys(entry)))].filter((key) => !ignored.has(key));
  const thead = document.createElement("thead");
  const heading = document.createElement("tr");
  const caption = document.createElement("caption");
  caption.className = "visually-hidden";
  caption.textContent = `Comparaison de ${chosen.map((entry) => entry.name).join(", ")}`;
  const corner = document.createElement("th");
  corner.scope = "col";
  corner.textContent = "Critère";
  heading.appendChild(corner);
  chosen.forEach((entry) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = entry.name;
    heading.appendChild(cell);
  });
  thead.appendChild(heading);
  const tbody = document.createElement("tbody");
  fields.forEach((field) => {
    const row = document.createElement("tr");
    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = labels[field] || field;
    row.appendChild(name);
    const values = chosen.map((entry) => valueText(entry[field]));
    const differs = new Set(values).size > 1;
    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      if (differs) cell.className = "compare-difference";
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.append(caption, thead, tbody);
}

function render() {
  const entries = entriesForType(typeSelect.value);
  const query = searchInput.value.trim().toLocaleLowerCase("fr");
  selected = selected.filter((id) => entries.some((entry) => entry.id === id));
  picker.replaceChildren();
  entries.filter((entry) => !query || valueText(entry.name).toLocaleLowerCase("fr").includes(query)).slice(0, 120).forEach((entry) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");
    label.className = "compare-option";
    input.type = "checkbox";
    input.checked = selected.includes(entry.id);
    input.disabled = !input.checked && selected.length >= 4;
    input.addEventListener("change", () => {
      if (input.checked) selected.push(entry.id);
      else selected = selected.filter((id) => id !== entry.id);
      writeUrl();
      render();
    });
    text.textContent = entry.name;
    label.append(input, text);
    picker.appendChild(label);
  });
  renderTable(entries);
}

typeSelect.addEventListener("change", () => { selected = []; writeUrl(); render(); });
searchInput.addEventListener("input", render);
document.getElementById("resetCompare").addEventListener("click", () => { selected = []; searchInput.value = ""; writeUrl(); render(); });
window.addEventListener("popstate", () => { readUrl(); render(); });
readUrl();
render();
