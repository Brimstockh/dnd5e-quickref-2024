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
  const category = normalizeSearch(entry.category || entry.group);
  const keywords = normalizeSearch(Array.isArray(entry.keywords) ? entry.keywords.join(" ") : entry.keywords);
  const excerpt = normalizeSearch(entry.excerpt || entry.description);
  return {
    title,
    titleTokens: tokens(title),
    category,
    keywords,
    keywordTokens: tokens(keywords),
    excerpt,
  };
}

export function scoreSearchEntry(entry, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return 0;

  const queryTokens = tokens(normalizedQuery);
  const fields = searchable(entry);
  let score = 0;

  if (fields.title === normalizedQuery) score += 1000;
  else if (fields.titleTokens.includes(normalizedQuery)) score += 750;
  else if (fields.title.startsWith(normalizedQuery)) score += 650;
  else if (fields.title.includes(normalizedQuery)) score += 450;

  for (const token of queryTokens) {
    if (fields.titleTokens.includes(token)) score += 150;
    else if (fields.titleTokens.some((word) => word.startsWith(token))) score += 110;
    else if (fields.title.includes(token)) score += 80;
    else if (fields.category === token || fields.category.split(" ").includes(token)) score += 55;
    else if (fields.keywords.includes(token)) score += 35;
    else if (fields.excerpt.includes(token)) score += 18;
    else if ([...fields.titleTokens, ...fields.keywordTokens].some((word) => isNear(token, word))) score += 12;
    else return null;
  }

  return score - Math.min(fields.title.length / 100, 1);
}

export function searchEntries(entries, query, options = {}) {
  const category = options.category || "";
  const limit = Number.isFinite(options.limit) ? options.limit : 20;
  const normalizedQuery = normalizeSearch(query);

  return entries
    .filter((entry) => !category || (entry.category || entry.group) === category)
    .map((entry) => ({ entry, score: scoreSearchEntry(entry, normalizedQuery) }))
    .filter((result) => result.score !== null)
    .sort((first, second) => (
      second.score - first.score
      || String(first.entry.title).localeCompare(String(second.entry.title), "fr")
    ))
    .slice(0, limit);
}

export function countSearchCategories(results) {
  return results.reduce((counts, result) => {
    const category = result.entry.category || result.entry.group || "Contenu";
    counts.set(category, (counts.get(category) || 0) + 1);
    return counts;
  }, new Map());
}
