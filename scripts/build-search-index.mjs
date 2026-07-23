import { readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

function plainText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value, length = 180) {
  const text = plainText(value);
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

function queryUrl(path, value) {
  return `${path}?q=${encodeURIComponent(value)}`;
}

async function loadGlobalData(path, key) {
  const source = await readFile(resolve(root, path), "utf8");
  const context = {};
  vm.runInNewContext(source, context, { filename: path });
  return context[key];
}

async function loadGlobalDataSets(path, keys) {
  const source = await readFile(resolve(root, path), "utf8");
  const context = {};
  vm.runInNewContext(source, context, { filename: path });
  return keys.flatMap((key) => context[key] || []);
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function textFromHtml(value) {
  return plainText(decodeHtml(value));
}

async function equipmentSearchEntries() {
  const source = await readFile(resolve(root, "armes-armures.html"), "utf8");
  const tables = [...source.matchAll(/<table class="equipment-table">([\s\S]*?)<\/table>/gi)];
  return tables.flatMap((table, tableIndex) => {
    let group = tableIndex === 0 ? "Arme" : "Armure";
    return [...table[1].matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/gi)].flatMap((row) => {
      const cells = [...row[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => textFromHtml(cell[1]));
      if (!cells.length) return [];
      if (/group-row/i.test(row[1])) {
        group = cells[0];
        return [];
      }
      const title = cells[0];
      return [{
        id: `equipment-${tableIndex + 1}-${title}`,
        title,
        category: "Objet",
        url: queryUrl("armes-armures.html", title),
        keywords: [tableIndex === 0 ? "arme" : "armure", group, ...cells.slice(1)],
        excerpt: excerpt([group, ...cells.slice(1)].join(" · ")),
      }];
    });
  });
}

async function backgroundSearchEntries() {
  const source = await readFile(resolve(root, "historique.html"), "utf8");
  const headings = [...source.matchAll(/<h3 id="([^"]+)">([\s\S]*?)<\/h3>/gi)];
  return headings.map((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? source.indexOf("</div>", start);
    const body = textFromHtml(source.slice(start, end));
    const title = textFromHtml(heading[2]);
    return {
      id: `background-${heading[1]}`,
      title,
      category: "Historique",
      url: queryUrl("historique.html", title),
      keywords: ["historique", "origine", body],
      excerpt: excerpt(body),
    };
  });
}

async function anchoredRuleEntries(path) {
  const source = await readFile(resolve(root, path), "utf8");
  const headings = [...source.matchAll(/<h3><a id="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h3>/gi)];
  return headings.map((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? source.length;
    const title = textFromHtml(heading[2]);
    const body = textFromHtml(source.slice(start, end));
    return {
      id: `rule-${path}-${heading[1]}`,
      title,
      category: "Règle",
      url: `${path}#${heading[1]}`,
      keywords: ["règle", body],
      excerpt: excerpt(body),
    };
  });
}

const spells = JSON.parse(await readFile(resolve(root, "data/spells_2024.json"), "utf8")).spells;
const monsters = JSON.parse(await readFile(resolve(root, "data/monsters_2024.json"), "utf8")).monsters;
const feats = JSON.parse(await readFile(resolve(root, "data/feats_2024.json"), "utf8")).feats;
const conditions = await loadGlobalData("js/data_condition.js", "data_condition");
const quickReferenceGroups = [
  ["js/data_movement.js", ["data_movement"], "Mouvement"],
  ["js/data_action.js", ["data_action"], "Action"],
  ["js/data_bonusaction.js", ["data_bonusaction"], "Action bonus"],
  ["js/data_reaction.js", ["data_reaction"], "Réaction"],
  ["js/data_environment.js", ["data_environment_obscurance", "data_environment_light", "data_environment_vision", "data_environment_cover"], "Environnement"],
];
const quickReferenceEntries = (await Promise.all(quickReferenceGroups.map(async ([path, keys, category]) => ({
  category,
  items: await loadGlobalDataSets(path, keys),
})))).flatMap(({ category, items }) => items.map((item, index) => ({
  id: `quickref-${category}-${index + 1}`,
  title: item.title,
  category,
  url: queryUrl("quickref.html", item.title),
  keywords: [item.subtitle, item.reference, ...(item.bullets || [])],
  excerpt: excerpt(item.description || item.bullets?.[0]),
})));
const equipment = await equipmentSearchEntries();
const backgrounds = await backgroundSearchEntries();
const rules = [
  ...(await anchoredRuleEntries("rules-2024.html")),
  ...(await anchoredRuleEntries("combat-2024.html")),
];

const classes = [
  ["Barbare", "class-barbarian.html"], ["Barde", "class-bard.html"],
  ["Clerc", "class-cleric.html"], ["Druide", "class-druid.html"],
  ["Ensorceleur", "class-sorcerer.html"], ["Guerrier", "class-fighter.html"],
  ["Magicien", "class-wizard.html"], ["Moine", "class-monk.html"],
  ["Occultiste", "class-warlock.html"], ["Paladin", "class-paladin.html"],
  ["Rôdeur", "class-rodeur.html"], ["Roublard", "class-rogue.html"],
];

const species = [
  ["Aasimar", "race-aasimar.html"], ["Drakéide", "race-drakeide.html"],
  ["Elfe", "race-elfe.html"], ["Gnome", "race-gnome.html"],
  ["Goliath", "race-goliath.html"], ["Halfelin", "race-halfelin.html"],
  ["Humain", "race-human.html"], ["Nain", "race-dwarf.html"],
  ["Orc", "race-orc.html"], ["Tieffelin", "race-tieffelin.html"],
];

const pages = [
  ["Règles du jeu", "Règle", "rules-2024.html", "Principes généraux et règles D&D 2024"],
  ["Combat", "Règle", "combat-2024.html", "Initiative, attaques et dégâts"],
  ["Maîtrises d’armes", "Règle", "mastery-2024.html", "Maîtrises et propriétés des armes"],
  ["Glossaire", "Glossaire", "glossaire.html", "Termes et états de jeu"],
  ["Équipement", "Objet", "armes-armures.html", "Armes, armures et équipement"],
  ["Création de personnage", "Page", "creation-personnage-2024.html", "Guide de création D&D 2024"],
  ["Historiques", "Historique", "historique.html", "Origines, maîtrises et dons"],
  ["Royaumes Oubliés", "Univers", "faerun.html", "Explorer Faerûn"],
  ["Histoire des Royaumes", "Univers", "histoire-royaumes.html", "Chronologie du monde"],
  ["Divinités", "Univers", "divinites.html", "Panthéon de Faerûn"],
  ["Factions", "Univers", "groupes-royaumes.html", "Groupes influents"],
  ["Personnages importants", "Univers", "personnages-royaumes.html", "Figures importantes"],
  ["Plans d’existence", "Univers", "plans-existence.html", "Les autres réalités"],
  ["Feuille de personnage", "Outil", "character-sheet-standalone.html", "Fiche autonome sauvegardée localement"],
];

const entries = [
  ...spells.map((spell) => ({
    id: `spell-${spell.id}`,
    title: spell.name,
    category: "Sort",
    url: queryUrl("spells.html", spell.name),
    keywords: [spell.school, `niveau ${spell.level}`, ...(spell.classes || []), spell.casting_time, spell.range],
    excerpt: excerpt(spell.description),
  })),
  ...monsters.map((monster) => ({
    id: `monster-${monster.id}`,
    title: monster.name,
    category: "Monstre",
    url: queryUrl("monstres.html", monster.name),
    keywords: [monster.type, monster.kind, monster.size, monster.alignment, `FP ${monster.cr}`],
    excerpt: excerpt([monster.kind || monster.type, monster.size, monster.alignment, monster.cr ? `FP ${monster.cr}` : ""].filter(Boolean).join(" · ")),
  })),
  ...feats.map((feat, index) => ({
    id: `feat-${index + 1}`,
    title: feat.name,
    category: "Don",
    url: queryUrl("dons.html", feat.name),
    keywords: [feat.category, feat.prerequis, ...(feat.aliases || []), feat.repeatable ? "répétable" : ""],
    excerpt: excerpt(feat.description),
  })),
  ...conditions.map((condition, index) => ({
    id: `condition-${index + 1}`,
    title: condition.title,
    category: "État",
    url: queryUrl("quickref.html", condition.title),
    keywords: [condition.subtitle, condition.reference],
    excerpt: excerpt(condition.description || condition.bullets?.[0]),
  })),
  ...quickReferenceEntries,
  ...equipment,
  ...backgrounds,
  ...rules,
  ...classes.map(([title, file]) => ({
    id: `class-${file}`,
    title,
    category: "Classe",
    url: `classes/${file}`,
    keywords: ["classe", "création de personnage"],
    excerpt: `Classe de personnage : ${title}.`,
  })),
  ...species.map(([title, file]) => ({
    id: `species-${file}`,
    title,
    category: "Espèce",
    url: `races/${file}`,
    keywords: ["espèce", "peuple", "origine", "création de personnage"],
    excerpt: `Espèce de personnage : ${title}.`,
  })),
  ...pages.map(([title, category, url, description], index) => ({
    id: `page-${index + 1}`,
    title,
    category,
    url,
    keywords: [category, description],
    excerpt: description,
  })),
];

entries.sort((first, second) => first.title.localeCompare(second.title, "fr"));
await writeFile(
  resolve(root, "data/search-index.json"),
  `${JSON.stringify({ version: 2, count: entries.length, entries })}${EOL}`,
  "utf8",
);
console.log(`Generated ${entries.length} search entries.`);
