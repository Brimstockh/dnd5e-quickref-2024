export const SEARCH_COMMANDS = Object.freeze([
  { command: "sort", aliases: ["sort", "spell"], category: "Sort", label: "Sorts" },
  { command: "règle", aliases: ["regle", "règle", "rule"], category: "Règle", label: "Règles" },
  { command: "glossaire", aliases: ["glossaire", "glossary"], category: "Glossaire", label: "Glossaire" },
  { command: "classe", aliases: ["classe", "class"], category: "Classe", label: "Classes" },
  { command: "espèce", aliases: ["espece", "espèce", "race", "species"], category: "Espèce", label: "Espèces" },
  { command: "don", aliases: ["don", "feat"], category: "Don", label: "Dons" },
  { command: "équipement", aliases: ["equipement", "équipement", "objet", "equipment"], category: "Objet", label: "Équipement" },
  { command: "état", aliases: ["etat", "état", "condition"], category: "État", label: "États" },
  { command: "action", aliases: ["action"], category: "Action", label: "Actions" },
  { command: "monstre", aliases: ["monstre", "monster"], category: "Monstre", label: "Monstres" },
  { command: "historique", aliases: ["historique", "background"], category: "Historique", label: "Historiques" },
]);

export function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(value) {
  return normalizeSearch(value).split(" ").filter(Boolean);
}

export function parseSearchQuery(value) {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^@([^\s]+)\s*(.*)$/u);
  if (!match) return { raw, query: raw, command: "", category: "", label: "" };
  const commandName = normalizeSearch(match[1]);
  const definition = SEARCH_COMMANDS.find(({ aliases }) => (
    aliases.some((alias) => normalizeSearch(alias) === commandName)
  ));
  if (!definition) return { raw, query: raw, command: "", category: "", label: "" };
  return {
    raw,
    query: match[2].trim(),
    command: `@${definition.command}`,
    category: definition.category,
    label: definition.label,
  };
}

function isNear(first, second) {
  if (first === second) return true;
  const limit = first.length >= 7 ? 2 : first.length >= 4 ? 1 : 0;
  if (!limit || Math.abs(first.length - second.length) > limit) return false;

  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let row = 1; row <= first.length; row += 1) {
    const current = [row];
    let minimum = current[0];
    for (let column = 1; column <= second.length; column += 1) {
      const cost = first[row - 1] === second[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost,
      );
      minimum = Math.min(minimum, current[column]);
    }
    if (minimum > limit) return false;
    previous.splice(0, previous.length, ...current);
  }
  return previous[second.length] <= limit;
}

function searchable(entry) {
  const title = normalizeSearch(entry.title);
  const aliases = (entry.aliases || []).map((alias) => ({
    original: String(alias),
    normalized: normalizeSearch(alias),
  }));
  const category = normalizeSearch(entry.category || entry.group);
  const keywords = normalizeSearch(Array.isArray(entry.keywords) ? entry.keywords.join(" ") : entry.keywords);
  const excerpt = normalizeSearch(entry.excerpt || entry.description);
  return {
    title,
    titleTokens: tokens(title),
    aliases,
    aliasTokens: aliases.flatMap(({ normalized }) => tokens(normalized)),
    category,
    keywords,
    keywordTokens: tokens(keywords),
    excerpt,
  };
}

