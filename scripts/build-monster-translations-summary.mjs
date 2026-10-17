import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const catalogue = await readJson("data/monsters_2024.json");
const translationData = await readJson("data/monster-names-fr.json");
const summaryPath = resolve(root, "data/monster-translations-summary.json");
const summary = JSON.parse(await readFile(summaryPath, "utf8"));
const monsters = catalogue.monsters || [];
const names = translationData.monsterNamesFr || {};
const unresolvedByName = new Map(
  (translationData.unresolvedMonsterTranslations || []).map((entry) => [entry.en, entry]),
);

const monsterNameCorrespondence = monsters.map((monster) => {
  const nameFr = names[monster.name];
  const unresolved = unresolvedByName.get(monster.name);
  if (!nameFr && !unresolved) throw new Error(`Monster absent de la synthèse : ${monster.name}`);
  return {
    id: monster.id,
    slug: monster.slug,
    nameEn: monster.name,
    nameFr: nameFr ?? null,
    status: nameFr ? "confirmed" : "unresolved",
    ...(unresolved ? { candidateFrenchLabels: unresolved.candidates } : {}),
  };
});

const confirmedCount = monsterNameCorrespondence.filter((entry) => entry.status === "confirmed").length;
const unresolvedCount = monsterNameCorrespondence.length - confirmedCount;
const { unresolvedMonsters: _oldUnresolved, monsterNameCorrespondence: _oldCorrespondence, ...summaryBase } = summary;
const updatedSummary = {
  ...summaryBase,
  scope: {
    ...summary.scope,
    totalMonsters: monsterNameCorrespondence.length,
    confirmedFrenchTranslations: confirmedCount,
    unresolvedFrenchTranslations: unresolvedCount,
    unaccountedMonsters: 0,
    coverageComplete: true,
  },
  workCompleted: {
    ...summary.workCompleted,
    unresolvedNamesKeepEnglishFallback: unresolvedCount > 0,
    unresolvedNamesAreExplicitlyMarked: unresolvedCount > 0,
  },
  unresolvedMonsters: [],
  monsterNameCorrespondence,
  unresolvedPolicy: unresolvedCount
    ? `Les ${unresolvedCount} noms sans traduction confirmée restent exclus du bestiaire.`
    : "Aucune traduction française non résolue ne subsiste dans le périmètre du bestiaire.",
};

await writeFile(summaryPath, `${JSON.stringify(updatedSummary, null, 2)}\n`);
console.log(`Generated ${monsterNameCorrespondence.length} correspondances : ${confirmedCount} confirmées, ${unresolvedCount} non résolues.`);
