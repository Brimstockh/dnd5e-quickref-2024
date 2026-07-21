function text(value, fallback) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function formatSpell(spell, index) {
  return [
    `${index + 1}. ${text(spell.name, "Sort sans nom")}`,
    `Niveau : ${text(spell.level, "-")}`,
    `École : ${text(spell.school, "-")}`,
    `Classes : ${Array.isArray(spell.classes) && spell.classes.length ? spell.classes.join(", ") : "-"}`,
    `Temps d'incantation : ${text(spell.casting_time, "-")}`,
    `Portée : ${text(spell.range, "-")}`,
    `Composantes : ${text(spell.components, "-")}`,
    `Durée : ${text(spell.duration, "-")}`,
    "",
    text(spell.description, "Description non disponible."),
  ].join("\n");
}

export function buildSpellExportText(spells) {
  const items = Array.isArray(spells) ? spells : [];
  const header = `SORTS D&D 2024\n${items.length} sort(s) exporté(s)`;
  if (!items.length) return `${header}\n`;
  return `${header}\n\n${items.map(formatSpell).join("\n\n------------------------------------------------------------------------\n\n")}\n`;
}
