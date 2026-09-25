import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../services-montures-vehicules.html", import.meta.url), "utf8");
const shell = await readFile(new URL("../js/site-shell.js", import.meta.url), "utf8");
const navigation = await readFile(new URL("../js/site-navigation.js", import.meta.url), "utf8");
const tools = await readFile(new URL("../outils-aventurier.html", import.meta.url), "utf8");
const sharedStyles = await readFile(new URL("../css/tools-services.css", import.meta.url), "utf8");
const worker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");
const search = JSON.parse(await readFile(new URL("../data/search-index.json", import.meta.url), "utf8"));
const home = await readFile(new URL("../index.html", import.meta.url), "utf8");

function sectionBetween(startMarker, endMarker = "") {
  const start = page.indexOf(startMarker);
  assert.notEqual(start, -1, `missing page marker: ${startMarker}`);
  const end = endMarker ? page.indexOf(endMarker, start) : page.length;
  assert.notEqual(end, -1, `missing page end marker: ${endMarker}`);
  return page.slice(start, end);
}

test("services page exposes the shared shell and stable section anchors", () => {
  assert.match(page, /<body[^>]*class="content-page service-page"/);
  assert.match(page, /data-library-title="Services, montures et véhicules"/);
  assert.match(page, /data-library-category="Équipement"/);
  assert.match(page, /data-library-description="Montures, véhicules, voyages et services D&amp;D 2024"/);
  assert.match(page, /<header data-site-header data-active="services"><\/header>/);
  assert.match(page, /href="css\/tools-services\.css"/);
  assert.match(page, /<a class="skip-link" href="#main-content">Aller au contenu<\/a>/);
  assert.match(page, /<main class="page" id="main-content">/);
  assert.doesNotMatch(page, /<style[\s>]/i);
  assert.match(page, /<h1>Services, montures et véhicules<\/h1>/);

  for (const id of [
    "montures", "montures-cargaison", "bardes", "selles", "vehicules-terrestres",
    "grands-vehicules", "services", "train-de-vie", "nourriture-logement", "voyage",
    "personnel", "services-incantation",
  ]) {
    assert.match(page, new RegExp(`id="${id}"`), id);
  }
});

