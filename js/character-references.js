import { searchEntries, normalizeSearch } from "./search-engine.js";

const SHORTCUTS = Object.freeze([
  ["Attaquer", "action"],
  ["Se cacher", "action"],
  ["Agripper", "action"],
  ["Pousser", "action"],
  ["Lancer un sort", "action"],
  ["Se désengager", "action"],
]);

function asList(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map((item) => typeof item === "string" ? item : item?.name || item?.id || "")
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function exactEntry(entries, value, types = []) {
  const candidate = normalizeSearch(value);
  return entries.find((entry) => {
    if (types.length && !types.includes(entry.type)) return false;
    return normalizeSearch(entry.id) === candidate
      || normalizeSearch(entry.title) === candidate
      || (entry.aliases || []).some((alias) => normalizeSearch(alias) === candidate);
  }) || searchEntries(entries, value, { limit: 20 }).find((result) => !types.length || types.includes(result.entry.type))?.entry;
}

function reference(entries, raw, types = []) {
  const entry = exactEntry(entries, raw, types);
  return { raw: String(raw), entry: entry || null };
}

function entityReference(entries, value, type) {
  if (!String(value ?? "").trim()) return { raw: "", entry: null };
  const direct = exactEntry(entries, value, [type]);
  if (direct) return { raw: String(value), entry: direct };
  const firstWord = String(value).trim().split(/\s+/u)[0];
  return reference(entries, firstWord, [type]);
}

export function resolveCharacterReferences(character = {}, index = {}) {
  const entries = Array.isArray(index.entries) ? index.entries : [];
  const groups = [];
  const classReference = entityReference(entries, character.class, "class");
  const speciesReference = entityReference(entries, character.species, "species");

  if (classReference.raw) groups.push({ key: "class", label: "Classe", items: [classReference] });
  if (speciesReference.raw) groups.push({ key: "species", label: "Espèce", items: [speciesReference] });

  const explicitFeatures = asList(character.features || character.classFeatures || character.capacities);
  let features = explicitFeatures.map((item) => reference(entries, item, ["class-feature", "species-feature"]));
  if (!features.length && classReference.entry) {
    const level = Number(character.level) || 0;
    features = entries
      .filter((entry) => entry.type === "class-feature" && entry.className === classReference.entry.title && (!entry.subclass || entry.subclass === "") && (!entry.level || entry.level <= level))
      .sort((first, second) => (first.level || 0) - (second.level || 0) || first.title.localeCompare(second.title, "fr"))
      .map((entry) => ({ raw: entry.title, entry }));
  }
  if (features.length) groups.push({ key: "features", label: "Capacités de classe", items: features });

  const subclass = character.subclass || character.subClass || character.subclasse;
  if (subclass) groups.push({ key: "subclass", label: "Sous-classe", items: [reference(entries, subclass, ["subclass"])] });

  const feats = asList(character.feats || character.dons || character.feat);
  if (feats.length) groups.push({ key: "feats", label: "Dons", items: feats.map((item) => reference(entries, item, ["feat"])) });

  const spells = asList(character.spells || character.preparedSpells);
  if (spells.length) groups.push({ key: "spells", label: "Sorts connus / préparés", items: spells.map((item) => reference(entries, item, ["spell"])) });

  const proficiencies = character.proficiencies || {};
  const tools = asList(proficiencies.tools || character.tools);
  if (tools.length) groups.push({ key: "tools", label: "Outils maîtrisés", items: tools.map((item) => reference(entries, item, ["tool"])) });

  const weapons = asList(proficiencies.weapons).concat(asList(character.actions).map((item) => item));
  if (weapons.length) groups.push({ key: "weapons", label: "Armes principales", items: weapons.map((item) => reference(entries, item, ["equipment", "adventuring-gear"])) });

  const items = asList(character.items || character.inventory?.items || character.equipment);
  if (items.length) groups.push({ key: "items", label: "Objets", items: items.map((item) => reference(entries, item, ["magic-item", "equipment", "adventuring-gear"])) });

  const shortcuts = SHORTCUTS.map(([title]) => reference(entries, title, ["action", "movement", "reaction", "bonus-action"]));
  groups.push({ key: "shortcuts", label: "Raccourcis de combat", items: shortcuts });
  return groups;
}

export function renderCharacterReferences(root, character, index) {
  if (!root) return;
  root.replaceChildren();
  const groups = resolveCharacterReferences(character, index);
  groups.forEach((group) => {
    const section = document.createElement("section");
    const title = document.createElement("h3");
    const list = document.createElement("ul");
    section.className = "character-references__group";
    title.textContent = group.label;
    list.className = "character-references__list";
    group.items.forEach((item) => {
      const line = document.createElement("li");
      if (item.entry?.url) {
        const link = document.createElement("a");
        link.href = item.entry.url;
        link.textContent = item.entry.title;
        line.appendChild(link);
      } else {
        line.className = "character-references__unresolved";
        line.textContent = `${item.raw} (référence non indexée)`;
      }
      list.appendChild(line);
    });
    section.append(title, list);
    root.appendChild(section);
  });
  if (!groups.length) root.innerHTML = "<p class=\"muted small\">Aucune référence contextualisée disponible.</p>";
}