function evaluateSearchEntry(entry, query, options = {}) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return { score: 0, reason: "" };

  const queryTokens = tokens(normalizedQuery);
  const fields = searchable(entry);
  const exactAlias = fields.aliases.find(({ normalized }) => normalized === normalizedQuery);
  let score = 0;
  let reason = "";

  if (fields.title === normalizedQuery) {
    score += 1000;
    reason = "Titre exact";
  } else if (exactAlias) {
    score += 850;
    reason = `Alias : ${exactAlias.original}`;
  } else if (fields.titleTokens.includes(normalizedQuery)) {
    score += 750;
    reason = "Titre";
  } else if (fields.title.startsWith(normalizedQuery)) {
    score += 650;
    reason = "Début du titre";
  } else if (fields.title.includes(normalizedQuery)) {
    score += 450;
    reason = "Titre";
  } else {
    const alias = fields.aliases.find(({ normalized }) => normalized.includes(normalizedQuery));
    if (alias) {
      score += 320;
      reason = `Alias : ${alias.original}`;
    }
  }

  for (const token of queryTokens) {
    if (fields.titleTokens.includes(token)) {
      score += 150;
      reason ||= "Titre";
    } else if (fields.titleTokens.some((word) => word.startsWith(token))) {
      score += 110;
      reason ||= "Titre";
    } else if (fields.title.includes(token)) {
      score += 80;
      reason ||= "Titre";
    } else {
      const alias = fields.aliases.find(({ normalized }) => normalized.includes(token));
      if (alias) {
        score += 70;
        reason ||= `Alias : ${alias.original}`;
      } else if (fields.category === token || fields.category.split(" ").includes(token)) {
        score += 55;
        reason ||= "Catégorie";
      } else if (fields.keywords.includes(token)) {
        score += 35;
        reason ||= "Mot-clé";
      } else if (fields.excerpt.includes(token)) {
        score += 18;
        reason ||= "Extrait";
      } else if ([...fields.titleTokens, ...fields.aliasTokens, ...fields.keywordTokens].some((word) => isNear(token, word))) {
        score += 12;
        reason ||= "Correspondance approchée";
      } else {
        return null;
      }
    }
  }

  if (options.boostIds?.has(entry.id)) {
    score += 45;
    reason ||= "Suggéré pour le profil actif";
  }
  if (options.recentUrls?.has(entry.url || entry.path)) {
    score += 25;
    reason ||= "Consulté récemment";
  }
  return {
    score: score - Math.min(fields.title.length / 100, 1),
    reason: reason || "Correspondance",
  };
}

export function scoreSearchEntry(entry, query, options = {}) {
  return evaluateSearchEntry(entry, query, options)?.score ?? null;
}

export function searchEntries(entries, query, options = {}) {
  const parsed = parseSearchQuery(query);
  const category = options.category || parsed.category || "";
  const limit = Number.isFinite(options.limit) ? options.limit : 20;
  const boostIds = new Set(options.boostIds || []);
  const recentUrls = new Set(options.recentUrls || []);

  return entries
    .filter((entry) => !category || (entry.category || entry.group) === category)
    .map((entry) => {
      const match = evaluateSearchEntry(entry, parsed.query, { boostIds, recentUrls });
      return match ? { entry, ...match } : null;
    })
    .filter(Boolean)
    .sort((first, second) => (
      second.score - first.score
      || String(first.entry.title).localeCompare(String(second.entry.title), "fr")
    ))
    .slice(0, limit);
}

function foldedText(value) {
  let folded = "";
  const positions = [];
  let offset = 0;
  for (const character of String(value ?? "")) {
    const length = character.length;
    const normalized = character
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr")
      .replace(/[^a-z0-9]/g, " ");
    for (const foldedCharacter of normalized) {
      folded += foldedCharacter;
      positions.push({ start: offset, end: offset + length });
    }
    offset += length;
  }
  return { folded, positions };
}

export function highlightSearchText(value, query) {
  const text = String(value ?? "");
  const parsed = parseSearchQuery(query);
  const queryTokens = tokens(parsed.query);
  if (!text || !queryTokens.length) return [{ text, match: false }];

  const { folded, positions } = foldedText(text);
  const ranges = [];
  for (const token of queryTokens) {
    let index = folded.indexOf(token);
    while (index !== -1) {
      const first = positions[index];
      const last = positions[index + token.length - 1];
      if (first && last) ranges.push([first.start, last.end]);
      index = folded.indexOf(token, index + token.length);
    }
  }
  if (!ranges.length) return [{ text, match: false }];
  ranges.sort((first, second) => first[0] - second[0]);
  const merged = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([...range]);
  }

  const segments = [];
  let offset = 0;
  for (const [start, end] of merged) {
    if (start > offset) segments.push({ text: text.slice(offset, start), match: false });
    segments.push({ text: text.slice(start, end), match: true });
    offset = end;
  }
  if (offset < text.length) segments.push({ text: text.slice(offset), match: false });
  return segments;
}

export function countSearchCategories(results) {
  return results.reduce((counts, result) => {
    const category = result.entry.category || result.entry.group || "Contenu";
    counts.set(category, (counts.get(category) || 0) + 1);
    return counts;
  }, new Map());
}
