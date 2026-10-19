import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const CATEGORIES = new Set(["combat-defense", "movement", "magic", "allies-states", "exploration"]);

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadScript(path) {
  const context = {};
  vm.runInNewContext(await readFile(resolve(root, path), "utf8"), context, { filename: path });
  return context;
}

export async function loadIntentionContext() {
  const [action, bonus, reaction, movement, condition, environment, general, intentData] = await Promise.all([
    loadScript("js/data_action.js"),
    loadScript("js/data_bonusaction.js"),
    loadScript("js/data_reaction.js"),
    loadScript("js/data_movement.js"),
    loadScript("js/data_condition.js"),
    loadScript("js/data_environment.js"),
    loadScript("js/data_general.js"),
    loadScript("js/data_intentions.js"),
  ]);
  const catalogs = {
    action: action.data_action,
    bonus: bonus.data_bonusaction,
    reaction: reaction.data_reaction,
    movement: movement.data_movement,
    condition: condition.data_condition,
    environment: [
      ...(environment.data_environment_obscurance || []),
      ...(environment.data_environment_light || []),
      ...(environment.data_environment_vision || []),
      ...(environment.data_environment_cover || []),
    ],
    general: general.data_general,
  };
  return { catalogs, intentions: intentData.data_intentions };
}

export function validateIntentions({ catalogs, intentions }) {
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(intentions) || intentions.length === 0) return ["Le catalogue d'intentions est vide ou invalide."];

  intentions.forEach((intent, index) => {
    const prefix = `intentions[${index}]`;
    if (!intent?.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(intent.id)) errors.push(`${prefix}: identifiant stable invalide`);
    if (ids.has(intent.id)) errors.push(`${prefix}: identifiant dupliqué « ${intent.id} »`);
    ids.add(intent.id);
    if (!CATEGORIES.has(intent.category)) errors.push(`${prefix}: catégorie inconnue « ${intent.category} »`);
    if (!Number.isFinite(intent.order)) errors.push(`${prefix}: ordre manquant`);

    const refs = [];
    if (intent.primaryRule) refs.push({ ...intent.primaryRule, source: "règle principale" });
    if (Array.isArray(intent.relatedRules)) intent.relatedRules.forEach((ref) => refs.push({ ...ref, source: "règle associée" }));
    const refKeys = new Set();
    refs.forEach((ref) => {
      const key = `${ref.parameter}:${ref.slug}`;
      if (refKeys.has(key)) errors.push(`${prefix}: référence dupliquée « ${key} »`);
      refKeys.add(key);
      if (!catalogs[ref.parameter]) {
        errors.push(`${prefix}: catalogue inconnu « ${ref.parameter} »`);
        return;
      }
      if (!catalogs[ref.parameter].some((item) => slugify(item.title) === ref.slug)) {
        errors.push(`${prefix}: ${ref.source} introuvable « ${key} »`);
      }
    });
    if (!intent.primaryRule && (!Array.isArray(intent.relatedRules) || intent.relatedRules.length === 0)) {
      errors.push(`${prefix}: aucune règle référencée`);
    }
  });
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const context = await loadIntentionContext();
  const errors = validateIntentions(context);
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${context.intentions.length} intentions and ${Object.values(context.catalogs).flat().length} rules.`);
  }
}
