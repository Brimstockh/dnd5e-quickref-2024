import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../outils-aventurier.html", import.meta.url), "utf8");
const artisanNames = [
  "Matériel d'alchimiste",
  "Matériel de brasseur",
  "Matériel de calligraphe",
  "Outils de charpentier",
  "Outils de cartographe",
  "Outils de cordonnier",
  "Ustensiles de cuisinier",
  "Outils de souffleur de verre",
  "Outils de joaillier",
  "Outils de tanneur",
  "Outils de maçon",
  "Matériel de peintre",
  "Outils de potier",
  "Outils de forgeron",
  "Outils de bricoleur",
  "Outils de tisserand",
  "Outils de menuisier",
];
const otherNames = [
  "Accessoires de déguisement",
  "Matériel de contrefaçon",
  "Boîte de jeux",
  "Matériel d'herboriste",
  "Instrument de musique",
  "Instruments de navigateur",
  "Matériel d'empoisonneur",
  "Outils de voleur",
];

function sectionBetween(startMarker, endMarker) {
  const start = page.indexOf(startMarker);
  const end = page.indexOf(endMarker, start);
  assert.notEqual(start, -1, `missing section marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing section marker: ${endMarker}`);
  return page.slice(start, end);
}

function card(name) {
  const marker = `<h4>${name}`;
  const start = page.indexOf(marker);
  assert.notEqual(start, -1, `missing tool card: ${name}`);
  const next = page.indexOf("<h4>", start + marker.length);
  return page.slice(start, next === -1 ? page.length : next);
}

function assertIncludesAll(value, terms, label) {
  for (const term of terms) assert.match(value, new RegExp(term, "i"), `${label}: ${term}`);
}

test("the tools page contains the complete 17 + 8 PH2024 tool families without duplicates", () => {
  const artisanSection = sectionBetween("<h3>Outils d'artisan</h3>", "<h3>Autres outils</h3>");
  const otherSection = sectionBetween("<h3>Autres outils</h3>", "<h3>Matériel d'aventurier</h3>");
  const artisanCards = [...artisanSection.matchAll(/<h4>([^<]+?)(?: \([^<]+\))?<\/h4>/g)].map((match) => match[1]);
  const otherCards = [...otherSection.matchAll(/<h4>([^<]+?)(?: \([^<]+\))?<\/h4>/g)].map((match) => match[1]);

  assert.equal(artisanCards.length, 17);
  assert.equal(otherCards.length, 8);
  assert.deepEqual(new Set(artisanCards), new Set(artisanNames));
  assert.deepEqual(new Set(otherCards), new Set(otherNames));
  assert.equal(new Set([...artisanCards, ...otherCards]).size, 25);
});

test("all 25 tool cards retain their PH2024 price, weight, ability, and Utilize field", () => {
  const metadata = [
    ["Matériel d'alchimiste", "50 po", "4 kg", "Intelligence"],
    ["Matériel de brasseur", "20 po", "4,5 kg", "Intelligence"],
    ["Matériel de calligraphe", "10 po", "2,5 kg", "Dextérité"],
    ["Outils de charpentier", "8 po", "3 kg", "Force"],
    ["Outils de cartographe", "15 po", "3 kg", "Sagesse"],
    ["Outils de cordonnier", "5 po", "2,5 kg", "Dextérité"],
    ["Ustensiles de cuisinier", "1 po", "4 kg", "Sagesse"],
    ["Outils de souffleur de verre", "30 po", "2,5 kg", "Intelligence"],
    ["Outils de joaillier", "25 po", "1 kg", "Intelligence"],
    ["Outils de tanneur", "5 po", "2,5 kg", "Dextérité"],
    ["Outils de maçon", "10 po", "4 kg", "Force"],
    ["Matériel de peintre", "10 po", "2,5 kg", "Sagesse"],
    ["Outils de potier", "10 po", "1,5 kg", "Intelligence"],
    ["Outils de forgeron", "20 po", "4 kg", "Force"],
    ["Outils de bricoleur", "50 po", "5 kg", "Dextérité"],
    ["Outils de tisserand", "1 po", "2,5 kg", "Dextérité"],
    ["Outils de menuisier", "1 po", "2,5 kg", "Dextérité"],
    ["Accessoires de déguisement", "25 po", "1,5 kg", "Charisme"],
    ["Matériel de contrefaçon", "15 po", "2,5 kg", "Dextérité"],
    ["Boîte de jeux", "variable", "-", "Sagesse"],
    ["Matériel d'herboriste", "5 po", "1,5 kg", "Intelligence"],
    ["Instrument de musique", "variable", "variable", "Charisme"],
    ["Instruments de navigateur", "25 po", "1 kg", "Sagesse"],
    ["Matériel d'empoisonneur", "50 po", "1 kg", "Intelligence"],
    ["Outils de voleur", "25 po", "0,5 kg", "Dextérité"],
  ];

  for (const [name, price, weight, ability] of metadata) {
    const tool = card(`${name} (${price})`);
    assert.match(tool, new RegExp(`Carac\\.</strong> ${ability}\\.`), `${name}: ability`);
    assert.match(tool, new RegExp(`Poids\\.</strong> ${weight}\\.`), `${name}: weight`);
    assert.match(tool, /<strong>Utilisation\.<\/strong>/, `${name}: Utilize field`);
    assert.match(tool, /DD \d+/, `${name}: Utilize DC`);
  }
});

