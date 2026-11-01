import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const data = JSON.parse(readFileSync(new URL("../data/spells_2024.json", import.meta.url), "utf8"));
const identityDigest = "d98982f9544a2af23b6defb585ce08cd9bebf7401a0c7f9d712d7bf1b01be4fc";

const corrections = [
  {
    id: 62,
    name: "Chatiment de cecite",
    slug: "chatiment-de-cecite",
    level: 3,
    classes: ["Paladin"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une créature avec une arme de corps à corps ou une frappe à mains nues",
    startsWith: "La cible touchée subit 3d8 dégâts radiants supplémentaires",
    keeps: ["état Aveuglé", "jet de sauvegarde de Constitution", "Les dégâts supplémentaires augmentent de 1d8"],
  },
  {
    id: 63,
    name: "Chatiment de courroux",
    slug: "chatiment-de-courroux",
    level: 1,
    classes: ["Paladin"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une créature avec une arme de corps à corps ou une frappe à mains nues",
    startsWith: "La cible subit 1d6 dégâts nécrotiques supplémentaires",
    keeps: ["jet de sauvegarde de Sagesse", "état Effrayé", "la cible effrayée renouvelle son jet", "Les dégâts augmentent de 1d6"],
  },
  {
    id: 64,
    name: "Chatiment de fournaise",
    slug: "chatiment-de-fournaise",
    level: 1,
    classes: ["Paladin"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une cible avec une arme de corps à corps ou une frappe à mains nues",
    startsWith: "Lorsque vous touchez la cible, elle subit 1d6 dégâts de feu supplémentaires.",
    keeps: ["Au début de chacun de ses tours", "jet de sauvegarde de Constitution", "Tous les dégâts augmentent de 1d6"],
  },
  {
    id: 65,
    name: "Chatiment de revelation",
    slug: "chatiment-de-revelation",
    level: 2,
    classes: ["Paladin"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une créature avec une arme de corps à corps ou une frappe à mains nues",
    startsWith: "La cible touchée subit 2d6 dégâts radiants supplémentaires.",
    keeps: ["Lumière vive", "bénéficient d'un Avantage", "état Invisible", "Les dégâts augmentent de 1d6"],
  },
  {
    id: 66,
    name: "Chatiment de stupeur",
    slug: "chatiment-de-stupeur",
    level: 4,
    classes: ["Paladin"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une créature avec une arme de corps à corps ou une frappe à mains nues",
    startsWith: "La cible subit 4d6 dégâts psychiques supplémentaires",
    keeps: ["jet de sauvegarde de Sagesse", "état Étourdi", "jusqu'à la fin de votre prochain tour", "Les dégâts supplémentaires augmentent de 1d6"],
  },
  {
    id: 67,
    name: "Chatiment de tonnerre",
    slug: "chatiment-de-tonnerre",
    level: 1,
    classes: ["Paladin"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une cible avec une arme de corps à corps ou une frappe à mains nues",
    startsWith: "Votre coup retentit comme le tonnerre",
    keeps: ["2d6 dégâts de tonnerre", "jet de sauvegarde de Force", "repoussée à 3 mètres", "état À terre", "Les dégâts augmentent de 1d6"],
  },
  {
    id: 68,
    name: "Chatiment divin",
    slug: "chatiment-divin",
    level: 1,
    classes: ["Paladin"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une cible avec une arme de corps à corps ou une frappe à mains nues",
    startsWith: "La cible subit 2d8 dégâts radiants supplémentaires suite à l'attaque.",
    keeps: ["1d8 si la cible est un fiélon ou un mort-vivant", "Les dégâts augmentent de 1d8"],
  },
  {
    id: 69,
    name: "Chatiment du ban",
    slug: "chatiment-du-ban",
    level: 5,
    classes: ["Paladin"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une créature avec une arme de corps à corps ou une frappe à mains nues",
    startsWith: "La cible touchée par le jet d'attaque subit 5d10 points de dégâts de force supplémentaires.",
    keeps: ["réduit la cible à 50 points de vie ou moins", "jet de sauvegarde de Charisme", "demi-plan inoffensif", "état Incapable d'agir", "la case inoccupée la plus proche"],
  },
  {
    id: 117,
    name: "Croissance vegetale",
    slug: "croissance-vegetale",
    level: 3,
    classes: ["Barde", "Druide", "Rôdeur"],
    castingTime: "Action (embroussaillement) ou 8 heures (fertilisation).",
    startsWith: "Ce sort canalise la vitalité dans des plantes.",
    keeps: ["Embroussaillement.", "30 mètres de rayon", "4 mètres de déplacement pour chaque mètre parcouru", "Fertilisation.", "750 mètres", "pendant 365 jours", "deux fois plus de nourriture"],
  },
  {
    id: 173,
    name: "Fleche de foudre",
    slug: "fleche-de-foudre",
    level: 3,
    classes: ["Rôdeur"],
    castingTime: "Action bonus, que vous pouvez prendre immédiatement après avoir touché ou manqué une cible avec une attaque à distance en utilisant une arme.",
    startsWith: "Lorsque votre attaque touche ou rate la cible, l'arme ou la munition utilisée se transforme en éclair.",
    keeps: ["4d8 dégâts de foudre si l'attaque touche", "la moitié de ces dégâts si elle rate", "Chaque créature dans un rayon de 3 mètres", "2d8 dégâts de foudre", "Les dégâts des deux effets du sort augmentent de 1d8"],
  },
  {
    id: 185,
    name: "Frappe piegeuse",
    slug: "frappe-piegeuse",
    level: 1,
    classes: ["Rôdeur"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une créature avec une arme.",
    startsWith: "Lorsque vous touchez la cible, des lianes avides apparaissent sur elle.",
    keeps: ["jet de sauvegarde de Force", "bénéficie d'un Avantage", "état Entravé", "1d6 dégâts perforants", "jet de Force (Athlétisme)", "Les dégâts augmentent de 1d6"],
  },
  {
    id: 194,
    name: "Grele d'epines",
    slug: "grele-d-epines",
    level: 1,
    classes: ["Rôdeur"],
    castingTime: "Action bonus, que vous prenez immédiatement après avoir touché une créature avec une arme à distance.",
    startsWith: "Lorsque vous touchez la créature, ce sort crée une pluie d'épines",
    keeps: ["jet de sauvegarde de Dextérité", "1d10 dégâts perforants", "rayon de 1,50 mètre", "Les dégâts augmentent de 1d10"],
  },
  {
    id: 328,
    name: "Represailles infernales",
    slug: "represailles-infernales",
    level: 1,
    classes: ["Occultiste"],
    castingTime: "Réaction, que vous prenez lorsque vous subissez des dégâts infligés par une créature que vous pouvez voir dans un rayon de 18 mètres.",
    startsWith: "La créature qui vous a blessé est momentanément entourée de flammes vertes.",
    keeps: ["jet de sauvegarde de Dextérité", "2d10 dégâts de feu", "la moitié en cas de réussite", "Les dégâts augmentent de 1d10"],
  },
];

function htmlToText(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#039;", "'");
}

function normalizeFrench(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.\s]+$/g, "");
}

function repeatsCastingConditionAtStart(spell) {
  const castingTime = normalizeFrench(spell.casting_time);
  const marker = "immediatement apres avoir ";
  const markerIndex = castingTime.indexOf(marker);
  if (markerIndex === -1) return false;

  const condition = castingTime.slice(markerIndex + marker.length);
  const descriptionStart = normalizeFrench(spell.description);
  return [
    condition,
    `${marker}${condition}`,
    `prendre ${marker}${condition}`,
  ].some((fragment) => descriptionStart.startsWith(fragment));
}

function assertDescriptionStartsWithEffect(spell, expectedStart) {
  assert.ok(spell.description.startsWith(expectedStart), `${spell.name} should start with its effect`);
  assert.match(spell.description_html, /^<p>[\s\S]*<\/p>$/, `${spell.name} should keep valid paragraph HTML`);
  assert.equal(htmlToText(spell.description_html), spell.description, `${spell.name} HTML and plain text should match`);
}

test("spell fixes preserve the 391 ordered IDs and slugs and the 13 spell identities", () => {
  assert.equal(data.spells.length, 391);
  const digest = createHash("sha256")
    .update(data.spells.map(({ id, slug }) => `${id}:${slug}`).join("\n"))
    .digest("hex");
  assert.equal(digest, identityDigest, "ordered spell IDs and slugs should remain unchanged");
  assert.equal(new Set(data.spells.map(({ id }) => id)).size, 391);
  assert.equal(new Set(data.spells.map(({ slug }) => slug)).size, 391);

  for (const expected of corrections) {
    const spell = data.spells.find(({ id }) => id === expected.id);
    assert.ok(spell, `spell id ${expected.id} should exist`);
    assert.equal(spell.name, expected.name);
    assert.equal(spell.slug, expected.slug);
    assert.equal(spell.level, expected.level);
    assert.deepEqual(spell.classes, expected.classes);
    assert.equal(spell.casting_time, expected.castingTime, `${spell.name} casting time`);
    assertDescriptionStartsWithEffect(spell, expected.startsWith);
  }
});

test("spell descriptions retain their mechanical effects", () => {
  for (const expected of corrections) {
    const spell = data.spells.find(({ id }) => id === expected.id);
    for (const phrase of expected.keeps) {
      assert.ok(spell.description.includes(phrase), `${spell.name} should retain: ${phrase}`);
    }
  }
});

test("spell descriptions do not open by repeating an immediately-after-hit casting condition", () => {
  for (const spell of data.spells) {
    assert.equal(repeatsCastingConditionAtStart(spell), false, `${spell.name} repeats its casting condition at the start`);
  }
});
