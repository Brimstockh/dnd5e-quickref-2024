/**
 * Canonical information architecture for the public site.
 *
 * A navigation entry owns its URL, labels, content metadata, and optional
 * child-page matchers. Consumers should use the helpers below instead of
 * reading HTML data-active values as their primary source of truth.
 */

function entry({
    id,
    label,
    url,
    description,
    group = "",
    icon,
    category,
    contentId = "",
    matches = [],
}) {
    return Object.freeze({
        id,
        label,
        url,
        description,
        group,
        icon,
        category,
        type: "page",
        contentId,
        matches: Object.freeze([url, ...matches]),
    });
}

function section({ id, label, description, landing, icon, artwork, accent, actionLabel, groups = [], links }) {
    return Object.freeze({
        id,
        label,
        description,
        landing,
        icon,
        artwork: Object.freeze({ ...artwork }),
        accent,
        actionLabel,
        groups: Object.freeze(groups.map((group) => Object.freeze({ ...group }))),
        links: Object.freeze(links),
    });
}

export const SITE_SECTIONS = Object.freeze([
    section({
        id: "rules",
        label: "Règles",
        description: "Comprendre et appliquer les règles du jeu.",
        landing: "regles.html",
        icon: "rules",
        artwork: { src: "assets/images/rules-game-table.webp", position: "center 45%" },
        accent: "#6f91aa",
        actionLabel: "Explorer les règles",
        links: [
            entry({ id: "rules-hub", label: "Explorer les règles", url: "regles.html", description: "Le point d’entrée des règles du jeu.", icon: "rules", category: "Règle" }),
            entry({ id: "quickref", label: "Référence rapide", url: "quickref.html", description: "Actions, conditions et environnement", icon: "quick-reference", category: "Règle", contentId: "page-reference-rapide" }),
            entry({ id: "rules", label: "Règles du jeu", url: "rules-2024.html", description: "Principes généraux 2024", icon: "rules", category: "Règle", contentId: "page-regles-du-jeu" }),
            entry({ id: "combat", label: "Combat", url: "combat-2024.html", description: "Initiative, attaques et dégâts", icon: "combat", category: "Règle", contentId: "page-combat" }),
            entry({ id: "mastery", label: "Maîtrises", url: "mastery-2024.html", description: "Maîtrises d’armes et actions", icon: "mastery", category: "Règle", contentId: "page-maitrises-d-armes" }),
            entry({ id: "glossary", label: "Glossaire", url: "glossaire.html", description: "Termes et états de jeu", icon: "glossary", category: "Glossaire", contentId: "page-glossaire" }),
        ],
    }),
    section({
        id: "compendium",
        label: "Compendium",
        description: "Consulter les ressources et catalogues du jeu.",
        landing: "compendium.html",
        icon: "spells",
        artwork: { src: "assets/images/compendium-library.webp", position: "center 42%" },
        accent: "#809b65",
        actionLabel: "Ouvrir le compendium",
        links: [
            entry({ id: "compendium-hub", label: "Ouvrir le compendium", url: "compendium.html", description: "Les ressources et catalogues de D&D 2024.", icon: "spells", category: "Compendium" }),
            entry({ id: "spells", label: "Sorts", url: "spells.html", description: "Catalogue des sorts", icon: "spells", category: "Sort", contentId: "page-sorts" }),
            entry({ id: "monsters", label: "Monstres", url: "monstres.html", description: "Bestiaire", icon: "monsters", category: "Monstre", contentId: "page-monstres" }),
            entry({ id: "equipment", label: "Armes et armures", url: "armes-armures.html", description: "Armes, armures et propriétés", icon: "equipment", category: "Équipement", contentId: "page-equipement" }),
            entry({ id: "adventuring-gear", label: "Matériel d’aventurier", url: "outils-aventurier.html", description: "Outils, paquetages et objets", icon: "equipment", category: "Matériel" }),
            entry({ id: "magic-items", label: "Objets magiques", url: "objets-magiques.html", description: "Objets magiques de la campagne", icon: "magic-item", category: "Objet magique" }),
            entry({ id: "services", label: "Services, montures et véhicules", url: "services-montures-vehicules.html", description: "Voyages, montures, véhicules et dépenses", icon: "equipment", category: "Équipement" }),
        ],
    }),
    section({
        id: "creation",
        label: "Création",
        description: "Créer et préparer un personnage pour l’aventure.",
        landing: "creation.html",
        icon: "character-sheet",
        artwork: { src: "assets/images/creation-hero.webp", position: "center 42%" },
        accent: "#b38a45",
        actionLabel: "Explorer la création",
        groups: [
            { id: "create", label: "Créer" },
            { id: "options", label: "Options de personnage" },
        ],
        links: [
            entry({ id: "creation-hub", label: "Explorer la création", url: "creation.html", description: "Le point d’entrée de la création de personnage.", icon: "character-sheet", category: "Création" }),
            entry({ id: "creator", label: "Assistant guidé", url: "assistant-creation.html", description: "Création en 11 étapes", group: "create", icon: "character-sheet", category: "Création" }),
            entry({ id: "creation", label: "Guide de création", url: "creation-personnage-2024.html", description: "Créer un personnage pas à pas", group: "create", icon: "character-sheet", category: "Création", contentId: "page-creation-de-personnage" }),
            entry({ id: "compare", label: "Comparateur", url: "comparateur.html", description: "Comparer classes, espèces et options", group: "create", icon: "compare", category: "Comparateur" }),
            entry({ id: "sheet", label: "Feuille de personnage", url: "character-sheet-standalone.html", description: "Feuille autonome sauvegardée localement", group: "create", icon: "character-sheet", category: "Feuille de personnage" }),
            entry({ id: "classes", label: "Classes", url: "classes/index.html", description: "Les douze classes", group: "options", icon: "classes", category: "Classe", matches: ["classes/"] }),
            entry({ id: "species", label: "Espèces", url: "races/index.html", description: "Peuples et origines", group: "options", icon: "species", category: "Espèce", matches: ["races/"] }),
            entry({ id: "backgrounds", label: "Historiques", url: "historique.html", description: "Dons et compétences d’origine", group: "options", icon: "backgrounds", category: "Historique" }),
            entry({ id: "feats", label: "Dons", url: "dons.html", description: "Capacités spéciales", group: "options", icon: "feats", category: "Don" }),
        ],
    }),
    section({
        id: "universe",
        label: "Univers",
        description: "Explorer Faerûn et les autres réalités du multivers.",
        landing: "univers.html",
        icon: "planes",
        artwork: { src: "assets/images/faerun-city.webp", position: "center 44%" },
        accent: "#98778f",
        actionLabel: "Explorer l’univers",
        links: [
            entry({ id: "universe-hub", label: "Explorer l’univers", url: "univers.html", description: "L’index des ressources de l’univers.", icon: "planes", category: "Univers" }),
            entry({ id: "faerun", label: "Faerûn / Royaumes Oubliés", url: "faerun.html", description: "Explorer Faerûn", icon: "faerun", category: "Univers" }),
            entry({ id: "lore", label: "Lore / index du multivers", url: "lore.html", description: "Index transversal du multivers", icon: "planes", category: "Lore" }),
            entry({ id: "history", label: "Histoire", url: "histoire-royaumes.html", description: "Chronologie du monde", icon: "history", category: "Univers" }),
            entry({ id: "gods", label: "Divinités", url: "divinites.html", description: "Panthéon de Faerûn", icon: "gods", category: "Univers" }),
            entry({ id: "factions", label: "Factions", url: "groupes-royaumes.html", description: "Groupes influents", icon: "factions", category: "Univers" }),
            entry({ id: "people", label: "Personnages importants", url: "personnages-royaumes.html", description: "Figures importantes", icon: "characters", category: "Univers" }),
            entry({ id: "planes", label: "Plans d’existence", url: "plans-existence.html", description: "Les autres réalités", icon: "planes", category: "Univers" }),
        ],
    }),
    section({
        id: "table",
        label: "Ma table",
        description: "Retrouver vos personnages et les outils de votre campagne.",
        landing: "ma-table.html",
        icon: "session",
        artwork: { src: "assets/images/table-adventurers.webp", position: "center 45%" },
        accent: "#a14b42",
        actionLabel: "Ouvrir Ma table",
        links: [
            entry({ id: "table-hub", label: "Ouvrir Ma table", url: "ma-table.html", description: "Les ressources personnelles et de campagne.", icon: "session", category: "Ma table" }),
            entry({ id: "personal", label: "Espace personnel", url: "espace-personnel.html", description: "Bibliothèque, notes et profils", icon: "characters", category: "Espace personnel" }),
            entry({ id: "characters", label: "Personnages sauvegardés", url: "html/characters.html", description: "Consulter les personnages", icon: "characters", category: "Personnage", matches: ["html/character.html", "html/character-profile.html"] }),
            entry({ id: "campaign-rules", label: "Règles de campagne", url: "regles-campagne.html", description: "Décisions propres à notre table", icon: "rules", category: "Règle de campagne" }),
            entry({ id: "dice-stats", label: "Statistiques de dés", url: "dice-stats.html", description: "Probabilités et distributions des jets de dés", icon: "dice", category: "Outil" }),
        ],
    }),
]);

