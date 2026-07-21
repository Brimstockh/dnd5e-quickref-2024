(function (root) {
  "use strict";

  const searchTextCache = new WeakMap();

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function getSearchText(spell) {
    if (searchTextCache.has(spell)) return searchTextCache.get(spell);

    const text = normalize([
      spell.name,
      spell.school,
      ...(Array.isArray(spell.classes) ? spell.classes : []),
      spell.description,
    ].join(" "));
    searchTextCache.set(spell, text);
    return text;
  }

  function filterAndSortSpells(spells, {
    query = "",
    level = null,
    selectedClasses = new Set(),
    sort = "name_asc",
  } = {}) {
    const normalizedQuery = normalize(query).trim();
    const classFilter = selectedClasses instanceof Set
      ? selectedClasses
      : new Set(selectedClasses);
    const items = Array.isArray(spells) ? spells : [];

    const filtered = items.filter((spell) => {
      if (level !== null && spell.level !== level) return false;
      if (classFilter.size > 0) {
        const classes = Array.isArray(spell.classes) ? spell.classes : [];
        if (!classes.some((name) => classFilter.has(name))) return false;
      }
      return !normalizedQuery || getSearchText(spell).includes(normalizedQuery);
    });

    return filtered.sort((a, b) => {
      const nameComparison = String(a.name ?? "").localeCompare(String(b.name ?? ""), "fr");
      if (sort === "level_asc") return a.level - b.level || nameComparison;
      if (sort === "level_desc") return b.level - a.level || nameComparison;
      if (sort === "name_desc") return -nameComparison;
      return nameComparison;
    });
  }

  root.DndSpellFilters = root.DndSpellFilters || {};
  root.DndSpellFilters.filterAndSortSpells = filterAndSortSpells;
})(globalThis);