test("navigation, search indexing, and PWA precache include the page", () => {
  assert.match(navigation, /entry\(\{ id: "services", label: "Services, montures et véhicules", url: "services-montures-vehicules\.html"/);
  assert.match(shell, /js-site-navigation|site-navigation\.js/);
  assert.match(tools, /href="services-montures-vehicules\.html"/);
  assert.match(worker, /"\.\/services-montures-vehicules\.html"/);
  assert.ok(search.entries.some((entry) => entry.url === "services-montures-vehicules.html"));
});

test("the home dashboard exposes the multiverse index and equipment services", () => {
  assert.match(home, /data-site-explorer/);
  assert.match(navigation, /entry\(\{ id: "lore", label: "Lore \/ index du multivers", url: "lore\.html"/);
  assert.match(navigation, /entry\(\{ id: "faerun", label: "Faerûn \/ Royaumes Oubliés", url: "faerun\.html"/);
  assert.match(navigation, /entry\(\{ id: "services", label: "Services, montures et véhicules", url: "services-montures-vehicules\.html"/);
});

test("mounts, barding, saddles, and drawn vehicles retain PH2024 values", () => {
  const mounts = sectionBetween("<caption>Montures et autres animaux</caption>", "</table>");
  for (const [name, capacity, price] of [
    ["Chameau", "450 lb", "50 po"],
    ["Éléphant", "1 320 lb", "200 po"],
    ["Cheval de trait", "540 lb", "50 po"],
    ["Cheval de selle", "480 lb", "75 po"],
    ["Mastiff", "195 lb", "25 po"],
    ["Mule", "420 lb", "8 po"],
    ["Poney", "225 lb", "30 po"],
    ["Cheval de guerre", "540 lb", "400 po"],
  ]) {
    assert.match(mounts, new RegExp(`${name}[\\s\\S]{0,100}${capacity}[\\s\\S]{0,80}${price}`));
  }

  const drawn = sectionBetween("<caption>Harnachement et véhicules tractés</caption>", "</table>");
  assert.equal((drawn.match(/<tr><td>/g) ?? []).length, 10);
  for (const name of [
    "Carrosse / voiture", "Carriole", "Char", "Nourriture quotidienne", "Selle exotique",
    "Selle militaire", "Selle de selle", "Traîneau", "Écurie quotidienne", "Wagon",
  ]) assert.match(drawn, new RegExp(name));

  assert.match(page, /coût normal.*quatre fois|quatre fois.*prix normal/i);
  assert.match(page, /poids normal/i);
  assert.match(page, /Selle militaire[\s\S]{0,180}Avantage/);
  assert.match(page, /Selle exotique[\s\S]{0,180}monture aquatique[\s\S]{0,80}monture volante/);
  assert.match(page, /5 fois sa capacité de charge normale/);
});

test("large vehicle rules and the seven vehicle records are complete", () => {
  const largeVehicles = sectionBetween("<caption>Véhicules aériens et nautiques</caption>", "</table>");
  assert.equal((largeVehicles.match(/<tr><td>/g) ?? []).length, 7);
  for (const [name, speed, hp, cost] of [
    ["Airship", "8 mph", "300", "40 000 po"],
    ["Galley", "4 mph", "500", "30 000 po"],
    ["Keelboat", "1 mph", "100", "3 000 po"],
    ["Longship", "3 mph", "300", "10 000 po"],
    ["Rowboat", "1,5 mph", "50", "50 po"],
    ["Sailing Ship", "2 mph", "300", "10 000 po"],
    ["Warship", "2,5 mph", "500", "25 000 po"],
  ]) {
    assert.match(largeVehicles, new RegExp(`${name}[\\s\\S]{0,100}${speed}[\\s\\S]{0,160}${hp}[\\s\\S]{0,100}${cost}`));
  }
  assert.match(page, /vent fort[\s\S]{0,160}moitié/);
  assert.match(page, /sans vent[\s\S]{0,180}voiles/);
  assert.match(page, /remontent un courant[\s\S]{0,100}divisée par deux/);
  assert.match(page, /descendant le courant[\s\S]{0,180}3 mph/);
  assert.match(page, /Barque transportée[\s\S]{0,100}100 lb/);
  assert.match(page, /un cinquième[\s\S]{0,180}5 pa par jour[\s\S]{0,120}2 po par jour/);
  assert.match(page, /1 PV[\s\S]{0,100}1 jour[\s\S]{0,100}20 po/);
  assert.match(page, /divisés par deux/);
  assert.match(sharedStyles, /vehicle-table th:first-child/);
});

test("services tables retain every lifestyle, travel, hireling, and spellcasting tier", () => {
  for (const name of ["Wretched", "Squalid", "Poor", "Modest", "Comfortable", "Wealthy", "Aristocratic"]) {
    assert.match(page, new RegExp(name));
  }
  for (const rate of ["3 pc / mile", "1 pc / mile", "1 pc", "1 pa / mile", "2 po / jour", "2 pa / jour", "2 pc / mile"]) {
    assert.match(page, new RegExp(rate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const spellcasting = sectionBetween("<caption>Services d'incantation</caption>", "</table>");
  assert.equal((spellcasting.match(/<tr><td>/g) ?? []).length, 7);
  for (const tier of ["Cantrip", "<td>1</td>", "<td>2</td>", "<td>3</td>", "4-5", "6-8", "<td>9</td>"]) {
    assert.match(spellcasting, new RegExp(tier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(spellcasting, /<td>9<\/td>[\s\S]{0,120}Ville uniquement[\s\S]{0,80}100 000 po/);
  assert.doesNotMatch(page, /<h[234][^>]*>[^<]*(?:Magic Items|Identifying a Magic Item|Attunement|Harmonisation)[^<]*<\/h[234]>/i);
});
