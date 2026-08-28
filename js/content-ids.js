const CONTENT_TYPES = Object.freeze([
  "action",
  "background",
  "bonus-action",
  "class",
  "class-feature",
  "condition",
  "environment",
  "equipment",
  "feat",
  "glossary",
  "monster",
  "magic-item",
  "movement",
  "page",
  "reaction",
  "rule",
  "species",
  "species-feature",
  "spell",
  "subclass",
  "tool",
  "adventuring-gear",
  "campaign-rule",
]);

const CONTENT_TYPE_SET = new Set(CONTENT_TYPES);
const CONTENT_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;

export function slugifyContent(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isContentType(value) {
  return CONTENT_TYPE_SET.has(String(value ?? ""));
}

export function createContentId(type, value) {
  const normalizedType = String(type ?? "");
  const slug = slugifyContent(value);
  if (!isContentType(normalizedType)) {
    throw new TypeError(`Unknown content type: ${normalizedType || "(empty)"}`);
  }
  if (!slug) {
    throw new TypeError(`Cannot create a ${normalizedType} content ID from an empty value`);
  }
  return `${normalizedType}-${slug}`;
}

export function isContentId(value) {
  const candidate = String(value ?? "");
  return CONTENT_ID_PATTERN.test(candidate)
    && CONTENT_TYPES.some((type) => candidate.startsWith(`${type}-`));
}

export function resolveContentId(value, aliases = {}) {
  const candidate = String(value ?? "");
  return Object.hasOwn(aliases, candidate) ? aliases[candidate] : candidate;
}

export function buildContentAliasMap(entries) {
  const aliases = {};
  for (const entry of entries || []) {
    if (!entry || !isContentId(entry.id)) continue;
    for (const legacyId of entry.legacyIds || []) {
      const alias = String(legacyId ?? "");
      if (!alias || alias === entry.id) continue;
      if (Object.hasOwn(aliases, alias) && aliases[alias] !== entry.id) {
        throw new TypeError(`Content alias collision: ${alias}`);
      }
      aliases[alias] = entry.id;
    }
  }
  return aliases;
}

export { CONTENT_ID_PATTERN, CONTENT_TYPES };
