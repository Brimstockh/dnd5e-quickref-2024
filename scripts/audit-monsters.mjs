import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const checkMode = process.argv.includes("--check");
const abilityCodes = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const detailSections = ["traits", "actions", "bonus_actions", "reactions", "legendary_actions"];
const requiredFields = ["name", "slug", "type", "size", "alignment", "ac", "hp", "speed", "senses", "languages", "cr", "xp", "pb"];
const xpByCr = {
  "0": [0, 10], "1/8": [25], "1/4": [50], "1/2": [100], "1": [200], "2": [450], "3": [700],
  "4": [1100], "5": [1800], "6": [2300], "7": [2900], "8": [3900], "9": [5000], "10": [5900],
  "11": [7200], "12": [8400], "13": [10000], "14": [11500], "15": [13000], "16": [15000],
  "17": [18000], "18": [20000], "19": [22000], "20": [25000], "21": [33000], "22": [41000],
  "23": [50000], "24": [62000], "25": [75000], "26": [90000], "27": [105000], "28": [120000],
  "29": [135000], "30": [155000],
};
const hpPattern = /^([0-9]+) \(([0-9]+)d([0-9]+)(?: ([+-]) ?([0-9]+))?\)/;
const damagePattern = /([0-9]+) \(([0-9]+)d([0-9]+)(?: ([+-]) ?([0-9]+))?\)/g;

const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const signed = (value) => {
  const match = String(value ?? "").match(/[+-]?[0-9]+/);
  return match ? Number(match[0]) : null;
};
const formatModifier = (value) => value >= 0 ? `+${value}` : String(value);
const normalizedNumber = (value) => Number(String(value ?? "").replaceAll(" ", ""));
const push = (list, message) => list.push(message);

const catalogue = await readJson("data/monsters_2024.json");
const detailsData = await readJson("data/monsters_2024_details.json");
const translations = await readJson("data/monster-names-fr.json");
const monsters = catalogue.monsters || [];
const detailMonsters = detailsData.monsters || {};
const names = translations.monsterNamesFr || {};
const unresolved = translations.unresolvedMonsterTranslations || [];
const errors = [];
const warnings = [];

const duplicateValues = (values) => values.filter((value, index) => values.indexOf(value) !== index);
for (const [label, values] of [["id", monsters.map((monster) => monster.id)], ["slug", monsters.map((monster) => monster.slug)], ["name", monsters.map((monster) => monster.name)]]) {
  for (const value of new Set(duplicateValues(values))) push(errors, `Identifiant ${label} dupliqué : ${value}`);
}

if (catalogue.count !== monsters.length) push(errors, `Catalogue count=${catalogue.count}, entrées=${monsters.length}`);
if (detailsData.count !== Object.keys(detailMonsters).length) push(errors, `Détails count=${detailsData.count}, entrées=${Object.keys(detailMonsters).length}`);
if (detailsData.count !== monsters.length) push(errors, `Détails=${Object.keys(detailMonsters).length}, catalogue=${monsters.length}`);
if (translations.count !== monsters.length) push(errors, `Traductions count=${translations.count}, catalogue=${monsters.length}`);
if (translations.resolvedCount !== Object.keys(names).length) push(errors, `resolvedCount=${translations.resolvedCount}, traductions=${Object.keys(names).length}`);
if (translations.unresolvedCount !== unresolved.length) push(errors, `unresolvedCount=${translations.unresolvedCount}, entrées=${unresolved.length}`);

