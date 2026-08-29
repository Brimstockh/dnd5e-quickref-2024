import fs from "node:fs";

const catalogue = JSON.parse(fs.readFileSync("data/monsters_2024.json", "utf8"));
const monsters = catalogue.monsters;
const translationData = JSON.parse(
  fs.readFileSync("data/monster-names-fr.json", "utf8"),
);
const summaryPath = "data/monster-translations-summary.json";
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

const unresolvedByName = new Map(
  translationData.unresolvedMonsterTranslations.map((entry) => [entry.en, entry]),
);

const monsterNameCorrespondence = monsters.map((monster) => {
  const nameFr = translationData.monsterNamesFr[monster.name];
  const unresolved = unresolvedByName.get(monster.name);

  if (!nameFr && !unresolved) {
    throw new Error(`Monster absent de la synthèse : ${monster.name}`);
  }

  return {
    id: monster.id,
    slug: monster.slug,
    nameEn: monster.name,
    nameFr: nameFr ?? null,
    status: nameFr ? "confirmed" : "unresolved",
    ...(unresolved ? { candidateFrenchLabels: unresolved.candidates } : {}),
  };
});

const confirmedCount = monsterNameCorrespondence.filter(
  (entry) => entry.status === "confirmed",
).length;
const unresolvedCount = monsterNameCorrespondence.length - confirmedCount;

if (
  monsterNameCorrespondence.length !== summary.scope.totalMonsters ||
  confirmedCount !== summary.scope.confirmedFrenchTranslations ||
  unresolvedCount !== summary.scope.unresolvedFrenchTranslations
) {
  throw new Error("Les totaux de la synthèse ne correspondent pas au catalogue");
}

const { unresolvedPolicy, ...summaryWithoutPolicy } = summary;
const updatedSummary = {
  ...summaryWithoutPolicy,
  monsterNameCorrespondence,
  unresolvedPolicy,
};

fs.writeFileSync(`${summaryPath}`, `${JSON.stringify(updatedSummary, null, 2)}\n`);
console.log(
  `Generated ${monsterNameCorrespondence.length} correspondances : ${confirmedCount} confirmées, ${unresolvedCount} non résolues.`,
);
