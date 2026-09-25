/**
 * Canonical information architecture for the public site.
 *
 * Link tuples are kept compact so the classic site shell can consume them
 * without a framework: [id, label, url, description, groupId, icon].
 */
export const SITE_SECTIONS = Object.freeze([
    {
        id: "rules",
        label: "Règles",
        description: "Comprendre et appliquer les règles du jeu.",
        landing: "regles.html",
        icon: "rules",
        groups: [],
        links: [
            ["rules-hub", "Explorer les règles", "regles.html", "Le point d’entrée des règles du jeu.", "", "rules"],
            ["quickref", "Référence rapide", "quickref.html", "Actions, conditions et environnement", "", "quick-reference"],
            ["rules", "Règles du jeu", "rules-2024.html", "Principes généraux 2024", "", "rules"],
            ["combat", "Combat", "combat-2024.html", "Initiative, attaques et dégâts", "", "combat"],
            ["mastery", "Maîtrises", "mastery-2024.html", "Maîtrises d’armes et actions", "", "mastery"],
            ["glossary", "Glossaire", "glossaire.html", "Termes et états de jeu", "", "glossary"],
        ],
    },
    {
        id: "compendium",
        label: "Compendium",
        description: "Consulter les ressources et catalogues du jeu.",
        landing: "compendium.html",
        icon: "spells",
        groups: [],
        links: [
            ["compendium-hub", "Ouvrir le compendium", "compendium.html", "Les ressources et catalogues de D&D 2024.", "", "spells"],
            ["spells", "Sorts", "spells.html", "Catalogue des sorts", "", "spells"],
            ["monsters", "Monstres", "monstres.html", "Bestiaire", "", "monsters"],
            ["equipment", "Armes et armures", "armes-armures.html", "Armes, armures et propriétés", "", "equipment"],
            ["adventuring-gear", "Matériel d’aventurier", "outils-aventurier.html", "Outils, paquetages et objets", "", "equipment"],
            ["magic-items", "Objets magiques", "objets-magiques.html", "Objets magiques de la campagne", "", "magic-item"],
            ["services", "Services, montures et véhicules", "services-montures-vehicules.html", "Voyages, montures, véhicules et dépenses", "", "equipment"],
        ],
    },
    {
        id: "creation",
        label: "Création",
        description: "Créer et préparer un personnage pour l’aventure.",
        landing: "creation.html",
        icon: "character-sheet",
        groups: [
            { id: "create", label: "Créer" },
            { id: "options", label: "Options de personnage" },
        ],
        links: [
            ["creation-hub", "Explorer la création", "creation.html", "Le point d’entrée de la création de personnage.", "", "character-sheet"],
            ["creator", "Assistant guidé", "assistant-creation.html", "Création en 11 étapes", "create", "character-sheet"],
            ["creation", "Guide de création", "creation-personnage-2024.html", "Créer un personnage pas à pas", "create", "character-sheet"],
            ["compare", "Comparateur", "comparateur.html", "Comparer classes, espèces et options", "create", "compare"],
            ["sheet", "Feuille de personnage", "character-sheet-standalone.html", "Feuille autonome sauvegardée localement", "create", "character-sheet"],
            ["classes", "Classes", "classes/index.html", "Les douze classes", "options", "classes"],
            ["species", "Espèces", "races/index.html", "Peuples et origines", "options", "species"],
            ["backgrounds", "Historiques", "historique.html", "Dons et compétences d’origine", "options", "backgrounds"],
            ["feats", "Dons", "dons.html", "Capacités spéciales", "options", "feats"],
        ],
    },
    {
        id: "universe",
        label: "Univers",
        description: "Explorer Faerûn et les autres réalités du multivers.",
        landing: "univers.html",
        icon: "planes",
        groups: [],
        links: [
            ["universe-hub", "Explorer l’univers", "univers.html", "L’index des ressources de l’univers.", "", "planes"],
            ["faerun", "Faerûn / Royaumes Oubliés", "faerun.html", "Explorer Faerûn", "", "faerun"],
            ["lore", "Lore / index du multivers", "lore.html", "Index transversal du multivers", "", "planes"],
            ["history", "Histoire", "histoire-royaumes.html", "Chronologie du monde", "", "history"],
            ["gods", "Divinités", "divinites.html", "Panthéon de Faerûn", "", "gods"],
            ["factions", "Factions", "groupes-royaumes.html", "Groupes influents", "", "factions"],
            ["people", "Personnages importants", "personnages-royaumes.html", "Figures importantes", "", "characters"],
            ["planes", "Plans d’existence", "plans-existence.html", "Les autres réalités", "", "planes"],
        ],
    },
    {
        id: "table",
        label: "Ma table",
        description: "Retrouver vos personnages et les outils de votre campagne.",
        landing: "ma-table.html",
        icon: "session",
        groups: [],
        links: [
            ["table-hub", "Ouvrir Ma table", "ma-table.html", "Les ressources personnelles et de campagne.", "", "session"],
            ["personal", "Espace personnel", "espace-personnel.html", "Bibliothèque, notes et profils", "", "characters"],
            ["characters", "Personnages sauvegardés", "html/characters.html", "Consulter les personnages", "", "characters"],
            ["campaign-rules", "Règles de campagne", "regles-campagne.html", "Décisions propres à notre table", "", "rules"],
            ["dice-stats", "Statistiques de dés", "dice-stats.html", "Probabilités et distributions des jets de dés", "", "dice"],
        ],
    },
]);

export function navigationSectionForPath(path) {
    const normalized = String(path || "").split(/[?#]/, 1)[0].replace(/^\.\//, "") || "index.html";
    return SITE_SECTIONS.find((section) => section.links.some((link) => link[2] === normalized))?.label || "";
}