test("closed Craft lists preserve PH2024 exclusions and named objects", () => {
  const smith = card("Outils de forgeron");
  assertIncludesAll(smith, [
    "Armes de mêlée sauf",
    "gourdin",
    "massue",
    "bâton de combat",
    "fouet",
    "armures intermédiaires sauf armure de peaux",
    "armures lourdes",
    "billes",
    "seau",
    "chausse-trappes",
    "chaîne",
    "pied-de-biche",
    "balles d'arme à feu",
    "grappin",
    "pot en fer",
    "pointes en fer",
    "billes de fronde",
  ], "smith Craft list");
  assert.doesNotMatch(smith, /toutes les armes de mêlée/i);

  const woodcarver = card("Outils de menuisier");
  assertIncludesAll(woodcarver, [
    "gourdin",
    "massue",
    "bâton de combat",
    "armes à distance sauf",
    "pistolet",
    "mousquet",
    "fronde",
    "focaliseur arcanique",
    "flèches",
    "carreaux",
    "focaliseur druidique",
    "porte-plume",
    "aiguilles",
  ], "woodcarver Craft list");
  assert.doesNotMatch(woodcarver, /toutes les armes à distance/i);

  assertIncludesAll(card("Outils de bricoleur"), [
    "mousquet", "pistolet", "cloche", "lanterne sourde", "flasque", "lanterne à capote",
    "piège à mâchoires", "cadenas", "menottes", "miroir", "pelle", "sifflet", "boîte à amadou",
  ], "tinker Craft list");
  assert.doesNotMatch(card("Outils de bricoleur"), /autres objets techniques/i);

  assertIncludesAll(card("Outils de charpentier"), [
    "gourdin", "massue", "bâton de combat", "tonneau", "coffre", "échelle", "perche", "bélier portable", "torche",
  ], "carpenter Craft list");
  assertIncludesAll(card("Outils de tanneur"), [
    "fronde", "fouet", "armure de peaux", "armure de cuir", "armure de cuir clouté", "sac à dos",
    "étui à carreaux d'arbalète", "étui à carte ou parchemin", "parchemin", "sacoche", "carquois", "outre pleine",
  ], "leatherworker Craft list");
  assertIncludesAll(card("Outils de tisserand"), [
    "armure matelassée", "panier", "sac de couchage", "couverture", "beaux habits", "filet", "robe", "corde",
    "sac", "ficelle", "tente", "tenue de voyage",
  ], "weaver Craft list");
});

test("game and musical tool variants preserve their individual prices and weights", () => {
  const games = card("Boîte de jeux");
  assert.equal((games.match(/class="variant-table"/g) ?? []).length, 1);
  assertIncludesAll(games, [
    "<td>Dés</td><td>1 pa</td>",
    "<td>Échecs draconiques</td><td>1 po</td>",
    "<td>Cartes</td><td>5 pa</td>",
    "<td>Jeu des trois dragons</td><td>1 po</td>",
    "DD 10",
    "DD 20",
  ], "gaming set variants");

  const instruments = card("Instrument de musique");
  assert.equal((instruments.match(/<tr>/g) ?? []).length, 11);
  assertIncludesAll(instruments, [
    "<td>Cornemuse</td><td>30 po</td><td>3 kg</td>",
    "<td>Tambour</td><td>6 po</td><td>1,5 kg</td>",
    "<td>Tympanon</td><td>25 po</td><td>5 kg</td>",
    "<td>Flûte</td><td>2 po</td><td>0,5 kg</td>",
    "<td>Cor</td><td>3 po</td><td>1 kg</td>",
    "<td>Luth</td><td>35 po</td><td>1 kg</td>",
    "<td>Lyre</td><td>30 po</td><td>1 kg</td>",
    "<td>Flûte de pan</td><td>12 po</td><td>1 kg</td>",
    "<td>Chalemie</td><td>2 po</td><td>0,5 kg</td>",
    "<td>Viole</td><td>30 po</td><td>0,5 kg</td>",
  ], "musical instrument variants");
});

test("the introductory rules explain tool fields, separate variant proficiencies, and monster tool proficiencies", () => {
  const introduction = sectionBetween("<div class=\"rules-grid\">", "<h3>Pièces de monnaie</h3>");
  assertIncludesAll(introduction, [
    "Caractéristique",
    "Utilisation",
    "Artisanat",
    "Variantes",
    "chacune constitue une maîtrise distincte",
    "monstre ne maîtrise un outil que si cette maîtrise apparaît dans son profil de jeu",
  ], "tool rules");
});

test("the tools page uses shared themed styles and links to services", () => {
  assert.match(page, /class="content-page tools-page"/);
  assert.match(page, /href="css\/tools-services\.css"/);
  assert.match(page, /<a class="skip-link" href="#main-content">Aller au contenu<\/a>/);
  assert.match(page, /<main class="page" id="main-content">/);
  assert.doesNotMatch(page, /<style[\s>]/i);
  assert.match(page, /href="services-montures-vehicules\.html"/);
});