export function buildSectionFilterDefinitions(groups, matches) {
    const results = Array.isArray(matches) ? matches : [];
    const counts = new Map();
    results.forEach((entryDefinition) => {
        if (!entryDefinition?.section) return;
        counts.set(entryDefinition.section, (counts.get(entryDefinition.section) || 0) + 1);
    });
    return [
        { value: "", label: "Tout", count: results.length, disabled: false },
        ...groups.map((group) => {
            const count = counts.get(group.label) || 0;
            return { value: group.label, label: group.label, count, disabled: count === 0 };
        }),
    ];
}

export function normalizeNavigationPath(path) {
    const raw = String(path ?? "");
    let pathname = raw;
    try {
        pathname = new URL(raw, "https://dnd-navigation.invalid/").pathname;
    } catch {
        pathname = raw.split(/[?#]/, 1)[0];
    }
    pathname = pathname
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(/^\.\//, "");
    return pathname || "index.html";
}

function pathMatches(candidate, matcher) {
    const normalizedCandidate = normalizeNavigationPath(candidate);
    const normalizedMatcher = normalizeNavigationPath(matcher);
    if (normalizedMatcher.endsWith("/")) {
        const directory = normalizedMatcher.replace(/\/+$/, "");
        return normalizedCandidate === directory
            || normalizedCandidate.startsWith(`${directory}/`)
            || normalizedCandidate.endsWith(`/${directory}`)
            || normalizedCandidate.includes(`/${directory}/`);
    }
    return normalizedCandidate === normalizedMatcher || normalizedCandidate.endsWith(`/${normalizedMatcher}`);
}

function matchingScore(candidate, matcher) {
    const normalizedMatcher = normalizeNavigationPath(matcher);
    if (!pathMatches(candidate, normalizedMatcher)) return -1;
    return normalizedMatcher.endsWith("/") ? normalizedMatcher.length - 1 : normalizedMatcher.length + 10000;
}

export function navigationContextForPath(path) {
    const normalizedPath = normalizeNavigationPath(path);
    let match = null;

    for (const section of SITE_SECTIONS) {
        for (const entryDefinition of section.links) {
            const score = Math.max(...entryDefinition.matches.map((matcher) => matchingScore(normalizedPath, matcher)));
            if (score < 0 || (match && score <= match.score)) continue;
            match = { score, section, entry: entryDefinition };
        }
    }

    if (!match) return null;
    return {
        section: match.section,
        entry: match.entry,
    };
}

export function navigationEntryForPath(path) {
    return navigationContextForPath(path)?.entry || null;
}

export function navigationSectionForPath(path) {
    return navigationContextForPath(path)?.section?.label || "";
}