const monsterSlugs = new Set(monsters.map((monster) => monster.slug));
for (const monster of monsters) {
  const detail = detailMonsters[monster.slug];
  if (!detail) {
    push(errors, `Détails absents : ${monster.slug}`);
    continue;
  }
  for (const field of requiredFields) if (monster[field] === undefined || monster[field] === null || monster[field] === "") push(errors, `${monster.name}: champ obligatoire vide (${field})`);
  const abilityKeys = Object.keys(detail.abilities || {}).sort();
  if (abilityKeys.join(",") !== abilityCodes.slice().sort().join(",")) push(errors, `${monster.name}: six caractéristiques attendues`);
  for (const code of abilityCodes) {
    const ability = detail.abilities?.[code];
    if (!ability || typeof ability.score !== "number") continue;
    const expected = Math.floor((ability.score - 10) / 2);
    if (signed(ability.modifier) !== expected) push(errors, `${monster.name} ${code}: modificateur ${ability.modifier}, attendu ${formatModifier(expected)}`);
    const save = signed(ability.save);
    const proficiency = signed(monster.pb);
    if (save !== null && save !== expected && save !== expected + proficiency) push(warnings, `${monster.name} ${code}: sauvegarde ${ability.save} hors modificateur/BM`);
  }

  const hpMatch = String(monster.hp).match(hpPattern);
  if (hpMatch) {
    const [, total, diceCount, diceSides, bonusSign, bonusValue] = hpMatch;
    const fixedBonus = bonusSign === "-" ? -Number(bonusValue) : Number(bonusValue || 0);
    const expected = Math.floor(Number(diceCount) * (Number(diceSides) + 1) / 2 + fixedBonus);
    if (Number(total) !== expected) push(errors, `${monster.name}: PV ${total}, moyenne attendue ${expected}`);
    const conModifier = signed(detail.abilities?.CON?.modifier);
    const expectedBonus = Number(diceCount) * conModifier;
    if (conModifier !== null && Number(fixedBonus) !== expectedBonus) push(warnings, `${monster.name}: bonus de PV ${fixedBonus}, formule standard ${expectedBonus}`);
  } else if (!String(monster.hp).includes("for each")) {
    push(warnings, `${monster.name}: formule de PV non reconnue (${monster.hp})`);
  }

  const expectedXp = xpByCr[String(monster.cr)];
  const actualXp = normalizedNumber(monster.xp);
  if (expectedXp && !expectedXp.includes(actualXp)) push(errors, `${monster.name}: PX ${monster.xp}, attendu ${expectedXp.join(" ou ")}`);
  const numericCr = Number(monster.cr);
  if (Number.isFinite(numericCr)) {
    const expectedPb = numericCr < 5 ? 2 : numericCr < 9 ? 3 : numericCr < 13 ? 4 : numericCr < 17 ? 5 : numericCr < 21 ? 6 : numericCr < 25 ? 7 : numericCr < 29 ? 8 : 9;
    if (signed(monster.pb) !== expectedPb) push(errors, `${monster.name}: BM ${monster.pb}, attendu +${expectedPb}`);
  }

  for (const section of detailSections) {
    for (const entry of detail[section] || []) {
      for (const match of entry.description?.matchAll(damagePattern) || []) {
        const [, average, diceCount, diceSides, bonusSign, bonusValue] = match;
        const fixedBonus = bonusSign === "-" ? -Number(bonusValue) : Number(bonusValue || 0);
        const expected = Math.floor(Number(diceCount) * (Number(diceSides) + 1) / 2 + fixedBonus);
        if (Number(average) !== expected) push(errors, `${monster.name}/${entry.name}: dégâts ${average} (${diceCount}d${diceSides}), attendu ${expected}`);
      }
      const attackBonus = entry.description?.match(/Attack Roll: ([+-]?[0-9]+)/)?.[1];
      if (attackBonus) {
        const bonus = Number(attackBonus);
        const proficiency = signed(monster.pb);
        const abilityModifiers = abilityCodes.map((code) => Math.floor((detail.abilities[code].score - 10) / 2));
        if (!abilityModifiers.some((modifier) => bonus === modifier || bonus === modifier + proficiency)) push(warnings, `${monster.name}/${entry.name}: bonus d'attaque ${attackBonus} non déductible des caractéristiques/BM`);
      }
      const saveDc = entry.description?.match(/Saving Throw: DC ([0-9]+)/)?.[1];
      if (saveDc) {
        const dc = Number(saveDc);
        const proficiency = signed(monster.pb);
        const abilityModifiers = abilityCodes.map((code) => Math.floor((detail.abilities[code].score - 10) / 2));
        if (!abilityModifiers.some((modifier) => dc === 8 + modifier + proficiency)) push(warnings, `${monster.name}/${entry.name}: DD ${saveDc} non déductible de 8+caractéristique+BM`);
      }
    }
  }
}

for (const slug of Object.keys(detailMonsters)) if (!monsterSlugs.has(slug)) push(errors, `Bloc détaillé orphelin : ${slug}`);
for (const name of monsters.map((monster) => monster.name)) if (!names[name]) push(errors, `Traduction française absente : ${name}`);
for (const name of Object.keys(names)) if (!monsters.some((monster) => monster.name === name)) push(errors, `Clé de traduction orpheline : ${name}`);
for (const entry of unresolved) if (monsterSlugs.has(monsters.find((monster) => monster.name === entry.en)?.slug)) push(errors, `Traduction non résolue encore présente : ${entry.en}`);

console.log(`Monster audit: ${monsters.length} entrées, ${errors.length} erreur(s) certaine(s), ${warnings.length} avertissement(s).`);
if (errors.length) {
  console.log("\nErreurs certaines:");
  errors.forEach((message) => console.log(`- ${message}`));
}
if (warnings.length) {
  console.log("\nAvertissements à vérifier:");
  warnings.forEach((message) => console.log(`- ${message}`));
}
if (checkMode && errors.length) process.exitCode = 1;
